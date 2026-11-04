import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { FlumojsProvider } from './components/FluentEmoji';
import './index.css';
import { initBrowserTooltipSuppressor } from './utils/suppressBrowserTooltips';

// Suppress native browser tooltips across all items in the app
initBrowserTooltipSuppressor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FlumojsProvider>
      <App />
    </FlumojsProvider>
  </StrictMode>,
);
