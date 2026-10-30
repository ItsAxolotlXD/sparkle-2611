import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initBrowserTooltipSuppressor } from './utils/suppressBrowserTooltips';

// Suppress native browser tooltips across all items in the app
initBrowserTooltipSuppressor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
