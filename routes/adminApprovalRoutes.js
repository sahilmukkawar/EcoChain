// routes/adminApprovalRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { User, FactoryApplication, CollectorApplication, Factory } = require('../database/models');
const { sendApprovalNotification } = require('../utils/notificationService');
const logger = require('../utils/logger');

// Get all pending factory applications
router.get('/factories/pending', authenticate, authorize('admin'), async (req, res) => {
  try {
    const pendingFactories = await FactoryApplication.find({ status: 'pending' })
      .populate('userId', 'personalInfo.name personalInfo.email personalInfo.phone')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        factories: pendingFactories
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all pending collector applications
router.get('/collectors/pending', authenticate, authorize('admin'), async (req, res) => {
  try {
    const pendingCollectors = await CollectorApplication.find({ status: 'pending' })
      .populate('userId', 'personalInfo.name personalInfo.email personalInfo.phone')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        collectors: pendingCollectors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all applications (pending, approved, rejected) with filtering
router.get('/applications', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    let applications = [];
    let totalCount = 0;

    if (!type || type === 'factory') {
      const factoryQuery = { ...query };
      if (type === 'factory') {
        applications = await FactoryApplication.find(factoryQuery)
          .populate('userId', 'personalInfo.name personalInfo.email personalInfo.phone role')
          .populate('reviewedBy', 'personalInfo.name')
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));
        
        totalCount = await FactoryApplication.countDocuments(factoryQuery);
      }
    }

    if (!type || type === 'collector') {
      const collectorQuery = { ...query };
      if (type === 'collector') {
        applications = await CollectorApplication.find(collectorQuery)
          .populate('userId', 'personalInfo.name personalInfo.email personalInfo.phone role')
          .populate('reviewedBy', 'personalInfo.name')
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));
        
        totalCount = await CollectorApplication.countDocuments(collectorQuery);
      }
    }

    // If no specific type, combine both
    if (!type) {
      const factoryApplications = await FactoryApplication.find(query)
        .populate('userId', 'personalInfo.name personalInfo.email personalInfo.phone role')
        .populate('reviewedBy', 'personalInfo.name')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit / 2));
      
      const collectorApplications = await CollectorApplication.find(query)
        .populate('userId', 'personalInfo.name personalInfo.email personalInfo.phone role')
        .populate('reviewedBy', 'personalInfo.name')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit / 2));
      
      applications = [...factoryApplications, ...collectorApplications];
      totalCount = await FactoryApplication.countDocuments(query) + await CollectorApplication.countDocuments(query);
    }

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve factory application
router.put('/factories/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body; // For consistency, though not used for approval

    // Find the factory application
    const factoryApplication = await FactoryApplication.findById(id);
    if (!factoryApplication) {
      return res.status(404).json({ success: false, message: 'Factory application not found' });
    }

    // Update factory application status
    factoryApplication.status = 'approved';
    factoryApplication.reviewedBy = req.user.id;
    factoryApplication.reviewedAt = new Date();
    await factoryApplication.save();

    // Update user approval status
    const user = await User.findById(factoryApplication.userId);
    if (user) {
      user.approvalStatus = 'approved';
      await user.save();
      
      // Automatically create factory profile using application data
      try {
        const existingFactory = await Factory.findOne({ userId: factoryApplication.userId });
        if (!existingFactory) {
          const factoryData = {
            factoryId: 'FAC' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
            userId: factoryApplication.userId, // This should be an ObjectId
            companyInfo: {
              name: factoryApplication.factoryName,
              registrationNumber: factoryApplication.gstNumber,
            },
            contactInfo: {
              email: factoryApplication.email,
              phone: factoryApplication.phone,
              primaryContact: factoryApplication.ownerName,
            },
            location: {
              address: factoryApplication.address.street,
              city: factoryApplication.address.city,
              state: factoryApplication.address.state,
              country: factoryApplication.address.country,
              coordinates: {
                type: 'Point',
                coordinates: [0, 0] // Default coordinates, can be updated later
              }
            },
            capabilities: {
              processingCapacity: 1, // Set to 1 as minimum required value
              acceptedMaterials: [] // Will be set by factory later
            }
          };

          logger.info('Creating factory profile with data:', factoryData);
          logger.info('Factory userId type:', typeof factoryData.userId);
          logger.info('Factory userId value:', factoryData.userId);
          
          const factory = new Factory(factoryData);
          await factory.save();
          logger.info('Factory profile created successfully:', factory._id);
        } else {
          logger.info('Factory profile already exists for userId:', factoryApplication.userId);
        }
      } catch (factoryCreationError) {
        logger.error('Failed to create factory profile:', factoryCreationError);
        // Don't fail the approval if factory profile creation fails
      }
      
      // Send approval notification
      try {
        await sendApprovalNotification(user, factoryApplication, 'approved');
      } catch (emailError) {
        console.error('Failed to send approval notification:', emailError);
        // Don't fail the approval if email fails
      }
    }

    res.json({
      success: true,
      message: 'Factory application approved successfully',
      data: {
        application: factoryApplication
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reject factory application
router.put('/factories/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    // Find the factory application
    const factoryApplication = await FactoryApplication.findById(id);
    if (!factoryApplication) {
      return res.status(404).json({ success: false, message: 'Factory application not found' });
    }

    // Update factory application status
    factoryApplication.status = 'rejected';
    factoryApplication.rejectionReason = rejectionReason;
    factoryApplication.reviewedBy = req.user.id;
    factoryApplication.reviewedAt = new Date();
    await factoryApplication.save();

    // Update user approval status
    const user = await User.findById(factoryApplication.userId);
    if (user) {
      user.approvalStatus = 'rejected';
      user.rejectionReason = rejectionReason;
      await user.save();
      
      // Send rejection notification
      try {
        await sendApprovalNotification(user, factoryApplication, 'rejected');
      } catch (emailError) {
        console.error('Failed to send rejection notification:', emailError);
        // Don't fail the rejection if email fails
      }
    }

    res.json({
      success: true,
      message: 'Factory application rejected successfully',
      data: {
        application: factoryApplication
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve collector application
router.put('/collectors/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Find the collector application
    const collectorApplication = await CollectorApplication.findById(id);
    if (!collectorApplication) {
      return res.status(404).json({ success: false, message: 'Collector application not found' });
    }

    // Update collector application status
    collectorApplication.status = 'approved';
    collectorApplication.reviewedBy = req.user.id;
    collectorApplication.reviewedAt = new Date();
    await collectorApplication.save();

    // Update user approval status
    const user = await User.findById(collectorApplication.userId);
    if (user) {
      user.approvalStatus = 'approved';
      await user.save();
      
      // Send approval notification
      try {
        await sendApprovalNotification(user, collectorApplication, 'approved');
      } catch (emailError) {
        console.error('Failed to send approval notification:', emailError);
        // Don't fail the approval if email fails
      }
    }

    res.json({
      success: true,
      message: 'Collector application approved successfully',
      data: {
        application: collectorApplication
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reject collector application
router.put('/collectors/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    // Find the collector application
    const collectorApplication = await CollectorApplication.findById(id);
    if (!collectorApplication) {
      return res.status(404).json({ success: false, message: 'Collector application not found' });
    }

    // Update collector application status
    collectorApplication.status = 'rejected';
    collectorApplication.rejectionReason = rejectionReason;
    collectorApplication.reviewedBy = req.user.id;
    collectorApplication.reviewedAt = new Date();
    await collectorApplication.save();

    // Update user approval status
    const user = await User.findById(collectorApplication.userId);
    if (user) {
      user.approvalStatus = 'rejected';
      user.rejectionReason = rejectionReason;
      await user.save();
      
      // Send rejection notification
      try {
        await sendApprovalNotification(user, collectorApplication, 'rejected');
      } catch (emailError) {
        console.error('Failed to send rejection notification:', emailError);
        // Don't fail the rejection if email fails
      }
    }

    res.json({
      success: true,
      message: 'Collector application rejected successfully',
      data: {
        application: collectorApplication
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get specific factory application details
router.get('/factories/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const factoryApplication = await FactoryApplication.findById(id)
      .populate('userId', 'personalInfo.name personalInfo.email personalInfo.phone role accountStatus');
    
    if (!factoryApplication) {
      return res.status(404).json({ success: false, message: 'Factory application not found' });
    }

    res.json({
      success: true,
      data: {
        application: factoryApplication
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get specific collector application details
router.get('/collectors/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const collectorApplication = await CollectorApplication.findById(id)
      .populate('userId', 'personalInfo.name personalInfo.email personalInfo.phone role accountStatus');
    
    if (!collectorApplication) {
      return res.status(404).json({ success: false, message: 'Collector application not found' });
    }

    res.json({
      success: true,
      data: {
        application: collectorApplication
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;