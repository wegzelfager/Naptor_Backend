const express = require("express");
const { getUserSettingsController, updateUserSettingsController, changePasswordController } = require("../controllers/user.controller");
const router = express.Router();
const { protect } = require('../middlewares/authenticate.middleware');

router.get('/settings', protect, getUserSettingsController);
router.put('/settings', protect, updateUserSettingsController);
router.patch('/settings', protect, updateUserSettingsController);
router.get('/profile', protect, getUserSettingsController);
router.put('/profile', protect, updateUserSettingsController);
router.patch('/profile', protect, updateUserSettingsController);
router.put('/change-password', protect, changePasswordController);
module.exports = router;
