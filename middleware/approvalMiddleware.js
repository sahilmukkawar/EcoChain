// middleware/approvalMiddleware.js
const { User } = require('../database/models');

/**
 * Middleware to check if factory/collector accounts are approved
 * Should be used after authenticate middleware
 */
const checkApprovalStatus = async (req, res, next) => {
  try {
    // Get full user details
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user is a factory or collector
    if ((user.role === 'factory' || user.role === 'collector') && user.approvalStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Account pending admin approval',
        approvalStatus: user.approvalStatus,
        data: {
          role: user.role,
          approvalStatus: user.approvalStatus,
          rejectionReason: user.rejectionReason
        }
      });
    }
    
    // If approved or not a factory/collector, continue
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error checking approval status' 
    });
  }
};

module.exports = {
  checkApprovalStatus
};