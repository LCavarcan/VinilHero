// Efeitos da cena, sintetizados com WebAudio (sem arquivos): sininho da porta, caixa registradora e
// aplauso. Ligados ou desligados pela jogadora (guardado na janela).

const KEY = 'vinilhero.sound';
const VOLUME = 0.25;

let ctx = null;
let lastDoor = 0;

export const soundOn = () => localStorage.getItem(KEY) !== 'off';
export const setSoundOn = (on) => localStorage.setItem(KEY, on ? 'on' : 'off');

function audio() {
  if (!soundOn()) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Tom curto com ataque rápido e decaimento. */
function tone(a, freq, start, duration, gain, type = 'sine') {
  const osc = a.createOscillator();
  const env = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(gain * VOLUME, start + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(env).connect(a.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function noise(a, start, duration, gain, { frequency = 2000, q = 0.8 } = {}) {
  const length = Math.ceil(a.sampleRate * duration);
  const buffer = a.createBuffer(1, length, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const env = a.createGain();
  env.gain.setValueAtTime(gain * VOLUME, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter).connect(env).connect(a.destination);
  src.start(start);
}

/** Sininho da porta (no máximo um a cada 0,25 s, para a fila não virar barulho). */
export function doorBell() {
  const a = audio();
  if (!a || a.currentTime - lastDoor < 0.25) return;
  lastDoor = a.currentTime;
  tone(a, 1318, a.currentTime, 0.25, 0.25);
  tone(a, 988, a.currentTime + 0.09, 0.35, 0.2);
}

/** "Ka-ching": o clique da gaveta e o sino. */
export function cashRegister() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  noise(a, t, 0.05, 0.5, { frequency: 3000, q: 2 });
  tone(a, 2093, t + 0.05, 0.4, 0.3, 'triangle');
  tone(a, 2637, t + 0.08, 0.5, 0.2, 'triangle');
}

/** Aplauso: muitas palminhas de ruído espalhadas em ~1,8 s. */
export function applause() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  for (let i = 0; i < 70; i++) {
    const start = t + Math.random() * 1.6;
    noise(a, start, 0.03 + Math.random() * 0.03, 0.25 + Math.random() * 0.3, { frequency: 1200 + Math.random() * 1800, q: 1.2 });
  }
}
