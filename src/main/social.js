// Lojas rivais (etapa 5) no processo principal: busca no servidor do Fretshift, com cache, e nunca
// atrapalha o jogo (sem login ou sem internet, devolve null e o jogo segue sem os bônus).
// Não depende do Electron: recebe a função `api` (account.js), então dá para testar.

const HOUR = 60 * 60 * 1000;

/**
 * @param {object} o
 * @param {(method: string, route: string, body?: object) => Promise<any>} o.api
 * @param {() => Promise<boolean>} o.isSignedIn
 * @param {() => number} [o.now]
 */
export function createSocial({ api, isSignedIn, now = Date.now }) {
  const rivals = new Map(); // songId → { at, entries }
  let weekly = null; // { at, data }
  let me = null;

  async function safe(fn) {
    try {
      if (!(await isSignedIn())) return null;
      return await fn();
    } catch {
      return null;
    }
  }

  return {
    /** Melhores resultados seus e dos amigos num disco (cache de 1 hora). */
    rivals: (songId) =>
      safe(async () => {
        const hit = rivals.get(songId);
        if (hit && now() - hit.at < HOUR) return hit.entries;
        const { entries } = await api('GET', `/songs/${songId}/rivals`);
        rivals.set(songId, { at: now(), entries });
        return entries;
      }),
    /** Disco da semana e o ranking dele (cache de 1 hora; `force` busca de novo). */
    weekly: (force = false) =>
      safe(async () => {
        if (!force && weekly && now() - weekly.at < HOUR) return weekly.data;
        const data = await api('GET', '/weekly');
        weekly = { at: now(), data };
        return data;
      }),
    friendsShops: () => safe(async () => (await api('GET', '/friends/shops')).shops),
    /** Manda o resumo da loja (ao fechar o dia). Devolve se deu certo. */
    publishShop: (summary) => safe(async () => (await api('PUT', '/shop', summary)).saved === true),
    /** Nome da conta (cache até sair). */
    me: () =>
      safe(async () => {
        me ??= await api('GET', '/me');
        return me;
      }),
    forget() {
      rivals.clear();
      weekly = null;
      me = null;
    },
  };
}
