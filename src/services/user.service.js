const userRepo = require('../repositories/user.repository');
const bcrypt = require('bcrypt');

const getUserSettings = async (userId) => {
    if (!userId) {
        const error = new Error('user id is required');
        error.statusCode = 400;
        throw error;
    }
    const user = await userRepo.getUserSettingsById(userId);
    if (!user) {
        const error = new Error('user not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

const updateUserSettings = async (userId, updateData) => {
    if (!userId) {
        const error = new Error('user id is required');
        error.statusCode = 400;
        throw error;
    }
    const user = await userRepo.updateUserSettingsById(userId, updateData);
    if (!user) {
        const error = new Error('user not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

const changePassword = async (userId, updateData) => {
    if (!userId) {
        const error = new Error('user id is required');
        error.statusCode = 400;
        throw error;
    }
    const user = await userRepo.findById(userId);
    if (!user) {
        const error = new Error('user not found');
        error.statusCode = 404;
        throw error;
    }
    const comparePassword = await bcrypt.compare(updateData.oldPassword, user.password);
    if (!comparePassword) {
        const error = new Error('incorrect old password');
        error.statusCode = 401;
        throw error;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(updateData.password, salt);
    const updatedUser = await userRepo.updateUserSettingsById(userId, { password: hashedPassword });
    if (!updatedUser) {
        const error = new Error('user not found');
        error.statusCode = 404;
        throw error;
    }
    return updatedUser;
};

module.exports = {
    getUserSettings,
    updateUserSettings,
    changePassword
};
