/* =========================================================================
   Engine lesson controller:
   1. Instant interactive 2D four-stroke SVG cutaway (0..720 deg, zero WebGL).
   2. Click-to-load Inkworks 3D figure iframe with WebGL pre-check,
      IntersectionObserver off-screen rAF suspend/resume, and runtime fallback.
   ========================================================================= */

const PHASES = [
  {
    num: '01',
    name: 'Intake',
    nick: '"suck" · 0° to 180°',
    color: '#2f7de1',
    desc: 'The piston moves down while the intake valve opens. The expanding space drops pressure inside the cylinder and draws fresh air and petrol mixture in.',
  },
  {
    num: '02',
    name: 'Compression',
    nick: '"squeeze" · 180° to 360°',
    color: '#d98e04',
    desc: 'Both valves close and the rising piston squeezes the trapped air-fuel mixture into a small space at the top of the cylinder so it burns fast and hard.',
  },
  {
    num: '03',
    name: 'Power',
    nick: '"bang" · 360° to 540°',
    color: '#e5482f',
    desc: 'Near the top, the spark plug ignites the compressed charge. Rapidly rising pressure drives the piston down and spins the crankshaft. This is the only stroke that makes work.',
  },
  {
    num: '04',
    name: 'Exhaust',
    nick: '"blow" · 540° to 720°',
    color: '#7b8494',
    desc: 'The exhaust valve opens and the rising piston sweeps the spent combustion gas out into the exhaust manifold so the next intake stroke can begin.',
  },
];

const STROKE_MID = [60, 270, 420, 630];
const D2R = Math.PI / 180;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 2D geometry (SVG coordinates)
const CRANK_X = 180;
const CRANK_Y = 272;
const R = 36;
const L = 114;
const CHAMBER_TOP = 78;
const CROWN_OFFSET = 28; // pin to crown

// DOM refs
const gasChamber = document.getElementById('gasChamber');
const sparkFlash = document.getElementById('sparkFlash');
const intakeValve = document.getElementById('intakeValve');
const exhaustValve = document.getElementById('exhaustValve');
const conRod = document.getElementById('conRod');
const conRodInk = document.getElementById('conRodInk');
const pistonGroup = document.getElementById('pistonGroup');
const crankWeb = document.getElementById('crankWeb');
const crankMark = document.getElementById('crankMark');
const crankPin = document.getElementById('crankPin');

const p2dNum = document.getElementById('p2dNum');
const p2dName = document.getElementById('p2dName');
const p2dNick = document.getElementById('p2dNick');
const p2dDesc = document.getElementById('p2dDesc');
const t2dAngle = document.getElementById('t2dAngle');
const t2dTurn = document.getElementById('t2dTurn');
const t2dIn = document.getElementById('t2dIn');
const t2dEx = document.getElementById('t2dEx');
const crankSlider = document.getElementById('crankSlider');
const sliderDeg = document.getElementById('sliderDeg');
const play2dBtn = document.getElementById('play2dBtn');
const prevStrokeBtn = document.getElementById('prevStrokeBtn');
const nextStrokeBtn = document.getElementById('nextStrokeBtn');
const reset2dBtn = document.getElementById('reset2dBtn');
const phasePills = [...document.querySelectorAll('.phase-pill[data-phase]')];

const toggle3dBtn = document.getElementById('toggle3dBtn');
const viewerStatus = document.getElementById('viewerStatus');
const webglNotice = document.getElementById('webglNotice');
const embedSection = document.getElementById('embedSection');
const embedFrameWrap = document.getElementById('embedFrameWrap');
const embedSyncText = document.getElementById('embedSyncText');
const embedPowerState = document.getElementById('embedPowerState');
const fallback2dSection = document.getElementById('fallback2dSection');

let theta = 60;
let playing2d = false;
let raf2d = null;
let lastTs = 0;

function phaseIndex(deg) {
  const norm = ((deg % 720) + 720) % 720;
  return Math.min(3, Math.floor(norm / 180));
}

function valveLift(deg, start, end) {
  if (deg < start || deg > end) return 0;
  const u = (deg - start) / (end - start);
  return Math.sin(Math.PI * u) * 14;
}

