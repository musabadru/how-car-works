/* =========================================================================
   Driveline Lesson Simulator:
   1. Direct Shift-CVT: Launch (fixed gear) <-> Cruise (steel-belt variator)
      with belt ratio adjustment active in Cruise mode.
   2. Open Differential: Straight / Left turn / Right turn front-wheel split.
   Respects prefers-reduced-motion (starts paused when reduced motion is on).
   ========================================================================= */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- INTERACTION 1: DIRECT SHIFT-CVT ---------------- */
const modeLaunchBtn = document.getElementById('modeLaunchBtn');
const modeCruiseBtn = document.getElementById('modeCruiseBtn');
const beltRatioSlider = document.getElementById('beltRatioSlider');
const beltRatioLabel = document.getElementById('beltRatioLabel');
const cvtPlayBtn = document.getElementById('cvtPlayBtn');
const cvtResetBtn = document.getElementById('cvtResetBtn');

const cvtStatus = document.getElementById('cvtStatus');
const cvtReadPath = document.getElementById('cvtReadPath');
const cvtReadRatio = document.getElementById('cvtReadRatio');
const cvtReadSpeed = document.getElementById('cvtReadSpeed');
const cvtExplain = document.getElementById('cvtExplain');

const beltPathGroup = document.getElementById('beltPathGroup');
const launchPathGroup = document.getElementById('launchPathGroup');
const beltBranchIn = document.getElementById('beltBranchIn');
const beltBranchOut = document.getElementById('beltBranchOut');
const launchBranchIn = document.getElementById('launchBranchIn');
const launchBranchOut = document.getElementById('launchBranchOut');

const priRim = document.getElementById('priRim');
const secRim = document.getElementById('secRim');
const priMark = document.getElementById('priMark');
const secMark = document.getElementById('secMark');
const beltTop = document.getElementById('beltTop');
const beltBot = document.getElementById('beltBot');
const beltDashTop = document.getElementById('beltDashTop');

const cvtInRotor = document.getElementById('cvtInRotor');
const cvtOutRotor = document.getElementById('cvtOutRotor');
const launchDriveGear = document.getElementById('launchDriveGear');
const launchDrivenGear = document.getElementById('launchDrivenGear');

let cvtMode = 'launch'; // 'launch' | 'cruise'
let beltPos = 0.35;     // 0 = low belt ratio (high torque), 1 = overdrive (high speed)
let cvtPlaying = !reduceMotion;
let cvtInAngle = 0;
let cvtOutAngle = 0;
let cvtBeltOffset = 0;

function currentRatio() {
  if (cvtMode === 'launch') return 3.4; // illustrative fixed launch gear ratio
  // Cruise belt mode: illustrative continuous ratio from 2.2:1 (low) down to 0.55:1 (overdrive)
  return 2.2 - beltPos * 1.65;
}

