import { generateToken } from '../middleware/jwt.js';
import User from '../model/userModel.js';
import { sendOTP } from '../utils/mailer.js';
import { generateOTP } from '../utils/otpGenerator.js';
import { createUserSchema, updateUserSchema } from '../validation/userValidation.js';
import bcrypt from "bcrypt";
import cron from 'node-cron';
export const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
    
        await createUserSchema.validate({ name, email, password });
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        };
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });
        const token = generateToken({ id: newUser.id, email: newUser.email });
        res.status(201).json({
            message: "User created successfully",
            user: newUser,
            token: token
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.errors });
        }
        res.status(409).json({ message: error.message });
    }
}

// login user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        console.log(user, "user")
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        console.log(email, password, user.password);
        const matchpassword = await bcrypt.compare(password, user.password)
        if (matchpassword) {
            const token = generateToken({ id: user.id, email: user.email });
            res.status(200).json({ message: "logged in successfully", token: token })
        } else {
            res.status(401).json({ message: "Invalid credentials" })
        }
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

// get all users
export const getUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

// register with otp
export const registerOtp = async (req, res) => {
    const { name, email, password } = req.body;
    const files = req.files;
    console.log(files, typeof files, "files")
    try {
        await createUserSchema.validate({ name, email, password });
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(400).json({ message: 'Email already registered' });
            } else {
                const otp = generateOTP();
                const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

                // OTP ko update karenge existing user ke liye
                await existingUser.update({
                    otp,
                    otpExpires,
                });

                // OTP email par bhejna
                await sendOTP(email, otp);

                return res.status(200).json({ message: 'OTP resent on email', userId: existingUser.id });
            }
        }

        // Naya user create karein agar user exist nahi karta
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        const filePaths = files ? files.map(file => file.path) : [];
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpires,
            files: filePaths
        });

        res.status(201).json({ message: 'User registered. OTP sent on email', userId: user.id });
        await sendOTP(email, otp);

    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.errors });
        }
        res.status(500).json({ message: error });
    }
};

// verify register with otp
export const verifyRegister = async (req, res) => {
    const { email, otp } = req.body;
    console.log("Received Email:", email);
    console.log("Received OTP:", otp);

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// forget password otp send
export const forgetOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();
        await sendOTP(email, otp);
        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// new password after otp verification
export const newPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.otp !== otp || user.otpExpires < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.otp = null;
        user.otpExpires = null;
        await user.save();
        res.status(200).json({ message: "Password updated successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updatePassword = async (req, res) => {
    const { email, oldpassword, newPassword } = req.body;
    try {
        // Validation
        await updateUserSchema.validate({ email, oldpassword, newPassword }, { abortEarly: false });

        // User Fetch
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Old Password Match
        const isPasswordMatch = await bcrypt.compare(oldpassword, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Old password is incorrect' });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // same password match
        const isSamePassword = await bcrypt.compare(oldpassword, hashedPassword);
        if (isSamePassword) {
            return res.status(401).json({ message: 'Old password and new password can not be same' });
        }

        // const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.errors });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// delete unverified users
const deleteUnverifiedUsers = async () => {
    try {
        const deleted = await User.destroy({
            where: {
                isVerified: false, // Bas unverified users ko target kar raha hai
            }
        });
        if (deleted) {
            console.log(`${deleted} Unverified users deleted successfully`);
        } else {
            console.log('No unverified users found');
        }
    } catch (error) {
        console.error('Failed to delete unverified users:', error);
    }
};

cron.schedule('0 0 * * *', deleteUnverifiedUsers); // Har minute chalega
console.log('Cron job running at 12 AM every day'); 











////////////////////////////////////////////////////////
// this code is for fun only

//     // Check if password already exists in the database
//     const users = await User.findAll();
//     let existingUserEmail = null;

//     for (let user of users) {
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (isMatch) {
//             existingUserEmail = user.email;
//             break; // Stop checking if we found a match
//         }
//     }

//     // If password is already used, return an error
//     if (existingUserEmail) {
//         return res.status(400).json({
//             message: `This password is already used by ${existingUserEmail}. Please choose a different one.`,
//         });
//     }
///////////////////////////////////////////////////////////////