// Textos da tela. Os nomes no código e nos dados são em inglês; o que a jogadora lê fica aqui.

export const SECTION_NAMES = {
  rock: 'Rock e Metal',
  pop: 'Pop',
  brasil: 'Brasil',
  eletronica: 'Eletrônica',
  soul: 'Soul e Funk',
  variados: 'Variados',
  storage: 'Depósito',
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

export const PERIOD_NAMES = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  night: 'Noite',
  closing: 'Fim do dia',
  all: 'O dia todo',
  closed: 'Loja fechada',
};

export const ARCHETYPE_NAMES = {
  curious: 'Curioso',
  sectionFan: 'Fã de seção',
  musician: 'Músico',
  collector: 'Colecionador',
  karaoke: 'Karaokeiro',
  critic: 'Crítico',
};

const ARCHETYPE_PLURAL = {
  curious: 'curiosos',
  sectionFan: 'fãs de seção',
  musician: 'músicos',
  collector: 'colecionadores',
  karaoke: 'karaokeiros',
  critic: 'críticos',
};

export const TITLE_NAMES = {
  neighborhood: 'Lojinha de bairro',
  known: 'Conhecida no bairro',
  meetingPoint: 'Ponto de encontro',
  reference: 'Referência',
  cityPoint: 'Point da cidade',
  localLegend: 'Lenda local',
  legendary: 'Lendária',
};

export const UPGRADES = {
  sound: { name: 'Caixa de som', effect: 'Mais gente ouve da rua: movimento ×1,15 / ×1,3 / ×1,5.' },
  window: { name: 'Vitrine', effect: 'Discos à mostra na frente, inclusive os dominados: chance de compra ×1,1 / ×1,2.' },
  extraShelf: { name: 'Prateleira extra', effect: '+8 lugares numa seção. Discos no depósito não vendem.' },
  booth: { name: 'Cabine de audição', effect: 'Karaokeiros vêm 50% mais. Libera a Noite de karaokê.' },
  neon: { name: 'Letreiro neon', effect: 'A loja aparece de longe: +3 visitantes de base em toda apresentação.' },
  stage: { name: 'Palco', effect: 'Libera o show da banda: tocar no "Jogar juntos" do Fretshift, com 2 a 4 pessoas.' },
  cafe: { name: 'Cafeteria', effect: 'Um café no balcão: 15% dos compradores levam um segundo disco.' },
  collectorsRoom: {
    name: 'Sala de colecionadores',
    effect: 'Uma sala com vitrines para os discos raros: colecionadores vêm 50% mais, pagam 15% mais e até 2 discos dominados a mais vendem sozinhos por período.',
  },
  mezzanine: {
    name: 'Mezanino',
    effect: 'Um segundo andar em cima das prateleiras: +8 lugares em todas as seções e espaço para o Festival do bairro.',
  },
};

export const EVENTS = {
  rush: {
    name: 'Hora do rush',
    effect: 'À tarde a rua lota, mas ninguém tem tempo: discos curtos (menos de 2,5 min) atraem 40% mais gente; os outros, 20% menos.',
  },
  rain: { name: 'Dia de chuva', effect: 'Manhã e tarde mais vazias (−30%). À noite todo mundo entra pra fugir da chuva (+20%).' },
  karaoke: {
    name: 'Noite de karaokê',
    effect: 'À noite só partidas de voz contam (as outras valem como só pôr pra tocar). Três vezes mais karaokeiros, +20% de movimento.',
  },
  demanding: { name: 'Cliente exigente', effect: 'Um cliente deixou um pedido difícil no quadro. Ele espera 3 dias.' },
  bia: { name: 'Festa da Bia', effect: 'A Bia traz a turma dela à noite: discos rápidos atraem 40% mais gente.' },
};

