/** Role of a turn in the Sena chat thread. */
export type ChatRole = 'user' | 'assistant'

/**
 * A single chat turn stored in session state.
 * `content` is plain text for user turns and markdown for assistant turns.
 */
export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
}

/** User-logged numbers only — never invent values on the client or server. */
export interface FinancialSnapshot {
  currency?: string
  revenue?: number
  expenses?: number
  profit?: number
  notes?: string
}

/** Optional profile + books context sent with each chat request. */
export interface UserContext {
  name?: string
  country?: string
  businessName?: string
  financialSnapshot?: FinancialSnapshot
}

/** POST body for `/api/ai/chat`. */
export interface ChatRequest {
  messages: Array<Pick<ChatMessage, 'role' | 'content'>>
  userContext?: UserContext
}

/** One Server-Sent Event from the chat stream. */
export interface ChatStreamEvent {
  content?: string
  done?: boolean
  error?: string
}

/**
 * Builds a session chat turn with a unique id.
 */
export function createChatMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  }
}
