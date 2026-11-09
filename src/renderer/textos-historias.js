// Falas das histórias da vizinhança e das conversas entre clientes (docs/design/historias.md).
// Só texto: as regras ficam em src/core/stories.js. Cada fala é [quem, texto]; quem é o id do
// cliente fixo (o retrato e o nome vêm de textos-clientes.js). {disco} vira o disco lembrado pela
// história (o que a jogadora tocou no passo que guardou a lembrança).

export const STORY_TEXT = {
  presente: {
    title: 'O presente da Lurdinha',
    steps: [
      {
        lines: [
          ['cida', 'Meu bem, me ajuda numa coisa? A Lurdinha, minha vizinha, tem um neto que vive batucando no sofá dela.'],
          ['cida', 'Ela quer dar um disco pra ele. Mas a Lurdinha não entende nada de música. Nem eu, pra falar a verdade.'],
          ['cida', 'Na próxima vez que eu vier, toca um que tenha uma bateria boa? Aí eu levo esse.'],
        ],
      },
      {
        ask: 'Lembra do neto da Lurdinha? Toca um com bateria bem tocada, que eu levo de presente.',
        done: 'É esse! Vou levar embrulhado. Ele vai ficar doido.',
        missed: 'Bonito, mas precisava ser na bateria, pro menino. Eu volto.',
      },
      {
        ask: 'Minha avó me deu {disco}. Disse que foi a moça da loja que escolheu. Toca ele na bateria? Quero ouvir como é de verdade.',
        done: 'Caramba. É assim que é pra soar? Vou ter que ensaiar uns cinco anos.',
        missed: 'Valeu, mas eu queria ouvir {disco}, na bateria. É meu agora, sabe?',
      },
      {
        lines: [
          ['teo', 'Dona Cida! Foi a senhora que escolheu o disco com a minha avó?'],
          ['cida', 'Fui eu nada. Foi aqui, ó. Eu só carreguei a sacola.'],
          ['teo', 'Eu ouvi umas trinta vezes. Minha avó já sabe a letra e nem tem letra.'],
          ['cida', 'Ela me contou. Disse que agora você batuca na panela também.'],
        ],
      },
    ],
  },

  cabine: {
    title: 'A moça da cabine',
    steps: [
      {
        lines: [
          ['cida', 'Sabe aquela moça que fica na cabine, de porta fechada? Eu ouvi ela cantando outro dia.'],
          ['cida', 'Baixinho, mas eu ouvi. Tem uma voz de rádio antigo.'],
          ['cida', 'Eu queria pedir pra ela cantar uma das minhas. Mas eu tenho medo de assustar a menina.'],
        ],
      },
      {
        ask: 'A Dona Cida me pediu pra cantar uma das dela. Uma bem dela, sabe? Canta comigo? Assim eu não fico sozinha.',
        done: 'Ela chorou. Ou tava com alergia. Ela disse que era alergia.',
        missed: 'Acho que não era bem desse jeito que a Dona Cida queria. Eu tento outro dia.',
      },
      {
        lines: [
          ['marina', 'Dona Cida, a senhora gostou? De verdade?'],
          ['cida', 'Menina, o Zé ia pedir bis. E ele não pedia bis pra ninguém.'],
          ['marina', 'Eu nem sei quem é o Zé, mas fiquei muito feliz.'],
          ['cida', 'Senta aqui que eu te conto. Tem tempo?'],
        ],
      },
    ],
  },

  aulas: {
    title: 'Não corre, menino',
    steps: [
      {
        lines: [
          ['rita', 'Aquele menino da bateria, o Téo. Ele é bom, viu? Mas acelera tudo.'],
          ['rita', 'Eu era igual. O baterista da minha banda me jogou uma baqueta uma vez. Pegou na testa.'],
          ['rita', 'Vou dar umas dicas pra ele. Sem baqueta na testa. Acho.'],
        ],
      },
      {
        ask: 'A Rita disse que eu tenho que segurar o tempo, não correr. Toca uma bateria inteira sem perder o fio? Quero ouvir como é.',
        done: 'Ahh. Entendi. Não é devagar, é no lugar. Ela falou isso e eu não tinha entendido.',
        missed: 'Perdeu o fio no meio, né? Tudo bem. Até você. Isso me consola, pra falar a verdade.',
      },
      {
        lines: [
          ['teo', 'Rita! Ensaiei com metrônomo a semana toda. Meu vizinho odeia o metrônomo.'],
          ['rita', 'Todo vizinho odeia metrônomo. É sinal de que tá funcionando.'],
          ['teo', 'O Caio disse que eu parei de correr. Ele quase chorou. Ele nega.'],
          ['rita', 'Guitarrista nega tudo. Agora vai lá e ensaia mais.'],
        ],
      },
    ],
  },

  set: {
    title: 'O primeiro set da Nina',
    steps: [
      {
        lines: [
          ['nina', 'A moça do fone falou comigo! A Bia! Ela é DJ DE VERDADE.'],
          ['nina', 'Eu perguntei se eu podia escolher uma música pro set dela. Ela disse "depende da música".'],
          ['nina', 'Me ajuda a escolher uma bem rápida? Da próxima vez?'],
        ],
      },
      {
        ask: 'É hoje! Toca uma bem rápida, que eu vou mostrar pra Bia. Tem que ser a melhor de todas!',
        done: 'ESSA! Vou anotar o nome. Pai, me empresta a caneta.',
        missed: 'Não era essa… A Bia vai achar que eu não entendo nada. Escolhe outra da próxima vez?',
      },
      {
        ask: 'A Nina escolheu {disco} pro meu set. Toca pra eu ouvir direito? Se ficar bom, ela vai ter crédito no flyer.',
        done: 'A menina tem ouvido. Isso entra no set de sábado, com o nome dela.',
        missed: 'Hm. Não deu pra sentir a pista. Eu quero ouvir {disco} de novo, com calma.',
      },
      {
        lines: [
          ['bia', 'Nina, sua música abriu a pista no sábado. Todo mundo dançou.'],
          ['nina', 'TODO MUNDO? Até os adultos?'],
          ['bia', 'Principalmente os adultos. Saiu seu nome no flyer: "seleção: Nina, 9 anos".'],
          ['nina', 'Eu fiz DEZ. Mas pode deixar nove. Fica mais impressionante.'],
        ],
      },
    ],
  },

  entrevista: {
    title: 'A coleção no jornal',
    steps: [
      {
        lines: [
          ['jorge', 'Aquele senhor de chapéu. O Seu Afonso. Cinco mil discos, me disseram.'],
          ['jorge', 'Quero escrever sobre a coleção dele. Mas ele não fala com jornalista.'],
          ['jorge', 'Talvez fale se for aqui. Com música boa tocando. Vou tentar.'],
        ],
      },
      {
        ask: 'O rapaz do blog quer me entrevistar. Aceito, se for aqui e se você tocar algo à altura. Um disco que você domina, ou Difícil com 4 estrelas.',
        done: 'Ele anotou tudo. Até o que eu disse sobre o piano. Não devia ter dito sobre o piano.',
        missed: 'Assim não. Não vou falar da minha coleção com isso tocando. Outro dia.',
      },
      {
        lines: [
          ['jorge', 'Saiu a matéria. "Cinco mil discos e uma loja de bairro". Foi a mais lida do mês.'],
          ['afonso', 'Li. Duas vezes. Você errou o ano de uma prensagem.'],
          ['jorge', 'Corrijo hoje.'],
          ['afonso', 'Não precisa. Ficou bom. Minha filha mandou para a família inteira.'],
        ],
      },
    ],
  },
};