/** Conquistas da coleção (src/core/achievements.js). */
export const ACHIEVEMENTS = {
  firstShow: { name: 'Primeira apresentação', how: 'Apresentar um disco na loja.' },
  firstFullCombo: { name: 'Sem errar nenhuma', how: 'Um full combo numa apresentação.' },
  mastered1: { name: 'Disco dominado', how: '5 estrelas em Difícil ou Expert num disco.' },
  mastered10: { name: 'Prateleira dourada', how: '10 discos dominados.' },
  allInstruments: { name: 'Banda de uma pessoa só', how: 'Partidas em guitarra, baixo, bateria e voz.' },
  hardFive: { name: 'Mão firme', how: '4 estrelas ou mais em Difícil ou Expert em 5 discos.' },
  allSections: { name: 'De tudo um pouco', how: 'Apresentar discos de todas as seções.' },
  repertoire25: { name: 'Repertório', how: 'Apresentar 25 discos diferentes na loja.' },
  requests50: { name: 'O bairro pede, você toca', how: 'Atender 50 pedidos.' },
  firstHome: { name: 'Da casa', how: 'Um cliente fixo chegar ao capítulo 5.' },
  firstStory: { name: 'A vizinhança tem história', how: 'Ver uma história da vizinhança até o fim.' },
  legendary: { name: 'Lendária', how: 'Reputação 75.' },
  festival: { name: 'Festa na rua', how: 'Fazer um Festival do bairro.' },
};

/** Decoração (src/core/decor.js): nome e como aparece na loja. */
export const DECOR_TEXT = {
  posterRock: { name: 'Pôster de rock', look: 'Raio vermelho no fundo preto. Vai numa das paredes.' },
  posterBrasil: { name: 'Pôster de MPB', look: 'Verde e amarelo, com um sol. Vai numa das paredes.' },
  posterEletronica: { name: 'Pôster de eletrônica', look: 'Ondas azuis no roxo. Vai numa das paredes.' },
  posterSoul: { name: 'Pôster de soul', look: 'Um disco preto no laranja. Vai numa das paredes.' },
  plant: { name: 'Vaso de planta', look: 'Uma planta na entrada, balançando com o vento da porta.' },
  rug: { name: 'Tapete', look: 'Um tapete vermelho na frente da vitrine.' },
  lights: { name: 'Varal de luzes', look: 'Luzinhas coloridas no teto, piscando.' },
  armchair: { name: 'Poltrona', look: 'Uma poltrona roxa para quem quer ouvir sem pressa.' },
  jukebox: { name: 'Jukebox', look: 'Uma jukebox antiga, com as luzes correndo.' },
  dimmer: { name: 'Dimmer', look: 'Libera as cores da luz da loja: neon, fria e pôr do sol.' },
};

/** Caminho da loja (src/core/milestones.js): o nome de cada marco e de cada condição. */
export const MILESTONES = {
  start: { name: 'Lojinha', about: 'Uma porta, duas prateleiras e um toca-discos.' },
  equipped: { name: 'Equipada', about: 'Som que se ouve da rua e uma vitrine.' },
  catalog: { name: 'Acervo', about: 'Discos de vários estilos, com espaço para mais.' },
  ambience: { name: 'Com a sua cara', about: 'Uma loja que dá vontade de ficar.' },
  spaces: { name: 'Espaços especiais', about: 'Cabine para ouvir e palco para tocar.' },
  collectors: { name: 'Ponto dos colecionadores', about: 'A sala dos discos raros, e o Seu Afonso de casa.' },
  reference: { name: 'Referência do bairro', about: 'Lendária, com festival na rua.' },
};

export const MILESTONE_GOALS = {
  sound: 'caixa de som',
  window: 'vitrine',
  extraShelf: 'uma prateleira extra',
  sections: 'discos de 4 seções nas prateleiras',
  decor: '3 itens de decoração',
  booth: 'cabine de audição',
  stage: 'palco',
  collectorsRoom: 'sala de colecionadores',
  afonso: 'Seu Afonso no capítulo 3',
  reputation: 'reputação 75',
  festival: 'um Festival do bairro',
};

export const LIGHTING_NAMES = { warm: 'Quente', neon: 'Neon', cool: 'Fria', sunset: 'Pôr do sol' };

