import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Truck,
  FastForward,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface IntroPageProps {
  onEnterAdmin: () => void;
  onEnterCitizen: () => void;
  onEnterDriver: () => void;
  onSkip?: () => void;
}

// ----------------------------------------------------
// Simulation Data & Geometric Constants
// ----------------------------------------------------
const W = 1000;
const H = 640;
const KM = 0.005; // 100 map units = 0.5 km

interface Point {
  x: number;
  y: number;
}

const P: Record<string, Point> = {
  D: { x: 100, y: 500 }, // Depot
  S1: { x: 400, y: 500 }, // Stop 1
  S2: { x: 400, y: 300 }, // Stop 2
  S3: { x: 800, y: 100 }, // Stop 3
  R: { x: 600, y: 300 }, // Request Location (Kurla)
  F: { x: 900, y: 500 }, // MRF Facility
  C: { x: 200, y: 200 } // Critical Request Location
};

const REQ = {
  id: 'REQ-2041',
  loc: 'Kurla West, LBS Marg',
  type: 'Mixed Household',
  kg: 15,
  pri: 'High'
};

interface FleetVehicle {
  id: string;
  pos: Point;
  ok: boolean;
  spare: number;
  note?: string;
  route?: string[] | null;
}

const FLEET: FleetVehicle[] = [
  { id: 'V-01', pos: { x: 200, y: 100 }, ok: true, spare: 10, note: 'Capacity 10 kg' },
  { id: 'V-02', pos: { x: 900, y: 200 }, ok: true, spare: 80, route: null },
  { id: 'V-03', pos: P.D, ok: true, spare: 78, route: ['D', 'S1', 'S2', 'S3', 'F'] },
  { id: 'V-04', pos: { x: 700, y: 500 }, ok: false, spare: 100, note: 'In maintenance' }
];

const man = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// Pre-seeded blocks
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const blocks: { x: number; y: number; a: number; park: boolean }[] = [];
for (let x = 0; x < W; x += 100) {
  for (let y = 0; y < H; y += 100) {
    blocks.push({ x, y, a: 0.35 + rnd() * 0.5, park: rnd() < 0.08 });
  }
}

// ----------------------------------------------------
// Routing on Grid Utilities
// ----------------------------------------------------
function seg(a: Point, b: Point): Point[] {
  const m: Point = { x: b.x, y: a.y };
  const o: Point[] = [a];
  if (
    (m.x !== a.x && m.y !== a.y) ||
    ((m.x !== a.x || m.y !== a.y) && !(m.x === b.x && m.y === b.y))
  ) {
    o.push(m);
  }
  o.push(b);
  return o.filter(
    (p, i, r) => i === 0 || p.x !== r[i - 1].x || p.y !== r[i - 1].y
  );
}

interface Waypoint {
  p: Point;
  k: string;
  type: 'stop' | 'facility' | 'pickup' | 'crit';
  label: string;
  done: boolean;
  _i?: number;
  sAt?: number;
}

interface SimulationRoute {
  pts: Point[];
  cum: number[];
  len: number;
  wps: Waypoint[];
}

function build(start: Point, wps: Waypoint[]): SimulationRoute {
  const pts: Point[] = [start];
  let cur = start;
  for (const w of wps) {
    const s = seg(cur, w.p);
    pts.push(...s.slice(1));
    cur = w.p;
    w._i = pts.length - 1;
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum[i] = cum[i - 1] + man(pts[i - 1], pts[i]);
  }
  for (const w of wps) {
    if (w._i !== undefined) {
      w.sAt = cum[w._i];
    }
  }
  return { pts, cum, len: cum[cum.length - 1] || 0, wps };
}

function posAt(r: SimulationRoute, s: number) {
  s = Math.max(0, Math.min(r.len, s));
  let i = 1;
  while (i < r.cum.length - 1 && r.cum[i] < s) i++;
  const a = r.pts[i - 1] || r.pts[0];
  const b = r.pts[i] || a;
  const d = r.cum[i] - r.cum[i - 1] || 1;
  const t = (s - r.cum[i - 1]) / d;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    i,
    ang: Math.atan2(b.y - a.y, b.x - a.x)
  };
}

function wp(k: string, type: Waypoint['type'], label: string): Waypoint {
  return { p: P[k], k, type, label, done: false };
}

// Assignment evaluation
interface EvalResult {
  v: FleetVehicle;
  verdict: string;
  cost: number | null;
}

function evaluateFleet(): EvalResult[] {
  return FLEET.map((v) => {
    if (!v.ok) return { v, verdict: 'Unavailable', cost: null };
    if (v.spare < REQ.kg) return { v, verdict: 'Too full', cost: null };
    let cost: number;
    if (v.route) {
      const k = v.route.map((n) => P[n]);
      cost = Infinity;
      for (let i = 0; i < k.length - 1; i++) {
        cost = Math.min(
          cost,
          man(k[i], P.R) + man(P.R, k[i + 1]) - man(k[i], k[i + 1])
        );
      }
    } else {
      cost = man(v.pos, P.R);
    }
    return { v, verdict: 'Eligible', cost: cost * KM };
  });
}

