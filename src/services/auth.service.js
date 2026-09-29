const env = require('../config/env');
const userRepo = require('../repositories/user.repository')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./email.service');
const User = require('../models/user.model');
const { createVerificationToken, createPasswordResetToken } = require('../utils/verficationToken');

const generateAccessToken = (userId) => {
    return jwt.sign(
        { id: userId },
        env.jwtAccessSecret,
        { expiresIn: env.accessTokenExpiry || '15m' }
    );
};

const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        env.jwtRefreshSecret,
        { expiresIn: env.refreshTokenExpiry || '7d' }
    );
};

const login = async (email, password) => {
    try {
        console.log("👉 1. Starting login service...");

        const user = await userRepo.findUserByEmail(email);
        console.log("👉 2. User found:", user?._id);

        if (!user) {
            const error = new Error('invalid input data');
            error.statusCode = 401;
            throw error;
        }

        console.log("👉 3. Checking password with bcrypt...");
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        console.log("👉 4. Password match result:", isPasswordMatch);

        if (!isPasswordMatch) {
            const error = new Error('invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        if (!user.isVerified) {
            const error = new Error('Please verify your email address before logging in. Check your inbox for the activation link.');
            error.statusCode = 403;
            throw error;
        }

        console.log("👉 5. Generating tokens...");
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        console.log("👉 6. Updating refresh token in MongoDB...");
        await userRepo.updateRefreshToken(user._id, refreshToken);
        console.log("👉 7. Refresh token updated!");

        return { accessToken, refreshToken };

    } catch (error) {
        console.error("❌ Error inside service:", error);
        throw error;
    }
}

const refreshTheToken = async (oldRefreshToken) => {
    try {
        const decoded = jwt.verify(
            oldRefreshToken,
            env.jwtRefreshSecret
        )

        const user = await userRepo.findByRefreshToken(oldRefreshToken);
        if (!user) {
            const error = new Error('Invalid or expired refresh token');
            error.statusCode = 403;
            throw error;
        }

        const accessToken = generateAccessToken(user._id);
        return { accessToken }

    } catch (error) {
        const authError = new Error('Invalid or expired refresh token');
        authError.statusCode = 403;
        throw authError;
    }
}
const register = async (name, email, password) => {
    try {
        const existingUser = await userRepo.findUserByEmail(email);

        if (existingUser) {
            if (existingUser.isVerified) {
                const error = new Error("Email already exists. Please use a different value.");
                error.statusCode = 409;
                throw error;
            }


            const salt = await bcrypt.genSalt(10);
            existingUser.password = await bcrypt.hash(password, salt);
            existingUser.name = name;
            const verificationToken = existingUser.createVerificationToken();
            await existingUser.save();

            const baseUrl = env.clientUrl || 'https://naptor-fronted-tau.vercel.app';
            const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

            try {
                await sendVerificationEmail({
                    userEmail: email,
                    userName: name,
                    verificationUrl
                });
            } catch (emailErr) {
                console.error('[Register] Resending verification email failed:', emailErr.message);
                const error = new Error('Failed to send verification email. Please try again later.');
                error.statusCode = 500;
                throw error;
            }

            return existingUser;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        const verificationToken = newUser.createVerificationToken();
        await newUser.save();

        const baseUrl = env.clientUrl || 'https://naptor-fronted-tau.vercel.app';
        const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

        try {
            await sendVerificationEmail({
                userEmail: email,
                userName: name,
                verificationUrl
            });
        } catch (emailErr) {
            console.error('[Register] Email sending failed, rolling back user creation:', emailErr.message);
            await User.findByIdAndDelete(newUser._id);
            const error = new Error('Failed to send verification email. Please try again later.');
            error.statusCode = 500;
            throw error;
        }

        return newUser;
    } catch (error) {
        throw error;
    }
};

const resetPassword = async (email) => {
    const user = await userRepo.findUserByEmail(email);
    if (!user) {
        const error = new Error('user not found');
        error.statusCode = 404;
        throw error;
    }
    const resetToken = createPasswordResetToken();
    user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    user.passwordResetTokenExpires = Date.now() + 15 * 60 * 1000;
    await user.save();
    const baseUrl = env.clientUrl || 'https://naptor-fronted-tau.vercel.app';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    sendPasswordResetEmail({
        userEmail: email,
        userName: user.name || 'User',
        resetUrl
    }).catch(err => console.error('[Reset Password Email Error]:', err));
    return user;
}

const resetNewPassword = async (token, newPassword) => {
    try {
        if (!token) {
            const error = new Error('Token is required');
            error.statusCode = 401;
            throw error;
        }

        const hashedToken = crypto.createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await userRepo.findByResetPasswordToken(hashedToken);
        if (!user) {
            const error = new Error('Invalid reset password token');
            error.statusCode = 401;
            throw error;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save();
        return user;
    } catch (error) {
        throw error;
    }
}

const verifyEmail = async (token) => {
    try {
        if (!token) {
            const error = new Error('Token is required');
            error.statusCode = 401;
            throw error;
        }

        const hashedToken = crypto.createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await userRepo.findByVerificationToken(hashedToken);
        if (!user) {
            const error = new Error('Invalid verification token');
            error.statusCode = 401;
            throw error;
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();
        return user;


    } catch (error) {
        throw error;
    }
}
const resendVerificationEmail = async (email) => {
    try {
        const user = await userRepo.findUserByEmail(email);
        if (!user) {
            const error = new Error('No account found with this email address.');
            error.statusCode = 404;
            throw error;
        }

        if (user.isVerified) {
            const error = new Error('Account is already verified. You can log in directly.');
            error.statusCode = 400;
            throw error;
        }

        const verificationToken = user.createVerificationToken();
        await user.save();

        const baseUrl = env.clientUrl || 'https://naptor-fronted-tau.vercel.app';
        const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

        await sendVerificationEmail({
            userEmail: user.email,
            userName: user.name || 'User',
            verificationUrl
        });

        return { message: 'Verification email sent successfully' };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    login,
    refreshTheToken,
    register,
    verifyEmail,
    resetPassword,
    restePassword: resetPassword,
    resetNewPassword,
    resendVerificationEmail
};