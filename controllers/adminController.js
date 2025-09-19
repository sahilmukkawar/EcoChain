// controllers/adminController.js
const GarbageCollection = require('../database/models/GarbageCollection');
const User = require('../database/models/User');
const AdminPayment = require('../database/models/AdminPayment');
const FactoryApplication = require('../database/models/FactoryApplication');
const CollectorApplication = require('../database/models/CollectorApplication');
const { calculateCollectorPayment } = require('../utils/paymentRates');
const logger = require('../utils/logger');

/**
 * Get collections ready for collector payment
 */
const getCollectionsForPayment = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    // Find collections that have been collected but payment not processed
    const collections = await GarbageCollection.find({
      status: 'collected',
      'payment.collectorPaid': { $ne: true }
    })
    .populate('userId', 'personalInfo.name personalInfo.email')
    .populate('collectorId', 'personalInfo.name personalInfo.email')
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
    
    const total = await GarbageCollection.countDocuments({
      status: 'collected',
      'payment.collectorPaid': { $ne: true }
    });
    
    console.log(`Found ${collections.length} collections ready for collector payment`);
    
    res.json({
      success: true,
      data: {
        collections,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching collections for payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collections for payment',
      error: error.message
    });
  }
};

/**
 * Process collector payment for a collection
 */
