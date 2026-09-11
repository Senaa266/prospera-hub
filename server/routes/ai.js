import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { chat } from '../controllers/ai.js'

const router = Router()

router.post('/chat', authenticate, chat)

export default router