// Pedidos do dia: 2 ou 3 clientes deixam um pedido no quadro na abertura. Atender dá gorjeta e
// reputação. Só vale tocando (não em "só pôr pra tocar"). Ver docs/design/index.md#pedidos-do-dia.

import { BALANCE } from './balance.js';
import { INSTRUMENTS, SECTIONS } from './records.js';
import { pick } from './rng.js';

const Q = BALANCE.requests;
const HARD = ['Hard', 'Expert'];

const hasChart = (record, instrument, difficulties) => {
  const charts = record.totalNotes?.[instrument];
  if (!charts) return false;
  return difficulties ? difficulties.some((d) => charts[d] > 0) : Object.values(charts).some((n) => n > 0);
};

/** Gorjeta e reputação de um pedido. */
export function rewardOf(request) {
  return { tip: Q.tip[request.kind] ?? 0, reputation: Q.reputation[request.kind] ?? BALANCE.reputation.requestBonus };
}

/**
 * Pedidos possíveis com os discos da prateleira (`shelfRecords`: resumo + seção), cada um com uma
 * chave para não repetir o mesmo pedido no dia.
 */
export function possibleRequests(shelfRecords) {
  const out = [];
  const any = (fn) => shelfRecords.some(fn);
  for (const [tag, periods] of Object.entries(Q.tagPeriods)) {
    if (!any((r) => r.tags?.includes(tag))) continue;
    if (periods) for (const period of periods) out.push({ key: `tag:${tag}:${period}`, kind: 'tag', tag, period });
    else out.push({ key: `tag:${tag}`, kind: 'tag', tag });
  }
  for (const section of SECTIONS) {
    if (any((r) => r.section === section)) out.push({ key: `section:${section}`, kind: 'section', section });
  }
  for (const instrument of INSTRUMENTS) {
    if (instrument === 'vocals') continue; // a voz tem o pedido próprio, "pra cantar junto"
    if (any((r) => hasChart(r, instrument))) {
      out.push({ key: `instrument:${instrument}`, kind: 'instrument', instrument, minP: Q.instrumentMinP });
    }
  }
  if (any((r) => r.tags?.includes('cantavel') && hasChart(r, 'vocals'))) out.push({ key: 'sing', kind: 'sing' });
  if (any((r) => INSTRUMENTS.some((i) => hasChart(r, i, HARD)))) {
    out.push({ key: 'impress', kind: 'impress', minStars: Q.impressMinStars });
  }
  return out;
}

/**
 * 2 ou 3 pedidos diferentes, só entre os possíveis. Os tipos de pedido têm peso igual (um tipo com
 * muitas variações, como seção, não domina o quadro). `taken`: chaves que já estão no quadro.
 */
export function generateRequests(rng, { dayNumber, shelfRecords, taken = [] }) {
  const [min, max] = Q.perDay;
  const wanted = min + Math.floor(rng() * (max - min + 1));
  let pool = possibleRequests(shelfRecords).filter((r) => !taken.includes(r.key));
  const requests = [];
  while (requests.length < wanted && pool.length) {
    const kind = pick(rng, Object.fromEntries(pool.map((r) => [r.kind, 1])));
    const ofKind = pool.filter((r) => r.kind === kind);
    const chosen = ofKind[Math.floor(rng() * ofKind.length)];
    pool = pool.filter((r) => r.key !== chosen.key);
    requests.push({ id: `r${dayNumber}-${requests.length + 1}`, ...chosen, ...rewardOf(chosen), done: false });
  }
  return requests;
}

/** Pedido do cliente exigente (evento): um disco específico com full combo, fica 3 dias no quadro. */
export function demandingRequest(rng, { dayNumber, shelfRecords }) {
  const candidates = shelfRecords.filter((r) => INSTRUMENTS.some((i) => hasChart(r, i, Q.demandingDifficulties)));
  if (!candidates.length) return null;
  const record = candidates[Math.floor(rng() * candidates.length)];
  const request = {
    id: `r${dayNumber}-x`,
    key: `demanding:${record.id}`,
    kind: 'demanding',
    songId: record.id,
    difficulties: Q.demandingDifficulties,
    expiresDay: dayNumber + Q.demandingDays - 1,
  };
  return { ...request, ...rewardOf(request), done: false };
}

