
const mongoose = require('mongoose');
const crypto = require('crypto');
const userSchema = new mongoose.Schema({
    name: { type: String, trim: true }, 
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email is already taken'],
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        maxlength: [128, 'Password must be less than 128 characters long'],
    },
    refreshToken: {
        type: String,
        default: null,
    },
    refreshTokenExpiresAt: {
        type: Date,
        default: null,
    },

    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    isActive: {
        type: Boolean,
        default: true,
    },
    sendEmail:{type:Boolean,default:true},
}, { timestamps: true })

userSchema.methods.createVerificationToken = function () {
    const unhashedToken = crypto.randomBytes(32).toString('hex');

    this.verificationToken = crypto
        .createHash('sha256')
        .update(unhashedToken)
        .digest('hex');

    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

    return unhashedToken;
}


const User = mongoose.model('User', userSchema);
module.exports = User;
