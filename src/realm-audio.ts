export class Atmosphere {
  crackle?: GainNode;
  ctx?: AudioContext;
  gain?: GainNode;
  on = false;
  async toggle() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      const c = this.ctx;
      this.gain = c.createGain();
      this.gain.gain.value = 0;
      this.gain.connect(c.destination);
      const buf = c.createBuffer(1, c.sampleRate * 4, c.sampleRate),
        d = buf.getChannelData(0);
      let y = 0;
      for (let i = 0; i < d.length; i++) {
        y = (y + Math.random() * 0.06 - 0.03) / 1.025;
        d[i] = y;
      }
      const wind = c.createBufferSource();
      wind.buffer = buf;
      wind.loop = true;
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 780;
      wind.connect(f).connect(this.gain);
      wind.start();
      const crackle = c.createBufferSource(),
        pop = c.createBuffer(1, c.sampleRate * 3, c.sampleRate),
        pd = pop.getChannelData(0);
      let env = 0;
      for (let i = 0; i < pd.length; i++) {
        if (Math.random() < 0.0008) env = Math.random();
        env *= 0.975;
        pd[i] = (Math.random() * 2 - 1) * env;
      }
      crackle.buffer = pop;
      crackle.loop = true;
      this.crackle = c.createGain();
      this.crackle.gain.value = 0.1;
      crackle.connect(this.crackle).connect(this.gain);
      crackle.start();
    }
    await this.ctx.resume();
    this.on = !this.on;
    this.gain!.gain.setTargetAtTime(
      this.on ? 0.42 : 0,
      this.ctx.currentTime,
      0.2,
    );
    return this.on;
  }
  pulse(strength: number) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(strength > 1 ? 83 : 168, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(29, c.currentTime + 1.2);
    g.gain.setValueAtTime(0.22 * strength, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.6);
    o.connect(g).connect(this.gain!);
    o.start();
    o.stop(c.currentTime + 1.7);
  }
}
