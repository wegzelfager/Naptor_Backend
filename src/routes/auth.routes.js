const express = require('express');
const { login, refresh, register, verifyEmail, resetPassword, resetNewPassword } = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { loginSchema, registerSchema, resetPasswordSchema, resetNewPasswordSchema, verifyEmailSchema } = require('../dtos/auth.dto');
const router = express.Router();
router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', refresh);
router.get('/verify-email', (req, res, next) => {
    if (req.query.token) {
        req.params.token = req.query.token;
        return verifyEmail(req, res, next);
    }
    return res.status(400).json({ status: 'error', message: 'Verification token is required' });
});
router.get('/verify-email/:token', validate(verifyEmailSchema), verifyEmail);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/reset-new-password', validate(resetNewPasswordSchema), resetNewPassword);
module.exports = router;
