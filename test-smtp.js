require('dotenv').config();
const nodemailer = require('nodemailer');

const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { type: 'login', user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

t.sendMail({
    from: '"Naptor Signal" <bndahabali@gmail.com>',
    to: 'aliabueldahab2005@gmail.com',
    subject: '🚨 Naptor Alert System — Test Email',
    html: `
        <div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #e0e0e0;border-radius:8px;max-width:500px">
            <h2 style="color:#d9534f">🚨 Naptor Email Test</h2>
            <p>Your Naptor alert email system is <strong>working correctly!</strong></p>
            <p>You will receive emails like this when your monitored services go DOWN or recover.</p>
            <p style="color:#6c757d;font-size:12px">Naptor Signal Monitoring Engine</p>
        </div>`
}).then(i => {
    console.log('✅ Email sent to aliabueldahab2005@gmail.com');
    console.log('Message ID:', i.messageId);
}).catch(e => {
    console.error('❌ Failed:', e.message);
});