const processCollectorPayment = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { approveCollection = true, paymentMethod = 'digital_transfer', adminNotes } = req.body;
    
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const collection = await GarbageCollection.findById(collectionId)
      .populate('collectorId', 'personalInfo.name personalInfo.email personalInfo.phone ecoWallet')
      .populate('userId', 'personalInfo.name');
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }
    
    if (collection.status !== 'collected') {
      return res.status(400).json({
        success: false,
        message: 'Collection must be in collected status for payment processing'
      });
    }
    
    if (collection.payment?.collectorPaid) {
      return res.status(400).json({
        success: false,
        message: 'Collector payment already processed for this collection'
      });
    }
    
    if (!approveCollection) {
      // Admin rejected the collection
      await collection.updateStatus('rejected', adminNotes || 'Collection rejected by admin');
      
      // Save rejection record in AdminPayment collection
      await AdminPayment.createPaymentRecord({
        collectionId: collection._id,
        collectionDisplayId: collection.collectionId,
        adminId: req.user.id,
        collectorId: collection.collectorId,
        userId: collection.userId,
        action: 'rejected',
        collectionDetails: {
          wasteType: collection.collectionDetails.type,
          weight: collection.collectionDetails.weight,
          quality: collection.collectionDetails.quality,
          pickupDate: collection.scheduling.actualPickupDate || collection.createdAt,
          location: {
            pickupAddress: collection.location.pickupAddress
          }
        },
        rejectionReason: adminNotes || 'No reason provided',
        adminNotes: adminNotes,
        metadata: {
          browserInfo: {
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip || req.connection.remoteAddress
          },
          systemInfo: {
            version: process.env.APP_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
          }
        }
      });
      
      return res.json({
        success: true,
        message: 'Collection rejected',
        data: {
          collectionId: collection.collectionId,
          status: 'rejected',
          reason: adminNotes
        }
      });
    }
    
    // Calculate collector payment using Indian industry standards
    const paymentCalculation = calculateCollectorPayment(
      collection.collectionDetails.type,
      collection.collectionDetails.weight,
      collection.collectionDetails.quality,
      {
        distance: 0, // Could be calculated based on location
        timeSlot: collection.scheduling.preferredTimeSlot,
        isWeekend: new Date(collection.scheduling.actualPickupDate || collection.createdAt).getDay() % 6 === 0,
        pickupDate: collection.scheduling.actualPickupDate || collection.createdAt
      }
    );
    
    const collectorPaymentINR = paymentCalculation.paymentSummary.finalAmount;
    
    // Store the calculated payment in the collection for consistency
    collection.payment.calculatedAmount = collectorPaymentINR;
    collection.payment.paymentCalculation = paymentCalculation;
    
    // Initialize payment object if it doesn't exist
    if (!collection.payment) {
      collection.payment = {};
    }
    
    // Update collection with payment info
    collection.payment.collectorPaid = true;
    collection.payment.collectorPaymentAmount = collectorPaymentINR;
    collection.payment.collectorPaymentCurrency = 'INR';
    collection.payment.collectorPaymentDate = new Date();
    collection.payment.collectorPaymentMethod = paymentMethod;
    collection.payment.paymentCalculation = paymentCalculation;
    collection.payment.adminNotes = adminNotes || `Payment approved and processed by admin: ${req.user.name}`;
    collection.payment.approvedBy = req.user.id;
    
    // Update collection status to delivered (approved by admin, ready for factory)
    await collection.updateStatus('delivered', 'Collection approved by admin, collector paid, ready for factory processing');
    
    await collection.save();
    
    // Update collector's earnings statistics
    const collector = await User.findById(collection.collectorId);
    if (collector) {
      // Add to collector's earnings history
      if (!collector.collectorStats) {
        collector.collectorStats = {
          totalEarnings: 0,
          totalCollections: 0,
          paymentHistory: []
        };
      }
      
      collector.collectorStats.totalEarnings += collectorPaymentINR;
      collector.collectorStats.totalCollections += 1;
      collector.collectorStats.paymentHistory.push({
        collectionId: collection.collectionId,
        amount: collectorPaymentINR,
        currency: 'INR',
        paymentDate: new Date(),
        wasteType: collection.collectionDetails.type,
        weight: collection.collectionDetails.weight,
        calculation: paymentCalculation
      });
      
      await collector.save();
      
      console.log(`Payment of ₹${collectorPaymentINR} processed for collector ${collector.personalInfo.name}`);
    }
    
    // Broadcast update via WebSocket
    if (global.broadcastUpdate) {
      global.broadcastUpdate('admin_payment', 'collector_paid', {
        collectionId: collection.collectionId,
        collectorId: collection.collectorId,
        paymentAmount: collectorPaymentINR,
        currency: 'INR',
        adminId: req.user.id,
        calculation: paymentCalculation
      });
    }
    
    // Save payment approval record in AdminPayment collection
    const adminPaymentRecord = await AdminPayment.createPaymentRecord({
      collectionId: collection._id,
      collectionDisplayId: collection.collectionId,
      adminId: req.user.id,
      collectorId: collection.collectorId,
      userId: collection.userId,
      action: 'approved',
      paymentDetails: {
        amount: collectorPaymentINR,
        currency: 'INR',
        paymentMethod: paymentMethod,
        calculation: {
          baseRate: paymentCalculation.breakdown.baseRate,
          weight: collection.collectionDetails.weight,
          qualityMultiplier: paymentCalculation.breakdown.qualityMultiplier,
          bonuses: paymentCalculation.breakdown.bonuses || 0,
          finalAmount: collectorPaymentINR,
          breakdown: paymentCalculation
        }
      },
      collectionDetails: {
        wasteType: collection.collectionDetails.type,
        weight: collection.collectionDetails.weight,
        quality: collection.collectionDetails.quality,
        pickupDate: collection.scheduling.actualPickupDate || collection.createdAt,
        location: {
          pickupAddress: collection.location.pickupAddress
        }
      },
      adminNotes: adminNotes || `Payment approved and processed by admin: ${req.user.personalInfo?.name || req.user.name}`,
      metadata: {
        processingTime: req.startTime ? Date.now() - req.startTime : 0, // Handle case where req.startTime is not set
        browserInfo: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip || req.connection.remoteAddress
        },
        systemInfo: {
          version: process.env.APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        }
      }
    });
    
    console.log(`Payment record saved with ID: ${adminPaymentRecord.paymentId}`);
    
    res.json({
      success: true,
      message: `Collector payment of ₹${collectorPaymentINR} processed successfully`,
      data: {
        collectionId: collection.collectionId,
        collectorPayment: {
          amount: collectorPaymentINR,
          currency: 'INR',
          calculation: paymentCalculation,
          method: paymentMethod,
          processedDate: new Date()
        },
        newStatus: collection.status,
        collectorName: collector?.personalInfo.name,
        wasteDetails: {
          type: collection.collectionDetails.type,
          weight: collection.collectionDetails.weight,
          quality: collection.collectionDetails.quality
        }
      }
    });
  } catch (error) {
    logger.error('Error processing collector payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process collector payment',
      error: error.message
    });
  }
};

/**
 * Get admin dashboard statistics
 */
