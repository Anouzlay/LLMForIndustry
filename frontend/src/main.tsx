import React, { Component, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: any, info: any) {
    // Surface details to the console to debug quickly
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info)
    this.setState({ error })
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', color: '#6b7280', padding: '24px', textAlign: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>Something went wrong.</div>
            <div>Please check the browser console for details and share the error.</div>
            {this.state.error?.message && (
              <div style={{ marginTop: '12px', color: '#ef4444' }}>{String(this.state.error.message)}</div>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
