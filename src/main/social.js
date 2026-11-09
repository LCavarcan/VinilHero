// Lojas rivais (etapa 5) no processo principal: busca no servidor do Fretshift, com cache, e nunca
// atrapalha o jogo (sem login ou sem internet, devolve null e o jogo segue sem os bônus).
// Não depende do Electron: recebe a função `api` (account.js), então dá para testar.

const HOUR = 60 * 60 * 1000;
// "atualizar" à força (abrir a Vizinhança, entrar na conta) no máximo a cada 30 s: clicar várias
// vezes não vira uma enxurrada de requisições ao servidor
export const MIN_REFRESH_MS = 30 * 1000;

const isObject = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const isText = (x) => typeof x === 'string';

/** Só as entradas de rivais com pontuação de verdade (o resto do jogo confia nelas). */
export function cleanRivals(data) {
  if (!Array.isArray(data?.entries)) return null;
  return data.entries.filter((e) => isObject(e) && Number.isFinite(e.score));
}

/** Disco da semana com a forma esperada, ou null. Ranking inválido vira lista vazia. */
export function cleanWeekly(data) {
  if (!isObject(data)) return null;
  if (data.song !== undefined && data.song !== null && !(isObject(data.song) && isText(data.song.id) && /^[0-9a-f]{6,64}$/.test(data.song.id))) {
    return null;
  }
  const ranking = Array.isArray(data.ranking) ? data.ranking.filter((e) => isObject(e) && Number.isFinite(e.score)) : [];
  return { ...data, ranking };
}

/** Lojas dos amigos: só objetos, com nome em texto. */
export function cleanShops(data) {
  if (!Array.isArray(data?.shops)) return null;
  return data.shops.filter((s) => isObject(s) && (s.displayName === undefined || isText(s.displayName)));
}

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
  let shops = null; // { at, data }
  let lastPublished = null; // o último resumo aceito pelo servidor (não manda igual de novo)

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
        const entries = cleanRivals(await api('GET', `/songs/${songId}/rivals`));
        if (!entries) return null;
        rivals.set(songId, { at: now(), entries });
        return entries;
      }),
    /** Disco da semana e o ranking dele (cache de 1 hora; `force` busca de novo). */
    weekly: (force = false) =>
      safe(async () => {
        const age = weekly ? now() - weekly.at : Infinity;
        if (age < (force ? MIN_REFRESH_MS : HOUR)) return weekly.data;
        const data = cleanWeekly(await api('GET', '/weekly'));
        if (!data) return weekly?.data ?? null;
        weekly = { at: now(), data };
        return data;
      }),
    friendsShops: () =>
      safe(async () => {
        if (shops && now() - shops.at < MIN_REFRESH_MS) return shops.data;
        const data = cleanShops(await api('GET', '/friends/shops'));
        if (data) shops = { at: now(), data };
        return data;
      }),
    /** Manda o resumo da loja (ao fechar o dia). Devolve se deu certo; resumo igual ao último não vai. */
    publishShop: (summary) =>
      safe(async () => {
        const key = JSON.stringify(summary);
        if (key === lastPublished) return true;
        const saved = (await api('PUT', '/shop', summary))?.saved === true;
        if (saved) lastPublished = key;
        return saved;
      }),
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
      shops = null;
      lastPublished = null;
    },
  };
}