const getAdminStats = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    // Get various statistics
    const totalUsers = await User.countDocuments();
    const totalCollectors = await User.countDocuments({ role: 'collector' });
    const totalFactories = await User.countDocuments({ role: 'factory' });
    
    const totalCollections = await GarbageCollection.countDocuments();
    const pendingPayments = await GarbageCollection.countDocuments({ 
      status: 'collected', 
      'payment.collectorPaid': { $ne: true } 
    });
    
    const completedCollections = await GarbageCollection.countDocuments({ status: 'completed' });
    
    // Calculate total tokens issued
    const tokenStats = await GarbageCollection.aggregate([
      { $match: { 'tokenCalculation.totalTokensIssued': { $exists: true } } },
      { $group: { _id: null, totalTokens: { $sum: '$tokenCalculation.totalTokensIssued' } } }
    ]);
    
    const totalEcoTokensIssued = tokenStats[0]?.totalTokens || 0;
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalCollectors,
        totalFactories,
        totalCollections,
        pendingPayments,
        completedCollections,
        totalEcoTokensIssued
      }
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
      error: error.message
    });
  }
};

/**
 * Get real users data for admin dashboard
 */
const getAllUsers = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { page = 1, limit = 50 } = req.query;
    
    // Get regular users (not admin, collector, or factory)
    const users = await User.find({ role: 'user' })
      .select('personalInfo.name personalInfo.email personalInfo.phone ecoWallet role accountStatus createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments({ role: 'user' });
    
    // Get user collections count
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const collectionsCount = await GarbageCollection.countDocuments({ userId: user._id });
        const completedCollections = await GarbageCollection.countDocuments({ 
          userId: user._id, 
          status: { $in: ['completed', 'delivered', 'verified'] } 
        });
        
        return {
          _id: user._id,
          name: user.personalInfo.name,
          email: user.personalInfo.email,
          phone: user.personalInfo.phone,
          role: user.role,
          accountStatus: user.accountStatus,
          ecoTokens: user.ecoWallet.currentBalance,
          totalEarned: user.ecoWallet.totalEarned,
          totalCollections: collectionsCount,
          completedCollections: completedCollections,
          joinedDate: user.createdAt
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * Get real collectors data for admin dashboard
 */
const getAllCollectors = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { page = 1, limit = 50 } = req.query;
    
    const collectors = await User.find({ role: 'collector' })
      .select('personalInfo.name personalInfo.email personalInfo.phone collectorStats accountStatus createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments({ role: 'collector' });
    
    // Get collector statistics
    const collectorsWithStats = await Promise.all(
      collectors.map(async (collector) => {
        const assignedCollections = await GarbageCollection.countDocuments({ collectorId: collector._id });
        const completedCollections = await GarbageCollection.countDocuments({ 
          collectorId: collector._id, 
          status: { $in: ['completed', 'delivered', 'verified'] } 
        });
        const pendingCollections = await GarbageCollection.countDocuments({ 
          collectorId: collector._id, 
          status: { $in: ['scheduled', 'in_progress', 'collected'] } 
        });
        
        // Calculate completion rate
        const completionRate = assignedCollections > 0 ? 
          Math.round((completedCollections / assignedCollections) * 100) : 0;
        
        return {
          _id: collector._id,
          name: collector.personalInfo.name,
          email: collector.personalInfo.email,
          phone: collector.personalInfo.phone,
          role: collector.role,
          accountStatus: collector.accountStatus,
          totalEarnings: collector.collectorStats?.totalEarnings || 0,
          totalCollections: collector.collectorStats?.totalCollections || 0,
          assignedCollections: assignedCollections,
          completedCollections: completedCollections,
          pendingCollections: pendingCollections,
          completionRate: completionRate,
          rating: collector.collectorStats?.averageRating || 0,
          joinedDate: collector.createdAt
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        collectors: collectorsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching collectors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collectors',
      error: error.message
    });
  }
};

/**
 * Get real factories data for admin dashboard
 */
const getAllFactories = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { page = 1, limit = 50 } = req.query;
    
    const factories = await User.find({ role: 'factory' })
      .select('personalInfo companyInfo accountStatus createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments({ role: 'factory' });
    
    // Get factory statistics (you might need to create a product/order model later)
    const factoriesWithStats = await Promise.all(
      factories.map(async (factory) => {
        // For now, using collection statistics as proxy for materials processed
        const materialsProcessed = await GarbageCollection.aggregate([
          { $match: { factoryId: factory._id, status: { $in: ['delivered', 'verified', 'completed'] } } },
          { $group: { _id: null, totalWeight: { $sum: '$collectionDetails.weight' } } }
        ]);
        
        const totalProcessed = materialsProcessed[0]?.totalWeight || 0;
        
        return {
          _id: factory._id,
          name: factory.companyInfo?.name || factory.personalInfo.name,
          email: factory.personalInfo.email,
          phone: factory.personalInfo.phone,
          role: factory.role,
          accountStatus: factory.accountStatus,
          materialsProcessed: Math.round(totalProcessed),
          productsListed: 0, // Will be updated when product system is implemented
          joinedDate: factory.createdAt
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        factories: factoriesWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching factories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch factories',
      error: error.message
    });
  }
};

/**
 * Get admin payment history with filtering and pagination
 */
const getPaymentHistory = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const {
      page = 1,
      limit = 20,
      action, // 'approved' or 'rejected'
      wasteType,
      dateFrom,
      dateTo,
      collectorId,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filters
    const filters = {};
    if (action) filters.action = action;
    if (wasteType) filters.wasteType = wasteType;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (collectorId) filters.collectorId = collectorId;
    if (minAmount) filters.minAmount = parseFloat(minAmount);
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount);
    
    // Build options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1
    };
    
    // Get payment history
    const result = await AdminPayment.getPaymentHistory(filters, options);
    
    // Format response
    const formattedPayments = result.payments.map(payment => ({
      paymentId: payment.paymentId,
      collectionId: payment.collectionDisplayId,
      adminName: payment.adminId?.personalInfo?.name || 'Unknown Admin',
      collectorName: payment.collectorId?.personalInfo?.name || 'Unknown Collector',
      collectorEmail: payment.collectorId?.personalInfo?.email,
      userName: payment.userId?.personalInfo?.name || 'Unknown User',
      action: payment.action,
      amount: payment.action === 'approved' ? payment.paymentDetails?.amount : null,
      currency: payment.paymentDetails?.currency || 'INR',
      paymentMethod: payment.paymentDetails?.paymentMethod,
      wasteType: payment.collectionDetails.wasteType,
      weight: payment.collectionDetails.weight,
      quality: payment.collectionDetails.quality,
      pickupDate: payment.collectionDetails.pickupDate,
      adminNotes: payment.adminNotes,
      rejectionReason: payment.rejectionReason,
      processedAt: payment.processedAt,
      status: payment.status,
      location: payment.collectionDetails.location?.pickupAddress
    }));
    
    res.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: result.pagination
      }
    });
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

