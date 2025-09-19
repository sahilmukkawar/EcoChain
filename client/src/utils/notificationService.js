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
    return nodemailer.createTransport({
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

// Send OTP for email verification
const sendOTP = async (user, otp) => {
  try {
    const subject = 'EcoChain - Email Verification Code';
    const text = 'Dear ' + user.personalInfo.name + ',\n\n' +
      'Thank you for signing up with EcoChain. Please use the following verification code to complete your sign up:\n\n' +
      'Verification Code: ' + otp + '\n\n' +
      'This code will expire in 10 minutes.\n\n' +
      'Best regards,\nThe EcoChain Team';
      
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Email Verification</h2>
        <p>Dear ${user.personalInfo.name},</p>
        <p>Thank you for signing up with EcoChain.</p>
        <p>Please use the following verification code to complete your sign up:</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0; color: #0369a1; font-size: 24px; letter-spacing: 5px;">${otp}</h3>
        </div>
        <p><strong>This code will expire in 10 minutes.</strong></p>
        <p>Best regards,<br/>The EcoChain Team</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@ecochain.com',
      to: user.personalInfo.email,
      subject: subject,
      text: text,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 OTP sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    throw error;
  }
};

// Send approval notification
const sendApprovalNotification = async (user, application, action) => {
  try {
    const subject = action === 'approved' 
      ? 'EcoChain ' + user.role + ' Application Approved' 
      : 'EcoChain ' + user.role + ' Application Rejected';
      
    const text = action === 'approved'
      ? 'Dear ' + user.personalInfo.name + ',\n\n' +
        'Great news! Your ' + user.role + ' application has been approved. ' +
        'You can now log in to your account and access all features.\n\n' +
        'Best regards,\nThe EcoChain Team'
      : 'Dear ' + user.personalInfo.name + ',\n\n' +
        'We regret to inform you that your ' + user.role + ' application has been rejected.\n\n' +
        'Reason: ' + (application.rejectionReason || 'No reason provided') + '\n\n' +
        'If you have any questions, please contact our support team.\n\n' +
        'Best regards,\nThe EcoChain Team';
        
    const html = action === 'approved'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Application Approved!</h2>
          <p>Dear ${user.personalInfo.name},</p>
          <p>Great news! Your ${user.role} application has been <strong style="color: #22c55e;">approved</strong>.</p>
          <p>You can now log in to your account and access all features.</p>
          <p>Best regards,<br/>The EcoChain Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Application Rejected</h2>
          <p>Dear ${user.personalInfo.name},</p>
          <p>We regret to inform you that your ${user.role} application has been <strong style="color: #ef4444;">rejected</strong>.</p>
          <p><strong>Reason:</strong> ${application.rejectionReason || 'No reason provided'}</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br/>The EcoChain Team</p>
        </div>
      `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@ecochain.com',
      to: user.personalInfo.email,
      subject: subject,
      text: text,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Approval notification sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending approval notification:', error);
    throw error;
  }
};

// Send sign up confirmation
const sendSignUpConfirmation = async (user) => {
  try {
    const subject = 'Welcome to EcoChain!';
    const text = 'Dear ' + user.personalInfo.name + ',\n\n' +
      'Thank you for signing up with EcoChain. ' +
      (user.role === 'factory' || user.role === 'collector' 
        ? 'Your application is pending admin approval. You will receive a notification once approved.' 
        : 'You can now start using all EcoChain features.') + '\n\n' +
      'Best regards,\nThe EcoChain Team';
      
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Welcome to EcoChain!</h2>
        <p>Dear ${user.personalInfo.name},</p>
        <p>Thank you for signing up with EcoChain.</p>
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
      subject: subject,
      text: text,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Sign up confirmation sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending sign up confirmation:', error);
    throw error;
  }
};

module.exports = {
  sendOTP: sendOTP,
  sendApprovalNotification: sendApprovalNotification,
  sendSignUpConfirmation: sendSignUpConfirmation
};