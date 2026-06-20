import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface in dev; in production this is where you'd log to a service.
    console.error("UI error:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="card card-pad" style={{ maxWidth: 640, margin: "40px auto" }}>
          <div className="flex items-center gap-12" style={{ marginBottom: 12 }}>
            <span className="kpi-icon tint-red"><AlertTriangle /></span>
            <div>
              <h3>Something went wrong</h3>
              <div className="caption">This screen hit an unexpected error.</div>
            </div>
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "var(--surface-3)",
              padding: 12,
              borderRadius: 10,
              fontSize: 12.5,
              color: "var(--red-600)",
              overflow: "auto",
            }}
          >
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={() => this.setState({ error: null })}>
            <RotateCcw size={16} /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