/**
 * Get payment statistics for admin dashboard
 */
const getPaymentStatistics = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { dateFrom, dateTo, adminId } = req.query;
    
    const dateRange = {};
    if (dateFrom) dateRange.from = dateFrom;
    if (dateTo) dateRange.to = dateTo;
    
    const stats = await AdminPayment.getPaymentStatistics(adminId, dateRange);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      error: error.message
    });
  }
};

/**
 * Debug endpoint to check payment history status
 */
const debugPaymentHistory = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    // Count AdminPayment records
    const adminPaymentCount = await AdminPayment.countDocuments();
    
    // Count paid collections
    const paidCollectionsCount = await GarbageCollection.countDocuments({
      'payment.collectorPaid': true
    });
    
    // Get sample AdminPayment records
    const samplePayments = await AdminPayment.find({})
      .populate('adminId', 'personalInfo.name')
      .populate('collectorId', 'personalInfo.name')
      .limit(5)
      .sort({ createdAt: -1 });
    
    // Get sample paid collections
    const sampleCollections = await GarbageCollection.find({
      'payment.collectorPaid': true
    })
    .populate('collectorId', 'personalInfo.name')
    .limit(5)
    .sort({ 'payment.collectorPaymentDate': -1 });
    
    res.json({
      success: true,
      data: {
        adminPaymentRecords: {
          count: adminPaymentCount,
          sample: samplePayments.map(p => ({
            paymentId: p.paymentId,
            collectionId: p.collectionDisplayId,
            action: p.action,
            amount: p.paymentDetails?.amount,
            processedAt: p.processedAt
          }))
        },
        paidCollections: {
          count: paidCollectionsCount,
          sample: sampleCollections.map(c => ({
            collectionId: c.collectionId,
            collectorName: c.collectorId?.personalInfo?.name,
            amount: c.payment?.collectorPaymentAmount,
            paymentDate: c.payment?.collectorPaymentDate
          }))
        },
        needsMigration: paidCollectionsCount > adminPaymentCount
      }
    });
  } catch (error) {
    logger.error('Error in debug payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to debug payment history',
      error: error.message
    });
  }
};