/** Pedido ainda aberto: não atendido, não desistido, e (exigente) dentro do prazo. */
export const isOpenRequest = (request, dayNumber) =>
  !request.done && !request.failed && (request.expiresDay === undefined || request.expiresDay >= dayNumber);

/**
 * A apresentação atende o pedido? `presentation`: { mode, period, record, play, P }. Só vale
 * tocando: "só pôr pra tocar" (e partida que não conta, como fora da voz na Noite de karaokê) não atende.
 */
export function fulfilled(request, { mode, period, record, play, P }) {
  if (mode !== 'play' || !play) return false;
  if (request.period && request.period !== period) return false;
  switch (request.kind) {
    case 'tag':
      return !!record.tags?.includes(request.tag);
    case 'section':
      return record.section === request.section;
    case 'instrument':
      return play.instrument === request.instrument && P >= request.minP;
    case 'sing':
      return play.instrument === 'vocals' && !!record.tags?.includes('cantavel');
    case 'impress':
      return (play.stars ?? 0) >= request.minStars && HARD.includes(play.difficulty);
    case 'demanding':
      return record.id === request.songId && !!play.fullCombo && request.difficulties.includes(play.difficulty);
    default:
      return false;
  }
}

/** O cliente exigente vai embora (sem perda) se o disco dele for tocado sem atender. */
export function gaveUp(request, presentation) {
  return (
    request.kind === 'demanding' &&
    presentation.mode === 'play' &&
    !!presentation.play &&
    presentation.record.id === request.songId &&
    !fulfilled(request, presentation)
  );
}

/**
 * O disco pode atender o pedido, se for bem tocado? (para destacar os discos na escolha)
 * Não olha o período nem o desempenho, só o disco.
 */
export function recordMatches(request, record) {
  switch (request.kind) {
    case 'tag':
      return !!record.tags?.includes(request.tag);
    case 'section':
      return record.section === request.section;
    case 'instrument':
      return hasChart(record, request.instrument);
    case 'sing':
      return !!record.tags?.includes('cantavel') && hasChart(record, 'vocals');
    case 'impress':
      return INSTRUMENTS.some((i) => hasChart(record, i, HARD));
    case 'demanding':
      return record.id === request.songId;
    default:
      return false;
  }
}

/**
 * Por que a apresentação não atendeu o pedido (para o resultado mostrar). Devolve `null` se atendeu,
 * senão `{ why, ...detalhes }`: notPlayed, period, tag, section, instrument, lowP, notVocals,
 * notSingable, difficulty, stars, otherRecord, fullCombo.
 */
export function missReason(request, presentation) {
  if (fulfilled(request, presentation)) return null;
  const { mode, period, record, play, P } = presentation;
  if (mode !== 'play' || !play) return { why: 'notPlayed' };
  if (request.period && request.period !== period) return { why: 'period' };
  switch (request.kind) {
    case 'tag':
      return { why: 'tag' };
    case 'section':
      return { why: 'section' };
    case 'instrument':
      return play.instrument !== request.instrument ? { why: 'instrument' } : { why: 'lowP', P };
    case 'sing':
      return play.instrument !== 'vocals' ? { why: 'notVocals' } : { why: 'notSingable' };
    case 'impress':
      return HARD.includes(play.difficulty) ? { why: 'stars', stars: play.stars ?? 0 } : { why: 'difficulty' };
    case 'demanding':
      if (record.id !== request.songId) return { why: 'otherRecord' };
      return request.difficulties.includes(play.difficulty) ? { why: 'fullCombo' } : { why: 'difficulty' };
    default:
      return { why: 'other' };
  }
}
