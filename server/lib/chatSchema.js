import { z } from 'zod'

const financialSnapshotSchema = z
  .object({
    currency: z.string().max(12).optional(),
    revenue: z.number().finite().optional(),
    expenses: z.number().finite().optional(),
    profit: z.number().finite().optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict()
  .optional()

const userContextSchema = z
  .object({
    name: z.string().max(120).optional(),
    country: z.string().max(80).optional(),
    businessName: z.string().max(160).optional(),
    financialSnapshot: financialSnapshotSchema,
  })
  .strict()
  .optional()

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(8000),
})

/**
 * Validates a POST /api/ai/chat body.
 * Rejects unknown fields and oversized threads.
 */
export const chatRequestSchema = z
  .object({
    messages: z.array(chatMessageSchema).min(1).max(40),
    userContext: userContextSchema,
  })
  .strict()
