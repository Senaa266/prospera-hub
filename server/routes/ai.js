import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { chat } from '../controllers/ai.js'

const router = Router()

router.post('/chat', authenticate, rateLimit, chat)

export default router