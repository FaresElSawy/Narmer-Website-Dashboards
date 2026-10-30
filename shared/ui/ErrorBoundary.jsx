import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <main className="error-page">
          <h1>Page unavailable / الصفحة غير متاحة</h1>
          <p>Reload the page to try again. / أعد تحميل الصفحة للمحاولة مرة أخرى.</p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => window.location.reload()}
          >
            Reload / إعادة التحميل
          </button>
        </main>
      )
    return this.props.children
  }
}
