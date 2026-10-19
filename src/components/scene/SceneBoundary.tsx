import { Component, type ReactNode } from 'react'

/** Keeps the editorial fallback usable if the lazy bundle or renderer fails. */
export class SceneBoundary extends Component<{
  children: ReactNode
  onFailure: () => void
}, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}
