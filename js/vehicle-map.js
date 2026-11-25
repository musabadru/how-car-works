/* Synchronizes the four SVG cutaway hotspots with the accessible part list and detail inspector. */

const PARTS = {
  engine: {
    kicker: 'Stage 1 of 4 · Makes rotation',
    title: 'Four-stroke petrol engine',
    desc: 'Burns a compressed mix of air and petrol across four cylinders to spin the crankshaft. Two full crankshaft turns complete intake, compression, power and exhaust in every cylinder.',
    part: '2.0L M20A-FKS inline-four petrol',
    next: 'Direct Shift-CVT input shaft',
    href: 'lessons/engine.html',
    cta: 'Open Engine lesson',
  },
  transmission: {
    kicker: 'Stage 2 of 4 · Adapts speed and torque',
    title: 'Direct Shift-CVT',
    desc: 'Uses a physical launch gear for crisp standing starts from rest, then hands off to a steel belt and variable pulleys for smooth continuous ratio changes while cruising.',
    part: 'Direct Shift-CVT (launch gear + belt variator)',
    next: 'Final drive reduction gear',
    href: 'lessons/driveline.html#cvt',
    cta: 'Open Driveline lesson (CVT)',
  },
  differential: {
    kicker: 'Stage 3 of 4 · Splits torque in a turn',
    title: 'Final drive & open differential',
    desc: 'Provides the final speed reduction inside the transaxle and uses spider gears so the outer front wheel can spin faster than the inner front wheel around a corner.',
    part: 'Front transaxle final drive & open differential',
    next: 'Left and right front half-shafts',
    href: 'lessons/driveline.html#differential',
    cta: 'Open Driveline lesson (Differential)',
  },
  wheels: {
    kicker: 'Stage 4 of 4 · Pushes against the road',
    title: 'Front wheels & tyres',
    desc: 'Half-shafts with constant-velocity joints carry torque from the differential to the front hubs so the tyres can both steer and drive the car forward.',
    part: 'Front-wheel drive (2WD / FF) driven hubs',
    next: 'Road contact patch (traction)',
    href: 'lessons/driveline.html#wheels',
    cta: 'Trace torque to the front wheels',
  },
};

const hotspots = [...document.querySelectorAll('.hotspot[data-part]')];
const listBtns = [...document.querySelectorAll('.part-btn[data-part]')];
const inspKicker = document.getElementById('inspKicker');
const inspTitle = document.getElementById('inspTitle');
const inspDesc = document.getElementById('inspDesc');
const inspPart = document.getElementById('inspPart');
const inspNext = document.getElementById('inspNext');
const inspLink = document.getElementById('inspLink');

function selectPart(key) {
  const info = PARTS[key];
  if (!info) return;

  hotspots.forEach((hs) => {
    const active = hs.dataset.part === key;
    hs.classList.toggle('is-active', active);
    hs.setAttribute('aria-pressed', String(active));
  });

  listBtns.forEach((btn) => {
    const active = btn.dataset.part === key;
    btn.setAttribute('aria-pressed', String(active));
  });

  inspKicker.textContent = info.kicker;
  inspTitle.textContent = info.title;
  inspDesc.textContent = info.desc;
  inspPart.textContent = info.part;
  inspNext.textContent = info.next;
  inspLink.setAttribute('href', info.href);
  inspLink.textContent = info.cta;
}

hotspots.forEach((hs) => {
  hs.addEventListener('click', () => selectPart(hs.dataset.part));
  hs.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectPart(hs.dataset.part);
    }
  });
});

listBtns.forEach((btn) => {
  btn.addEventListener('click', () => selectPart(btn.dataset.part));
});

// Initialize default selection cleanly
selectPart('engine');
