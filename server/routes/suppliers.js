import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  listSupplierGroups,
  createSupplierGroup,
  joinSupplierGroup,
} from '../controllers/suppliers.js'

const router = Router()

router.get('/', authenticate, listSupplierGroups)
router.post('/', authenticate, createSupplierGroup)
router.post('/join', authenticate, joinSupplierGroup)

export default router