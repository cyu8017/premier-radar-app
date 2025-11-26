import React from "react"

const Header = (props) => {
  return (
    <header className="App-header">
      <div className="nav-inner container-fluid">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div className="brand-text">
            <span className="brand-title">{props.text}</span>
            <span className="brand-subtitle">Track upcoming and trending releases</span>
          </div>
        </div>
        <div className="nav-actions">
          <span className="pill pill-live">Live</span>
          <span className="pill pill-muted">Powered by OMDb + iTunes</span>
        </div>
      </div>
    </header>
  )
}

export default Header
