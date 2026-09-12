import Sidebar from '../layout/Sidebar'

export function PageShell({ children, wide = false }) {
  return (
    <div className="flex min-h-screen bg-canvas font-sans text-ink">
      <Sidebar />
      <main
        className={`mx-auto min-w-0 w-full flex-1 animate-page-in px-6 py-8 pb-16 md:px-11 ${
          wide ? 'max-w-[1150px]' : 'max-w-[1050px]'
        }`}
      >
        {children}
      </main>
    </div>
  )
}

export default PageShell