/**
 * Get analytics data for admin dashboard
 */
const getAnalyticsData = async (req, res) => {
  try {
    console.log('Analytics request received:', req.user);
    
    // Only admin can access this
    if (req.user.role !== 'admin') {
      console.log('User role check failed:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { period = 'monthly', dateFrom, dateTo } = req.query;
    console.log('Analytics request params:', { period, dateFrom, dateTo });
    
    // Build date range filter
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);
    
    // Get platform metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    const totalCollectors = await User.countDocuments({ role: 'collector' });
    const totalFactories = await User.countDocuments({ role: 'factory' });
    
    // Get total garbage collected
    const garbageStats = await GarbageCollection.aggregate([
      { $match: { status: { $in: ['completed', 'delivered', 'verified'] } } },
      { $group: { _id: null, totalWeight: { $sum: '$collectionDetails.weight' } } }
    ]);
    const totalGarbageCollected = garbageStats[0]?.totalWeight || 0;
    
    // Get total tokens issued
    const tokenStats = await GarbageCollection.aggregate([
      { $match: { 'tokenCalculation.totalTokensIssued': { $exists: true } } },
      { $group: { _id: null, totalTokens: { $sum: '$tokenCalculation.totalTokensIssued' } } }
    ]);
    const totalTokensIssued = tokenStats[0]?.totalTokens || 0;
    
    // Get total revenue (sum of all collector payments)
    const revenueStats = await GarbageCollection.aggregate([
      { $match: { 'payment.collectorPaid': true, 'payment.collectorPaymentAmount': { $exists: true } } },
      { $group: { _id: null, totalRevenue: { $sum: '$payment.collectorPaymentAmount' } } }
    ]);
    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    
    // Get environmental impact metrics (estimated)
    // Based on industry standards: 1kg of recycled waste saves ~0.5kg CO2, ~0.01 trees, ~0.2kWh energy, ~0.5L water
    const co2Saved = totalGarbageCollected * 0.5; // kg CO2 equivalent
    const treesEquivalent = totalGarbageCollected * 0.01; // trees
    const energySaved = totalGarbageCollected * 0.2; // kWh
    const waterSaved = totalGarbageCollected * 0.5; // liters
    
    // Get business metrics
    // For now, we'll use placeholder values since we don't have order data in this model
    const ordersPlaced = 0;
    const averageOrderValue = 0;
    const customerRetentionRate = 0;
    const factorySatisfactionScore = 0;
    
    // Get top performers
    // Top users by collections
    const topUsers = await GarbageCollection.aggregate([
      { $match: { status: { $in: ['completed', 'delivered', 'verified'] } } },
      { $group: { 
          _id: '$userId', 
          collections: { $sum: 1 },
          totalWeight: { $sum: '$collectionDetails.weight' }
      } },
      { $sort: { collections: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
      } },
      { $unwind: '$user' },
      { $project: {
          _id: '$_id',
          name: { $ifNull: ['$user.personalInfo.name', 'Unknown User'] },
          collections: 1,
          tokens: { $multiply: ['$totalWeight', 10] } // Estimate tokens based on weight
      } }
    ]).catch(err => {
      console.error('Error in topUsers aggregation:', err);
      return [];
    });
    
    // Top collectors by earnings
    const topCollectors = await User.find({ role: 'collector' })
      .sort({ 'collectorStats.totalEarnings': -1 })
      .limit(5)
      .select('personalInfo.name collectorStats.totalEarnings collectorStats.totalCollections');
    
    const formattedTopCollectors = topCollectors.map(collector => ({
      _id: collector._id,
      name: collector.personalInfo.name,
      collections: collector.collectorStats?.totalCollections || 0,
      earnings: collector.collectorStats?.totalEarnings || 0
    }));
    
    // Top factories by materials processed (using collections as proxy)
    const topFactories = await GarbageCollection.aggregate([
      { $match: { factoryId: { $exists: true }, status: { $in: ['delivered', 'verified', 'completed'] } } },
      { $group: { 
          _id: '$factoryId', 
          materials: { $sum: '$collectionDetails.weight' },
          collections: { $sum: 1 }
      } },
      { $sort: { materials: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'factory'
      } },
      { $unwind: '$factory' },
      { $project: {
          _id: '$_id',
          name: {
            $concat: [
              { $ifNull: ['$factory.companyInfo.name', ''] },
              ' ',
              { $ifNull: ['$factory.personalInfo.name', ''] }
            ]
          },
          materials: 1
      } }
    ]).catch(err => {
      console.error('Error in topFactories aggregation:', err);
      return [];
    });

    // Waste type distribution
    const wasteTypeDistribution = await GarbageCollection.aggregate([
      { $match: { status: { $in: ['completed', 'delivered', 'verified'] } } },
      { $group: { 
          _id: '$collectionDetails.type', 
          count: { $sum: 1 },
          totalWeight: { $sum: '$collectionDetails.weight' }
      } },
      { $sort: { totalWeight: -1 } }
    ]);
    
    // Calculate percentages
    const totalCollectionsCount = wasteTypeDistribution.reduce((sum, item) => sum + item.count, 0);
    const formattedWasteTypeDistribution = wasteTypeDistribution.map(item => ({
      type: item._id,
      count: item.count,
      weight: item.totalWeight,
      percentage: totalCollectionsCount > 0 ? (item.count / totalCollectionsCount) * 100 : 0
    }));
    
    // Collection trends (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const collectionTrends = await GarbageCollection.aggregate([
      { $match: { 
          status: { $in: ['completed', 'delivered', 'verified'] },
          createdAt: { $gte: startDate, $lte: endDate }
      } },
      { $group: {
          _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          collections: { $sum: 1 },
          totalWeight: { $sum: '$collectionDetails.weight' }
      } },
      { $sort: { _id: 1 } }
    ]);
    
    const formattedCollectionTrends = collectionTrends.map(item => ({
      date: item._id,
      collections: item.collections,
      weight: item.totalWeight
    }));
    
    console.log('Analytics data fetched successfully');
    
    res.json({
      success: true,
      data: {
        platformMetrics: {
          totalUsers,
          activeUsers,
          totalCollectors,
          totalFactories,
          totalGarbageCollected,
          totalTokensIssued,
          totalRevenue
        },
        environmentalImpact: {
          co2Saved,
          treesEquivalent,
          energySaved,
          waterSaved
        },
        businessMetrics: {
          ordersPlaced,
          averageOrderValue,
          customerRetentionRate,
          factorySatisfactionScore
        },
        topPerformers: {
          topUsers,
          topCollectors: formattedTopCollectors,
          topFactories
        },
        wasteTypeDistribution: formattedWasteTypeDistribution,
        collectionTrends: formattedCollectionTrends
      }
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message
    });
  }
};