function render2d(deg) {
  const norm = ((deg % 720) + 720) % 720;
  const idx = phaseIndex(norm);
  const p = PHASES[idx];

  const a = norm * D2R;
  const pinX = CRANK_X + R * Math.sin(a);
  const pinY = CRANK_Y - R * Math.cos(a);
  const wristY = pinY - Math.sqrt(Math.max(1, L * L - (pinX - CRANK_X) ** 2));
  const crownY = wristY - CROWN_OFFSET;

  // Piston, rod & crank
  pistonGroup.setAttribute('transform', `translate(0, ${(wristY - 158).toFixed(1)})`);
  conRod.setAttribute('x1', String(CRANK_X));
  conRod.setAttribute('y1', wristY.toFixed(1));
  conRod.setAttribute('x2', pinX.toFixed(1));
  conRod.setAttribute('y2', pinY.toFixed(1));
  conRodInk.setAttribute('x1', String(CRANK_X));
  conRodInk.setAttribute('y1', wristY.toFixed(1));
  conRodInk.setAttribute('x2', pinX.toFixed(1));
  conRodInk.setAttribute('y2', pinY.toFixed(1));
  crankWeb.setAttribute('x2', pinX.toFixed(1));
  crankWeb.setAttribute('y2', pinY.toFixed(1));
  crankMark.setAttribute('x2', pinX.toFixed(1));
  crankMark.setAttribute('y2', pinY.toFixed(1));
  crankPin.setAttribute('cx', pinX.toFixed(1));
  crankPin.setAttribute('cy', pinY.toFixed(1));

  // Valves
  const inLift = valveLift(norm, 0, 180);
  const exLift = valveLift(norm, 540, 720);
  intakeValve.setAttribute('transform', `translate(0, ${inLift.toFixed(1)})`);
  exhaustValve.setAttribute('transform', `translate(0, ${exLift.toFixed(1)})`);

  // Gas volume & colour
  const chamberH = Math.max(8, crownY - CHAMBER_TOP);
  gasChamber.setAttribute('height', chamberH.toFixed(1));
  gasChamber.setAttribute('fill', p.color);
  const opacity = idx === 1 ? 0.25 + 0.35 * ((norm - 180) / 180) : idx === 2 ? 0.55 - 0.25 * ((norm - 360) / 180) : 0.32;
  gasChamber.setAttribute('fill-opacity', opacity.toFixed(2));

  // Spark near TDC at start of Power stroke (345..385 deg)
  const sparkOn = norm >= 345 && norm <= 385;
  sparkFlash.setAttribute('opacity', sparkOn ? '1' : '0');

  // Text & readouts
  p2dNum.textContent = p.num;
  p2dNum.style.setProperty('--phase-color', p.color);
  p2dName.textContent = p.name;
  p2dNick.textContent = p.nick;
  p2dDesc.textContent = p.desc;

  const degRound = Math.round(norm);
  const turn = norm < 360 ? 1 : 2;
  t2dAngle.textContent = `${degRound}° / 720°`;
  t2dTurn.textContent = `Turn ${turn} of 2`;
  t2dIn.textContent = inLift > 1 ? 'Open' : 'Closed';
  t2dEx.textContent = exLift > 1 ? 'Open' : 'Closed';

  crankSlider.value = String(degRound);
  sliderDeg.textContent = `${degRound}° (Turn ${turn})`;

  phasePills.forEach((btn) => {
    btn.setAttribute('aria-pressed', String(Number(btn.dataset.phase) === idx));
  });
}

function setPlay2d(next) {
  playing2d = next;
  play2dBtn.setAttribute('aria-pressed', String(playing2d));
  play2dBtn.textContent = playing2d ? 'Pause' : 'Play';
  if (playing2d && raf2d === null) {
    lastTs = performance.now();
    raf2d = requestAnimationFrame(tick2d);
  } else if (!playing2d && raf2d !== null) {
    cancelAnimationFrame(raf2d);
    raf2d = null;
  }
}

function tick2d(ts) {
  raf2d = null;
  if (!playing2d) return;
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs = ts;
  theta = (theta + dt * 95) % 720;
  render2d(theta);
  raf2d = requestAnimationFrame(tick2d);
}

play2dBtn.addEventListener('click', () => setPlay2d(!playing2d));

prevStrokeBtn.addEventListener('click', () => {
  setPlay2d(false);
  const idx = (phaseIndex(theta) + 3) % 4;
  theta = STROKE_MID[idx];
  render2d(theta);
});

nextStrokeBtn.addEventListener('click', () => {
  setPlay2d(false);
  const idx = (phaseIndex(theta) + 1) % 4;
  theta = STROKE_MID[idx];
  render2d(theta);
});

reset2dBtn.addEventListener('click', () => {
  setPlay2d(false);
  theta = STROKE_MID[0];
  render2d(theta);
});

