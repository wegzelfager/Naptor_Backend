const nodemailer = require('nodemailer');

const parseSender = () => {
    const raw = process.env.SMTP_FROM || 'bndahabali@gmail.com';
    const cleaned = raw.replace(/\\"/g, '"');
    const match = cleaned.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
    if (match) {
        return {
            name: match[1]?.trim() || 'Naptor Signal',
            email: match[2]?.trim() || 'bndahabali@gmail.com'
        };
    }
    return { name: 'Naptor Signal', email: cleaned.trim() };
};

const sendViaBrevoApi = async ({ to, subject, html }) => {
    const apiKey = process.env.BREVO_API_KEY;
    const sender = parseSender();

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: sender.name,
                email: sender.email
            },
            to: [
                {
                    email: to,
                    name: to.split('@')[0]
                }
            ],
            subject: subject,
            htmlContent: html
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brevo HTTP API error (${response.status}): ${errorText}`);
    }

    return await response.json();
};

let _transporter = null;
const getTransporter = () => {
    if (!_transporter) {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;
        _transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: port,
            secure: secure, // false for port 587 (STARTTLS)
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            connectionTimeout: 10000, // 10-second connection timeout
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
    }
    return _transporter;
};

const sendEmail = async ({ to, subject, html }) => {
    // 1. If BREVO_API_KEY is configured, prioritize HTTPS API (bypasses Railway SMTP port blocks)
    if (process.env.BREVO_API_KEY) {
        return sendViaBrevoApi({ to, subject, html });
    }

    // 2. Fallback to Nodemailer SMTP (for local dev)
    const sender = parseSender();
    return getTransporter().sendMail({
        from: `"${sender.name}" <${sender.email}>`,
        to,
        subject,
        html
    });
};

const sendDownAlert = async ({ userEmail, monitorName, monitorUrl, error, time }) => {
    try {
        await sendEmail({
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
        });
        console.log(`[Alert Email]: Email sent to ${userEmail}`);
    } catch (error) {
        console.error(`[Alert Email Error]: Failed to send email to ${userEmail}`, error.message);
    }
};

const sendUpAlert = async ({ userEmail, monitorName, monitorUrl, time }) => {
    try {
        await sendEmail({
            to: userEmail,
            subject: `✅ RECOVERED: ${monitorName} is back UP!`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #5cb85c;">✅ Monitor Recovered</h2>
                    <p>Good news! Your monitor <strong>${monitorName}</strong> (${monitorUrl}) is back online at <strong>${time}</strong>.</p>
                    <p style="color: #6c757d; font-size: 12px;">Naptor Signal Monitoring Engine</p>
                </div>
            `
        });
        console.log(`[Alert Email]: Email sent to ${userEmail}`);
    } catch (error) {
        console.error(`[Alert Email Error]: Failed to send email to ${userEmail}`, error.message);
    }
};

const sendVerificationEmail = async ({ userEmail, userName, verificationUrl }) => {
    try {
        await sendEmail({
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
                    <p style="color: #9ca3af; font-size: 0.875rem;">This link will expire in 15 minutes.</p>
                </div>
            `
        });
        console.log(`[Verification Email]: Sent successfully to ${userEmail}`);
    } catch (error) {
        console.error(`[Verification Email Error]: Failed to send to ${userEmail}`, error.message);
        throw error;
    }
};

const sendPasswordResetEmail = async ({ userEmail, userName, resetUrl }) => {
    try {
        await sendEmail({
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
        });
        console.log(`[Reset Email]: Sent successfully to ${userEmail}`);
    } catch (error) {
        console.error(`[Reset Email Error]: Failed to send to ${userEmail}`, error.message);
        throw error;
    }
};

module.exports = { sendDownAlert, sendUpAlert, sendVerificationEmail, sendPasswordResetEmail };
