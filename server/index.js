import 'dotenv/config'
import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'

loadEnv({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') })

import authRoutes from './routes/auth.js'
import grantRoutes from './routes/grants.js'
import savingsRoutes from './routes/savings.js'
import supplierRoutes from './routes/suppliers.js'
import financeRoutes from './routes/finance.js'
import aiRoutes from './routes/ai.js'
import { refreshGrantsIfStale } from './scraper.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Prospera Hub API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/grants', grantRoutes)
app.use('/api/savings', savingsRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/ai', aiRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Prospera Hub API running on http://localhost:${PORT}`)
})

refreshGrantsIfStale().catch(() => {})