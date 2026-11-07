// Textos da tela. Os nomes no código e nos dados são em inglês; o que a jogadora lê fica aqui.

export const SECTION_NAMES = {
  rock: 'Rock e Metal',
  pop: 'Pop',
  brasil: 'Brasil',
  eletronica: 'Eletrônica',
  soul: 'Soul e Funk',
  variados: 'Variados',
};

export const TAG_NAMES = {
  rapida: 'rápida',
  lenta: 'lenta',
  pesada: 'pesada',
  cantavel: 'cantável',
  longa: 'longa',
  curta: 'curta',
};

export const INSTRUMENT_NAMES = {
  guitar: 'Guitarra',
  bass: 'Baixo',
  drums: 'Bateria',
  vocals: 'Voz',
};

export const DIFFICULTY_NAMES = {
  Easy: 'Fácil',
  Medium: 'Médio',
  Hard: 'Difícil',
  Expert: 'Expert',
};

const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

export const formatP = (p) => `P ${decimal.format(p)}`;
export const formatPercent = (x) => percent.format(x);
export const stars = (n) => '★'.repeat(Math.max(0, Math.min(5, n))) || '☆';
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