/**
 * Get all applications (collectors and factories)
 */
const getAllApplications = async (req, res) => {
  try {
    console.log('getAllApplications called with query:', req.query);
    // Only admin can access this
    if (req.user.role !== 'admin') {
      console.log('User role is not admin:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { status, type } = req.query;
    console.log('Query parameters - status:', status, 'type:', type);
    
    // Build filters
    const filters = {};
    if (status) filters.status = status;
    
    let applications = [];
    
    // Get factory applications
    if (!type || type === 'factory') {
      console.log('Fetching factory applications with filters:', filters);
      const factoryApplications = await FactoryApplication.find(filters)
        .populate('userId', 'personalInfo.name personalInfo.email role')
        .sort({ submittedAt: -1 });
      console.log('Found factory applications:', factoryApplications.length);
      
      applications = applications.concat(factoryApplications.map(app => {
        const appObj = app.toObject ? app.toObject() : app;
        return {
          ...appObj,
          type: 'factory'
        };
      }));
    }
    
    // Get collector applications
    if (!type || type === 'collector') {
      console.log('Fetching collector applications with filters:', filters);
      const collectorApplications = await CollectorApplication.find(filters)
        .populate('userId', 'personalInfo.name personalInfo.email role')
        .sort({ submittedAt: -1 });
      console.log('Found collector applications:', collectorApplications.length);
      
      applications = applications.concat(collectorApplications.map(app => {
        const appObj = app.toObject ? app.toObject() : app;
        return {
          ...appObj,
          type: 'collector'
        };
      }));
    }
    
    console.log('Total applications before sorting:', applications.length);
    
    // Sort all applications by submitted date
    applications.sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt) : new Date(0);
      const dateB = b.submittedAt ? new Date(b.submittedAt) : new Date(0);
      return dateB - dateA;
    });
    
    console.log('Total applications after sorting:', applications.length);
    
    res.json({
      success: true,
      data: {
        applications: applications || []
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    logger.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

/**
 * Approve factory application
 */
const approveFactoryApplication = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { applicationId } = req.params;
    
    // Find the factory application
    const application = await FactoryApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Factory application not found'
      });
    }
    
    // Check if already approved or rejected
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}`
      });
    }
    
    // Update application status
    application.status = 'approved';
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    await application.save();
    
    // Update user account status to active
    const user = await User.findById(application.userId);
    if (user) {
      user.accountStatus = 'active';
      // Update company info
      user.companyInfo = {
        name: application.factoryName,
        gstNumber: application.gstNumber,
        address: application.address,
        contactPerson: application.contactPerson
      };
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Factory application approved successfully',
      data: {
        application
      }
    });
  } catch (error) {
    logger.error('Error approving factory application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve factory application',
      error: error.message
    });
  }
};

/**
 * Reject factory application
 */
const rejectFactoryApplication = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { applicationId } = req.params;
    const { reason } = req.body;
    
    // Find the factory application
    const application = await FactoryApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Factory application not found'
      });
    }
    
    // Check if already approved or rejected
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}`
      });
    }
    
    // Update application status
    application.status = 'rejected';
    application.rejectionReason = reason;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    await application.save();
    
    res.json({
      success: true,
      message: 'Factory application rejected successfully',
      data: {
        application
      }
    });
  } catch (error) {
    logger.error('Error rejecting factory application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject factory application',
      error: error.message
    });
  }
};