function updateCvtUI() {
  const isLaunch = cvtMode === 'launch';
  const ratio = currentRatio();
  const speedMult = 1 / ratio;

  modeLaunchBtn.setAttribute('aria-pressed', String(isLaunch));
  modeCruiseBtn.setAttribute('aria-pressed', String(!isLaunch));
  beltRatioSlider.disabled = isLaunch;

  // Highlight active torque path
  launchPathGroup.setAttribute('opacity', isLaunch ? '1' : '0.32');
  beltPathGroup.setAttribute('opacity', isLaunch ? '0.35' : '1');
  launchBranchIn.setAttribute('stroke', isLaunch ? '#e5482f' : '#8f98a7');
  launchBranchOut.setAttribute('stroke', isLaunch ? '#e5482f' : '#8f98a7');
  beltBranchIn.setAttribute('stroke', isLaunch ? '#8f98a7' : '#2f7de1');
  beltBranchOut.setAttribute('stroke', isLaunch ? '#8f98a7' : '#2f7de1');

  // Update pulley effective radii in belt mode (pri grows, sec shrinks as beltPos -> 1)
  const rPri = 20 + beltPos * 20; // 20..40
  const rSec = 40 - beltPos * 20; // 40..20
  priRim.setAttribute('r', rPri.toFixed(1));
  secRim.setAttribute('r', rSec.toFixed(1));
  priMark.setAttribute('y2', (-Math.max(12, rPri - 3)).toFixed(1));
  secMark.setAttribute('y2', (-Math.max(12, rSec - 3)).toFixed(1));

  // Connect tangent-like belt lines across primary (268, 94) and secondary (452, 94)
  beltTop.setAttribute('y1', (94 - rPri).toFixed(1));
  beltTop.setAttribute('y2', (94 - rSec).toFixed(1));
  beltBot.setAttribute('y1', (94 + rPri).toFixed(1));
  beltBot.setAttribute('y2', (94 + rSec).toFixed(1));
  beltDashTop.setAttribute('y1', (94 - rPri).toFixed(1));
  beltDashTop.setAttribute('y2', (94 - rSec).toFixed(1));

  if (isLaunch) {
    cvtStatus.innerHTML = 'Active path: <strong>Launch gear (fixed mechanical gear)</strong>';
    beltRatioLabel.textContent = 'Locked (Launch gear)';
    cvtReadPath.textContent = 'Fixed launch gear';
    cvtReadRatio.textContent = `${ratio.toFixed(1)} : 1 (fixed)`;
    cvtReadSpeed.textContent = `${speedMult.toFixed(2)}x speed · high torque`;
    cvtExplain.textContent =
      'Pulling away from a stop needs strong torque. In Launch mode, power flows through meshing steel gears instead of the belt, giving crisp standing-start response while keeping the belt out of its highest-load ratio.';
  } else {
    const zone = beltPos < 0.35 ? 'Low belt ratio (hill / acceleration)' : beltPos > 0.7 ? 'Overdrive (calm highway cruise)' : 'Mid belt ratio (steady cruise)';
    cvtStatus.innerHTML = `Active path: <strong>Cruise steel-belt variator</strong> · ${zone}`;
    beltRatioLabel.textContent = `${ratio.toFixed(2)} : 1`;
    cvtReadPath.textContent = 'Steel-belt variator';
    cvtReadRatio.textContent = `${ratio.toFixed(2)} : 1 (variable)`;
    cvtReadSpeed.textContent = `${speedMult.toFixed(2)}x speed · ${ratio > 1 ? 'torque boost' : 'overdrive'}`;
    cvtExplain.textContent =
      'Once moving, the launch gear hands off to the steel belt and pulleys. Squeezing the primary pulley pushes the belt outward to a larger diameter while the secondary pulley opens smaller, raising output speed smoothly without discrete gear shifts.';
  }

  cvtPlayBtn.setAttribute('aria-pressed', String(cvtPlaying));
  cvtPlayBtn.textContent = cvtPlaying ? 'Pause' : 'Play';
}

modeLaunchBtn.addEventListener('click', () => {
  cvtMode = 'launch';
  updateCvtUI();
});

modeCruiseBtn.addEventListener('click', () => {
  cvtMode = 'cruise';
  updateCvtUI();
});

beltRatioSlider.addEventListener('input', () => {
  beltPos = Number(beltRatioSlider.value) / 100;
  updateCvtUI();
});

cvtPlayBtn.addEventListener('click', () => {
  cvtPlaying = !cvtPlaying;
  updateCvtUI();
  ensureLoop();
});

cvtResetBtn.addEventListener('click', () => {
  cvtMode = 'launch';
  beltPos = 0.35;
  beltRatioSlider.value = '35';
  cvtInAngle = 0;
  cvtOutAngle = 0;
  cvtPlaying = !reduceMotion;
  updateCvtUI();
  ensureLoop();
});

