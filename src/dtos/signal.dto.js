const { z } = require('zod')
const createMonitorSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Monitor name is required' })
      .min(3, 'Monitor name must be at least 3 characters')
      .max(50, 'Monitor name cannot exceed 50 characters')
      .trim(),
    url: z
      .string({ required_error: 'Monitor url is required' })
      .url('invalid url type')
      .trim(),
    interval: z
      .number({ required_error: 'Monitor interval is required' })
      .min(10, 'Monitor interval must be at least 10 seconds')
      .max(86400, 'Monitor interval cannot exceed 24 hours (86400 seconds)')
      .optional()
      .default(60),
    type: z
      .enum(['WEBSITE', 'API'], {
        invalid_type_error: 'Type must be WEBSITE or API'
      })
      .optional()
      .default('WEBSITE'),
    timeout: z
      .number({ invalid_type_error: 'Timeout must be a number' })
      .min(1000, 'Timeout must be at least 1000ms (1 second)')
      .max(30000, 'Timeout cannot exceed 30000ms (30 seconds)')
      .optional()
      .default(5000)
  })
})

const getMonitorHistorySchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Monitor ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format')
  }),
  query: z
    .object({
      limit: z
        .string()
        .optional()
        .transform(val => (val ? parseInt(val, 10) : 50))
        .refine(val => !isNaN(val) && val > 0 && val <= 500, {
          message: 'Limit must be a positive number up to 500'
        })
    })
    .optional()
})

const deleteMonitorSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Monitor ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format')
  })
})

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
      message: 'Invalid Monitor ID format'
    })
  }),
  body: z.object({
    status: z.enum(['PAUSED', 'PENDING', 'UP', 'DOWN'], {
      errorMap: () => ({
        message: 'Status must be either PAUSED, PENDING, UP, or DOWN'
      })
    })
  })
})

const globalUpdateMonitorStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
      message: 'Invalid Monitor ID format'
    })
  }),
  body: z.object({
    status: z.enum(['UP', 'DOWN'], {
      errorMap: () => ({
        message: 'Status must be either UP or DOWN'
      })
    }),
    name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name cannot exceed 50 characters').optional(),
    url: z.string().url('Invalid URL').optional(),
    interval: z.number().min(10, 'Interval must be at least 10 seconds').max(86400, 'Interval cannot exceed 24 hours').optional(),
    type: z.enum(['WEBSITE', 'API']).optional(),
    timeout: z.number().min(1000, 'Timeout must be at least 1000ms').max(30000, 'Timeout cannot exceed 30000ms').optional()
  })
})
module.exports = {
  createMonitorSchema,
  deleteMonitorSchema,
  getMonitorHistorySchema,
  updateStatusSchema,
  globalUpdateMonitorStatusSchema
}
