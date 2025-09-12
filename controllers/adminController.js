// controllers/adminController.js
const GarbageCollection = require('../database/models/GarbageCollection');
const User = require('../database/models/User');
const AdminPayment = require('../database/models/AdminPayment');
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

module.exports = {
  getCollectionsForPayment,
  processCollectorPayment,
  getAdminStats,
  getAllUsers,
  getAllCollectors,
  getAllFactories,
  getPaymentHistory,
  getPaymentStatistics,
  debugPaymentHistory
};