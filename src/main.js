/**
 * Konohapoly - Main Application Entrypoint with 3D Integration
 */
import { LocalAdapter } from './net.js';
import { UIRenderer } from './ui.js';
import { GameScene } from './scene.js';

function initApp() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  // Inisialisasi Adaptor Jaringan
  const netAdapter = new LocalAdapter();

  // Inisialisasi Scene 3D Three.js
  const tempContainer = document.createElement('div');
  const gameScene = new GameScene(tempContainer);

  // Inisialisasi Renderer UI
  new UIRenderer(appContainer, netAdapter, gameScene);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
