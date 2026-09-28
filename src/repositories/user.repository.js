const User = require('../models/user.model');

const findUserByEmail = async (email) => {
    return await User.findOne({ email });
};


const updateRefreshToken = async (userId, token) => {
    return await User.findByIdAndUpdate(
        userId,
        { refreshToken: token },
        { new: true, runValidators: true }
    );
};

const findByRefreshToken = async (token) => {
    return await User.findOne({ refreshToken: token });
};

const findById = async (id) => {
    return await User.findById(id);
};

const createUser = async (userData) => {
    try {
        const newUser = await User.create(userData);

        const userObject = newUser.toObject();
        delete userObject.password;
        delete userObject.__v;

        return userObject;

    } catch (error) {
        error.message = `Database Error: ${error.message}`;
        throw error;
    }
};

const findByVerificationToken = async (hashedToken) => {
    return await User.findOne({
        verificationToken: hashedToken,
        verificationTokenExpires: { $gt: Date.now() }
    });
};

const findByResetPasswordToken = async (hashedToken) => {
    return await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: { $gt: Date.now() }
    });
};

const getUserSettingsById = async (userId) => {
    const user = await User.findById(userId).select('-password');
    return user;

}
const updateUserSettingsById = async (userId, updateData) => {
    const user = await User.findByIdAndUpdate(
        { _id: userId },
        updateData,
        { new: true, runValidators: true }
    );
    return user;
}

module.exports = {
    findUserByEmail,
    updateRefreshToken,
    findByRefreshToken,
    findById,
    createUser,
    findByVerificationToken,
    findByResetPasswordToken,
    getUserSettingsById,
    updateUserSettingsById
};