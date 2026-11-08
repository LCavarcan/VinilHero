// Atualização automática: o app instalado procura versões novas nos Releases do próprio repositório
// (LCavarcan/VinilHero, ver `build.publish` no package.json), baixa em segundo plano e avisa a janela.
// Mesmo esquema do Fretshift. Ver docs/decisoes/index.md#d-18-atualizacao-automatica.

import { app, ipcMain } from 'electron';
import updater from 'electron-updater';

const { autoUpdater } = updater;

const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

/** Em desenvolvimento (`npm start`) não há versão instalada para atualizar. */
export const updatesSupported = () => app.isPackaged && !process.env.PORTABLE_EXECUTABLE_DIR;

/** Procura versões novas ao abrir e a cada 6 horas; avisa a janela quando uma terminar de baixar. */
export function startUpdater(getWindow) {
  let ready = null;
  ipcMain.handle('update:version', () => app.getVersion());
  ipcMain.handle('update:status', () => ready);
  ipcMain.handle('update:install', () => {
    if (ready) autoUpdater.quitAndInstall();
  });
  if (!updatesSupported()) return;

  autoUpdater.autoDownload = true;
  // se a pessoa não clicar em "Reiniciar para atualizar", instala ao fechar o jogo
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-downloaded', (info) => {
    ready = { version: info.version };
    getWindow()?.webContents.send('update:ready', ready);
  });
  // sem internet ou sem versão publicada ainda: tenta de novo na próxima verificação
  autoUpdater.on('error', (err) => console.warn('atualização:', err.message));
  const check = () => autoUpdater.checkForUpdates().catch((err) => console.warn('atualização:', err.message));
  check();
  setInterval(check, CHECK_EVERY_MS);
}
