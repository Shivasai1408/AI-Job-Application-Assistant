const nodemailer = require('nodemailer');

function getTransporter() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
}

async function sendResumeCreatedEmail({ recipient, fullName, title, content }) {
    const transporter = getTransporter();
    if (!transporter) {
        console.warn('Resume email not sent: SMTP is not configured');
        return false;
    }

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: recipient,
        subject: `Your resume was created: ${title}`,
        text: `Hi ${fullName || 'there'},\n\nYour resume "${title}" was created successfully.\n\nResume content:\n\n${content}\n\nBest regards,\nJob Application Assistant`,
        attachments: [{
            filename: `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'resume'}.txt`,
            content,
            contentType: 'text/plain'
        }]
    });

    return true;
}

module.exports = { sendResumeCreatedEmail };
