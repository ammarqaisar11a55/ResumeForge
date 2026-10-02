import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initBackend } from './state/backendStore';
import { applyTheme, useUiStore } from './state/uiStore';
import './styles/app.css';

applyTheme(useUiStore.getState().theme);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  applyTheme(useUiStore.getState().theme);
});
initBackend();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
