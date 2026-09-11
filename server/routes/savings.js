import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { listCircles, createCircle, joinCircle } from '../controllers/savings.js'

const router = Router()

router.get('/', authenticate, listCircles)
router.post('/', authenticate, createCircle)
router.post('/join', authenticate, joinCircle)

export default router