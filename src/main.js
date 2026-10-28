/**
 * Konohapoly - Main Application Entrypoint
 */
import { LocalAdapter } from './net.js';
import { UIRenderer } from './ui.js';

function initApp() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;
  
  const netAdapter = new LocalAdapter();
  new UIRenderer(appContainer, netAdapter);
}

// Cek status DOM secara aman untuk ES Module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
