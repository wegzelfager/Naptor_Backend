const { z } = require('zod');
const loginSchema = z.object({
    body: z.object({
        email: z.string({ required_error: "email is required" }).email("invalid email type"),
        password: z.string({ required_error: "password is required" }).min(6, "password must be at least 6 chars")
    })
})

const registerSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "name is required" }).min(3, "name cannot be less than 3 chars"),
        email: z.string({ required_error: "email is required" }).email("invalid email type"),
        password: z.string({ required_error: "password is required" }).min(6, "password must be at least 6 chars")
    })
})

const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string({ required_error: "email is required" }).email("invalid email type")
    })
})

const resetNewPasswordSchema = z.object({
    body: z.object({
        token: z.string().optional(),
        newPassword: z.string().min(6, "password must be at least 6 chars").optional(),
        password: z.string().min(6, "password must be at least 6 chars").optional()
    }).refine(data => data.newPassword || data.password, {
        message: "Password must be at least 6 characters",
        path: ["newPassword"]
    }),
    query: z.object({
        token: z.string().optional()
    }).optional()
}).refine(data => data.body?.token || (data.query && data.query?.token), {
    message: "Reset token is required",
    path: ["token"]
})

// GET /auth/verify-email/:token
const verifyEmailSchema = z.object({
    params: z.object({
        token: z
            .string({ required_error: 'Verification token is required' })
            .min(10, 'Invalid verification token')
    })
})

const resendVerificationSchema = z.object({
    body: z.object({
        email: z.string({ required_error: "email is required" }).email("invalid email type")
    })
});

module.exports = { loginSchema, registerSchema, resetPasswordSchema, resetNewPasswordSchema, verifyEmailSchema, resendVerificationSchema };