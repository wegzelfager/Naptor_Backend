const nodemailer = require('nodemailer');


let _transporter = null;
const getTransporter = () => {
    if (!_transporter) {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = port === 465; // true for 465 (SSL), false for 587 (STARTTLS)
        _transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure,
            requireTLS: !secure, // only require STARTTLS upgrade when NOT using SSL
            auth: {
                type: 'login',
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            connectionTimeout: 15000,
            greetingTimeout: 10000,
            socketTimeout: 20000,
        });
    }
    return _transporter;
};
const sendDownAlert = async ({ userEmail, monitorName, monitorUrl, error, time }) => {
    try {
        await getTransporter().sendMail({
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: `🚨 ALERT: ${monitorName} is DOWN!`,
            html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: #d9534f;">🚨 Monitor Alert: DOWN</h2>
                        <p>Your monitor <strong>${monitorName}</strong> (${monitorUrl}) went down at <strong>${time}</strong>.</p>
                        <div style="background-color: #f8d7da; color: #721c24; padding: 12px; border-radius: 4px; margin: 15px 0;">
                            <strong>Error Details:</strong> ${error || 'No response from server'}
                        </div>
                        <p style="color: #6c757d; font-size: 12px;">Naptor Signal Monitoring Engine</p>
                    </div>
                `
        })
        console.log(`[Alert Email]: Email sent to ${userEmail}`);
    } catch (error) {
        console.error(`[Alert Email Error]: Failed to send email to ${userEmail}`, error);
    }
}
const sendUpAlert = async ({ userEmail, monitorName, monitorUrl, time }) => {
    try {
        await getTransporter().sendMail({
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: `✅ RECOVERED: ${monitorName} is back UP!`,
            html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: #5cb85c;">✅ Monitor Recovered</h2>
                        <p>Good news! Your monitor <strong>${monitorName}</strong> (${monitorUrl}) is back online at <strong>${time}</strong>.</p>
                        <p style="color: #6c757d; font-size: 12px;">Naptor Signal Monitoring Engine</p>
                    </div>
                `
        })
        console.log(`[Alert Email]: Email sent to ${userEmail}`);
    } catch (error) {
        console.error(`[Alert Email Error]: Failed to send email to ${userEmail}`, error);
    }
}

const sendVerificationEmail = async ({ userEmail, userName, verificationUrl }) => {
    try {
        await getTransporter().sendMail({
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: `Verify Your Email - Naptor Signal`,
            html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: #6366f1;">Welcome to Naptor Signal, ${userName}! 👋</h2>
                        <p>Thank you for signing up. Please verify your email address to activate your account and start monitoring your services.</p>
                        <div style="margin: 30px 0;">
                            <a href="${verificationUrl}" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
                        </div>
                        <p style="color: #9ca3af; font-size: 0.875rem;">If you did not create an account, you can safely ignore this email.</p>
                        <p style="color: #9ca3af; font-size: 0.875rem;">This link will expire in 24 hours.</p>
                    </div>
                `
        })
        console.log(`[Alert Email]: Email sent to ${userEmail}`);
    } catch (error) {
        console.error(`[Alert Email Error]: Failed to send email to ${userEmail}`, error);
    }
}

const sendPasswordResetEmail = async ({ userEmail, userName, resetUrl }) => {
    try {
        await getTransporter().sendMail({
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: `Reset Your Password - Naptor Signal`,
            html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: #6366f1;">Reset Your Password, ${userName}! 👋</h2>
                        <p>Thank you for signing up. Please reset your password to activate your account and start monitoring your services.</p>
                        <div style="margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                        </div>
                        <p style="color: #9ca3af; font-size: 0.875rem;">If you did not create an account, you can safely ignore this email.</p>
                        <p style="color: #9ca3af; font-size: 0.875rem;">This link will expire in 24 hours.</p>
                    </div>
                `
        })
        console.log(`[Alert Email]: Email sent to ${userEmail}`);
    } catch (error) {
        console.error(`[Alert Email Error]: Failed to send email to ${userEmail}`, error);
    }
}
module.exports = { sendDownAlert, sendUpAlert, sendVerificationEmail, sendPasswordResetEmail };