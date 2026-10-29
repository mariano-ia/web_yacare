// Capturas del vestuario con Chrome headless por CDP (sin dependencias; Node 22+ trae WebSocket).
// Uso: node shot.mjs <url> <prefijo-salida> [desktop|mobile] [pasos]
//   pasos: lista separada por comas de: rail, hover, card, custom, stamped, away, filter  (por defecto todos)
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [url, prefix, mode = 'desktop', stepsArg] = process.argv.slice(2);
const STEPS = (stepsArg ?? 'rail,hover,card,custom,stamped,away').split(',');
const PORT = 9333 + Math.floor(Math.random() * 100);
const mobile = mode === 'mobile';
const W = mobile ? 390 : 1440, H = mobile ? 844 : 900;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/chrome-locker-${PORT}`,
  '--no-first-run', '--no-default-browser-check', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist', `--window-size=${W},${H}`, '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required',
  'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kill = () => { try { chrome.kill('SIGKILL'); } catch {} };
process.on('exit', kill);
setTimeout(() => { console.error('timeout general'); kill(); process.exit(2); }, 120000).unref();

let targets;
for (let i = 0; i < 50; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch {}
  await sleep(200);
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const logs = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.consoleAPICalled') logs.push(`[console.${m.params.type}] ${m.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
  else if (m.method === 'Runtime.exceptionThrown') logs.push(`[exception] ${m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text}`);
  else if (m.method === 'Log.entryAdded' && m.params.entry.level !== 'verbose' && m.params.entry.level !== 'info') logs.push(`[${m.params.entry.level}] ${m.params.entry.text} ${m.params.entry.url ?? ''}`);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const i = ++id;
  pending.set(i, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
};
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${prefix}-${name}.png`, Buffer.from(r.data, 'base64'));
  console.log('captura', `${prefix}-${name}.png`);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: mobile ? 2 : 1, mobile });
if (mobile) {
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
}
await send('Page.navigate', { url });
let ready = false;
for (let i = 0; i < 150; i++) {
  await sleep(200);
  try { ready = await evaluate(`document.querySelector('#app')?.dataset.ready === 'true'`); } catch {}
  if (ready) break;
}
console.log('listo:', ready, '· tiempo:', await evaluate('Math.round(performance.now())'), 'ms');
await sleep(800);

const cx = Math.round(W * (mobile ? 0.5 : 0.42)), cy = Math.round(H * 0.5);
for (const step of STEPS) {
  if (step === 'rail') await shot('rail');
  if (step === 'hover' && !mobile) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx, y: cy });
    await sleep(900);
    await shot('hover');
  }
  if (step === 'card') {
    await evaluate(`window.locker.select('home-7')`);
    await sleep(1600);
    await shot('card');
  }
  if (step === 'custom') {
    await evaluate(`document.querySelector('#card-custom').click()`);
    await sleep(1400);
    await shot('custom');
  }
  if (step === 'stamped') {
    await evaluate(`(() => { const n = document.querySelector('#cu-name'); n.value = 'NOCETI'; n.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await sleep(700);
    await evaluate(`window.locker.userYaw = Math.PI`);
    await sleep(1600);
    await shot('stamped');
  }
  if (step === 'away') {
    await evaluate(`(() => { const k = document.querySelector('input[name="kit"][value="away"]'); k.checked = true; k.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await sleep(1200);
    await shot('away');
  }
  if (step === 'luca') {
    await evaluate(`window.locker.select('luca')`);
    await sleep(900);
    await evaluate(`window.locker.userYaw = Math.PI`);
    await sleep(1600);
    await shot('luca');
  }
  if (step === 'filter') {
    await evaluate(`window.locker.select(null); document.querySelector('[data-filter="GK"]').click()`);
    await sleep(1500);
    await shot('filter');
  }
}
console.log(logs.length ? `--- consola (${logs.length}) ---\n${logs.slice(0, 40).join('\n')}` : '--- consola limpia ---');
ws.close();
kill();
process.exit(0);
