const userRepo = require('../repositories/user.repository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./email.service');
const User = require('../models/user.model');
const env = require('../config/env');

// ─── Token helpers ────────────────────────────────────────────────────────────

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

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async (email, password) => {
    try {
        const user = await userRepo.findUserByEmail(email);

        if (!user) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        if (!user.isVerified) {
            const error = new Error('Please verify your email address before logging in. Check your inbox for the activation link.');
            error.statusCode = 403;
            throw error;
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        await userRepo.updateRefreshToken(user._id, refreshToken);

        return { accessToken, refreshToken };

    } catch (error) {
        throw error;
    }
};

// ─── Refresh token ────────────────────────────────────────────────────────────

const refreshTheToken = async (oldRefreshToken) => {
    try {
        jwt.verify(oldRefreshToken, env.jwtRefreshSecret);

        const user = await userRepo.findByRefreshToken(oldRefreshToken);
        if (!user) {
            const error = new Error('Invalid or expired refresh token');
            error.statusCode = 403;
            throw error;
        }

        const accessToken = generateAccessToken(user._id);
        return { accessToken };

    } catch {
        const authError = new Error('Invalid or expired refresh token');
        authError.statusCode = 403;
        throw authError;
    }
};

// ─── Register (Pre-Registration JWT flow) ─────────────────────────────────────
//
//  ❌ NO user is saved to MongoDB here.
//  ✅ We sign a short-lived JWT containing { name, email, hashedPassword }
//     and send it inside the verification link.
//  ✅ The user record is created ONLY when they click the link (verifyEmail).

const register = async (name, email, password) => {
    try {
        // 1. Verify the email is not already registered and verified
        const existingUser = await userRepo.findUserByEmail(email);
        if (existingUser && existingUser.isVerified) {
            const error = new Error('Email already exists. Please use a different value.');
            error.statusCode = 409;
            throw error;
        }

        // Remove any stale unverified record to prevent DB pollution
        if (existingUser && !existingUser.isVerified) {
            await User.deleteOne({ _id: existingUser._id });
        }

        // 2. Hash password (never stored until they verify)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Generate a temporary JWT signup token containing { name, email, hashedPassword } with 15-minute expiration
        const signupToken = jwt.sign(
            { name, email, hashedPassword },
            env.jwtAccessSecret,
            { expiresIn: '15m' }
        );

        // 4. Send the verification email with a link pointing to http://localhost:4200/verify-email?token=TEMP_JWT_TOKEN
        const baseUrl = process.env.CLIENT_URL || env.clientUrl || 'http://localhost:4200';
        const verificationUrl = `${baseUrl}/verify-email?token=${signupToken}`;

        await sendVerificationEmail({
            userEmail: email,
            userName: name,
            verificationUrl,
        });

        return { message: 'Verification email sent. Please check your inbox to complete registration.' };

    } catch (error) {
        throw error;
    }
};

// ─── Verify Email (creates the user only after confirmation) ──────────────────

const verifyEmail = async (token) => {
    try {
        if (!token) {
            const error = new Error('Verification token is required');
            error.statusCode = 400;
            throw error;
        }

        // 1. Verify the temporary JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, env.jwtAccessSecret);
        } catch (jwtErr) {
            // Fallback for legacy sha256 tokens
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
            const legacyUser = await userRepo.findByVerificationToken(hashedToken);
            if (legacyUser) {
                legacyUser.isVerified = true;
                legacyUser.verificationToken = undefined;
                legacyUser.verificationTokenExpires = undefined;
                await legacyUser.save();
                return legacyUser;
            }

            const error = new Error(
                jwtErr.name === 'TokenExpiredError'
                    ? 'Verification link has expired. Please register again.'
                    : 'Invalid verification token.'
            );
            error.statusCode = 401;
            throw error;
        }

        // 2. Extract { name, email, hashedPassword }
        const { name, email, hashedPassword } = decoded;

        if (!email || !hashedPassword) {
            const error = new Error('Invalid verification token payload.');
            error.statusCode = 400;
            throw error;
        }

        // Check if user already exists
        const existing = await userRepo.findUserByEmail(email);
        if (existing) {
            if (existing.isVerified) {
                return { alreadyVerified: true };
            }
            // Upgrade legacy unverified record
            existing.name = name || existing.name;
            existing.password = hashedPassword;
            existing.isVerified = true;
            existing.verificationToken = undefined;
            existing.verificationTokenExpires = undefined;
            await existing.save();
            return existing;
        }

        // 3. ONLY THEN create and save the new User document in MongoDB with isVerified: true
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            isVerified: true,
        });
        await newUser.save();
        return newUser;

    } catch (error) {
        throw error;
    }
};

// ─── Resend verification ──────────────────────────────────────────────────────
//
//  Since we no longer store the user before verification, resending
//  just asks the user to go through register again (the form pre-fills fine).
//  But we also support the case where an old unverified record exists in DB.

const resendVerificationEmail = async (email) => {
    try {
        const user = await userRepo.findUserByEmail(email);

        if (user && user.isVerified) {
            const error = new Error('Account is already verified. You can log in directly.');
            error.statusCode = 400;
            throw error;
        }

        if (!user) {
            // In the new flow there is no DB record yet — tell them to re-register
            const error = new Error('No pending registration found. Please register again.');
            error.statusCode = 404;
            throw error;
        }

        // Old-flow unverified record: generate a fresh JWT and resend
        const signupToken = jwt.sign(
            { name: user.name, email: user.email, hashedPassword: user.password },
            env.jwtAccessSecret,
            { expiresIn: '15m' }
        );

        const baseUrl = process.env.CLIENT_URL || env.clientUrl || 'http://localhost:4200';
        const verificationUrl = `${baseUrl}/verify-email?token=${signupToken}`;

        await sendVerificationEmail({
            userEmail: user.email,
            userName: user.name || 'User',
            verificationUrl,
        });

        return { message: 'Verification email sent successfully.' };
    } catch (error) {
        throw error;
    }
};

// ─── Reset password ───────────────────────────────────────────────────────────

const resetPassword = async (email) => {
    const user = await userRepo.findUserByEmail(email);
    if (!user) {
        const error = new Error('No account found with this email address.');
        error.statusCode = 404;
        throw error;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    const baseUrl = env.clientUrl || 'https://naptor-fronted-tau.vercel.app';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    sendPasswordResetEmail({
        userEmail: email,
        userName: user.name || 'User',
        resetUrl,
    }).catch(err => console.error('[Reset Password Email Error]:', err.message));

    return user;
};

// ─── Reset new password ───────────────────────────────────────────────────────

const resetNewPassword = async (token, newPassword) => {
    try {
        if (!token) {
            const error = new Error('Token is required');
            error.statusCode = 401;
            throw error;
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await userRepo.findByResetPasswordToken(hashedToken);
        if (!user) {
            const error = new Error('Invalid or expired password reset token.');
            error.statusCode = 401;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save();
        return user;

    } catch (error) {
        throw error;
    }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
    login,
    refreshTheToken,
    register,
    verifyEmail,
    resetPassword,
    restePassword: resetPassword, // legacy alias
    resetNewPassword,
    resendVerificationEmail,
};