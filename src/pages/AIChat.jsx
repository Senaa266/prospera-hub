import { useSearchParams } from 'react-router-dom'
import ChatCore from '../components/chat/ChatCore'
import { PageShell } from '../components/ui/PageShell'

/**
 * Dedicated full-screen AI Coach page for longer coaching sessions.
 */
function AIChat() {
  const [params] = useSearchParams()
  const initialPrompt = params.get('prompt') || ''

  return (
    <PageShell flush>
      <div className="flex min-h-0 w-full flex-1 justify-center">
        <ChatCore variant="page" initialPrompt={initialPrompt} />
      </div>
    </PageShell>
  )
}

export default AIChat
