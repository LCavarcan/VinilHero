// Falas e capítulos dos clientes fixos (docs/design/clientes-fixos.md). Só texto: as regras e os
// pedidos ficam em src/core/regulars.js.
//
// Nas falas, {ultimo} vira o disco da última vez e {instrumento} o instrumento tocado agora.
// O capítulo 0 é o primeiro encontro.

export const REGULAR_TEXT = {
  cida: {
    name: 'Dona Cida',
    about: '68 anos, aposentada. Mora na rua de trás e vem de manhã, com a sacola da feira.',
    likes: 'Brasil e discos calmos, de manhã',
    asks: {
      taste: ['Põe alguma coisa do Brasil pra mim?', 'Uma música calminha, pra começar o dia?'],
      chapters: [
        'Toca uma daquelas bem bonitas, vai.',
        'Toca com carinho, que hoje eu acordei com saudade.',
        'Hoje eu queria ouvir uma do jeito que o Zé tocava: bem tocada.',
        'Capricha, que eu trouxe uma amiga pra te ouvir.',
        'Toca a música do Zé. Mas toca direito, viu?',
      ],
    },
    needs: { booth: 'Se tivesse um cantinho pra ouvir sossegada, eu ficava mais…' },
    chapters: [
      ['Bom dia, meu bem. Vi a porta aberta e o som lá fora.', 'Faz tempo que essa rua não tinha uma loja de disco.', 'Eu passo aqui de manhã, depois da feira. Se você deixar.'],
      ['Faz tempo que eu não ouvia isso alto assim.', 'O Zé, meu marido, tocava sanfona. Tinha uma caixa cheia de disco lá em casa.', 'Depois que ele foi, eu guardei tudo. Não tive coragem de pôr pra tocar.', 'Mas aqui é diferente, né? Aqui é você que toca.'],
      ['Sabe que eu sonhei com ele essa noite?', 'Ele tocava no forró da praça, todo sábado. Eu ia só pra ver.', 'Levei três sábados pra ter coragem de dançar com ele.'],
      ['Ah, agora sim. Dá pra ouvir de olho fechado.', 'Abri a caixa de discos ontem. Tinha um bilhete dele dentro de uma capa.', 'Não vou te contar o que estava escrito. Mas eu ri sozinha na cozinha.'],
      ['Essa é a Lurdinha, minha vizinha de 40 anos.', '— Cida, você não me falou que aqui tocavam assim!', 'Viu? Agora ela vai vir todo dia me atrapalhar.'],
      ['…', 'Ele errava essa parte. Sempre. E ria.', 'Você não errou nada. Mas eu ouvi ele rindo mesmo assim.', 'Fica com a sanfona dele. Lá em casa ela só junta poeira, e aqui ela ouve música todo dia.'],
    ],
    lines: {
      pleased: 'Ai, que gostoso. Era disso que eu precisava.',
      missed: 'Bonito, mas não era bem o que eu queria hoje.',
      passive: 'Disco é bom, mas eu vim pra te ouvir tocar.',
      better: 'Hoje foi melhor que {ultimo}, hein? Tô vendo.',
      worse: 'Da última vez você tocou {ultimo} tão bem… Dormiu pouco?',
      sameRecord: '{ultimo} de novo? Eu gosto, mas olha que tem outras.',
      otherInstrument: 'Agora {instrumento}? Você toca de tudo, é?',
      chapter: 'Senta aqui um pouquinho, que eu quero te contar uma coisa.',
    },
    perk: { name: 'A sanfona do Zé', effect: 'Na parede da loja. Os discos da seção Brasil vendem 10% mais.' },
  },

  nina: {
    name: 'Nina',
    about: '9 anos. Vem à tarde com o pai, que fica olhando os discos de rock enquanto ela grita.',
    likes: 'discos rápidos e "sem errar nenhuma"',
    asks: {
      taste: ['Toca uma bem rápida!', 'Uma curtinha, que meu pai já quer ir embora!', 'Toca qualquer uma! Mas toca!'],
      chapters: [
        'Toca uma rápida e não erra muito, tá?',
        'Meu pai disse que ninguém toca 3 estrelas. Mostra pra ele!',
        'Quero ver você tocar um montão de notas sem parar!',
        'Hoje é meu aniversário. Toca a mais rápida que você conseguir!',
        'Toca sem errar NENHUMA. Nenhuma, nenhuma.',
      ],
    },
    chapters: [
      ['Pai, olha! Tem uma loja de disco DE VERDADE!', 'Você que toca? Igual no videogame?', 'Eu vou voltar amanhã. Pai, a gente vai voltar amanhã.'],
      ['UAU. Pai, você viu? Você viu?', 'Eu vou ser assim quando crescer.', 'Ou astronauta. Ainda tô decidindo.'],
      ['Contei pra minha sala inteira da loja.', 'A professora perguntou o que eu quero ser e eu falei "dona de loja de disco".', 'Ela riu. Mas não foi rindo de mim. Acho.'],
      ['Eu contei. Foram muitas notas. Tipo, MUITAS.', 'Fiz um desenho da loja. Você tá nele, no meio, com a guitarra.', 'Não ficou muito parecido. Mas o cachorro ficou bom.'],
      ['Eu fiz 10 anos e ganhei um tecladinho!', 'Meu pai falou que se eu treinar todo dia, um dia toco aqui.', 'Você deixa? Quando eu for grande?'],
      ['…', 'NENHUMA! Você não errou NENHUMA!', 'Toma, é o cartaz que eu fiz. Pode pôr na vitrine.', 'Embaixo eu escrevi "a melhor loja do mundo". Com "u" no final, eu sei. Meu pai já falou.'],
    ],
    lines: {
      pleased: 'De novo! De novo!',
      missed: 'Legal… mas eu queria outra.',
      passive: 'Ué, você não vai tocar? Só o disco?',
      better: 'Hoje foi MUITO melhor que {ultimo}!',
      worse: 'Em {ultimo} você tocou melhor. Eu lembro.',
      sameRecord: 'Essa de novo! Eu adoro essa!',
      otherInstrument: 'Você toca {instrumento} também?! Que demais!',
      chapter: 'Pai, espera, eu tenho que falar uma coisa!',
    },
    perk: { name: 'O cartaz da Nina', effect: 'Na vitrine. Um curioso a mais em toda apresentação.' },
  },

  teo: {
    name: 'Téo',
    about: '16 anos. Baterista de garagem, baquetas no bolso de trás, vem à tarde depois da escola.',
    likes: 'bateria bem tocada, discos pesados',
    asks: {
      taste: ['Põe alguma coisa com bateria, vai.', 'Tem algo pesado aí?'],
      chapters: [
        'Toca na bateria. Quero ver se é verdade.',
        'Bateria, 3 estrelas. Se for pesada, melhor ainda.',
        'Preciso de uma música pra banda ensaiar. Toca uma bateria bem limpa.',
        'Tô quase desistindo. Toca uma bateria sem perder o ritmo, pra eu lembrar por que comecei.',
        'Hoje é o show. Toca comigo de cabeça: bateria, sem errar nada.',
      ],
    },
    chapters: [
      ['E aí. Ouvi a bateria lá da esquina.', 'Eu toco também. Quer dizer, em balde. E no sofá da minha avó.', 'Volto pra ver se você toca de verdade.'],
      ['Você toca? Sério? Tá. Respeito.', 'Comprei minha primeira baqueta de verdade com o dinheiro do lanche.', 'Minha mãe ainda não sabe. Não conta.'],
      ['Mano, isso foi pesado.', 'Montei uma banda! Eu, o Caio na guitarra e a prima dele no baixo.', 'A gente ainda não tem nome. Nem música. Mas tem banda.'],
      ['Briguei com o Caio. Ele acha que eu acelero tudo.', 'Talvez eu acelere tudo.', 'Mas ouvindo você agora… dá pra ser rápido sem correr, né? Vou falar com ele.'],
      ['Fizemos as pazes! E arrumamos um show. No aniversário da prima.', 'São 30 pessoas. Vinte e nove são da família dela.', 'Tô com mais medo que no dia da prova de física.'],
      ['…', 'NADA. Você não errou nada.', 'O show foi ontem. Deu tudo errado no começo e eu lembrei de você tocando. Aí deu certo.', 'Escuta: se um dia você fizer show aqui, eu toco junto. De graça. Bom, por um disco.'],
    ],
    lines: {
      pleased: 'Isso! Isso aí!',
      missed: 'Hmm. Faltou pegada.',
      passive: 'Pô, só o disco? Eu queria ver você tocar.',
      better: 'Tá melhor que em {ultimo}. Treinou, né?',
      worse: 'Em {ultimo} tava mais firme. Relaxa o pulso.',
      sameRecord: '{ultimo} de novo? Tô decorando a bateria já.',
      otherInstrument: '{instrumento}? Beleza, mas a bateria é que manda.',
      chapter: 'Ô, tem um minuto? Aconteceu um negócio.',
    },
    perk: { name: 'O Téo na banda', effect: 'O show da banda conta uma pessoa a mais (sozinha, vale como dupla).' },
  },

  bia: {
    name: 'Bia',
    about: 'DJ de festa de amigos. Chega à noite, de fone no pescoço, e mexe a cabeça antes de entrar.',
    likes: 'Eletrônica, discos rápidos e curtos',
    asks: {
      taste: ['Tem alguma coisa eletrônica?', 'Bota algo rápido, que hoje eu tô elétrica.'],
      chapters: [
        'Toca uma rápida, que eu quero sentir a pista.',
        'Uma eletrônica bem tocada, pra eu ouvir as camadas.',
        'Curta e certeira, 3 estrelas. Como um bom drop.',
        'Uma rápida, bem tocada, do começo ao fim. Tô escolhendo o set.',
        'É hoje. Toca a mais rápida, a mais limpa. Me dá coragem.',
      ],
    },
    chapters: [
      ['Opa. Essa loja é nova? Que som bom aqui dentro.', 'Eu discoteco em festa de amigo. Às vezes de amigo de amigo.', 'Vou passar mais vezes. Quero ver o que você toca à noite.'],
      ['Essa batida! Posso pegar emprestado pra uma festa?', 'Brincadeira. Quer dizer, mais ou menos.', 'Um dia eu quero tocar numa festa de verdade. Com gente que eu não conheço.'],
      ['Me chamaram pra tocar no Galpão. Festa grande.', 'Eu disse que ia pensar. Faz uma semana que eu tô pensando.', 'E se ninguém dançar?'],
      ['Ninguém nunca sabe se vai dar certo, né?', 'Você também não sabe, quando escolhe o disco.', 'Mas você escolhe mesmo assim.'],
      ['Montei o set. Tem uma música sua nele.', 'Bom, não sua. Mas do jeito que você toca.', 'Falei que sim pro Galpão. Vai ser sábado.'],
      ['…', 'Isso. É ISSO.', 'Sábado a pista lotou. Eu tremi o tempo todo e ninguém percebeu.', 'Agora quero fazer festa aqui também. Uma noite por mês, discos rápidos, loja cheia. Topa?'],
    ],
    lines: {
      pleased: 'Isso tem groove.',
      missed: 'Legal, mas não me pegou.',
      passive: 'Só o disco? Cadê o ao vivo?',
      better: 'Bem mais redondo que em {ultimo}.',
      worse: 'Em {ultimo} você tava mais solto.',
      sameRecord: '{ultimo} de novo? DJ que repete perde a pista, hein.',
      otherInstrument: 'Agora {instrumento}? Gosto de quem muda o set.',
      chapter: 'Ei, posso te contar uma coisa? Não ri.',
    },
    perk: { name: 'Festa da Bia', effect: 'Evento novo: uma noite em que os discos rápidos atraem 40% mais gente.' },
  },

  marina: {
    name: 'Marina',
    about: 'Canta no chuveiro e em mais lugar nenhum. Apareceu à noite, quando a loja ganhou a cabine.',
    likes: 'voz em discos cantáveis',
    asks: {
      taste: ['Você canta uma? Eu só escuto, juro.', 'Tem alguma que dá pra cantar junto?'],
      chapters: [
        'Canta uma pra mim? Eu fico aqui no cantinho.',
        'Canta de novo, mas com vontade. Eu vou tentar baixinho junto.',
        'Hoje eu queria ouvir uma voz bem afinada. Pra aprender.',
        'Canta comigo? Eu vou de verdade dessa vez.',
        'É o aniversário da minha mãe. Canta a mais bonita que você conseguir.',
      ],
    },
    chapters: [
      ['Oi. Desculpa, eu só vim olhar a cabine.', 'Eu canto um pouco. No chuveiro. Com a porta fechada. E a janela.', 'Tchau. Quer dizer, até logo.'],
      ['Nossa. Você canta assim, na frente de todo mundo?', 'Eu travo. Até no "parabéns" do trabalho eu só mexo a boca.', 'Mas na cabine ninguém vê, né?'],
      ['Eu cantei baixinho na cabine. Ninguém ouviu.', 'Quer dizer, o Seu Afonso ouviu, mas ele fingiu que não.', 'Foi a primeira vez que eu cantei com alguém por perto.'],
      ['Comecei a fazer aula de canto. Não conta pra ninguém.', 'A professora falou que eu tenho voz. Eu chorei no ônibus.', 'Ela também falou que eu respiro errado. Eu chorei de novo.'],
      ['Cantei! Alto! Na cabine com a porta aberta!', 'Duas pessoas pararam pra ouvir. Uma bateu palma.', 'Era a Dona Cida. Mas conta mesmo assim.'],
      ['…', 'Eu vou cantar no aniversário da minha mãe. Na frente da família toda.', 'Ela vai chorar. Eu vou chorar. Meu tio vai filmar torto.', 'Obrigada. Pode chamar mais noites de karaokê, que eu venho em todas.'],
    ],
    lines: {
      pleased: 'Que lindo… arrepiei.',
      missed: 'Bonito, mas eu queria ouvir uma voz.',
      passive: 'Ah, é só o disco hoje? Tudo bem.',
      better: 'Hoje foi mais bonito que {ultimo}.',
      worse: 'Em {ultimo} sua voz tava mais solta.',
      sameRecord: '{ultimo} de novo… eu já sei a letra inteira.',
      otherInstrument: 'Hoje {instrumento}? Mas e a voz?',
      chapter: 'Posso falar uma coisa? É meio bobo.',
    },
    perk: { name: 'Marina no karaokê', effect: 'A Noite de karaokê sai com o dobro da chance.' },
  },

  afonso: {
    name: 'Seu Afonso',
    about: 'Colecionador de cinco mil discos. Chega de manhã, de chapéu, e confere cada capa com lupa.',
    likes: 'Difícil e Expert, discos dominados',
    asks: {
      taste: ['Algo em Difícil ou Expert, se faz favor.', 'Um dos seus discos dourados, por gentileza.'],
      chapters: [
        'Um disco difícil, 3 estrelas ao menos. Quero ver do que é feito.',
        'Difícil ou Expert, 4 estrelas. Sem pressa.',
        'Mostre um disco que você domina. Ou 4 estrelas em Expert.',
        'Expert, 4 estrelas. Os grandes discos pedem isso.',
        'Este disco aqui. Ninguém o tocou direito ainda. Expert, 5 estrelas.',
      ],
    },
    needs: { window: 'Uma loja séria precisa de uma vitrine à altura. A segunda, digo.' },
    chapters: [
      ['Bom dia. Afonso. Coleciono discos há 50 anos.', 'Não costumo entrar em lojas novas. Elas não duram.', 'Veremos se esta dura.'],
      ['Hmm. Razoável. Mais que razoável.', 'Tenho cinco mil discos em casa. Minha filha diz que é uma doença.', 'Ela não está errada.'],
      ['Isto sim é tocar.', 'Minha filha quer que eu venda a coleção. Diz que o apartamento não aguenta.', 'Não vou vender para qualquer um. Disco precisa de quem toque.'],
      ['A vitrine nova ficou digna. Olhe aquela capa, como brilha.', 'Sabe por que eu coleciono? Não é pelos discos.', 'É porque cada um me lembra de onde eu estava quando ouvi.'],
      ['Expert. Muito bem.', 'Eu tocava piano. Parei aos 30, achei que não era bom o bastante.', 'Ouvindo você, acho que era bom o bastante, sim. Só não sabia.'],
      ['…', 'Nunca ninguém tinha tocado esse disco desse jeito.', 'Decidi. A coleção fica aqui, na sua vitrine. Não é para vender. É para ser vista.', 'Eu passo para conferir. De manhã. Com lupa.'],
    ],
    lines: {
      pleased: 'Aprovado.',
      missed: 'Não era isso que eu procurava.',
      passive: 'Pôr o disco qualquer um põe.',
      better: 'Superior ao que ouvi em {ultimo}.',
      worse: 'Em {ultimo} houve mais cuidado.',
      sameRecord: '{ultimo} outra vez. Repetição é para ensaio.',
      otherInstrument: '{instrumento}. Versátil. Anoto isso.',
      chapter: 'Tem um momento? Gostaria de lhe dizer algo.',
    },
    perk: { name: 'A coleção do Afonso', effect: 'Os discos dominados vendem sozinhos com 35% de chance (era 25%).' },
  },

  rita: {
    name: 'Rita',
    about: 'Guitarrista de uma banda de rock dos anos 90. Apareceu à tarde, quando viu o palco pela janela.',
    likes: 'guitarra e baixo, Rock e Metal',
    asks: {
      taste: ['Toca uma guitarra pra mim? Ou um baixo, tanto faz.', 'Tem rock nessa loja?'],
      chapters: [
        'Guitarra ou baixo, com vontade.',
        'Um rock de verdade, na guitarra ou no baixo, 3 estrelas.',
        'Guitarra bem limpa. Quero ouvir cada nota.',
        'Junta uma banda e sobe nesse palco. Quero ver um show.',
        'Último pedido de velha roqueira: guitarra ou baixo, sem dó. O melhor que você tiver.',
      ],
    },
    chapters: [
      ['Isso é um palco? Numa loja de disco?', 'Eu tocava guitarra numa banda. Os Parafusos Soltos. Ninguém lembra.', 'Vou voltar pra ver alguém usar esse palco direito.'],
      ['Olha só, ainda existe gente que toca.', 'A gente abriu show pra uma banda famosa em 1997. Depois acabou.', 'Brigas de banda. Aquela coisa.'],
      ['Esse riff! Eu tocava esse riff no ensaio pra irritar o baterista.', 'Liguei pro baixista ontem. Faz 20 anos que a gente não se fala.', 'Ele atendeu no primeiro toque.'],
      ['Agora sim. Isso é guitarra.', 'O baixista topou. O vocalista mora em Portugal, vai vir de férias.', 'Falta o baterista. Ele é teimoso. Sempre foi.'],
      ['Isso! ISSO! Uma banda no palco!', 'Vi vocês e lembrei da gente. A gente também era bom assim, quando não brigava.', 'O baterista topou. Disse que só se for aqui, nesse palco.'],
      ['…', 'Pronto. Agora eu sei que ainda dá.', 'O reencontro vai ser aqui. Uma noite só. Os Parafusos Soltos de volta.', 'Toma esse pôster. Autografado por todo mundo, até pelo teimoso.'],
    ],
    lines: {
      pleased: 'É isso aí. Rock.',
      missed: 'Faltou distorção na alma.',
      passive: 'Pôr disco é fácil. Quero ver tocar.',
      better: 'Bem melhor que em {ultimo}. Tá pegando o jeito.',
      worse: 'Em {ultimo} tava mais afiado.',
      sameRecord: '{ultimo} de novo? Tá parecendo meu antigo baterista.',
      otherInstrument: '{instrumento}? Respeito. Mas cadê a guitarra?',
      chapter: 'Ô, senta aí. Tenho uma história.',
    },
    perk: { name: 'O pôster autografado', effect: 'Os Parafusos Soltos na parede. Mais fãs de Rock e Metal entram na loja.' },
  },

  jorge: {
    name: 'Jorge',
    about: 'Escreve um blog de música que tem mais leitores do que parece. Não avisa quando vem.',
    likes: 'nada, em princípio. Quer ser surpreendido.',
    asks: {
      taste: ['Me mostre por que eu deveria escrever sobre esta loja.'],
      chapters: [
        'Quatro estrelas. É o mínimo para eu tirar o caderno do bolso.',
        'Quero um desempenho que eu possa descrever sem adjetivos educados.',
        'Sem erro. Nenhum. Aí eu escrevo.',
        'Difícil ou Expert, 4 estrelas. E um café, se tiver.',
        'Me impressione. Difícil ou Expert, sem uma nota errada.',
      ],
    },
    needs: { cafe: 'Uma loja sem café não merece um segundo parágrafo.' },
    chapters: [
      ['Jorge. Escrevo sobre música.', 'Já escrevi sobre 214 lojas. Fecharam 190.', 'Não é culpa minha. Na maioria dos casos.'],
      ['Hmm.', 'Anotei uma frase. Não vou dizer qual.', 'Pode ser boa. Pode ser ruim. Isso é o jornalismo.'],
      ['Isso não foi ruim.', 'Vindo de mim, você pode emoldurar.', 'Meu editor disse que eu "nunca gosto de nada". Ele não esteve aqui.'],
      ['…Tá. Isso foi bom. Sem ressalvas.', 'Não sei o que fazer com isso. Faz anos que eu não escrevo sem ressalvas.', 'Vou precisar pensar.'],
      ['O café é bom. A música é melhor.', 'Comecei a escrever sobre música porque eu não sabia tocar.', 'Achava que se não dava para fazer, dava para julgar. Estou revendo essa ideia.'],
      ['…', 'Saiu ontem. "A loja de disco onde as pessoas ainda tocam." Primeira página do blog.', 'Três mil leitores. Alguns vão vir aqui. Desculpe antecipadamente.', 'Pendure isso na parede. É a única resenha que eu emoldurei.'],
    ],
    lines: {
      pleased: 'Anotado.',
      missed: 'Não foi dessa vez.',
      passive: 'Só o disco. Previsível.',
      better: 'Melhor que {ultimo}. Registrado.',
      worse: '{ultimo} foi superior. Também registrado.',
      sameRecord: '{ultimo} outra vez. Vou ter que escrever "repetitivo".',
      otherInstrument: '{instrumento}. Interessante.',
      chapter: 'Tem um minuto? Para uma declaração.',
    },
    perk: { name: 'A resenha', effect: '+5 de reputação na hora e a resenha emoldurada na parede.' },
  },
};

/** Pista de quando um personagem ainda não apareceu vai chegar. */
export function unlockHint(unlock) {
  if (unlock.reputation) return `aparece quando a loja tiver reputação ${unlock.reputation}`;
  if (unlock.upgrade === 'booth') return 'aparece quando a loja tiver uma cabine de audição';
  if (unlock.upgrade === 'stage') return 'aparece quando a loja tiver um palco';
  return 'aparece logo';
}

/** Fala com os espaços preenchidos. */
export function fill(text, { lastSongTitle, instrument } = {}, instrumentNames = {}) {
  return text
    .replaceAll('{ultimo}', `“${lastSongTitle ?? 'aquele disco'}”`)
    .replaceAll('{instrumento}', (instrumentNames[instrument] ?? 'outro instrumento').toLowerCase());
}
