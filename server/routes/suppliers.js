import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  listSupplierGroups,
  getSupplierGroup,
  createSupplierGroup,
  joinSupplierGroup,
  approveMember,
  rejectMember,
  updateShare,
  fulfillSupplierGroup,
  getMessages,
  postMessage,
} from '../controllers/suppliers.js'

const router = Router()

router.get('/', authenticate, listSupplierGroups)
router.get('/:id', authenticate, getSupplierGroup)
router.post('/', authenticate, createSupplierGroup)
router.post('/join', authenticate, joinSupplierGroup)
router.post('/:id/approve', authenticate, approveMember)
router.post('/:id/reject', authenticate, rejectMember)
router.post('/:id/share', authenticate, updateShare)
router.post('/:id/fulfill', authenticate, fulfillSupplierGroup)
router.get('/:id/messages', authenticate, getMessages)
router.post('/:id/messages', authenticate, postMessage)

export default router