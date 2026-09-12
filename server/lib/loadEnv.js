import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(serverDir, '../..')

/**
 * Reloads AI keys from disk so a new GEMINI_API_KEY works without a full reboot.
 */
export function reloadAiEnv() {
  const files = [
    path.join(serverDir, '../.env'),
    path.join(repoRoot, '.env'),
    path.join(repoRoot, '.env.local'),
  ]
  for (const file of files) {
    loadEnv({ path: file, override: true })
  }
}

/**
 * @returns {{ gemini: boolean, openai: boolean, geminiKey: string, openaiKey: string }}
 */
export function getAiProviders() {
  reloadAiEnv()
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || ''
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || ''
  return {
    gemini: Boolean(geminiKey),
    openai: Boolean(openaiKey),
    geminiKey,
    openaiKey,
  }
}
