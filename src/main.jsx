import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// No <StrictMode> on purpose: its dev-only double-invocation of effects would
// spin up duplicate intervals/timeouts for the cook timer.
createRoot(document.getElementById('root')).render(<App />)