/** Eventos que a jogadora marca (docs/design/gestao.md). */
export const STORE_EVENTS = {
  themeNight: {
    name: 'Noite temática',
    effect: 'Uma noite de uma seção só: os fãs dela vêm três vezes mais e tocar um disco dela atrai +25% de gente.',
    risk: 'Tocar fora do tema, mal (desempenho abaixo de 0,40) ou só pôr pra tocar faz a noite ficar morna: −0,5 de reputação.',
    success: 'Tocar bem um disco da seção (desempenho 0,60 ou mais): +0,75 de reputação.',
  },
  listening: {
    name: 'Sessão de audição',
    effect: 'A cabine aberta para ouvir com calma: um pouco menos de gente (−10%), mas quem vem compra 35% mais. Curiosos vêm mais.',
    risk: 'Sem risco: só não vale a pena se a loja estiver sem estoque.',
    success: 'Tocando: +0,25 de reputação (gente que ouviu de verdade).',
  },
  launch: {
    name: 'Lançamento de disco',
    effect: 'Um disco que nunca foi apresentado na loja ganha festa de lançamento: +40% de gente quando ele toca.',
    risk: 'Não tocar o disco lançado no período, ou só pôr pra tocar: −0,5 de reputação.',
    success: 'Tocar bem o disco lançado (0,60 ou mais): +0,5 de reputação.',
  },
  festival: {
    name: 'Festival do bairro',
    effect: 'O dia inteiro: o bairro todo na porta, +50% de gente em todos os períodos. Pede o mezanino, o palco e reputação 60.',
    risk: 'Só pôr pra tocar em algum período decepciona: −0,5 de reputação naquele período.',
    success: 'Tocar bem (0,60 ou mais) em cada período: +0,5 de reputação por período.',
  },
  collectors: {
    name: 'Encontro de colecionadores',
    effect: 'De manhã, colecionadores vêm quatro vezes mais e os discos dominados vendem sozinhos com o dobro da chance.',
    risk: 'Tocar em Fácil ou só pôr pra tocar decepciona: −0,5 de reputação.',
    success: 'Difícil ou Expert com 4 estrelas ou mais: +0,75 de reputação.',
  },
};

export const STORE_EVENT_REASONS = {
  booth: 'precisa da cabine de audição',
  expansion: 'precisa do mezanino e do palco',
  reputation: 'precisa de mais reputação',
  cooldown: 'aconteceu há pouco tempo',
  already: 'já tem um evento marcado hoje',
  closed: 'não sobrou período livre hoje',
  noRecord: 'nenhum disco serve agora',
  money: 'dinheiro insuficiente',
  debt: 'contas atrasadas',
};

export const STORE_EVENT_OUTCOME = {
  success: 'deu certo',
  neutral: 'passou',
  flop: 'não deu certo',
};

const INSTRUMENT_WELL_PLAYED = {
  guitar: 'uma guitarra bem tocada',
  bass: 'um baixo bem tocado',
  drums: 'uma bateria bem tocada',
  vocals: 'uma voz afinada',
};

const PERIOD_IN = { morning: 'de manhã', afternoon: 'à tarde', night: 'à noite' };

/** O pedido como o cliente fala. */
export function requestText(r) {
  switch (r.kind) {
    case 'tag':
      if (r.tag === 'rapida') return r.period === 'night' ? 'Algo agitado pra noite' : 'Algo agitado pra animar a tarde';
      if (r.tag === 'lenta') return 'Algo calmo pra começar a manhã';
      if (r.tag === 'pesada') return 'Quero ouvir algo pesado';
      return `Um disco ${TAG_NAMES[r.tag] ?? r.tag}`;
    case 'section':
      return `Tem alguma coisa de ${SECTION_NAMES[r.section]}?`;
    case 'instrument':
      return `Quero ouvir ${INSTRUMENT_WELL_PLAYED[r.instrument]}`;
    case 'sing':
      return r.key === 'karaoke' ? 'Noite de karaokê: bora cantar!' : 'Alguma coisa pra cantar junto';
    case 'impress':
      return 'Me impressiona!';
    case 'demanding':
      return `${r.songTitle ?? 'Aquele disco'}, sem errar uma nota`;
    default:
      return 'Pedido';
  }
}