phasePills.forEach((btn) => {
  btn.addEventListener('click', () => {
    setPlay2d(false);
    theta = STROKE_MID[Number(btn.dataset.phase)] ?? 60;
    render2d(theta);
  });
});

crankSlider.addEventListener('input', () => {
  setPlay2d(false);
  theta = Number(crankSlider.value);
  render2d(theta);
});

render2d(theta);

/* =========================================================================
   Click-to-load Inkworks 3D embed + WebGL check + IntersectionObserver pause
   ========================================================================= */
let activeIframe = null;
let embedObserver = null;
let is3dOpen = false;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
    return Boolean(ctx);
  } catch {
    return false;
  }
}

function showWebGLFallbackMessage(reason) {
  webglNotice.hidden = false;
  webglNotice.innerHTML = `<strong>WebGL unavailable:</strong> ${reason} The interactive 2D four-stroke cutaway remains active below so you can still step and scrub all 720 degrees.`;
  viewerStatus.innerHTML = 'Mode: <strong>2D four-stroke cutaway</strong> (WebGL unavailable fallback)';
  close3dEmbed();
}

function postToEmbed(msg) {
  if (activeIframe && activeIframe.contentWindow) {
    activeIframe.contentWindow.postMessage(msg, window.location.origin);
  }
}

function close3dEmbed() {
  is3dOpen = false;
  if (embedObserver) {
    embedObserver.disconnect();
    embedObserver = null;
  }
  if (activeIframe) {
    activeIframe.remove();
    activeIframe = null;
  }
  embedSection.hidden = true;
  fallback2dSection.hidden = false;
  toggle3dBtn.textContent = 'Load interactive 3D engine';
  toggle3dBtn.setAttribute('aria-pressed', 'false');
}

function open3dEmbed() {
  setPlay2d(false);
  webglNotice.hidden = true;

  if (!hasWebGL()) {
    showWebGLFallbackMessage('This browser has WebGL disabled or unsupported.');
    return;
  }

  is3dOpen = true;
  fallback2dSection.hidden = true;
  embedSection.hidden = false;
  toggle3dBtn.textContent = 'Switch back to 2D cutaway';
  toggle3dBtn.setAttribute('aria-pressed', 'true');
  viewerStatus.innerHTML = 'Mode: <strong>Inkworks 3D inline-4 figure</strong> (auto-pauses off-screen)';
  embedPowerState.textContent = reduceMotion ? 'Reduced motion · paused' : 'Loop active';

  const iframe = document.createElement('iframe');
  iframe.src = '../inkworks/index.html?m=engine&layout=figure';
  iframe.title = 'Interactive 3D four-cylinder petrol engine figure (Inkworks)';
  iframe.loading = 'eager';
  embedFrameWrap.innerHTML = '';
  embedFrameWrap.appendChild(iframe);
  activeIframe = iframe;

  if ('IntersectionObserver' in window) {
    embedObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          postToEmbed({ type: 'inkworks:resume' });
          embedPowerState.textContent = reduceMotion ? 'Visible · reduced motion' : 'Visible · loop active';
        } else {
          postToEmbed({ type: 'inkworks:suspend' });
          embedPowerState.textContent = 'Off-screen · loop suspended';
        }
      },
      { threshold: 0.05 }
    );
    embedObserver.observe(embedFrameWrap);
  }
}

window.addEventListener('message', (e) => {
  if (e.origin !== window.location.origin || !e.data || typeof e.data !== 'object') return;
  if (e.data.type === 'inkworks:webgl-error') {
    showWebGLFallbackMessage('The 3D context could not be initialized.');
  } else if (e.data.type === 'inkworks:state') {
    const statusWord = e.data.suspended ? 'suspended off-screen' : e.data.playing ? 'running' : 'paused';
    embedSyncText.textContent = `Cylinder ${e.data.focus + 1} · ${e.data.phaseName} ("${e.data.phaseNick}") · ${statusWord}`;
    embedPowerState.textContent = e.data.suspended ? 'Off-screen · loop suspended' : e.data.playing ? 'Visible · loop active' : 'Visible · paused';
  }
});

toggle3dBtn.addEventListener('click', () => {
  if (is3dOpen) {
    close3dEmbed();
    viewerStatus.innerHTML = 'Mode: <strong>2D four-stroke cutaway</strong> (instant, works without WebGL)';
  } else {
    open3dEmbed();
  }
});

// Pause 2D animation if page tab becomes hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    setPlay2d(false);
    if (is3dOpen) postToEmbed({ type: 'inkworks:suspend' });
  }
});
