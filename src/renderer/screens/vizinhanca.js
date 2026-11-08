// Vizinhança (etapa 5): as lojas dos amigos (os mesmos do Fretshift) e o disco da semana com o ranking
// da semana entre vocês. Precisa da conta Microsoft; sem ela, o jogo funciona igual, sem esta tela.

import { button, el } from '../dom.js';
import { DIFFICULTY_NAMES, INSTRUMENT_NAMES, TITLE_NAMES, UPGRADES, formatReputation, plural } from '../text.js';

const REFRESH_MS = 60_000;
let cache = null; // { at, data }
let loading = false;

const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
const score = new Intl.NumberFormat('pt-BR');

async function load(root, state, ui, force = false) {
  if (loading || (!force && cache && Date.now() - cache.at < REFRESH_MS)) return;
  loading = true;
  try {
    cache = { at: Date.now(), data: await window.api.social.neighborhood() };
  } finally {
    loading = false;
  }
  render(root, state, ui);
}

function upgradeList(upgrades) {
  const names = Object.entries(upgrades ?? {})
    .filter(([, level]) => level > 0)
    .map(([id, level]) => `${UPGRADES[id]?.name ?? id}${level > 1 ? ` ${level}` : ''}`);
  return names.length ? names.join(' · ') : 'ainda sem melhorias';
}

function shopCard(shop) {
  return el(
    'li',
    'friend-shop',
    el('span', 'disc', ''),
    el(
      'div',
      null,
      el('div', null, el('strong', null, shop.name), shop.name !== shop.displayName ? el('span', 'muted small', ` · ${shop.displayName}`) : null),
      el('div', 'muted', `${TITLE_NAMES[shop.title] ?? shop.title} · ★ ${formatReputation(shop.reputation)} · dia ${shop.day}`),
      el('div', 'small', upgradeList(shop.upgrades)),
      el(
        'div',
        'muted small',
        `${plural(shop.mastered, 'disco dominado', 'discos dominados')} · atualizada em ${date.format(new Date(shop.updatedAt))}`,
      ),
    ),
  );
}

function weeklyCard(weekly, ui) {
  if (!weekly?.song) {
    return el('section', 'panel weekly', el('h2', null, 'Disco da semana'), el('p', 'muted', 'Ainda sem disco nesta semana: o servidor escolhe entre as músicas publicadas no Fretshift com link do YouTube.'));
  }
  const winner = weekly.lastWeek?.winner;
  const action = weekly.inLibrary
    ? el('p', 'muted small', 'Ele está na sua prateleira com o selo "semana".')
    : weekly.song.youtube
      ? button('Baixar no Fretshift', 'secondary', async () => {
          const res = await window.api.social.importWeekly({ songId: weekly.song.id });
          if (!res.ok) ui.toastError(res.error);
        }, { title: 'O Fretshift baixa o chart e o áudio do YouTube (Fretshift 0.3.0 ou mais novo)' })
      : null;
  return el(
    'section',
    'panel weekly',
    el('p', 'label', `Disco da semana · ${weekly.week}`),
    el('h2', null, weekly.song.title ?? 'Sem título', el('span', 'muted', ` · ${weekly.song.artist ?? ''}`)),
    el(
      'p',
      'small',
      weekly.active
        ? 'Tocar este disco até domingo: movimento ×1,3 e uma vaga no ranking da semana.'
        : 'Vale a partir da reputação 50 (Lenda local): movimento ×1,3. O ranking já conta.',
    ),
    weekly.ranking.length
      ? el(
          'ol',
          'weekly-ranking',
          ...weekly.ranking.map((e, i) =>
            el(
              'li',
              e.me ? 'me' : null,
              el('span', 'pos', i === 0 ? '🏆' : `${i + 1}º`),
              el('strong', null, e.me ? 'Você' : e.displayName),
              el('span', 'muted small', `${INSTRUMENT_NAMES[e.instrument]} · ${DIFFICULTY_NAMES[e.difficulty]}`),
              el('span', 'score', score.format(e.score)),
            ),
          ),
        )
      : el('p', 'muted small', 'Ninguém tocou ainda nesta semana.'),
    winner
      ? el('p', 'small', winner.me ? '🏆 Você ganhou a semana passada: o troféu está no balcão.' : `🏆 Semana passada: ${winner.displayName}.`)
      : null,
    action,
  );
}

export function render(root, state, ui) {
  const data = cache?.data;
  const account = data?.account;
  const header = el(
    'div',
    'screen-header row',
    el('div', null, el('h1', null, 'Vizinhança'), el('p', 'muted', 'As lojas dos seus amigos do Fretshift e o disco da semana.')),
    el('div', 'row-buttons', account?.signedIn ? button('Atualizar', 'ghost small', () => load(root, state, ui, true)) : null, button('Voltar à loja', 'ghost', () => ui.closeOverlay())),
  );

  let body;
  if (!data) {
    body = el('p', 'muted', 'Carregando…');
    load(root, state, ui);
  } else if (!account?.signedIn) {
    body = el(
      'section',
      'panel empty',
      el('p', null, 'Entre com a mesma conta Microsoft do Fretshift para ver as lojas dos amigos, disputar o disco da semana e ganhar o bônus de "referência" nos discos em que você tem o melhor resultado.'),
      el('p', 'muted small', 'Sem conta, o jogo continua igual, só sem esses bônus.'),
      button('Entrar com a conta Microsoft', 'primary big', async () => {
        await ui.signIn();
        load(root, state, ui, true);
      }),
    );
  } else {
    body = el(
      'div',
      'neighborhood',
      weeklyCard(data.weekly, ui),
      el(
        'section',
        'panel',
        el('h2', null, 'Lojas dos amigos'),
        data.shops === null
          ? el('p', 'muted', 'Sem conexão com o servidor agora. O jogo segue normal; tente de novo mais tarde.')
          : data.shops.length
            ? el('ul', 'friend-shops', ...data.shops.map(shopCard))
            : el('p', 'muted', 'Nenhum amigo com loja ainda. A loja aparece aqui quando o amigo fecha um dia no VinilHero.'),
        el(
          'p',
          'muted small',
          `Você entrou como ${account.displayName ?? '…'}${account.friendCode ? ` · seu código: ${account.friendCode}` : ''}. Os amigos são os mesmos do Fretshift (adicione por lá).`,
        ),
        button('Sair da conta', 'ghost small', async () => {
          await ui.signOut();
          load(root, state, ui, true);
        }),
      ),
    );
  }
  root.replaceChildren(el('section', 'screen neighborhood-screen', header, body));
}
