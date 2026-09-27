import { Component } from "react";
import BackHome from "./BackHome";

/* Catches a render error on one page so the rest of the site stays up. Each
   route gets its own boundary (App.jsx), reset by changing page. */
class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("This page could not be shown:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="pg">
        <div className="pg-shell">
          <div className="pg-head">
            <h1 className="pg-title">Something went wrong</h1>
            <BackHome />
          </div>
          <p className="pg-intro">This page hit an error. Going back home and trying again usually fixes it.</p>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
