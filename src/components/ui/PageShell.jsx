import Sidebar from '../layout/Sidebar'

/**
 * Shared authenticated layout: sidebar + animated main column.
 */
export function PageShell({ children, wide = false, flush = false }) {
  return (
    <div className="flex min-h-screen bg-canvas font-sans text-ink">
      <Sidebar />
      <main
        className={
          flush
            ? 'flex h-screen min-w-0 flex-1 animate-page-in px-6 py-7 md:px-11'
            : `mx-auto min-w-0 w-full flex-1 animate-page-in px-6 py-8 pb-16 md:px-11 ${
                wide ? 'max-w-[1150px]' : 'max-w-[1050px]'
              }`
        }
      >
        {children}
      </main>
    </div>
  )
}

export default PageShell
