const express = require('express');
const { login, refresh, register, verifyEmail, resetPassword, resetNewPassword } = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { loginSchema, registerSchema, resetPasswordSchema, resetNewPasswordSchema } = require('../dtos/auth.dto');
const router = express.Router();
router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', refresh);
router.get('/verify-email/:token', verifyEmail);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/reset-new-password', validate(resetNewPasswordSchema), resetNewPassword);
module.exports = router;