/** A condição do pedido, em uma linha. */
export function requestHint(r) {
  const when = r.period ? ` · ${PERIOD_IN[r.period]}` : '';
  switch (r.kind) {
    case 'tag':
      return `disco ${TAG_NAMES[r.tag] ?? r.tag}${when}`;
    case 'section':
      return `disco da seção ${SECTION_NAMES[r.section]}${when}`;
    case 'instrument':
      return `${INSTRUMENT_NAMES[r.instrument]} com desempenho de ${decimal.format(r.minP)} ou mais${when}`;
    case 'sing':
      return `voz num disco cantável${when}`;
    case 'impress':
      return `${r.minStars} estrelas ou mais em Difícil ou Expert${when}`;
    case 'demanding':
      return `full combo em Médio ou acima · até o dia ${r.expiresDay}`;
    default:
      return '';
  }
}

/** Por que a apresentação não atendeu o pedido (`miss`: de requestsMissed do resultado). */
export function missText(r, miss) {
  switch (miss.why) {
    case 'notPlayed':
      return 'só vale tocando no Fretshift';
    case 'period':
      return `só vale ${PERIOD_IN[r.period]}`;
    case 'tag':
      return `esse disco não é ${TAG_NAMES[r.tag] ?? r.tag}`;
    case 'section':
      return `esse disco não é da seção ${SECTION_NAMES[r.section]}`;
    case 'instrument':
      return `precisava tocar ${INSTRUMENT_NAMES[r.instrument]?.toLowerCase()}`;
    case 'lowP':
      return `faltou capricho: desempenho ${decimal.format(miss.P)}, precisava de ${decimal.format(r.minP)}`;
    case 'notVocals':
      return 'precisava cantar (voz)';
    case 'notSingable':
      return 'esse disco não é cantável';
    case 'difficulty':
      return r.kind === 'demanding' ? 'precisa ser em Médio ou acima' : 'precisa ser em Difícil ou Expert';
    case 'stars':
      return `${plural(miss.stars, 'estrela', 'estrelas')}, precisava de ${r.minStars}`;
    case 'otherRecord':
      return `continua esperando até o dia ${r.expiresDay}`;
    case 'fullCombo':
      return 'precisava de full combo';
    default:
      return 'não foi dessa vez';
  }
}

export const ERRORS = {
  noStage: 'O show da banda precisa do palco (Melhorias).',
  noExe: 'Não achei o Fretshift instalado. Na tela de espera, use "Onde está o Fretshift?".',
  badSong: 'Esse disco não pode ser aberto no Fretshift.',
  launchFailed: 'Não deu para abrir o Fretshift.',
  noGame: 'A loja ainda não abriu: falta encontrar o Fretshift.',
  dayClosed: 'O dia já acabou. Feche o dia para abrir o próximo.',
  alreadyWaiting: 'Já tem um disco esperando ser tocado.',
  notOnShelf: 'Esse disco está no depósito. Coloque numa prateleira primeiro.',
  shelfFull: 'Essa prateleira está cheia. Compre uma prateleira extra ou tire um disco.',
  recordPending: 'Esse disco está esperando ser tocado; não dá para guardar agora.',
  debt: 'Contas atrasadas: com saldo negativo, as melhorias e o estoque ficam bloqueados.',
  money: 'Dinheiro insuficiente.',
  reputation: 'A loja ainda não tem reputação para isso.',
  maxed: 'Essa melhoria já está no nível máximo.',
  dayNotFinished: 'Ainda falta tocar nos períodos do dia.',
  dayNotClosed: 'Feche o dia antes de abrir o próximo.',
  notWaiting: 'Nenhum disco esperando.',
  unknownRecord: 'Disco desconhecido.',
  badCopies: 'Quantidade de cópias inválida.',
  notInLibrary: 'Esse disco saiu da biblioteca do Fretshift. Escolha outro.',
  featuredToday: 'O destaque do balcão já foi trocado hoje. Amanhã dá para trocar de novo.',
  badDiscount: 'Desconto inválido.',
  badPromotion: 'Promoção inválida.',
  promotionExists: 'Já tem uma promoção nisso.',
  tooManyPromotions: 'No máximo duas promoções ao mesmo tempo.',
  unknownPromotion: 'Essa promoção já acabou.',
  unknownSection: 'Seção desconhecida.',
  unknownEvent: 'Evento desconhecido.',
  noBooth: 'Esse evento precisa da cabine de audição.',
  event_reputation: 'A loja ainda não tem reputação para esse evento.',
  event_cooldown: 'Esse evento aconteceu há pouco tempo.',
  event_already: 'Já tem um evento marcado hoje.',
  event_closed: 'Não sobrou período livre hoje para esse evento.',
  event_noRecord: 'Nenhum disco serve para esse evento agora.',
  event_period: 'Esse evento não pode ser nesse período.',
  event_section: 'Essa seção não tem discos na prateleira.',
  event_record: 'Esse disco não pode ser lançado (precisa nunca ter sido apresentado e ter 3 cópias).',
  noEvent: 'Nenhum evento marcado.',
  unknownDecor: 'Item desconhecido.',
  decorOwned: 'Você já tem esse item.',
  notOwned: 'Compre o item primeiro.',
  unknownSlot: 'Lugar desconhecido.',
  unknownLighting: 'Cor de luz desconhecida.',
  eventStarted: 'O evento já começou: não dá para desmarcar.',
  unexpected: 'Algo deu errado.',
};

