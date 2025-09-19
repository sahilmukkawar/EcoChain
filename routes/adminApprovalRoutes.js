// routes/adminApprovalRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { User, FactoryApplication, CollectorApplication } = require('../database/models');
const { sendApprovalNotification } = require('../client/src/utils/notificationService');

// Get all applications (factory and collector)
router.get('/applications', authenticate, async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { status, type, page = 1, limit = 20 } = req.query;

    // Build query filters
    const filters = {};
    if (status && status !== 'all') {
      filters.status = status;
    }

    // Get factory applications
    let factoryApplications = [];
    let collectorApplications = [];

    if (!type || type === 'all' || type === 'factory') {
      factoryApplications = await FactoryApplication.find(filters)
        .populate('userId', 'personalInfo.name personalInfo.email role')
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    }

    if (!type || type === 'all' || type === 'collector') {
      collectorApplications = await CollectorApplication.find(filters)
        .populate('userId', 'personalInfo.name personalInfo.email role')
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    }

    // Combine and sort applications
    const allApplications = [...factoryApplications, ...collectorApplications]
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, limit);

    // Get total counts
    const factoryCount = await FactoryApplication.countDocuments(filters);
    const collectorCount = await CollectorApplication.countDocuments(filters);
    const total = factoryCount + collectorCount;

    res.json({
      success: true,
      data: {
        applications: allApplications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// Approve factory application
router.post('/applications/factory/:applicationId/approve', authenticate, async (req, res) => {
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
    const application = await FactoryApplication.findById(applicationId)
      .populate('userId', 'personalInfo.name personalInfo.email role');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Factory application not found'
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
      await user.save();
    }

    // Send approval notification
    try {
      await sendApprovalNotification(user, application, 'approved');
    } catch (emailError) {
      console.error('Failed to send approval notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Factory application approved successfully',
      data: {
        application
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve factory application',
      error: error.message
    });
  }
});

// Reject factory application
router.post('/applications/factory/:applicationId/reject', authenticate, async (req, res) => {
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
    const application = await FactoryApplication.findById(applicationId)
      .populate('userId', 'personalInfo.name personalInfo.email role');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Factory application not found'
      });
    }

    // Update application status
    application.status = 'rejected';
    application.rejectionReason = reason;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    await application.save();

    // Get user for notification
    const user = await User.findById(application.userId);
    
    // Send rejection notification
    try {
      await sendApprovalNotification(user, application, 'rejected');
    } catch (emailError) {
      console.error('Failed to send rejection notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Factory application rejected successfully',
      data: {
        application
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject factory application',
      error: error.message
    });
  }
});

// Approve collector application
router.post('/applications/collector/:applicationId/approve', authenticate, async (req, res) => {
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
    const application = await CollectorApplication.findById(applicationId)
      .populate('userId', 'personalInfo.name personalInfo.email role');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Collector application not found'
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
      await user.save();
    }

    // Send approval notification
    try {
      await sendApprovalNotification(user, application, 'approved');
    } catch (emailError) {
      console.error('Failed to send approval notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Collector application approved successfully',
      data: {
        application
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve collector application',
      error: error.message
    });
  }
});

// Reject collector application
router.post('/applications/collector/:applicationId/reject', authenticate, async (req, res) => {
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
    const application = await CollectorApplication.findById(applicationId)
      .populate('userId', 'personalInfo.name personalInfo.email role');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Collector application not found'
      });
    }

    // Update application status
    application.status = 'rejected';
    application.rejectionReason = reason;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    await application.save();

    // Get user for notification
    const user = await User.findById(application.userId);
    
    // Send rejection notification
    try {
      await sendApprovalNotification(user, application, 'rejected');
    } catch (emailError) {
      console.error('Failed to send rejection notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Collector application rejected successfully',
      data: {
        application
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject collector application',
      error: error.message
    });
  }
});

module.exports = router;