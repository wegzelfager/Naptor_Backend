const { z } = require('zod');

// PUT/PATCH /user/settings  &  PUT/PATCH /user/profile
const updateUserSettingsSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(3, 'Name must be at least 3 characters')
            .max(50, 'Name cannot exceed 50 characters')
            .trim()
            .optional(),
        sendEmail: z
            .boolean({ invalid_type_error: 'sendEmail must be a boolean' })
            .optional()
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field (name, sendEmail) must be provided'
    })
});

// PUT /user/change-password
const changePasswordSchema = z.object({
    body: z.object({
        oldPassword: z
            .string({ required_error: 'Current password is required' })
            .min(6, 'Current password must be at least 6 characters'),
        password: z
            .string({ required_error: 'New password is required' })
            .min(6, 'New password must be at least 6 characters')
            .max(128, 'New password cannot exceed 128 characters')
    })
});

module.exports = { updateUserSettingsSchema, changePasswordSchema };
