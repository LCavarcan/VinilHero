// API que a janela enxerga (window.api). A janela não lê arquivos nem calcula resultados.
const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel) => (...args) => ipcRenderer.invoke(channel, ...args);
const on = (channel) => (cb) => {
  const listener = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('api', {
  fretshift: {
    status: invoke('fretshift:status'),
    pickDir: invoke('fretshift:pick-dir'),
    onStatus: on('fretshift:status'),
  },
  records: {
    list: invoke('records:list'),
    onChanged: on('records:changed'),
  },
  plays: {
    last: invoke('plays:last'),
    onNew: on('plays:new'),
  },
});