const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const oneDecimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const formatP = (p) => `P ${decimal.format(p)}`;
export const formatPercent = (x) => percent.format(x);
export const formatMoney = (x) => money.format(Math.round(x));
export const formatReputation = (x) => oneDecimal.format(x);
export const formatDelta = (x) => (x > 0 ? '+' : x < 0 ? '−' : '±') + oneDecimal.format(Math.abs(x));
export const stars = (n) => '★'.repeat(Math.max(0, Math.min(5, n))) || '☆';
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const archetypeCount = (archetype, n) =>
  `${n} ${n === 1 ? ARCHETYPE_NAMES[archetype].toLowerCase() : ARCHETYPE_PLURAL[archetype]}`;

/** Uma partida em uma linha: "Bateria · Expert · ★★★★ · 93% · P 0,71". */
export function playLine(play, P) {
  return [
    INSTRUMENT_NAMES[play.instrument] ?? play.instrument,
    DIFFICULTY_NAMES[play.difficulty] ?? play.difficulty,
    stars(play.stars),
    formatPercent(play.accuracy),
    formatP(P),
  ].join(' · ');
}

const REQUEST_KIND_NAMES = {
  tag: 'o cliente que pediu um tipo de disco',
  section: 'o fã que pediu uma seção',
  instrument: 'o músico que pediu um instrumento',
  sing: 'quem queria cantar junto',
  impress: 'quem pediu pra ser impressionado',
  demanding: 'o cliente exigente',
};

