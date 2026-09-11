import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { listGrants } from '../controllers/grants.js'

const router = Router()

router.get('/', authenticate, listGrants)

export default router