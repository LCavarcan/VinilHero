// API que a janela enxerga (window.api). A janela não lê arquivos nem calcula resultados.
const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel) => (args) => ipcRenderer.invoke(channel, args);
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
  state: {
    get: invoke('state:get'),
    onChange: on('state:changed'),
  },
  day: {
    choose: invoke('day:choose'),
    cancel: invoke('day:cancel'),
    close: invoke('day:close'),
    open: invoke('day:open'),
    seen: invoke('day:seen'),
  },
  shop: { buy: invoke('shop:buy') },
  records: { move: invoke('record:move') },
});
