import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './common/styles/index.css'   // how everything looks, every device
import './platforms/index.css'       // sizes + layout per device (loads last, wins)
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
