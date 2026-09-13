import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  listOverview,
  createCircle,
  inviteMember,
  joinCircle,
  joinByInvite,
  getCircle,
  recordPayment,
  simulatePayout,
  payNextMember,
  createGoal,
  startInvestment,
  claimInvestment,
} from '../controllers/savings.js'

const router = Router()

router.get('/', authenticate, listOverview)
router.post('/', authenticate, createCircle)
router.post('/invite', authenticate, inviteMember)
router.post('/join', authenticate, joinCircle)
router.post('/invite/:token/join', authenticate, joinByInvite)
router.get('/circles/:id', authenticate, getCircle)
router.post('/circles/:id/join', authenticate, joinCircle)
router.post('/circles/:id/simulate', authenticate, simulatePayout)
router.post('/circles/:id/pay', authenticate, payNextMember)
router.post('/payments', authenticate, recordPayment)
router.post('/goals', authenticate, createGoal)
router.post('/investments', authenticate, startInvestment)
router.post('/investments/:id/claim', authenticate, claimInvestment)

export default router