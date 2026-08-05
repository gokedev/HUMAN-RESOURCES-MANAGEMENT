import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/main.css';
import { App } from './app.jsx';
// React mounts the entire frontend into the single root element from index.html.
createRoot(document.getElementById('root')).render(
// StrictMode helps reveal accidental side effects while developing React components.
<StrictMode>
    {/* App contains the global providers, router, and error boundary for the CoralHR UI. */}
    <App />
  </StrictMode>);
