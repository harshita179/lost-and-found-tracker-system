let nodemailerLib = null;
let transportVerified = false;

const normalizeEnvValue = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const isEmailSendingEnabled = () => {
  const emailEnabled = normalizeEnvValue(process.env.EMAIL_ENABLED).toLowerCase();

  if (emailEnabled === 'true') {
    return true;
  }

  if (emailEnabled === 'false') {
    return false;
  }

  return false;
};

const getNodemailer = () => {
  if (nodemailerLib) {
    return nodemailerLib;
  }

  try {
    nodemailerLib = require('nodemailer');
    return nodemailerLib;
  } catch (error) {
    console.warn('nodemailer package not available, email sending disabled');
    return null;
  }
};

const createTransporter = () => {
  const nodemailer = getNodemailer();

  if (!nodemailer) {
    return null;
  }

  const emailUser = normalizeEnvValue(process.env.EMAIL_USER);
  const emailPass = normalizeEnvValue(process.env.EMAIL_PASS).replace(/\s+/g, '');

  if (!emailUser || !emailPass || !isEmailSendingEnabled()) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

const hasEmailConfig = () => {
  const emailUser = normalizeEnvValue(process.env.EMAIL_USER);
  const emailPass = normalizeEnvValue(process.env.EMAIL_PASS).replace(/\s+/g, '');

  return Boolean(
    isEmailSendingEnabled() &&
    emailUser &&
    emailPass
  );
};

const getFromAddress = () => {
  const emailUser = normalizeEnvValue(process.env.EMAIL_USER);
  const fromName = normalizeEnvValue(process.env.EMAIL_FROM_NAME);

  if (fromName && emailUser) {
    return `"${fromName}" <${emailUser}>`;
  }

  return emailUser || 'noreply@lostandfound.com';
};

const verifyEmailTransporter = async () => {
  if (transportVerified) {
    return { ok: true };
  }

  if (!hasEmailConfig()) {
    return { ok: false, reason: 'Email sending disabled or credentials missing' };
  }

  const transporter = createTransporter();

  if (!transporter) {
    return { ok: false, reason: 'Transporter could not be created' };
  }

  try {
    await transporter.verify();
    transportVerified = true;
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
};

const sendMatchNotification = async (userEmail, username, itemDetails, matchedWithItem) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log(`Match notification email skipped for ${userEmail}`);
      return false;
    }

    const otherPartyName = matchedWithItem?.reportedByName || 'Not available';
    const otherPartyContact = matchedWithItem?.contactNumber || 'Not provided';

    const mailOptions = {
      from: getFromAddress(),
      to: userEmail,
      subject: 'Your item has been matched',
      text: `Hi ${username}, your reported item has been matched with "${matchedWithItem.title}".\n\nOther party name: ${otherPartyName}\nContact number: ${otherPartyContact}\n\nPlease log in to your dashboard for details.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px;">
            <h1 style="color: white; margin: 0; text-align: center;">Good news</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi <strong>${username}</strong>,</p>

            <p style="font-size: 16px; color: #333;">
              Great news. Your reported item has been matched with a found item.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #667eea; margin-top: 0;">Your item</h3>
              <p><strong>Title:</strong> ${itemDetails.title}</p>
              <p><strong>Category:</strong> ${itemDetails.category}</p>
              <p><strong>Description:</strong> ${itemDetails.description}</p>
              <p><strong>Date Reported:</strong> ${new Date(itemDetails.createdAt).toLocaleDateString()}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48bb78;">
              <h3 style="color: #48bb78; margin-top: 0;">Matched with</h3>
              <p><strong>Title:</strong> ${matchedWithItem.title}</p>
              <p><strong>Category:</strong> ${matchedWithItem.category}</p>
              <p><strong>Description:</strong> ${matchedWithItem.description}</p>
              <p><strong>Date Found:</strong> ${new Date(matchedWithItem.createdAt).toLocaleDateString()}</p>
              <p><strong>Other Party Name:</strong> ${otherPartyName}</p>
              <p><strong>Contact Number:</strong> ${otherPartyContact}</p>
            </div>

            <p style="font-size: 16px; color: #333;">
              Please visit the Lost & Found office to claim your item.
              Bring a valid ID for verification.
            </p>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View in dashboard
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated notification from Medipacs Lost & Found System.
              Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Match notification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending match notification:', error.message);
    return false;
  }
};

const sendPasswordResetCode = async (userEmail, username, resetCode) => {
  if (!hasEmailConfig()) {
    console.log(`Password reset email skipped for ${userEmail}: email configuration is incomplete or disabled`);
    return { sent: false, fallback: 'disabled' };
  }

  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log(`Password reset email skipped for ${userEmail}: transporter unavailable`);
      return { sent: false, fallback: 'disabled' };
    }

    const mailOptions = {
      from: getFromAddress(),
      to: userEmail,
      subject: 'Password reset code',
      text: `Hi ${username}, use this verification code to reset your password: ${resetCode}. This code expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%); padding: 24px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Reset your password</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi <strong>${username}</strong>,</p>
            <p style="font-size: 16px; color: #333;">
              Use the verification code below to reset your Lost & Found account password.
            </p>

            <div style="margin: 24px 0; padding: 20px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center;">
              <div style="font-size: 30px; font-weight: 700; letter-spacing: 8px; color: #312e81;">${resetCode}</div>
            </div>

            <p style="font-size: 14px; color: #4b5563;">
              This code expires in 10 minutes. If you did not request a password reset, you can ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { sent: true };
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
    return { sent: false, fallback: 'error' };
  }
};

