import { Component } from 'react'
import { Link } from 'react-router-dom'
import { AppButton } from './AppButton'
import { AppCard } from './AppCard'

/**
 * Catches render errors so a single page crash does not blank the whole app.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Something went wrong' }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('Prospera UI error:', error, info)
    }
  }

  reset = () => {
    this.setState({ hasError: false, message: '' })
    this.props.onReset?.()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 py-16">
        <AppCard className="max-w-md text-center">
          <h2 className="m-0 text-xl font-bold text-ink-strong">This screen hit a snag</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {this.state.message}. You can retry this view or head back to the dashboard.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <AppButton onClick={this.reset}>Try again</AppButton>
            <AppButton as={Link} to="/dashboard" variant="outline">
              Go to dashboard
            </AppButton>
          </div>
        </AppCard>
      </div>
    )
  }
}

export default ErrorBoundary
