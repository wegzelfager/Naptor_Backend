const authService = require('../services/auth.service')
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { accessToken, refreshToken } = await authService.login(email, password);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json({
            status: 'success',
            accessToken
        })
    } catch (error) {
        next(error)
    }
}

const refresh = async (req, res, next) => {
    try {
        const oldRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!oldRefreshToken) {
            const error = new Error('Refresh token is required');
            error.statusCode = 401;
            throw error
        }
        const { accessToken } = await authService.refreshTheToken(oldRefreshToken);
        res.status(200).json({
            status: 'success',
            accessToken
        })
    } catch (error) {
        next(error);
    }

}

const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        await authService.register(name, email, password);
        res.status(201).json({
            status: 'success',
            message: 'Registration successful. Please verify your email before logging in.'
        })
    } catch (error) {
        next(error);
    }
}

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        await authService.verifyEmail(token);
        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully. You can now log in.'
        })
    } catch (error) {
        next(error);
    }
}

const resetPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.resetPassword(email);
        res.status(200).json({
            status: 'success',
            message: 'Password reset link sent to your email.'
        });
    } catch (error) {
        next(error);
    }
}

const resetNewPassword = async (req, res, next) => {
    try {
        const token = req.body.token || req.query.token;
        const newPassword = req.body.newPassword || req.body.password;
        await authService.resetNewPassword(token, newPassword);
        res.status(200).json({
            status: 'success',
            message: 'Password has been reset successfully. You can now log in.'
        });
    } catch (error) {
        next(error);
    }
}

const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.resendVerificationEmail(email);
        res.status(200).json({
            status: 'success',
            message: 'A fresh verification link has been sent to your email.'
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { login, refresh, register, verifyEmail, resetPassword, resetNewPassword, resendVerification };