const sendSignupVerificationCode = async (userEmail, username, verificationCode) => {
  if (!hasEmailConfig()) {
    console.log(`Signup verification email skipped for ${userEmail}: email configuration is incomplete or disabled`);
    return { sent: false, fallback: 'disabled' };
  }

  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log(`Signup verification email skipped for ${userEmail}: transporter unavailable`);
      return { sent: false, fallback: 'disabled' };
    }

    const mailOptions = {
      from: getFromAddress(),
      to: userEmail,
      subject: 'Verify your signup',
      text: `Hi ${username}, use this OTP to complete your Lost & Found account signup: ${verificationCode}. This OTP expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0f766e 0%, #0f172a 100%); padding: 24px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Verify your email</h1>
          </div>

          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi <strong>${username}</strong>,</p>
            <p style="font-size: 16px; color: #333;">
              Use the OTP below to complete your Lost & Found account signup.
            </p>

            <div style="margin: 24px 0; padding: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
              <div style="font-size: 30px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">${verificationCode}</div>
            </div>

            <p style="font-size: 14px; color: #475569;">
              This OTP expires in 10 minutes. If you did not attempt to sign up, you can ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Signup verification email sent:', info.messageId);
    return { sent: true };
  } catch (error) {
    console.error('Error sending signup verification email:', error.message);
    return { sent: false, fallback: 'error' };
  }
};

const sendRejectionNotification = async (userEmail, username, itemDetails, rejectionReason) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log(`Rejection notification email skipped for ${userEmail} (no transporter)`);
      return false;
    }

    const reasonBlock = rejectionReason
      ? `
            <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e53e3e;">
              <h3 style="color: #e53e3e; margin-top: 0;">Reason for rejection</h3>
              <p style="font-size: 15px; color: #333; margin: 0;">${rejectionReason}</p>
            </div>`
      : '';

    const mailOptions = {
      from: getFromAddress(),
      to: userEmail,
      subject: 'Your item report has been rejected',
      text: `Hi ${username}, your item report "${itemDetails.title}" has been rejected.\n\nReason for rejection: ${rejectionReason}\n\nPlease log in to your dashboard for details.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Report rejected</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi <strong>${username}</strong>,</p>

            <p style="font-size: 16px; color: #333;">
              We are sorry to inform you that your reported item has been reviewed and rejected by the admin.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #667eea; margin-top: 0;">Your item</h3>
              <p><strong>Title:</strong> ${itemDetails.title}</p>
              <p><strong>Type:</strong> ${itemDetails.itemType}</p>
              <p><strong>Category:</strong> ${itemDetails.category}</p>
              <p><strong>Location:</strong> ${itemDetails.location}</p>
              <p><strong>Date Reported:</strong> ${new Date(itemDetails.createdAt).toLocaleDateString()}</p>
            </div>

            ${reasonBlock}

            <p style="font-size: 16px; color: #333;">
              If you believe this was a mistake, please contact the admin or re-submit your report with the correct details.
            </p>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to dashboard
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated notification from Medipacs Lost & Found System.
              Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection notification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending rejection notification:', error.message);
    return false;
  }
};

module.exports = {
  sendMatchNotification,
  sendPasswordResetCode,
  sendSignupVerificationCode,
  sendRejectionNotification,
  hasEmailConfig,
  verifyEmailTransporter,
};