/**
 * Approve collector application
 */
const approveCollectorApplication = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { applicationId } = req.params;
    
    // Find the collector application
    const application = await CollectorApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Collector application not found'
      });
    }
    
    // Check if already approved or rejected
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}`
      });
    }
    
    // Update application status
    application.status = 'approved';
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    await application.save();
    
    // Update user account status to active
    const user = await User.findById(application.userId);
    if (user) {
      user.accountStatus = 'active';
      // Update company info
      user.companyInfo = {
        name: application.companyName,
        serviceArea: application.serviceArea,
        vehicleDetails: application.vehicleDetails,
        licenseNumber: application.licenseNumber,
        contactPerson: application.contactPerson
      };
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Collector application approved successfully',
      data: {
        application
      }
    });
  } catch (error) {
    logger.error('Error approving collector application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve collector application',
      error: error.message
    });
  }
};

/**
 * Reject collector application
 */
const rejectCollectorApplication = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { applicationId } = req.params;
    const { reason } = req.body;
    
    // Find the collector application
    const application = await CollectorApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Collector application not found'
      });
    }
    
    // Check if already approved or rejected
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}`
      });
    }
    
    // Update application status
    application.status = 'rejected';
    application.rejectionReason = reason;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    await application.save();
    
    res.json({
      success: true,
      message: 'Collector application rejected successfully',
      data: {
        application
      }
    });
  } catch (error) {
    logger.error('Error rejecting collector application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject collector application',
      error: error.message
    });
  }
};

module.exports = {
  getCollectionsForPayment,
  processCollectorPayment,
  getAdminStats,
  getAllUsers,
  getAllCollectors,
  getAllFactories,
  getPaymentHistory,
  getPaymentStatistics,
  debugPaymentHistory,
  getAnalyticsData,
  getAllApplications,
  approveFactoryApplication,
  rejectFactoryApplication,
  approveCollectorApplication,
  rejectCollectorApplication
};