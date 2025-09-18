// utils/notificationService.js
const nodemailer = require('nodemailer');

// Mock email transporter for development
const createMockTransporter = () => {
  return {
    sendMail: async (mailOptions) => {
      console.log('📧 Mock Email Notification:');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Body:', mailOptions.text);
      console.log('HTML:', mailOptions.html);
      
      // In a real implementation, this would send an actual email
      return { messageId: 'mock-message-id' };
    }
  };
};

// Create transporter based on environment
const createTransporter = () => {
  // Check if we have real SMTP credentials
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Use mock transporter for development
  return createMockTransporter();
};

const transporter = createTransporter();

// Send approval notification
const sendApprovalNotification = async (user, application, action) => {
  try {
    const subject = action === 'approved' 
      ? `EcoChain ${application.userId.role} Application Approved` 
      : `EcoChain ${application.userId.role} Application Rejected`;
      
    const text = action === 'approved'
      ? `Dear ${user.personalInfo.name},\n\n` +
        `Great news! Your ${application.userId.role} application has been approved. ` +
        `You can now log in to your account and access all features.\n\n` +
        `Best regards,\nThe EcoChain Team`
      : `Dear ${user.personalInfo.name},\n\n` +
        `We regret to inform you that your ${application.userId.role} application has been rejected.\n\n` +
        `Reason: ${application.rejectionReason}\n\n` +
        `If you have any questions, please contact our support team.\n\n` +
        `Best regards,\nThe EcoChain Team`;
        
    const html = action === 'approved'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Application Approved!</h2>
          <p>Dear ${user.personalInfo.name},</p>
          <p>Great news! Your ${application.userId.role} application has been <strong style="color: #22c55e;">approved</strong>.</p>
          <p>You can now log in to your account and access all features.</p>
          <p>Best regards,<br/>The EcoChain Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Application Rejected</h2>
          <p>Dear ${user.personalInfo.name},</p>
          <p>We regret to inform you that your ${application.userId.role} application has been <strong style="color: #ef4444;">rejected</strong>.</p>
          <p><strong>Reason:</strong> ${application.rejectionReason}</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br/>The EcoChain Team</p>
        </div>
      `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@ecochain.com',
      to: user.personalInfo.email,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Approval notification sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending approval notification:', error);
    throw error;
  }
};

// Send registration confirmation
const sendRegistrationConfirmation = async (user) => {
  try {
    const subject = 'Welcome to EcoChain!';
    const text = `Dear ${user.personalInfo.name},\n\n` +
      `Thank you for registering with EcoChain. ` +
      `${user.role === 'factory' || user.role === 'collector' 
        ? 'Your application is pending admin approval. You will receive a notification once approved.' 
        : 'You can now start using all EcoChain features.'}\n\n` +
      `Best regards,\nThe EcoChain Team`;
      
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Welcome to EcoChain!</h2>
        <p>Dear ${user.personalInfo.name},</p>
        <p>Thank you for registering with EcoChain.</p>
        <p>
          ${user.role === 'factory' || user.role === 'collector' 
            ? 'Your application is <strong style="color: #f59e0b;">pending admin approval</strong>. You will receive a notification once approved.' 
            : 'You can now start using all EcoChain features.'}
        </p>
        <p>Best regards,<br/>The EcoChain Team</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@ecochain.com',
      to: user.personalInfo.email,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Registration confirmation sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending registration confirmation:', error);
    throw error;
  }
};

module.exports = {
  sendApprovalNotification,
  sendRegistrationConfirmation
};