export const CHAT_TEXT = {
  'cida-nina': [
    ['nina', 'A senhora dança forró?'],
    ['cida', 'Já dancei muito, minha filha. Hoje eu danço sentada.'],
    ['nina', 'Dá pra dançar sentada?'],
    ['cida', 'Com a música certa, dá até deitada.'],
  ],
  'teo-nina': [
    ['nina', 'Você toca bateria? Me ensina?'],
    ['teo', 'Ah… eu ainda tô aprendendo também.'],
    ['nina', 'Então a gente aprende junto. Eu sou boa em fazer barulho.'],
    ['teo', 'Isso já é metade da bateria, sério.'],
  ],
  'afonso-marina': [
    ['marina', 'Seu Afonso… aquele dia, na cabine. O senhor ouviu, né?'],
    ['afonso', 'Não ouvi nada.'],
    ['marina', 'O senhor bateu o pé no ritmo.'],
    ['afonso', 'Tenho um tique no pé. Antigo. Cante mais alto da próxima vez, para o tique acertar o tempo.'],
  ],
  'bia-teo': [
    ['bia', 'Sua banda tem nome já?'],
    ['teo', 'Ainda não. A gente vota toda semana e dá empate.'],
    ['bia', 'Quando tiver, me avisa. Faço uma festa com banda ao vivo antes do DJ.'],
    ['teo', 'Sério?! Vou falar pro Caio. Ele vai querer o nome "Os Caios".'],
  ],
  'rita-afonso': [
    ['afonso', 'A senhora tocava nos Parafusos Soltos. Tenho o compacto de 94.'],
    ['rita', 'Você tem o compacto? Nem eu tenho o compacto.'],
    ['afonso', 'Lado B arranhado. Alguém tocou demais.'],
    ['rita', 'Fui eu. Na sua casa? Não. Mas foi alguém como eu.'],
  ],
  'jorge-cida': [
    ['jorge', 'A senhora vem todo dia. O que faz uma música ser boa, na sua opinião?'],
    ['cida', 'Ah, meu filho. Quando é tocada com carinho.'],
    ['jorge', 'Só isso?'],
    ['cida', 'Você escreve muito pra quem pergunta tão pouco.'],
  ],
  'cida-afonso': [
    ['cida', 'O senhor que entende: quanto vale um disco velho, desses de sanfona?'],
    ['afonso', 'Depende. De quem era?'],
    ['cida', 'Do meu marido.'],
    ['afonso', 'Então não tem preço, senhora. Guarde bem.'],
  ],
  'nina-bia': [
    ['nina', 'Por que você anda com o fone no pescoço e não no ouvido?'],
    ['bia', 'Pra quando tocar uma música boa eu estar pronta.'],
    ['nina', 'E aqui toca música boa?'],
    ['bia', 'Por isso que ele tá no pescoço e não na bolsa.'],
  ],
  'marina-rita': [
    ['rita', 'Você é a que canta na cabine. Canta pra fora, menina.'],
    ['marina', 'Eu fico com vergonha.'],
    ['rita', 'Eu também ficava. Subia no palco de óculos escuros, à noite, num porão.'],
    ['marina', 'Isso ajudava?'],
    ['rita', 'Não. Mas eu ficava muito bonita.'],
  ],
  'jorge-rita': [
    ['jorge', 'Rita dos Parafusos Soltos. Escrevi sobre vocês em 2003. Uma nota.'],
    ['rita', 'Uma nota? Boa ou ruim?'],
    ['jorge', 'Eu disse que o show era "barulhento e necessário".'],
    ['rita', 'Vou mandar fazer camiseta com isso.'],
  ],
};

