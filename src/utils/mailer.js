import nodemailer from 'nodemailer';
import 'dotenv/config'; // Ensure dotenv is imported

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification OTP',
        text: `Your OTP is: ${otp}. Use it to verify your email.`
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', email);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export { sendOTP };