/* ---------------- INTERACTION 2: OPEN DIFFERENTIAL ---------------- */
const turnBtns = [...document.querySelectorAll('[data-turn]')];
const diffPlayBtn = document.getElementById('diffPlayBtn');
const diffResetBtn = document.getElementById('diffResetBtn');
const diffStatus = document.getElementById('diffStatus');
const diffReadLeft = document.getElementById('diffReadLeft');
const diffReadSpider = document.getElementById('diffReadSpider');
const diffReadRight = document.getElementById('diffReadRight');
const diffExplain = document.getElementById('diffExplain');

const leftWheelSteer = document.getElementById('leftWheelSteer');
const rightWheelSteer = document.getElementById('rightWheelSteer');
const leftNeedle = document.getElementById('leftNeedle');
const rightNeedle = document.getElementById('rightNeedle');
const spiderGear = document.getElementById('spiderGear');
const leftPctSvg = document.getElementById('leftPctSvg');
const rightPctSvg = document.getElementById('rightPctSvg');
const carPathArc = document.getElementById('carPathArc');
const carPathHead = document.getElementById('carPathHead');
const carDirText = document.getElementById('carDirText');
const leftTreads = document.getElementById('leftTreads');
const rightTreads = document.getElementById('rightTreads');

const TURN_MODES = {
  straight: {
    label: 'Straight ahead',
    steerDeg: 0,
    leftFactor: 1.0,
    rightFactor: 1.0,
    spiderLabel: 'Stationary on pin',
    status: 'Steering: <strong>Straight ahead</strong> · Both front wheels turn at the same speed',
    explain: 'Driving straight ahead, both front tyres cover the same distance. The differential carrier turns both side gears together at the same speed, so the spider gears do not spin on their own pin.',
    arc: 'M 370 58 L 370 16',
    head: '370,10 364,22 376,22',
    dirText: 'TRAVEL: STRAIGHT',
  },
  left: {
    label: 'Left turn',
    steerDeg: -18,
    leftFactor: 0.75,
    rightFactor: 1.25,
    spiderLabel: 'Spinning counter-clockwise',
    status: 'Steering: <strong>Left turn</strong> · Outer (right) wheel spins faster than inner (left) wheel',
    explain: 'In a left turn, the outer right tyre travels a wider arc than the inner left tyre. The spider gears spin on their pin so the right half-shaft speeds up to 125% while the left slows to 75%, keeping the average at 100%.',
    arc: 'M 370 58 Q 368 28 334 18',
    head: '326,16 339,13 336,24',
    dirText: 'TRAVEL: LEFT TURN',
  },
  right: {
    label: 'Right turn',
    steerDeg: 18,
    leftFactor: 1.25,
    rightFactor: 0.75,
    spiderLabel: 'Spinning clockwise',
    status: 'Steering: <strong>Right turn</strong> · Outer (left) wheel spins faster than inner (right) wheel',
    explain: 'In a right turn, the outer left tyre travels further than the inner right tyre. The spider gears spin the opposite way so the left wheel speeds up to 125% and the right slows to 75%, preventing tyre scrub.',
    arc: 'M 370 58 Q 372 28 406 18',
    head: '414,16 404,24 401,13',
    dirText: 'TRAVEL: RIGHT TURN',
  },
};

let turnMode = 'straight';
let diffPlaying = !reduceMotion;
let leftAngle = 0;
let rightAngle = 0;
let spiderAngle = 0;

function updateDiffUI() {
  const m = TURN_MODES[turnMode];
  turnBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.turn === turnMode)));

  leftWheelSteer.setAttribute('transform', `translate(114, 156) rotate(${m.steerDeg})`);
  rightWheelSteer.setAttribute('transform', `translate(626, 156) rotate(${m.steerDeg})`);
  carPathArc.setAttribute('d', m.arc);
  carPathHead.setAttribute('points', m.head);
  carDirText.textContent = m.dirText;

  const lPct = Math.round(m.leftFactor * 100);
  const rPct = Math.round(m.rightFactor * 100);
  leftPctSvg.textContent = `${lPct}% speed`;
  rightPctSvg.textContent = `${rPct}% speed`;

  diffStatus.innerHTML = m.status;
  diffReadLeft.textContent = `${lPct}% of ring speed`;
  diffReadSpider.textContent = m.spiderLabel;
  diffReadRight.textContent = `${rPct}% of ring speed`;
  diffExplain.textContent = m.explain;

  diffPlayBtn.setAttribute('aria-pressed', String(diffPlaying));
  diffPlayBtn.textContent = diffPlaying ? 'Pause' : 'Play';
}

turnBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    turnMode = btn.dataset.turn;
    updateDiffUI();
  });
});

diffPlayBtn.addEventListener('click', () => {
  diffPlaying = !diffPlaying;
  updateDiffUI();
  ensureLoop();
});

diffResetBtn.addEventListener('click', () => {
  turnMode = 'straight';
  leftAngle = 0;
  rightAngle = 0;
  spiderAngle = 0;
  diffPlaying = !reduceMotion;
  updateDiffUI();
  ensureLoop();
});

/* ---------------- SHARED DEMAND-DRIVEN ANIMATION LOOP ---------------- */
let lastTs = performance.now();
let rafId = null;

function ensureLoop() {
  if ((cvtPlaying || diffPlaying) && rafId === null) {
    lastTs = performance.now();
    rafId = requestAnimationFrame(animate);
  }
}

function animate(ts) {
  rafId = null;
  if (!cvtPlaying && !diffPlaying) return;
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs = ts;

  if (cvtPlaying) {
    const inSpeed = 140; // deg/s illustrative
    const ratio = currentRatio();
    cvtInAngle = (cvtInAngle + inSpeed * dt) % 360;
    cvtOutAngle = (cvtOutAngle + (inSpeed / ratio) * dt) % 360;
    cvtBeltOffset = (cvtBeltOffset + 65 * dt) % 14;

    cvtInRotor.setAttribute('transform', `translate(154, 140) rotate(${cvtInAngle.toFixed(1)})`);
    cvtOutRotor.setAttribute('transform', `translate(566, 140) rotate(${cvtOutAngle.toFixed(1)})`);

    if (cvtMode === 'launch') {
      launchDriveGear.setAttribute('transform', `translate(332, 206) rotate(${cvtInAngle.toFixed(1)})`);
      launchDrivenGear.setAttribute('transform', `translate(388, 206) rotate(${(-cvtOutAngle).toFixed(1)})`);
    } else {
      priMark.setAttribute('transform', `rotate(${cvtInAngle.toFixed(1)})`);
      secMark.setAttribute('transform', `rotate(${cvtOutAngle.toFixed(1)})`);
      beltDashTop.setAttribute('stroke-dashoffset', (-cvtBeltOffset).toFixed(1));
    }
  }

  if (diffPlaying) {
    const m = TURN_MODES[turnMode];
    const baseSpeed = 120; // deg/s
    leftAngle = (leftAngle + baseSpeed * m.leftFactor * dt) % 360;
    rightAngle = (rightAngle + baseSpeed * m.rightFactor * dt) % 360;
    const diffDelta = (m.leftFactor - m.rightFactor) * baseSpeed * 1.4;
    spiderAngle = (spiderAngle + diffDelta * dt) % 360;

    leftNeedle.setAttribute('transform', `rotate(${leftAngle.toFixed(1)})`);
    rightNeedle.setAttribute('transform', `rotate(${rightAngle.toFixed(1)})`);
    spiderGear.setAttribute('transform', `translate(376, 156) rotate(${spiderAngle.toFixed(1)})`);

    // Subtle tread scroll inside tyres to make differential speed immediately legible
    const lShift = ((leftAngle / 360) * 36) % 36 - 18;
    const rShift = ((rightAngle / 360) * 36) % 36 - 18;
    leftTreads.setAttribute('transform', `translate(0, ${(-lShift).toFixed(1)})`);
    rightTreads.setAttribute('transform', `translate(0, ${(-rShift).toFixed(1)})`);
  }

  if (cvtPlaying || diffPlaying) {
    rafId = requestAnimationFrame(animate);
  }
}

updateCvtUI();
updateDiffUI();
ensureLoop();
