/**
 * Konohapoly - Main Application Entrypoint for Tahap 2
 */
import { LocalAdapter } from './net.js';
import { UIRenderer } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  const netAdapter = new LocalAdapter();
  new UIRenderer(appContainer, netAdapter);
});