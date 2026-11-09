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
    pickExe: invoke('fretshift:pick-exe'),
    launch: invoke('fretshift:launch'),
    onStatus: on('fretshift:status'),
  },
  state: {
    get: invoke('state:get'),
    onChange: on('state:changed'),
  },
  live: { onUpdate: on('live:update') },
  account: { status: invoke('account:status'), signIn: invoke('account:sign-in'), signOut: invoke('account:sign-out') },
  social: { neighborhood: invoke('social:neighborhood'), importWeekly: invoke('fretshift:import') },
  day: {
    choose: invoke('day:choose'),
    cancel: invoke('day:cancel'),
    close: invoke('day:close'),
    open: invoke('day:open'),
    seen: invoke('day:seen'),
  },
  shop: { buy: invoke('shop:buy') },
  records: { move: invoke('record:move') },
  stock: { restock: invoke('stock:restock'), setAuto: invoke('stock:auto'), topUp: invoke('stock:top-up'), lot: invoke('stock:lot') },
  decor: {
    buy: invoke('decor:buy'),
    poster: invoke('decor:poster'),
    toggle: invoke('decor:toggle'),
    lighting: invoke('decor:lighting'),
  },
  manage: {
    feature: invoke('manage:feature'),
    promo: invoke('manage:promo'),
    endPromo: invoke('manage:end-promo'),
    event: invoke('manage:event'),
    cancelEvent: invoke('manage:cancel-event'),
  },
  update: {
    version: invoke('update:version'),
    status: invoke('update:status'),
    install: invoke('update:install'),
    onReady: on('update:ready'),
  },
});
