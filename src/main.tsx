import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import SparkOS from './SparkOS.tsx';
import { FluentInputMirror } from './components/FluentInputMirror';
import { FlumojsProvider } from './components/FluentEmoji';
import './index.css';
import { initBrowserTooltipSuppressor } from './utils/suppressBrowserTooltips';

// Suppress native browser tooltips across all items in the app
initBrowserTooltipSuppressor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FlumojsProvider>
      <SparkOS />
    </FlumojsProvider>
  </StrictMode>,
);