/** As frases de "por quê" do resultado. */
export function reasonText(r) {
  switch (r.code) {
    case 'passive':
      return 'Só pôr pra tocar: a loja teve o movimento de uma apresentação fraca.';
    case 'weekly':
      return 'Disco da semana: a vizinhança inteira veio ouvir (movimento ×1,3).';
    case 'reference':
      return `Os clientes da loja ${r.friend ? `de ${r.friend}` : 'do seu amigo'} vieram ouvir você: você é a referência deste disco (+15% de visitantes).`;
    case 'band':
      return r.weak
        ? `Show com ${r.count} pessoas, mas alguém se perdeu e o público notou: movimento ×${oneDecimal.format(r.E)}.`
        : `Show com ${r.count} pessoas: a loja lotou, movimento ×${oneDecimal.format(r.E)}.`;
    case 'karaokeIgnored':
      return `Noite de karaokê: ${INSTRUMENT_NAMES[r.instrument]?.toLowerCase() ?? 'o instrumento'} não conta, só a voz. Valeu como só pôr pra tocar.`;
    case 'event_rush':
      return r.up ? 'Hora do rush: um disco curto segurou o pessoal apressado.' : 'Hora do rush: o disco era longo e o pessoal não esperou.';
    case 'event_rain':
      return r.up ? 'Chuva lá fora: todo mundo entrou pra se esconder.' : 'Chuva: pouca gente na rua.';
    case 'event_karaoke':
      return 'Noite de karaokê: a loja encheu.';
    case 'requestDone':
      return `Pedido atendido: ${REQUEST_KIND_NAMES[r.kind] ?? 'um cliente'} deixou ${money.format(r.tip)} de gorjeta.`;
    case 'requestFailed':
      return 'O cliente exigente ouviu, não gostou e foi embora (sem perda).';
    case 'critic':
      return r.up ? 'Um crítico estava na plateia e elogiou: reputação em triplo.' : 'Um crítico estava na plateia e não gostou: a perda de reputação triplicou.';
    case 'singers':
      return `${r.count === 1 ? 'Um karaokeiro cantou junto e levou' : `${r.count} karaokeiros cantaram junto e levaram`} disco.`;
    case 'noStock':
      return `${plural(r.count, 'cliente saiu', 'clientes saíram')} sem o disco: esgotado. Reponha o estoque.`;
    case 'cafe':
      return `Com o café, ${plural(r.count, 'cliente levou', 'clientes levaram')} um segundo disco.`;
    case 'soloSales':
      return r.count === 1
        ? 'Um disco dominado vendeu sozinho: colecionador de passagem.'
        : `${r.count} discos dominados venderam sozinhos: colecionadores de passagem.`;
    case 'store_themeNight':
      return r.outcome === 'success'
        ? 'Noite temática: a turma da seção lotou a loja e saiu falando bem.'
        : r.outcome === 'flop'
          ? 'Noite temática: quem veio pelo tema não ouviu o que esperava. A noite ficou morna.'
          : 'Noite temática: a turma veio, ouviu e foi embora sem muito alarde.';
    case 'store_listening':
      return r.outcome === 'success' ? 'Sessão de audição: gente ouvindo de olho fechado, comprando com calma.' : 'Sessão de audição: a cabine ficou aberta, mas sem apresentação.';
    case 'store_launch':
      return r.outcome === 'success'
        ? 'Lançamento: o disco novo estreou bem na loja.'
        : r.outcome === 'flop'
          ? 'Lançamento: o pessoal veio para o disco novo e ele não tocou direito. Pegou mal.'
          : 'Lançamento: o disco estreou, mas sem empolgar.';
    case 'store_collectors':
      return r.outcome === 'success'
        ? 'Encontro de colecionadores: os colecionadores aplaudiram de pé (e de chapéu).'
        : r.outcome === 'flop'
          ? 'Encontro de colecionadores: torceram o nariz para a apresentação.'
          : 'Encontro de colecionadores: conversaram mais entre eles do que ouviram.';
    case 'store_festival':
      return r.outcome === 'success'
        ? 'Festival do bairro: a rua inteira dançando na porta da loja.'
        : r.outcome === 'flop'
          ? 'Festival do bairro: o público veio para ouvir alguém tocar e só tinha disco rodando.'
          : 'Festival do bairro: muita gente, mas a apresentação não empolgou.';
    case 'impulse':
      return `${plural(r.count, 'cliente levou', 'clientes levaram')} o disco em destaque do balcão por impulso.`;
    case 'promo':
      return `Promoção de ${percent.format(r.discount)}: mais gente comprou, cada disco saiu mais barato.`;
    case 'repeat':
      return `${r.times}ª vez desse disco hoje: menos gente parou para ouvir.`;
    case 'fullCombo':
      return 'Full combo! A vizinhança comentou.';
    case 'collectors':
      return `${DIFFICULTY_NAMES[r.difficulty]} com ${plural(r.stars, 'estrela', 'estrelas')} atraiu ${archetypeCount('collector', r.count)}.`;
    case 'musiciansUnimpressed':
      return `${r.count === 1 ? 'Um músico achou' : `${r.count} músicos acharam`} a apresentação fraca e não ${r.count === 1 ? 'comprou' : 'compraram'}.`;
    case 'musiciansBought':
      return `${r.count === 1 ? 'Um músico gostou' : `${r.count} músicos gostaram`} e ${r.count === 1 ? 'levou' : 'levaram'} disco.`;
    case 'sectionFans':
      return `${r.count === 1 ? 'Um fã' : `${r.count} fãs`} de ${SECTION_NAMES[r.section]} ${r.count === 1 ? 'entrou' : 'entraram'} na hora certa.`;
    case 'greatShow':
      return 'Que apresentação! Teve gente filmando da porta.';
    case 'roughShow':
      return 'A apresentação não engrenou; a loja perdeu um pouco de fama.';
    case 'nightCrowd':
      return 'À noite a rua tem mais movimento.';
    case 'slowMorning':
      return 'De manhã a rua é mais calma.';
    default:
      return '';
  }
}

