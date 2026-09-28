const { getUserSettings, updateUserSettings, changePassword } = require("../services/user.service");

const getUserSettingsController = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await getUserSettings(userId);
        res.status(200).json({
            status: 'success',
            user
        })
    } catch (error) {
        next(error)
    }
}
const updateUserSettingsController = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await updateUserSettings(userId, req.body);
        res.status(200).json({
            status: 'success',
            user
        })
    } catch (error) {
        next(error)
    }
}
const changePasswordController = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await changePassword(userId, req.body);
        res.status(200).json({
            status: 'success',
            user
        })
    } catch (error) {
        next(error)
    }
}
module.exports = { getUserSettingsController, updateUserSettingsController, changePasswordController }