/**
 * Reações dos clientes fixos ao que está acontecendo na loja no período da visita: o evento marcado
 * (`event_<id>`) e a promoção no disco tocado (`promo`). Quem não tem reação usa a fala de sempre.
 */
export const REACTIONS = {
  cida: {
    event_listening: 'Que sossego. Dá pra ouvir até o chiado do disco.',
    event_themeNight: 'Tanta gente de noite! Eu vim só espiar.',
    promo: 'Promoção? Vou levar um pra Lurdinha também.',
  },
  nina: {
    event_launch: 'Disco NOVO? Eu sou a primeira a ouvir? Pai, eu sou a primeira!',
    promo: 'Tá mais barato! Pai, agora dá!',
  },
  teo: {
    event_themeNight: 'Noite temática? Isso aqui tá parecendo show de verdade.',
    event_launch: 'Lançamento! Ninguém da escola ouviu esse ainda. Vantagem.',
  },
  bia: {
    event_themeNight: 'Uma noite de uma seção só. É assim que se monta uma pista.',
    event_launch: 'Disco novo é sempre um risco. Gosto disso.',
  },
  marina: {
    event_listening: 'A cabine aberta pra todo mundo… e se alguém me ouvir? Tá. Tudo bem.',
  },
  afonso: {
    event_collectors: 'Conheço metade desses senhores. A outra metade me deve discos.',
    event_listening: 'Isto sim. Ouvir sem pressa, como se deve.',
    promo: 'Desconto? Um disco destes não se remarca. Mas não é da minha conta.',
  },
  rita: {
    event_themeNight: 'Noite temática. Na minha época isso se chamava "sábado".',
    event_collectors: 'Muito chapéu numa sala só.',
  },
  jorge: {
    event_launch: 'Um lançamento numa loja de bairro. Isso dá uma nota.',
    event_collectors: 'Colecionadores. Ninguém escuta, todos opinam. Adoro.',
    event_themeNight: 'Uma noite temática bem feita diz muito sobre uma loja.',
  },
};

/** Fala com o disco lembrado preenchido. */
export const fillStory = (text, songTitle) => text.replaceAll('{disco}', `“${songTitle ?? 'aquele disco'}”`);