export function noticeText(n) {
  switch (n.code) {
    case 'historyImported':
      return n.bonus > 0
        ? `A vizinhança já te ouviu tocar: +${n.bonus} de reputação pelos discos que você já toca bem no Fretshift.`
        : 'Loja aberta! As partidas antigas do Fretshift entraram no histórico dos discos.';
    case 'saveBroken':
      return `O save não abriu (${n.error}) e foi guardado como ${n.file}. Nenhum backup servia: a loja recomeçou do zero.`;
    case 'saveRecovered':
      return n.file
        ? `O save não abriu (${n.error}) e foi guardado como ${n.file}. A loja voltou do backup ${n.from}.`
        : `O save não estava lá. A loja voltou do backup ${n.from}.`;
    case 'saveFailed':
      return `Não deu para gravar a loja (${n.error}). O jogo continua e tenta gravar de novo na próxima ação.`;
    case 'saveOk':
      return 'A loja voltou a ser gravada normalmente.';
    case 'backupFailed':
      return `O backup do dia não foi gravado (${n.error}). A loja em si está salva.`;
    default:
      return '';
  }
}

/**
 * O que o pedido de um cliente fixo precisa, em poucas palavras ("bateria · disco pesado · 4
 * estrelas"). `songTitle`: o disco do pedido, quando ele pede um específico.
 */
export function condText(cond, songTitle) {
  const parts = [];
  if (cond.show) parts.push('show da banda');
  if (cond.songId) parts.push(`“${songTitle ?? 'aquele disco'}”`);
  if (cond.section) parts.push(`disco de ${SECTION_NAMES[cond.section]}`);
  if (cond.tag) parts.push(`disco ${TAG_NAMES[cond.tag] ?? cond.tag}`);
  if (cond.mastered) parts.push('disco dominado');
  if (cond.instrument) {
    const list = Array.isArray(cond.instrument) ? cond.instrument : [cond.instrument];
    parts.push(list.map((i) => INSTRUMENT_NAMES[i]?.toLowerCase() ?? i).join(' ou '));
  }
  if (cond.difficulties) parts.push(`em ${cond.difficulties.map((d) => DIFFICULTY_NAMES[d]).join(' ou ')}`);
  if (cond.minStars !== undefined) parts.push(plural(cond.minStars, 'estrela', 'estrelas'));
  if (cond.minP !== undefined) parts.push(`desempenho ${decimal.format(cond.minP)}`);
  if (cond.minCombo !== undefined) parts.push(`combo de ${formatPercent(cond.minCombo)} das notas`);
  if (cond.fullCombo) parts.push('full combo');
  return parts.length ? parts.join(' · ') : 'qualquer disco, tocando';
}

/** Por que o pedido do cliente fixo não foi atendido (uma linha). */
export function regularMissText(cond, miss) {
  switch (miss?.why) {
    case 'notPlayed':
      return 'só vale tocando no Fretshift';
    case 'show':
      return 'precisava ser um show da banda';
    case 'otherRecord':
      return 'era outro disco';
    case 'section':
      return `precisava ser da seção ${SECTION_NAMES[cond.section]}`;
    case 'tag':
      return `precisava ser um disco ${TAG_NAMES[cond.tag] ?? cond.tag}`;
    case 'mastered':
      return 'precisava ser um disco dominado';
    case 'instrument':
      return `precisava tocar ${condText({ instrument: cond.instrument })}`;
    case 'difficulty':
      return `precisava ser em ${cond.difficulties.map((d) => DIFFICULTY_NAMES[d]).join(' ou ')}`;
    case 'lowP':
      return `desempenho ${decimal.format(miss.P)}, precisava de ${decimal.format(cond.minP)}`;
    case 'stars':
      return `${plural(miss.stars, 'estrela', 'estrelas')}, precisava de ${cond.minStars}`;
    case 'combo':
      return `maior combo com ${formatPercent(miss.combo)} das notas, precisava de ${formatPercent(cond.minCombo)}`;
    case 'fullCombo':
      return 'precisava de full combo';
    default:
      return 'não foi dessa vez';
  }
}
