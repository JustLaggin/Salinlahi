function playOscillatorBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    osc.start(t0);
    osc.stop(t0 + 0.2);
    setTimeout(() => ctx.close().catch(() => {}), 400);
  } catch {
    /* ignore */
  }
}

/** Short success tone; tries optional /beep.mp3 then Web Audio fallback. */
export function playSuccessBeep() {
  try {
    const audio = new Audio("/beep.mp3");
    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => playOscillatorBeep());
    }
  } catch {
    playOscillatorBeep();
  }
}
