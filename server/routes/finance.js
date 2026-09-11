import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { listTransactions, addTransaction, getReport } from '../controllers/finance.js'

const router = Router()

router.get('/', authenticate, listTransactions)
router.post('/', authenticate, addTransaction)
router.get('/report', authenticate, getReport)

export default router