const EV = evaluateFleet();
const WIN = EV.filter((e) => e.cost != null).sort((a, b) => (a.cost || 0) - (b.cost || 0))[0]?.v || FLEET[2];

const DUR = [3, 3.2, 2.4, 6.2, 5, 0, 3.6, 0, 2.6, 0];
const STEPS = ['Reported', 'Validated', 'Assigned', 'En route', 'Collecting', 'Collected'];

export const IntroPage: React.FC<IntroPageProps> = ({
  onEnterAdmin,
  onEnterCitizen,
  onEnterDriver,
  onSkip
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React State for HUD & UI Controls
  const [speed, setSpeed] = useState<number>(1);
  const [canTriggerCrit, setCanTriggerCrit] = useState<boolean>(false);
  const [banner, setBanner] = useState<{ show: boolean; text: string; good?: boolean }>({
    show: false,
    text: ''
  });
  const [hudCard, setHudCard] = useState<{
    tag: string;
    title: string;
    sub: string;
    big: string;
    cls: string;
    extraType: 'none' | 'facts' | 'eval' | 'metrics';
    evalShownCount?: number;
    metricsData?: { kg: number; km: string; util: number; completed: number };
  }>({
    tag: 'Citizen request',
    title: 'Overflowing waste reported in Kurla.',
    sub: 'A pickup request appears at Kurla West, LBS Marg.',
    big: '',
    cls: '',
    extraType: 'none'
  });

  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Mutable Simulation State Ref for 60fps Animation Loop
  const simRef = useRef<{
    phase: number;
    t: number;
    speed: number;
    base: SimulationRoute;
    route: SimulationRoute;
    newRoute: SimulationRoute | null;
    oldRoute: SimulationRoute | null;
    drawFrac: number;
    oldAlpha: number;
    s: number;
    pause: number;
    ang: number;
    truck: Point;
    status: number;
    crit: { stage: number; t: number; next?: SimulationRoute } | null;
    critDone: boolean;
    traveled: number;
    collectT: number;
    rev: number;
    cam: { x: number; y: number; z: number };
    pulse: number;
    dpr: number;
    cw: number;
    ch: number;
  }>({
    phase: 0,
    t: 0,
    speed: 1,
    base: build(P.D, [wp('S1', 'stop', 'Stop 1'), wp('S2', 'stop', 'Stop 2'), wp('S3', 'stop', 'Stop 3'), wp('F', 'facility', 'Facility')]),
    route: build(P.D, [wp('S1', 'stop', 'Stop 1'), wp('S2', 'stop', 'Stop 2'), wp('S3', 'stop', 'Stop 3'), wp('F', 'facility', 'Facility')]),
    newRoute: null,
    oldRoute: null,
    drawFrac: 1,
    oldAlpha: 0,
    s: 0,
    pause: 0,
    ang: 0,
    truck: { ...P.D },
    status: 0,
    crit: null,
    critDone: false,
    traveled: 0,
    collectT: 0,
    rev: 0,
    cam: { x: P.R.x, y: P.R.y, z: 2.2 },
    pulse: 0,
    dpr: 1,
    cw: 1000,
    ch: 640
  });

  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    } else {
      onEnterAdmin();
    }
  }, [onSkip, onEnterAdmin]);

  // Keyboard shortcut: ESC to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Initialize and Reset Simulation
  const initSimulation = useCallback(() => {
    const base = build(P.D, [
      wp('S1', 'stop', 'Stop 1'),
      wp('S2', 'stop', 'Stop 2'),
      wp('S3', 'stop', 'Stop 3'),
      wp('F', 'facility', 'Facility')
    ]);
    const sim = simRef.current;
    sim.phase = 0;
    sim.t = 0;
    sim.base = base;
    sim.route = base;
    sim.newRoute = null;
    sim.oldRoute = null;
    sim.drawFrac = 1;
    sim.oldAlpha = 0;
    sim.s = 0;
    sim.pause = 0;
    sim.ang = 0;
    sim.truck = { ...P.D };
    sim.status = 0;
    sim.crit = null;
    sim.critDone = false;
    sim.traveled = 0;
    sim.collectT = 0;
    sim.rev = 0;
    sim.cam = { x: P.R.x, y: P.R.y, z: 2.2 };
    sim.pulse = 0;

    setCanTriggerCrit(false);
    setBanner({ show: false, text: '' });
    setIsCompleted(false);
  }, []);

  const handleSpeedToggle = () => {
    const nextSpeed = speed === 1 ? 2 : speed === 2 ? 3 : 1;
    setSpeed(nextSpeed);
    simRef.current.speed = nextSpeed;
  };

  const handleSimulateCritical = () => {
    const sim = simRef.current;
    if (sim.phase !== 5 || sim.crit || sim.critDone) return;
    sim.crit = { stage: 0, t: 0 };
    setCanTriggerCrit(false);
  };

  // ----------------------------------------------------
  // Animation & Rendering Loop
  // ----------------------------------------------------
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      cv.width = cw * dpr;
      cv.height = ch * dpr;
      simRef.current.dpr = dpr;
      simRef.current.cw = cw;
      simRef.current.ch = ch;
    };

    window.addEventListener('resize', resize);
    resize();
    initSimulation();

    // Helper functions inside effect scope
    const fitZ = () => {
      const { cw, ch } = simRef.current;
      const aw = cw > 900 ? cw - 380 : cw;
      const ah = ch - 150;
      return Math.min(aw / (W + 160), ah / (H + 160));
    };

    const vcx = () => {
      const { cw } = simRef.current;
      return cw > 900 ? cw / 2 + 170 : cw / 2;
    };

    const target = () => {
      const sim = simRef.current;
      const p = sim.phase;
      const f = fitZ();
      const T = sim.truck;
      if (sim.crit && sim.crit.stage < 4) return { x: W / 2, y: H / 2, z: f };
      if (p <= 2) return { x: P.R.x, y: P.R.y, z: ([2.4, 2.2, 2][p] || 2) * f };
      if (p === 3 || p === 4 || p === 9) return { x: W / 2, y: H / 2, z: f };
      if (p === 5 || p === 7) return { x: T.x, y: T.y, z: f * 2 };
      if (p === 6) return { x: P.R.x, y: P.R.y, z: f * 2.8 };
      return { x: P.F.x, y: P.F.y, z: f * 2.6 };
    };

    const camStep = (dt: number) => {
      const sim = simRef.current;
      const t = target();
      const k = 1 - Math.exp(-dt * 2.2);
      const c = sim.cam;
      c.x += (t.x - c.x) * k;
      c.y += (t.y - c.y) * k;
      c.z += (t.z - c.z) * k;
    };

    const strokePath = (r: SimulationRoute, frac: number) => {
      const L = r.len * frac;
      ctx.beginPath();
      for (let i = 0; i < r.pts.length; i++) {
        const p = r.pts[i];
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
          continue;
        }
        if (r.cum[i] <= L) {
          ctx.lineTo(p.x, p.y);
        } else {
          const a = r.pts[i - 1];
          const d = r.cum[i] - r.cum[i - 1] || 1;
          const t = (L - r.cum[i - 1]) / d;
          ctx.lineTo(a.x + (p.x - a.x) * t, a.y + (p.y - a.y) * t);
          break;
        }
      }
      ctx.stroke();
    };

    const pin = (p: Point, col: string, label?: string, px?: number) => {
      const z = simRef.current.cam.z;
      const u = 1 / z;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = col;
      ctx.strokeStyle = '#070b14';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.arc(0, 0, (px || 8) * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (label) {
        ctx.font = `600 ${11 * u}px Inter, sans-serif`;
        ctx.fillStyle = '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.fillText(label, 0, -(px || 8) * u - 6 * u);
      }
      ctx.restore();
    };

    const sq = (p: Point, col: string, letter: string) => {
      const u = 1 / simRef.current.cam.z;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = '#0b1220';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.roundRect(-13 * u, -13 * u, 26 * u, 26 * u, 6 * u);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = `700 ${13 * u}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, 0, u);
      ctx.restore();
    };

    const truckSprite = (
      x: number,
      y: number,
      ang: number,
      col: string,
      label?: string,
      dim?: boolean
    ) => {
      const u = 1 / simRef.current.cam.z;
      ctx.save();
      ctx.translate(x, y);
      if (label) {
        ctx.font = `600 ${11 * u}px Inter, sans-serif`;
        ctx.fillStyle = dim ? '#64748b' : '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText(label, 0, -22 * u);
      }
      ctx.rotate(ang);
      ctx.scale(u, u);
      if (!dim) {
        ctx.shadowColor = col;
        ctx.shadowBlur = 18;
      }
      ctx.fillStyle = dim ? '#334155' : col;
      ctx.beginPath();
      ctx.roundRect(-18, -8, 26, 16, 3);
      ctx.fill();
      ctx.fillStyle = dim ? '#475569' : '#e0f2fe';
      ctx.beginPath();
      ctx.roundRect(10, -8, 10, 16, 3);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#070b14';
      ctx.fillRect(14, -5, 4, 10);
      ctx.fillStyle = '#0b1220';
      for (const wx of [-10, 2, 14]) {
        ctx.fillRect(wx - 3, -10, 6, 3);
        ctx.fillRect(wx - 3, 7, 6, 3);
      }
      ctx.restore();
    };

    const drive = (dt: number) => {
      const sim = simRef.current;
      if (sim.crit && sim.crit.stage < 4) return;
      if (sim.pause > 0) {
        sim.pause -= dt;
        return;
      }
      const w = sim.route.wps.find((wp) => !wp.done);
      if (!w || w.sAt === undefined) return;
      const step = 130 * dt;
      sim.s = Math.min(sim.route.len, sim.s + step);
      sim.traveled += step;
      if (sim.s >= w.sAt - 0.5) {
        w.done = true;
        if (w.type === 'stop' || w.type === 'crit') {
          sim.pause = w.type === 'crit' ? 1.2 : 0.6;
          if (w.type === 'crit') sim.critDone = true;
        } else if (w.type === 'pickup') {
          sim.phase = 6;
          sim.t = 0;
          sim.status = 4;
          setCanTriggerCrit(false);
        } else if (w.type === 'facility') {
          sim.phase = 8;
          sim.t = 0;
          setCanTriggerCrit(false);
        }
      }
    };

    const critStep = (dt: number) => {
      const sim = simRef.current;
      if (!sim.crit) return;
      const c = sim.crit;
      c.t += dt;
      if (c.stage === 0 && c.t > 1.8) {
        c.stage = 1;
        c.t = 0;
        sim.oldRoute = sim.route;
        sim.oldAlpha = 1;
        const here = posAt(sim.route, sim.s);
        const nxt = sim.route.pts[here.i] || here;
        const rest = sim.route.wps.filter((w) => !w.done);
        const order = [wp('C', 'crit', 'Critical')];
        let cur = P.C;
        const left = rest.filter((w) => w.type !== 'facility');
        const fac = rest.find((w) => w.type === 'facility') || wp('F', 'facility', 'Facility');
        while (left.length) {
          left.sort((a, b) => man(cur, a.p) - man(cur, b.p));
          const w = left.shift()!;
          order.push(w);
          cur = w.p;
        }
        order.push(fac);
        const pts = [{ x: here.x, y: here.y }, nxt];
        let c2 = nxt;
        const cum = [0];
        const R2: SimulationRoute = { pts, cum, len: 0, wps: order };
        for (const w of order) {
          const s = seg(c2, w.p);
          pts.push(...s.slice(1));
          c2 = w.p;
          w._i = pts.length - 1;
        }
        for (let i = 1; i < pts.length; i++) {
          cum[i] = cum[i - 1] + man(pts[i - 1], pts[i]);
        }
        R2.cum = cum;
        R2.len = cum[cum.length - 1] || 0;
        for (const w of order) {
          if (w._i !== undefined) w.sAt = cum[w._i];
        }
        sim.crit.next = R2;
      } else if (c.stage === 1 && c.t > 1.6) {
        c.stage = 2;
        c.t = 0;
        sim.newRoute = c.next || null;
        sim.drawFrac = 0;
      } else if (c.stage === 2) {
        sim.drawFrac = Math.min(1, c.t / 2);
        sim.oldAlpha = Math.max(0, 1 - c.t / 1.2);
        if (c.t > 2.1) {
          c.stage = 3;
          c.t = 0;
          if (sim.newRoute) {
            sim.route = sim.newRoute;
          }
          sim.s = 0;
          sim.newRoute = null;
          sim.oldRoute = null;
          sim.drawFrac = 1;
        }
      } else if (c.stage === 3 && c.t > 1.6) {
        c.stage = 4;
        sim.crit = null;
      }
    };

    const update = (dt: number) => {
      const sim = simRef.current;
      dt *= sim.speed;
      sim.t += dt;
      sim.pulse += dt;
      const ph = sim.phase;

      if (ph === 3) {
        sim.rev = Math.min(EV.length, Math.floor(sim.t / 0.9));
      }

      if (ph === 0 && sim.t > DUR[0]) {
        sim.phase = 1;
        sim.t = 0;
      } else if (ph === 1 && sim.t > DUR[1]) {
        sim.phase = 2;
        sim.t = 0;
      } else if (ph === 2 && sim.t > DUR[2]) {
        sim.phase = 3;
        sim.t = 0;
        sim.status = 1;
      } else if (ph === 3 && sim.t > DUR[3]) {
        sim.phase = 4;
        sim.t = 0;
        sim.status = 2;
      } else if (ph === 4) {
        if (sim.t < 1.6) {
          sim.oldAlpha = 1;
          sim.newRoute = null;
        } else {
          if (!sim.newRoute) {
            sim.oldRoute = sim.base;
            sim.newRoute = build(P.D, [
              wp('S1', 'stop', 'Stop 1'),
              wp('S2', 'stop', 'Stop 2'),
              wp('R', 'pickup', 'Pickup'),
              wp('S3', 'stop', 'Stop 3'),
              wp('F', 'facility', 'Facility')
            ]);
          }
          sim.drawFrac = Math.min(1, (sim.t - 1.6) / 2.4);
          sim.oldAlpha = Math.max(0, 1 - (sim.t - 1.6) / 1.2);
        }
        if (sim.t > DUR[4]) {
          if (sim.newRoute) sim.route = sim.newRoute;
          sim.s = 0;
          sim.oldRoute = null;
          sim.phase = 5;
          sim.t = 0;
          sim.status = 3;
          setCanTriggerCrit(true);
        }
      } else if (ph === 5 || ph === 7) {
        drive(dt);
      } else if (ph === 6) {
        sim.collectT = sim.t / DUR[6];
        if (sim.t > 2.2) sim.status = 5;
        if (sim.t > DUR[6]) {
          sim.phase = 7;
          sim.t = 0;
        }
      } else if (ph === 8 && sim.t > DUR[8]) {
        sim.phase = 9;
        sim.t = 0;
        setIsCompleted(true);
      }

      if (sim.crit) critStep(dt);
    };

    const draw = () => {
      const sim = simRef.current;
      const { dpr, cw, ch } = sim;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      const c = sim.cam;
      const z = c.z;
      ctx.setTransform(
        dpr * z,
        0,
        0,
        dpr * z,
        dpr * (vcx() - c.x * z),
        dpr * (ch / 2 - c.y * z)
      );

      // Streets background
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(-60, -60, W + 120, H + 120);

      // City blocks
      for (const b of blocks) {
        ctx.fillStyle = b.park
          ? 'rgba(52,211,153,.10)'
          : `rgba(30,48,78,${b.a * 0.55})`;
        ctx.beginPath();
        ctx.roundRect(b.x + 10, b.y + 10, 80, 80, 4);
        ctx.fill();
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const u = 1 / z;

      // Old route fading
      if (sim.oldRoute && sim.oldAlpha > 0) {
        ctx.globalAlpha = sim.oldAlpha * 0.8;
        ctx.strokeStyle = sim.crit ? '#f87171' : '#94a3b8';
        ctx.lineWidth = 3 * u;
        ctx.setLineDash([8 * u, 7 * u]);
        strokePath(sim.oldRoute, 1);
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Base route before optimization
      if (
        (sim.phase >= 3 && sim.phase < 4) ||
        (sim.phase === 4 && !sim.newRoute)
      ) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3 * u;
        ctx.globalAlpha = sim.phase === 4 ? sim.oldAlpha : 0.7;
        ctx.setLineDash([8 * u, 7 * u]);
        strokePath(sim.base, 1);
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Active / Optimized route
      const active =
        sim.newRoute && (sim.phase === 4 || sim.crit)
          ? sim.newRoute
          : sim.phase >= 5
          ? sim.route
          : null;

      if (active) {
        const frac = active === sim.newRoute ? sim.drawFrac : 1;
        ctx.strokeStyle = 'rgba(56,189,248,.25)';
        ctx.lineWidth = 9 * u;
        strokePath(active, frac);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.2 * u;
        strokePath(active, frac);
        if (active === sim.route && sim.phase >= 5 && sim.s > 0) {
          const f = sim.s / active.len;
          ctx.strokeStyle = 'rgba(52,211,153,.9)';
          ctx.lineWidth = 3.2 * u;
          strokePath(active, f);
        }
      }

      // Important places
      sq(P.D, '#38bdf8', 'D');
      sq(P.F, '#34d399', 'F');
      for (const k of ['S1', 'S2', 'S3']) {
        pin(P[k], '#475569', k.replace('S', 'Stop '), 5);
      }

      // Other fleet vehicles
      if (sim.phase >= 3 && sim.phase <= 4) {
        for (const v of FLEET) {
          if (v.id === WIN.id) continue;
          truckSprite(v.pos.x, v.pos.y, 0, '#64748b', v.id, true);
        }
      }

      // Pickup Request marker
      if (sim.phase >= 0) {
        const col =
          sim.status >= 5
            ? '#34d399'
            : sim.status === 4
            ? '#38bdf8'
            : '#fbbf24';
        const pr = (sim.pulse % 1.6) / 1.6;
        if (sim.status < 5) {
          ctx.strokeStyle = col;
          ctx.globalAlpha = 1 - pr;
          ctx.lineWidth = 2 * u;
          ctx.beginPath();
          ctx.arc(P.R.x, P.R.y, (10 + pr * 34) * u, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        if (sim.phase >= 2 && sim.status < 5) {
          ctx.strokeStyle = col;
          ctx.lineWidth = 2 * u;
          ctx.beginPath();
          ctx.arc(P.R.x, P.R.y, 15 * u, 0, Math.PI * 2);
          ctx.stroke();
        }
        pin(P.R, col, REQ.id, 9);
        if (sim.phase === 6) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 4 * u;
          ctx.beginPath();
          ctx.arc(
            P.R.x,
            P.R.y,
            22 * u,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * Math.min(1, sim.collectT * 1.4)
          );
          ctx.stroke();
        }
      }

      // Critical request marker
      if (sim.crit || sim.critDone) {
        const done =
          sim.critDone &&
          !sim.route.wps.some((w) => w.type === 'crit' && !w.done);
        const col = done ? '#34d399' : '#f87171';
        const pr = (sim.pulse % 1) / 1;
        if (!done) {
          ctx.strokeStyle = col;
          ctx.globalAlpha = 1 - pr;
          ctx.lineWidth = 2 * u;
          ctx.beginPath();
          ctx.arc(P.C.x, P.C.y, (10 + pr * 40) * u, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        pin(P.C, col, 'CRITICAL', 9);
      }

      // Truck sprite
      let tp: Point;
      let ang: number;
      if (
        (sim.phase >= 5 && sim.phase <= 8) ||
        sim.phase === 9
      ) {
        const pa = posAt(sim.route, sim.s);
        tp = pa;
        ang = pa.ang;
      } else {
        tp = P.D;
        ang = 0;
      }

      let dA = ang - sim.ang;
      while (dA > Math.PI) dA -= 2 * Math.PI;
      while (dA < -Math.PI) dA += 2 * Math.PI;
      sim.ang += dA * 0.18;
      sim.truck = { x: tp.x, y: tp.y };

      if (sim.phase >= 3) {
        truckSprite(tp.x, tp.y, sim.ang, '#38bdf8', WIN.id, false);
      }
      if (sim.phase === 3) {
        const rr = 1.6 * u * 14;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2 * u;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, rr * 1.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    // React HUD Update Synchronizer
    const syncHud = () => {
      const sim = simRef.current;
      const p = sim.phase;
      const t = sim.t;
      const c = sim.crit;

      let tag = '';
      let title = '';
      let sub = '';
      let big = '';
      let cls = '';
      let extraType: 'none' | 'facts' | 'eval' | 'metrics' = 'none';
      let evalShownCount = 0;
      let metricsData: { kg: number; km: string; util: number; completed: number } | undefined;

      if (c && c.stage < 4) {
        tag = 'Dynamic rerouting';
        if (c.stage === 0) {
          title = 'Critical request detected';
          big = 'Critical request detected';
          cls = 'text-rose-400';
          sub = 'A new high-risk pickup has just come in near Stop 2.';
        } else if (c.stage === 1) {
          title = 'Route recalculation required';
          big = 'Route recalculation required';
          cls = 'text-amber-400';
          sub = "The remaining stops are being reordered from the truck's current position.";
        } else if (c.stage === 2) {
          title = 'Optimizing route…';
          big = 'Optimizing route…';
          cls = 'text-sky-400';
          sub = 'The old route fades while the new one is drawn.';
        } else {
          title = 'New route active';
          big = 'New route active ✓';
          cls = 'text-emerald-400';
          sub = 'The truck now collects the critical request first, then continues.';
        }
      } else if (p === 0) {
        tag = 'Citizen request';
        title = 'Overflowing waste reported in Kurla.';
        sub = 'A pickup request appears at Kurla West, LBS Marg.';
      } else if (p === 1) {
        tag = 'New pickup request';
        title = 'The request reaches the control room.';
        extraType = 'facts';
      } else if (p === 2) {
        tag = 'Admin review';
        title = 'The admin reviews the request.';
        big = t > 1.2 ? 'Request validated ✓' : 'Checking details…';
        cls = t > 1.2 ? 'text-emerald-400' : 'text-sky-400';
      } else if (p === 3) {
        tag = 'Truck assignment';
        title = 'Finding the right vehicle…';
        sub = 'Availability, spare capacity, detour distance, current route and priority.';
        extraType = 'eval';
        evalShownCount = sim.rev;
        if (sim.rev >= EV.length) {
          big = t > 4.8 ? 'Vehicle assigned ✓' : `${WIN.id} · Optimizer recommendation`;
          cls = t > 4.8 ? 'text-emerald-400' : 'text-sky-400';
        }
      } else if (p === 4) {
        tag = 'Route optimization';
        title = t < 1.6 ? `${WIN.id} current route` : 'Optimizing route…';
        sub =
          t < 1.6
            ? 'Depot → Stop 1 → Stop 2 → Stop 3 → Facility'
            : 'The pickup is inserted where it adds the least distance.';
        if (t > 4) {
          big = 'Route updated ✓';
          cls = 'text-emerald-400';
        }
      } else if (p === 5) {
        tag = 'En route';
        title = `${WIN.id} is heading to the pickup.`;
        sub = 'Pause at each stop, then on to the request.';
      } else if (p === 6) {
        tag = 'Collection';
        title = t < 0.8 ? 'Arrived' : t < 2.2 ? 'Collecting waste…' : 'Collected';
        big = t >= 2.2 ? `♻️ ${REQ.kg} kg collected ✓` : '';
        cls = 'text-emerald-400';
      } else if (p === 7) {
        tag = 'Heading to facility';
        title = 'The load goes to the waste facility.';
        sub = 'The truck continues along its route.';
      } else if (p === 8) {
        tag = 'Waste facility';
        title = t < 1.2 ? 'Truck arrived' : 'Load transferred';
        big = t >= 1.2 ? 'Collection complete ✓' : '';
        cls = 'text-emerald-400';
      } else {
        tag = 'City-wide view';
        title = 'One request at a time, SafaiSaathi keeps the city moving.';
        const km = (sim.traveled * KM).toFixed(1);
        const util = Math.round(((120 - 78 + REQ.kg) / 120) * 100);
        extraType = 'metrics';
        metricsData = {
          kg: REQ.kg,
          km,
          util,
          completed: sim.critDone ? 2 : 1
        };
      }

      setHudCard({
        tag,
        title,
        sub,
        big,
        cls,
        extraType,
        evalShownCount,
        metricsData
      });

      // Status Chain Index
      const stepIdx =
        sim.phase < 2
          ? 0
          : sim.phase === 2
          ? 1
          : sim.status >= 5
          ? 5
          : sim.status === 4
          ? 4
          : sim.status === 3
          ? 3
          : sim.status === 2
          ? 2
          : 1;
      setActiveStepIndex(stepIdx);

      // Top banner
      if (c && c.stage === 0) {
        setBanner({ show: true, text: '🚨 Critical request detected', good: false });
      } else if (c && c.stage === 1) {
        setBanner({ show: true, text: 'Route recalculation required', good: false });
      } else if (c && c.stage === 3) {
        setBanner({ show: true, text: 'New route active ✓', good: true });
      } else {
        setBanner((prev) => (prev.show ? { show: false, text: '' } : prev));
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      camStep(dt * 1);
      draw();
      syncHud();
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [initSimulation]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070b14] text-[#e8eef9] font-sans select-none">
      {/* Simulation Fullscreen Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

      {/* Top Bar: Brand, Simulation Note, and Action Buttons */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto z-20 gap-4 flex-wrap">
        {/* Brand & Simulation Badge */}
        <div className="flex items-center gap-3 bg-[#0c1322]/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/50 shadow-xl shadow-black/40">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
            <span className="font-extrabold text-base tracking-tight text-white">
              SafaiSaathi
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline border-l border-slate-700 pl-3">
            Intelligent Municipal Waste & Fleet Simulation
          </span>
        </div>

        {/* Action Controls: Direct Portal Buttons & Skip Intro */}
        <div className="flex items-center gap-2">
          {/* Quick Access to Portals */}
          <div className="hidden md:flex items-center bg-[#0c1322]/85 backdrop-blur-md p-1 rounded-2xl border border-slate-700/50 shadow-xl">
            <button
              onClick={onEnterAdmin}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800/80 transition-all font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Enter Admin Hub"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Hub</span>
            </button>
            <button
              onClick={onEnterCitizen}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800/80 transition-all font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Enter Citizen Portal"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Citizen Portal</span>
            </button>
            <button
              onClick={onEnterDriver}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800/80 transition-all font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Enter Driver Terminal"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Driver Terminal</span>
            </button>
          </div>

          {/* Primary Skip Intro Button */}
          <button
            onClick={handleSkip}
            className="group px-4 py-2 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-sky-500/25 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer border border-sky-300/40"
            title="Skip intro and go to platform (Esc)"
          >
            <span>Skip Intro</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <kbd className="hidden sm:inline text-[10px] bg-black/20 text-slate-950 px-1.5 py-0.5 rounded font-mono font-bold ml-0.5">
              ESC
            </kbd>
          </button>
        </div>
      </header>

      {/* Floating Center Banner for Alerts */}
      {banner.show && (
        <div
          className={`absolute left-1/2 top-20 -translate-x-1/2 z-30 px-5 py-2.5 rounded-xl font-bold text-sm backdrop-blur-md shadow-2xl transition-all duration-300 flex items-center gap-2 border ${
            banner.good
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/60 text-rose-200 animate-bounce'
          }`}
        >
          {!banner.good && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {banner.good && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{banner.text}</span>
        </div>
      )}

      {/* Dynamic Simulation HUD Card */}
      <div className="absolute left-4 top-20 w-80 sm:w-96 max-h-[calc(100%-170px)] overflow-y-auto p-5 bg-[#0c1322]/85 backdrop-blur-xl border border-slate-700/60 rounded-2xl z-10 shadow-2xl shadow-black/60 custom-scrollbar">
        {/* Phase Tag */}
        <p className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{hudCard.tag}</span>
        </p>

        {/* Phase Title */}
        <h1 className="text-lg sm:text-xl font-extrabold text-white leading-tight mb-2 tracking-tight">
          {hudCard.title}
        </h1>

        {/* Phase Subtitle */}
        {hudCard.sub && (
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed m-0">
            {hudCard.sub}
          </p>
        )}

        {/* Dynamic Highlight Text */}
        {hudCard.big && (
          <p className={`mt-3 text-sm font-bold ${hudCard.cls}`}>
            {hudCard.big}
          </p>
        )}

        {/* Extra Type 1: Request Metadata Facts */}
        {hudCard.extraType === 'facts' && (
          <div className="mt-4 grid gap-px bg-slate-800 border border-slate-700/80 rounded-xl overflow-hidden text-xs">
            <div className="flex justify-between items-center px-3 py-2 bg-[#0b1220]">
              <span className="text-slate-400">Request ID</span>
              <span className="font-mono font-bold text-slate-200">{REQ.id}</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 bg-[#0b1220]">
              <span className="text-slate-400">Location</span>
              <span className="font-semibold text-slate-200">{REQ.loc}</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 bg-[#0b1220]">
              <span className="text-slate-400">Waste Type</span>
              <span className="font-semibold text-slate-200">{REQ.type}</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 bg-[#0b1220]">
              <span className="text-slate-400">Quantity</span>
              <span className="font-semibold text-slate-200">{REQ.kg} kg</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 bg-[#0b1220]">
              <span className="text-slate-400">Priority</span>
              <span className="font-bold text-amber-400">{REQ.pri}</span>
            </div>
          </div>
        )}

        {/* Extra Type 2: Fleet Evaluation Table */}
        {hudCard.extraType === 'eval' && (
          <div className="mt-4">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-left">
                  <th className="py-1.5 px-1 font-semibold">Truck</th>
                  <th className="py-1.5 px-1 font-semibold">Spare</th>
                  <th className="py-1.5 px-1 font-semibold">Extra Dist.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {EV.map((e, idx) => {
                  const shown = idx < (hudCard.evalShownCount || 0);
                  const win = e.v.id === WIN.id && (hudCard.evalShownCount || 0) >= EV.length;
                  const res = !shown
                    ? '…'
                    : e.cost == null
                    ? e.verdict
                    : `+${e.cost.toFixed(1)} km`;
                  return (
                    <tr
                      key={e.v.id}
                      className={
                        win
                          ? 'text-sky-400 font-bold bg-sky-500/10'
                          : e.cost == null && shown
                          ? 'text-slate-500'
                          : 'text-slate-300'
                      }
                    >
                      <td className="py-1.5 px-1 font-mono">{e.v.id}</td>
                      <td className="py-1.5 px-1">{shown ? `${e.v.spare} kg` : '…'}</td>
                      <td className="py-1.5 px-1">{res}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Extra Type 3: Final Metrics */}
        {hudCard.extraType === 'metrics' && hudCard.metricsData && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="p-2.5 border border-slate-800 rounded-xl bg-[#0b1220]">
              <b className="block text-base sm:text-lg font-extrabold text-emerald-400">
                {hudCard.metricsData.kg} kg
              </b>
              <span className="text-[11px] text-slate-400">Waste collected</span>
            </div>
            <div className="p-2.5 border border-slate-800 rounded-xl bg-[#0b1220]">
              <b className="block text-base sm:text-lg font-extrabold text-emerald-400">
                {hudCard.metricsData.km} km
              </b>
              <span className="text-[11px] text-slate-400">Route distance</span>
            </div>
            <div className="p-2.5 border border-slate-800 rounded-xl bg-[#0b1220]">
              <b className="block text-base sm:text-lg font-extrabold text-emerald-400">
                {hudCard.metricsData.util}%
              </b>
              <span className="text-[11px] text-slate-400">Vehicle load</span>
            </div>
            <div className="p-2.5 border border-slate-800 rounded-xl bg-[#0b1220]">
              <b className="block text-base sm:text-lg font-extrabold text-emerald-400">
                {hudCard.metricsData.completed}
              </b>
              <span className="text-[11px] text-slate-400">Requests done</span>
            </div>
          </div>
        )}
      </div>

      {/* Request Pipeline Lifecycle Chain (Bottom) */}
      <div className="absolute left-4 right-4 bottom-18 flex gap-1.5 justify-center flex-wrap z-10 pointer-events-none">
        {STEPS.map((step, i) => {
          const isDone = i < activeStepIndex || activeStepIndex >= 5;
          const isOn = i === activeStepIndex && activeStepIndex < 5;
          return (
            <span
              key={step}
              className={`text-[11px] sm:text-xs px-3 py-1 rounded-full border backdrop-blur-md transition-all duration-300 font-semibold ${
                isOn
                  ? 'text-sky-400 border-sky-400/60 bg-sky-950/70 shadow-md shadow-sky-500/20'
                  : isDone
                  ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60'
                  : 'text-slate-500 border-slate-800 bg-[#0c1322]/80'
              }`}
            >
              {step}
            </span>
          );
        })}
      </div>

      {/* Bottom Control Bar */}
      <footer className="absolute left-0 right-0 bottom-4 flex items-center justify-center gap-2.5 z-20 px-4 flex-wrap pointer-events-auto">
        {/* Simulate Critical Request */}
        <button
          onClick={handleSimulateCritical}
          disabled={!canTriggerCrit}
          className={`text-xs font-bold px-3.5 py-2 rounded-xl border backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            canTriggerCrit
              ? 'bg-rose-900/60 hover:bg-rose-800/80 border-rose-500/60 text-white shadow-lg shadow-rose-900/40 animate-pulse'
              : 'bg-[#0c1322]/80 border-slate-700/60 text-slate-400'
          }`}
          title="Simulate dynamic rerouting with sudden high-priority pickup"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Simulate Critical Request</span>
        </button>

        {/* Speed Multiplier Toggle */}
        <button
          onClick={handleSpeedToggle}
          className="text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700/60 bg-[#0c1322]/80 hover:bg-slate-800 text-slate-200 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
          title="Change simulation speed"
        >
          <FastForward className="w-3.5 h-3.5 text-sky-400" />
          <span>Speed {speed}×</span>
        </button>

        {/* Replay Simulation */}
        <button
          onClick={initSimulation}
          className="text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700/60 bg-[#0c1322]/80 hover:bg-slate-800 text-slate-200 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
          title="Replay intro animation from beginning"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
          <span>Replay</span>
        </button>
      </footer>

      {/* Completion Modal Overlay (Triggers when simulation concludes at Phase 9) */}
      {isCompleted && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl shadow-black animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-extrabold text-white mb-1">
              Simulation Complete!
            </h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              You just experienced SafaiSaathi's automated request ingestion, AI dynamic rerouting, and capacity-optimized dispatch. Choose your destination to start using the platform:
            </p>

            <div className="space-y-2.5 mb-6">
              <button
                onClick={onEnterAdmin}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white m-0">Admin Operations Hub</h3>
                    <p className="text-[11px] text-slate-400 m-0">Two-stage approval, live GIS map, route dispatch</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onEnterCitizen}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white m-0">Citizen Request Portal</h3>
                    <p className="text-[11px] text-slate-400 m-0">Report waste, camera uploads, track live progress</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onEnterDriver}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white m-0">Driver Turn-by-Turn Terminal</h3>
                    <p className="text-[11px] text-slate-400 m-0">Interactive GPS route, weigh-in proof collection</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                onClick={initSimulation}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Simulation</span>
              </button>

              <button
                onClick={handleSkip}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Enter Default Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
