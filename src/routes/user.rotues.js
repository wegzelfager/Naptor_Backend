const express = require("express");
const { getUserSettingsController, updateUserSettingsController, changePasswordController } = require("../controllers/user.controller");
const router = express.Router();
const { protect } = require('../middlewares/authenticate.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateUserSettingsSchema, changePasswordSchema } = require('../dtos/user.dto');

router.get('/settings', protect, getUserSettingsController);
router.put('/settings', protect, validate(updateUserSettingsSchema), updateUserSettingsController);
router.patch('/settings', protect, validate(updateUserSettingsSchema), updateUserSettingsController);
router.get('/profile', protect, getUserSettingsController);
router.put('/profile', protect, validate(updateUserSettingsSchema), updateUserSettingsController);
router.patch('/profile', protect, validate(updateUserSettingsSchema), updateUserSettingsController);
router.put('/change-password', protect, validate(changePasswordSchema), changePasswordController);
module.exports = router;
