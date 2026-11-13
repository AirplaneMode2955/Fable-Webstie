"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

export type TimelineEvent = {
  date: string;
  title: string;
  description: string;
  category: "personal" | "education" | "career";
  image?: string;
};

const categoryStyles = {
  personal: { badge: "bg-primary/10 text-primary", label: "Personal" },
  education: { badge: "bg-secondary/10 text-secondary", label: "Education" },
  career: { badge: "bg-accent/10 text-accent", label: "Career" },
};

/** width / height of each photo, so cards reserve the right space and crop as little as possible */
const IMAGE_RATIO: Record<string, number> = {
  "/Baby Jett.JPEG": 1.33,
  "/Elementary Age Jett.JPEG": 1.33,
  "/High School Golf.JPEG": 0.75,
  "/Mission.JPEG": 0.67,
  "/Jett Headshot.jpg": 0.8,
  "/Utah State University.JPEG": 0.75,
  "/Wife.JPEG": 0.75,
  "/engagements.JPEG": 1.5,
  "/Wedding.JPEG": 0.67,
  "/Head of Marketing.JPEG": 0.75,
};

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeInOut = (x: number) => x * x * (3 - 2 * x);
const easeIn = (x: number) => x * x;
const easeOut = (x: number) => 1 - (1 - x) * (1 - x);
const rand = (a: number, b: number) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

type Pt = { x: number; y: number };

type Stop = {
  x: number;
  y: number;
  side: "left" | "right";
  cardWidth: number;
  cardOffset: number;
  revealY: number;
};

/* ───────────────────────── swing poses ───────────────────────── */

const ARC_PEAK = 70;
const REACH = 21; // ball sits this far in front of the golfer's feet (unscaled)

/** [time, armAngle, clubAngle, lean, easeFromPrevious] */
type Key = [number, number, number, number, ((x: number) => number)?];

const ADDRESS: [number, number, number] = [-18, -12, 0];
const TOP: [number, number, number] = [150, -42, -7];
const FINISH: [number, number, number] = [-142, -104, -9];
const CARRY: [number, number, number] = [-12, -125, 0];

/** One clean shot: swing at the start, then walk after it. Ball launches at t = 0.09. */
const SHOT_KEYS: Key[] = [
  [0, ...ADDRESS],
  [0.01, ...ADDRESS],
  [0.05, ...TOP, easeInOut],
  [0.09, ...ADDRESS, easeIn],
  [0.17, ...FINISH, easeOut],
  [0.2, ...FINISH],
  [0.28, ...CARRY, easeInOut],
  [0.62, ...CARRY],
  [0.68, ...ADDRESS, easeInOut],
  [1, ...ADDRESS],
];

/** A miss, a walk to the ball, then a second swing. Impacts at t = 0.06 and t = 0.5. */
const MISS_KEYS: Key[] = [
  [0, ...ADDRESS],
  [0.01, ...ADDRESS],
  [0.035, ...TOP, easeInOut],
  [0.06, ...ADDRESS, easeIn],
  [0.12, ...FINISH, easeOut],
  [0.15, ...FINISH],
  [0.2, ...CARRY, easeInOut],
  [0.36, ...CARRY],
  [0.4, ...ADDRESS, easeInOut],
  [0.43, ...ADDRESS],
  [0.46, ...TOP, easeInOut],
  [0.5, ...ADDRESS, easeIn],
  [0.57, ...FINISH, easeOut],
  [0.6, ...FINISH],
  [0.66, ...CARRY, easeInOut],
  [0.84, ...CARRY],
  [0.9, ...ADDRESS, easeInOut],
  [1, ...ADDRESS],
];

const PUTT_KEYS: Key[] = [
  [0, ...ADDRESS],
  [0.04, ...ADDRESS],
  [0.12, 4, -12, 0, easeInOut],
  [0.16, ...ADDRESS, easeIn],
  [0.22, -34, -12, 0, easeOut],
  [0.7, -34, -12, 0],
  [0.82, -168, -22, -4, easeInOut],
  [1, -168, -22, -4],
];

function pose(t: number, keys: Key[]): [number, number, number] {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2], keys[0][3]];
  for (let i = 1; i < keys.length; i++) {
    const [t1, a1, b1, c1, ez = easeInOut] = keys[i];
    const [t0, a0, b0, c0] = keys[i - 1];
    if (t <= t1) {
      const k = ez((t - t0) / (t1 - t0));
      return [lerp(a0, a1, k), lerp(b0, b1, k), lerp(c0, c1, k)];
    }
  }
  const l = keys[keys.length - 1];
  return [l[1], l[2], l[3]];
}

/* ───────────────────────── geometry ───────────────────────── */

type Shot = { a: Pt; b: Pt; peak: number; impact: number; flight: number; d: string };
type Walk = { t0: number; t1: number; from: Pt; to: Pt };
type Seg = {
  y0: number;
  len: number;
  shots: Shot[];
  walks: Walk[];
  keys: Key[];
  over: "pond" | "bunkers";
  overAt: Pt;
  miss?: { kind: "trees" | "bunker"; m: Pt };
  };

/** Which shots go wrong, so he needs a second try. */
const MISSES: Record<number, "trees" | "bunker"> = { 1: "trees", 4: "bunker", 6: "trees", 9: "bunker" };

/** Ball flight timing: quick off the face, hanging as it comes down. */
const flightEase = (x: number) => 1 - Math.pow(1 - x, 1.4);

const arcPath = (a: Pt, b: Pt, peak: number) =>
  `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - peak * 2} ${b.x} ${b.y}`;

function buildGeometry(w: number, n: number) {
  const mobile = w < 1000;
  const scale = mobile ? 1 : 1.5;
  const reach = REACH * scale;
  const k = mobile ? 0.62 : 1;
  const fw = mobile ? 96 : 150;
  const base = mobile ? 560 : 360;
  const missLen = mobile ? 720 : 560;
  const puttLen = mobile ? 340 : 300;
  const top = mobile ? 250 : 270;
  const cx = w / 2;
  const amp = w * 0.1;

  const lens = Array.from({ length: n - 1 }, (_, i) => (MISSES[i] ? missLen : base));
  const ys: number[] = [top];
  lens.forEach((l) => ys.push(ys[ys.length - 1] + l));

  const stops: Stop[] = ys.map((y, i) => {
    if (mobile) {
      const x = i % 2 ? 88 : 44;
      return { x, y, side: "right", cardWidth: Math.min(w - 128 - 16, 440), cardOffset: 128 - x, revealY: 0 };
    }
    const left = i % 2 === 0;
    return {
      x: cx + (left ? -amp : amp),
      y,
      side: left ? "left" : "right",
      cardWidth: Math.max(240, Math.min(380, cx - amp - 96 - 24)),
      cardOffset: 96,
      revealY: 0,
    };
  });

  const stand = (p: Pt): Pt => ({ x: p.x - reach, y: p.y });

  const segs: Seg[] = lens.map((len, i) => {
    const A = stops[i];
    const B = stops[i + 1];
    const kind = MISSES[i];

    if (!kind) {
      const shot: Shot = { a: A, b: B, peak: ARC_PEAK, impact: 0.09, flight: 0.15, d: arcPath(A, B, ARC_PEAK) };
      return {
        y0: ys[i],
        len,
        shots: [shot],
        walks: [{ t0: 0.2, t1: 0.62, from: stand(A), to: stand(B) }],
        keys: SHOT_KEYS,
        over: i % 2 === 0 ? "pond" : "bunkers",
        overAt: { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 },
      };
    }

    // a wayward first shot lands off the line, then he plays it from there
    const cl = Math.hypot(B.x - A.x, B.y - A.y);
    const nx = -(B.y - A.y) / cl;
    const ny = (B.x - A.x) / cl;
    const side = mobile ? 1 : i % 2 ? 1 : -1;
    const off = kind === "trees" ? fw / 2 + 50 * k + 8 : fw / 2 - 10;
    const mid = { x: lerp(A.x, B.x, 0.45), y: lerp(A.y, B.y, 0.45) };
    const M: Pt = {
      x: clamp(mid.x + nx * side * off, 18, w - 18),
      y: mid.y + ny * side * off,
    };
    const s1: Shot = { a: A, b: M, peak: 42, impact: 0.06, flight: 0.09, d: arcPath(A, M, 42) };
    const s2: Shot = { a: M, b: B, peak: ARC_PEAK, impact: 0.5, flight: 0.15, d: arcPath(M, B, ARC_PEAK) };
    return {
      y0: ys[i],
      len,
      shots: [s1, s2],
      walks: [
        { t0: 0.15, t1: 0.38, from: stand(A), to: stand(M) },
        { t0: 0.58, t1: 0.86, from: stand(M), to: stand(B) },
      ],
      keys: MISS_KEYS,
      over: i % 2 === 0 ? "pond" : "bunkers",
      overAt: { x: (M.x + B.x) / 2, y: (M.y + B.y) / 2 },
      miss: { kind, m: M },
    };
  });

  // each card pops in as it scrolls up into view
  stops.forEach((s, i) => {
    s.revealY = i === 0 ? -9999 : s.y - 170;
  });

  const last = stops[n - 1];
  const cup = { x: mobile ? 66 : cx, y: last.y + (mobile ? 115 : 150) };
  const H = last.y + puttLen + 170;

  return { H, puttLen, stops, segs, cup, mobile, k, fw, scale };
}
type Geo = ReturnType<typeof buildGeometry>;

/* ───────────────────────── the course (static terrain) ───────────────────────── */

function distToSeg(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

type Tree = { x: number; y: number; r: number; tone: number };

function buildTrees(geo: Geo, w: number): Tree[] {
  const { stops, segs, fw, k, mobile } = geo;
  const last = stops[stops.length - 1];
  const poly: Pt[] = [{ x: stops[0].x, y: stops[0].y - 40 }, ...stops];
  const trees: Tree[] = [];

  if (!mobile) {
    for (let j = 0; j < poly.length - 1; j++) {
      const a = poly[j];
      const b = poly[j + 1];
      const L = Math.hypot(b.x - a.x, b.y - a.y);
      const ux = (b.x - a.x) / L;
      const uy = (b.y - a.y) / L;
      let idx = 0;
      for (let d = 18; d < L; d += 40 + rand(j, idx) * 22) {
        for (const side of [-1, 1]) {
          const r1 = rand(j * 13 + idx, side);
          const r2 = rand(j * 7 + idx, side + 3);
          const off = fw / 2 + 40 + r1 * 46;
          const p = { x: a.x + ux * d - uy * side * off, y: a.y + uy * d + ux * side * off };
          const r = 11 + r2 * 13;
          if (p.x < r + 4 || p.x > w - r - 4 || p.y > last.y - 70) continue;
          let near = false;
          for (let q = 0; q < poly.length - 1; q++) {
            if (distToSeg(p, poly[q], poly[q + 1]) < fw / 2 + 30 + r * 0.4) near = true;
          }
          if (!near) trees.push({ x: p.x, y: p.y, r, tone: r2 });
        }
        idx++;
      }
    }
  }

  // the clump the ball disappears into
  segs.forEach((s, i) => {
    if (s.miss?.kind !== "trees") return;
    const { m } = s.miss;
    for (let c = 0; c < 6; c++) {
      const ang = (c / 6) * Math.PI * 2 + rand(i, c) * 1.2;
      const rad = (c === 0 ? 0 : 22 + rand(c, i) * 10) * k;
      trees.push({
        x: m.x + Math.cos(ang) * rad,
        y: m.y + Math.sin(ang) * rad * 0.8,
        r: (17 + rand(i + c, 5) * 9) * Math.max(k, 0.8),
        tone: rand(c, i + 9),
      });
    }
  });

  return trees.sort((a, b) => a.y - b.y);
}

function Course({ geo, w }: { geo: Geo; w: number }) {
  const { stops, segs, cup, H, mobile, k, fw } = geo;
  const last = stops[stops.length - 1];
  const poly = [{ x: stops[0].x, y: stops[0].y - 40 }, ...stops];
  const line = poly.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
  const gk = mobile ? 0.7 : 1;
  const gx = (last.x + cup.x) / 2;
  const gy = (last.y + cup.y) / 2;
  const grx = Math.abs(cup.x - last.x) / 2 + 78 * gk;
  const gry = Math.abs(cup.y - last.y) / 2 + 72 * gk;
  const trees = useMemo(() => buildTrees(geo, w), [geo, w]);
  const fade = "linear-gradient(to bottom, transparent 0, #000 90px, #000 calc(100% - 150px), transparent 100%)";

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-0"
      width={w}
      height={H}
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      <defs>
        <linearGradient id="ttRough" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#172619" />
          <stop offset="1" stopColor="#15231a" />
        </linearGradient>
        <pattern id="ttMow" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
          <rect width="30" height="60" fill="#fff" opacity="0.045" />
        </pattern>
      </defs>

      <rect width={w} height={H} fill="url(#ttRough)" />

      {/* semi-rough, fairway, mow stripes */}
      <path d={line} fill="none" stroke="#1c3322" strokeWidth={fw + 54} strokeLinejoin="round" strokeLinecap="round" />
      <path d={line} fill="none" stroke="#25472d" strokeWidth={fw} strokeLinejoin="round" strokeLinecap="round" />
      <path d={line} fill="none" stroke="url(#ttMow)" strokeWidth={fw} strokeLinejoin="round" strokeLinecap="round" />

      {/* landing areas */}
      {stops.slice(1, -1).map((s) => (
        <circle key={s.y} cx={s.x} cy={s.y} r={40 * k + 8} fill="#2d5a36" opacity={0.75} />
      ))}

      {/* tee box: a black marker on each side of the ball */}
      <g transform={`translate(${stops[0].x} ${stops[0].y})`}>
        <rect x={-88 * Math.max(k, 0.8)} y={-24} width={176 * Math.max(k, 0.8)} height={48} rx={12} fill="#2f5d38" />
        {[-1, 1].map((side) => (
          <g key={side} transform={`translate(${side * 62 * Math.max(k, 0.8)} 0)`}>
            <ellipse cx={1.5} cy={3} rx={6} ry={4} fill="#000" opacity={0.35} />
            <circle r={6} fill="#0b0d0b" />
            <circle cx={-1.8} cy={-2} r={1.8} fill="#4b524b" />
          </g>
        ))}
      </g>

      {/* hazards the ball flies over, plus the bunkers he sometimes finds */}
      {segs.map((s, i) =>
        s.over === "pond" ? (
          <g key={`h${i}`} transform={`translate(${s.overAt.x} ${s.overAt.y}) scale(${k})`}>
            <ellipse rx={94} ry={52} fill="#1a4558" />
            <ellipse rx={86} ry={45} fill="#2d7391" />
            <ellipse cx={-16} cy={-9} rx={54} ry={23} fill="#3f8ba9" opacity={0.55} />
            <path d="M -44 8 q 8 -6 16 0 t 16 0" stroke="#c4e6f2" strokeWidth={1.6} fill="none" opacity={0.5} />
            <path d="M 16 -16 q 8 -6 16 0 t 16 0" stroke="#c4e6f2" strokeWidth={1.6} fill="none" opacity={0.5} />
          </g>
        ) : (
          <g key={`h${i}`} transform={`translate(${s.overAt.x} ${s.overAt.y}) scale(${k})`}>
            <ellipse cx={-36} cy={-8} rx={52} ry={28} fill="#7f7553" />
            <ellipse cx={-36} cy={-8} rx={46} ry={23} fill="#cfc193" opacity={0.92} />
            <ellipse cx={40} cy={15} rx={46} ry={25} fill="#7f7553" />
            <ellipse cx={40} cy={15} rx={40} ry={20} fill="#cfc193" opacity={0.92} />
            <path d="M -62 -10 h 44 M -58 -2 h 40 M 20 12 h 40 M 24 20 h 34" stroke="#a89a6b" strokeWidth={1.4} opacity={0.7} />
          </g>
        ),
      )}
      {segs.map((s, i) => (s.over === "pond" ? <Bridge key={`br${i}`} seg={s} k={k} mobile={mobile} /> : null))}
      {segs.map((s, i) =>
        s.miss?.kind === "bunker" ? (
          <g key={`mb${i}`} transform={`translate(${s.miss.m.x} ${s.miss.m.y}) scale(${Math.max(k, 0.75)})`}>
            <ellipse rx={50} ry={29} fill="#7f7553" />
            <ellipse rx={44} ry={24} fill="#cfc193" opacity={0.92} />
            <path d="M -30 -6 h 52 M -26 2 h 46 M -20 10 h 34" stroke="#a89a6b" strokeWidth={1.4} opacity={0.7} />
          </g>
        ) : null,
      )}

      {/* trees lining the fairway and hiding the odd ball */}
      {trees.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y})`}>
          <circle cx={4} cy={6} r={t.r} fill="#000" opacity={0.3} />
          <circle r={t.r} fill={t.tone > 0.5 ? "#173d22" : "#1c4a29"} />
          <circle cx={-t.r * 0.22} cy={-t.r * 0.25} r={t.r * 0.62} fill={t.tone > 0.5 ? "#245c33" : "#2a6b38"} opacity={0.85} />
          <circle cx={-t.r * 0.38} cy={-t.r * 0.42} r={t.r * 0.22} fill="#3d8a4a" opacity={0.6} />
        </g>
      ))}

      {/* the green */}
      <ellipse cx={gx} cy={gy} rx={grx + 24} ry={gry + 24} fill="#2c5732" />
      <ellipse cx={gx} cy={gy} rx={grx} ry={gry} fill="#3a7442" />
      <ellipse cx={gx} cy={gy} rx={grx} ry={gry} fill="url(#ttMow)" />
      <ellipse cx={cup.x} cy={cup.y} rx={9} ry={5} fill="#070b07" />
      <ellipse cx={cup.x} cy={cup.y} rx={9} ry={5} fill="none" stroke="#a9cc9d" strokeWidth={0.9} />
    </svg>
  );
}

/** A footbridge laid along his walk, spanning the pond with a little to spare. */
function Bridge({ seg, k, mobile }: { seg: Seg; k: number; mobile: boolean }) {
  const wk = seg.walks[seg.walks.length - 1];
  const c = seg.overAt;
  const rx = 98 * k;
  const ry = 56 * k;
  const dx = wk.to.x - wk.from.x;
  const dy = wk.to.y - wk.from.y;
  const fx = (wk.from.x - c.x) / rx;
  const fy = (wk.from.y - c.y) / ry;
  const qa = (dx / rx) ** 2 + (dy / ry) ** 2;
  const qb = 2 * (fx * (dx / rx) + fy * (dy / ry));
  const qc = fx * fx + fy * fy - 1;
  const disc = qb * qb - 4 * qa * qc;
  if (disc <= 0) return null;
  const t1 = (-qb - Math.sqrt(disc)) / (2 * qa);
  const t2 = (-qb + Math.sqrt(disc)) / (2 * qa);
  const seglen = Math.hypot(dx, dy);
  const L = (t2 - t1) * seglen + 30;
  const tm = (t1 + t2) / 2;
  const cx = wk.from.x + dx * tm;
  const cy = wk.from.y + dy * tm;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const bw = mobile ? 26 : 36;
  const planks = Math.floor(L / 7);
  const posts = Math.max(2, Math.round(L / 34));

  return (
    <g transform={`translate(${cx} ${cy}) rotate(${ang})`}>
      <rect x={-L / 2 + 4} y={-bw / 2 + 7} width={L} height={bw} rx={3} fill="#000" opacity={0.3} />
      <rect x={-L / 2} y={-bw / 2} width={L} height={bw} rx={3} fill="#9a7550" />
      {Array.from({ length: planks }, (_, n) => {
        const x = -L / 2 + 3.5 + n * 7;
        return <line key={n} x1={x} y1={-bw / 2 + 2} x2={x} y2={bw / 2 - 2} stroke="#6f5233" strokeWidth={1.1} opacity={0.75} />;
      })}
      <rect x={-L / 2} y={-bw / 2} width={L} height={bw * 0.28} rx={2} fill="#fff" opacity={0.06} />
      {[-1, 1].map((side) => (
        <g key={side}>
          <rect x={-L / 2} y={side * (bw / 2) - 1.6} width={L} height={3.2} rx={1.4} fill="#5c4127" />
          {Array.from({ length: posts + 1 }, (_, n) => (
            <rect
              key={n}
              x={-L / 2 + (n * (L - 5)) / posts}
              y={side * (bw / 2) - 2.6}
              width={5}
              height={5.2}
              rx={1}
              fill="#45301c"
            />
          ))}
        </g>
      ))}
    </g>
  );
}

/* ───────────────────────── shot trail ───────────────────────── */

function Arc({
  shot,
  y0,
  len,
  H,
  progress,
}: {
  shot: Shot;
  y0: number;
  len: number;
  H: number;
  progress: MotionValue<number>;
}) {
  const drawn = useTransform(progress, (p) => flightEase(clamp(((p * H - y0) / len - shot.impact) / shot.flight)));
  return (
    <>
      <path d={shot.d} fill="none" stroke="#f4f1e6" strokeWidth={1.6} strokeLinecap="round" strokeDasharray="2 9" opacity={0.22} />
      <motion.path
        d={shot.d}
        fill="none"
        stroke="#f4f1e6"
        strokeWidth={1.8}
        strokeLinecap="round"
        opacity={0.4}
        style={{ pathLength: drawn }}
      />
    </>
  );
}

/* ───────────────────────── cards ───────────────────────── */

function StopCard({
  event,
  stop,
  progress,
  H,
  priority,
}: {
  event: TimelineEvent;
  stop: Stop;
  progress: MotionValue<number>;
  H: number;
  priority: boolean;
}) {
  const reveal = useTransform(progress, (p) => clamp((p * H - stop.revealY) / 70));
  const y = useTransform(reveal, (r) => (1 - r) * 44);
  const scale = useTransform(reveal, (r) => 0.88 + r * 0.12);
  const styles = categoryStyles[event.category];
  const left = stop.side === "left";
  const ratio = clamp(IMAGE_RATIO[event.image ?? ""] ?? 1.33, 0.8, 1.5);

  return (
    <div className="absolute" style={{ left: stop.x, top: stop.y, width: 0, height: 0 }}>
      <motion.span
        style={{ opacity: reveal, width: stop.cardOffset - 34, [left ? "right" : "left"]: 34 }}
        className="absolute top-0 h-px bg-primary/35"
      />
      <motion.div
        style={{
          opacity: reveal,
          y,
          scale,
          width: stop.cardWidth,
          [left ? "right" : "left"]: stop.cardOffset,
          translateY: "-50%",
        }}
        className="absolute z-10 top-0 bg-surface-container-high rounded-[1rem] overflow-hidden border border-white/[0.08] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)]"
      >
        {event.image && (
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: ratio }}>
            <Image
              src={event.image}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 90vw, 380px"
              className="object-cover object-top"
              priority={priority}
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className={`font-label text-xs uppercase tracking-luxe px-2.5 py-0.5 rounded-full ${styles.badge}`}>
              {styles.label}
            </span>
            <span className="font-label text-xs uppercase tracking-luxe text-outline">{event.date}</span>
          </div>
          <h3 className="font-headline italic text-2xl text-primary mb-1.5 leading-tight">{event.title}</h3>
          <p className="text-on-surface-variant text-base leading-relaxed">{event.description}</p>
        </div>
      </motion.div>
    </div>
  );
}

function StaticList({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="max-w-screen-md mx-auto px-8 space-y-6">
      {events.map((e) => (
        <div key={e.title} className="bg-surface-container-high rounded-[1rem] border border-white/[0.08] overflow-hidden">
          {e.image && (
            <div className="relative w-full" style={{ aspectRatio: clamp(IMAGE_RATIO[e.image] ?? 1.33, 0.8, 1.5) }}>
              <Image src={e.image} alt={e.title} fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover object-top" />
            </div>
          )}
          <div className="p-5">
            <p className="font-label text-xs uppercase tracking-luxe text-outline mb-1">{e.date}</p>
            <h3 className="font-headline italic text-2xl text-primary mb-2">{e.title}</h3>
            <p className="text-on-surface-variant leading-relaxed">{e.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── main ───────────────────────── */

export default function TrailTimeline({ events }: { events: TimelineEvent[] }) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // every animated SVG node, by name
  const rig = useRef<Record<string, SVGElement | null>>({});
  const part = useCallback(
    (name: string) => (el: SVGElement | null) => {
      rig.current[name] = el;
      el?.setAttribute("data-part", name);
    },
    [],
  );
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => (w ? buildGeometry(w, events.length) : null), [w, events.length]);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 68%", "end 68%"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 150, damping: 30, mass: 0.4 });

  const place = useCallback(
    (p: number) => {
      const el = rig.current;
      const need = [
        "ball", "ballBody", "ballShadow", "golfer", "rig", "body", "head", "arm", "club", "farUpper", "farFore", "farHand",
        "legA", "shinA", "legB", "shinB", "golferShadow", "flag", "puff", "divot", "bubble",
        "dog", "dogBody", "dogTail", "dogHead", "dogLegFA", "dogLegFB", "dogLegBA", "dogLegBB", "dogShadow",
      ];
      if (!geo || need.some((k) => !el[k])) return;
      const set = (k: string, t: string) => el[k]!.setAttribute("transform", t);
      const fade = (k: string, o: number) => ((el[k] as SVGElement).style.opacity = String(o));

      const { stops, segs, puttLen, H, scale, cup, mobile } = geo;
      const last = stops[stops.length - 1];
      const y = clamp(p) * H;
      const reach = REACH * scale;
      const rad = Math.PI / 180;

      /**
       * Pose the golfer. `a`/`c`/`lean` are the swing keyframes; `ph` is the walk
       * cycle phase and `amp` (0..1) how much of the walk is blended in.
       */
      const setGolfer = (
        x: number, gy: number, face: number, a: number, c: number, lean: number, ph: number, amp: number, cheer = 0,
      ) => {
        // both hands are on the club unless it is slung over his shoulder
        const grip = clamp((c + 125) / 21) * (1 - amp);
        const back = grip * clamp(a / 150); // backswing
        const thru = grip * clamp(-(a + 18) / 124); // follow-through

        // legs: [thigh, shin] angles; A is the trail leg, B the lead leg
        const sw = Math.sin(ph);
        const cw = Math.cos(ph);
        // facing +x a right-hander shows his right side: legB (drawn in front) is the trail leg
        const stA = [-24 + 16 * thru - 3 * back, 12 - 10 * thru];
        const stB = [8 - 30 * thru + 4 * back, 10 + 44 * thru];
        const wkA = [sw * 27, 6 + 36 * Math.max(0, -cw)];
        const wkB = [-sw * 27, 6 + 36 * Math.max(0, cw)];
        const A = [lerp(stA[0], wkA[0], amp), lerp(stA[1], wkA[1], amp)];
        const B = [lerp(stB[0], wkB[0], amp), lerp(stB[1], wkB[1], amp)];
        const footY = (l: number[]) => 12 * Math.cos(l[0] * rad) + 12 * Math.cos((l[0] + l[1]) * rad);
        const drop = 24 - Math.max(footY(A), footY(B)); // keep the planted foot on the turf
        const shift = -1.6 * back + 3.2 * thru;

        set("golfer", `translate(${x} ${gy}) scale(${face * scale} ${scale})`);
        set("rig", `translate(${shift} ${drop})`);
        set("legA", `rotate(${A[0]} 0 -24)`);
        set("shinA", `translate(0 -12) rotate(${A[1]})`);
        set("legB", `rotate(${B[0]} 0 -24)`);
        set("shinB", `translate(0 -12) rotate(${B[1]})`);
        const bodyLean = lean + 5 * amp + 10 * grip * (1 - thru) * (1 - cheer);
        set("body", `rotate(${bodyLean} 0 -24)`);
        // eyes stay on the ball through impact, then come up to watch it fly
        const headTilt = grip * lerp(16, -22, clamp(thru * 2.2)) - bodyLean * 0.6 - 14 * cheer;
        set("head", `rotate(${headTilt} 3 -43)`);
        set("arm", `rotate(${a} 3 -39)`);
        set("club", `translate(3 -19) rotate(${c})`);
        (el.golferShadow as SVGElement).setAttribute("rx", String(11 + 3 * amp * Math.abs(sw)));

        // far arm: two-bone reach to the grip, or swinging free on the walk
        const sx = 1.5, sy = -38.5, L = 10.5;
        const ar = a * rad;
        const cr = c * rad;
        const gdx = 3.2 * Math.sin(cr);
        const gdy = 20 - 3.2 * Math.cos(cr);
        const gripPt = {
          x: 3 + gdx * Math.cos(ar) - gdy * Math.sin(ar),
          y: -39 + gdx * Math.sin(ar) + gdy * Math.cos(ar),
        };
        const fr = (-sw * 30 * amp - 150 * cheer) * rad;
        const freePt = { x: sx - 20 * Math.sin(fr), y: sy + 20 * Math.cos(fr) };
        const g = grip;
        let tx = lerp(freePt.x, gripPt.x, g);
        let ty = lerp(freePt.y, gripPt.y, g);
        let d = Math.hypot(tx - sx, ty - sy);
        const max = 2 * L - 0.2;
        if (d > max) {
          tx = sx + ((tx - sx) / d) * max;
          ty = sy + ((ty - sy) / d) * max;
          d = max;
        }
        const h = Math.sqrt(Math.max(0, L * L - (d / 2) * (d / 2)));
        const mx = (sx + tx) / 2, my = (sy + ty) / 2;
        // elbow bends away from the target line (toward his back)
        const ex = mx + ((ty - sy) / (d || 1)) * h;
        const ey = my - ((tx - sx) / (d || 1)) * h;
        const line = (k: string, x1: number, y1: number, x2: number, y2: number) => {
          const n = el[k]!;
          n.setAttribute("x1", String(x1));
          n.setAttribute("y1", String(y1));
          n.setAttribute("x2", String(x2));
          n.setAttribute("y2", String(y2));
        };
        line("farUpper", sx, sy, ex, ey);
        line("farFore", ex, ey, tx, ty);
        el.farHand!.setAttribute("cx", String(tx));
        el.farHand!.setAttribute("cy", String(ty));
      };

      /** Roxie: trots when `amp` > 0, sits when `sit` > 0. */
      const setDog = (x: number, dy: number, face: number, ph: number, amp: number, sit: number, wag: number) => {
        const ds = scale * 0.92;
        const bob = amp * Math.abs(Math.sin(ph * 2)) * 1.6;
        set("dog", `translate(${x} ${dy - bob * ds}) scale(${face * ds} ${ds})`);
        set("dogBody", `rotate(${-24 * sit} -8 -9)`);
        const sw = Math.sin(ph * 2) * 32 * amp;
        set("dogLegFA", `rotate(${sw + 22 * sit} 7 -10)`);
        set("dogLegFB", `rotate(${-sw + 22 * sit} 7 -10)`);
        set("dogLegBA", `rotate(${-sw - 78 * sit} -8 -10)`);
        set("dogLegBB", `rotate(${sw - 78 * sit} -8 -10)`);
        set("dogTail", `rotate(${wag} -10.5 -14)`);
        set("dogHead", `rotate(${-10 * sit + 4 * amp * Math.sin(ph * 2)} 9 -16)`);
        (el.dogShadow as SVGElement).setAttribute("rx", String(13 - 3 * sit));
      };

      const setBall = (bx: number, by: number, lift: number, size: number, alpha: number, sh: number, spin = 0) => {
        set("ball", `translate(${bx} ${by - lift})`);
        set("ballBody", `scale(${size}) rotate(${spin})`);
        fade("ball", alpha);
        // the shadow stays on the turf and slides away from the ball as it climbs
        set("ballShadow", `translate(${bx + lift * 0.2} ${by + lift * 0.05}) scale(${sh})`);
        fade("ballShadow", 0.35 * alpha * (0.45 + 0.55 * sh));
      };
      const bubble = el.bubble as SVGTextElement;
      const setBubble = (msg: string, amount: number, x: number, ay: number, size = 1) => {
        if (bubble.textContent !== msg) bubble.textContent = msg;
        bubble.style.opacity = String(amount);
        bubble.setAttribute("transform", `translate(${x} ${ay}) scale(${size * (0.85 + 0.15 * amount)})`);
      };
      /** Turf (and a tee, off the first box) kicked up behind the ball at impact. */
      const setDivot = (e: number, x: number, dy: number, tee: boolean) => {
        const divot = el.divot as SVGGElement;
        if (e <= 0 || e >= 1) {
          divot.style.opacity = "0";
          return;
        }
        divot.style.opacity = String(1 - e * e);
        divot.setAttribute("transform", `translate(${x} ${dy}) scale(${scale})`);
        Array.from(divot.children).forEach((bit, idx) => {
          const isTee = idx === 0;
          if (isTee && !tee) {
            bit.setAttribute("opacity", "0");
            return;
          }
          bit.setAttribute("opacity", "1");
          const vx = isTee ? 16 : -6 - idx * 5;
          const vy = isTee ? 30 : 16 + ((idx * 7) % 11);
          const px = vx * e;
          const py = -vy * e + 34 * e * e;
          bit.setAttribute("transform", `translate(${px} ${py}) rotate(${e * (isTee ? 540 : 200 + idx * 60)})`);
        });
      };

      const wag = Math.sin(y * 0.09) * 26;
      // phones have no room behind him, so she sits at his heel instead
      const dogOff = mobile ? { x: -6 * scale, y: 21 * scale } : { x: -34 * scale, y: 7 * scale };

      if (y >= last.y) {
        /* ── the putt ── */
        const t = clamp((y - last.y) / puttLen);
        const [a, c, lean] = pose(t, PUTT_KEYS);
        const party = clamp((t - 0.7) / 0.12);
        const hop = t > 0.82 ? -Math.abs(Math.sin(((t - 0.82) / 0.18) * Math.PI * 3)) * 7 * (1 - (t - 0.82) / 0.18) : 0;
        const gx = last.x - reach;
        setGolfer(gx, last.y + hop, 1, a, c, lean, 0, 0, party);
        const dogHop = t > 0.78 ? -Math.abs(Math.sin(((t - 0.78) / 0.22) * Math.PI * 4)) * 12 * (1 - (t - 0.78) / 0.22) : 0;
        setDog(gx + dogOff.x, last.y + dogOff.y + dogHop, 1, 0, 0, 1 - party, wag * (1 + 2 * party));

        const s = clamp((t - 0.16) / 0.46);
        const roll = 1 - Math.pow(1 - s, 2.2);
        const drop = clamp((t - 0.62) / 0.06);
        const bx = lerp(last.x, cup.x, roll);
        const by = lerp(last.y, cup.y, roll);
        setBall(bx, by + drop * 4, 0, 1 - drop * 0.8, 1 - drop, 1 - drop, roll * 900);

        const wig = t > 0.64 ? Math.sin((t - 0.64) * 70) * 9 * (1 - clamp((t - 0.64) / 0.3)) : 0;
        set("flag", `rotate(${wig} ${cup.x} ${cup.y - 64})`);
        fade("puff", 0);
        setDivot(0, 0, 0, false);
        setBubble("Birdie!", Math.sin(Math.PI * clamp((t - 0.64) / 0.34)), cup.x, cup.y - 64 - 24, 1.7);
        return;
      }

      /* ── a shot, or a miss and a second try ── */
      let i = 0;
      while (i < segs.length - 1 && y >= segs[i + 1].y0) i++;
      const seg = segs[i];
      const t = clamp((y - seg.y0) / seg.len);

      let active = seg.shots[0];
      let activeIdx = 0;
      seg.shots.forEach((sh, j) => {
        if (t >= sh.impact) {
          active = sh;
          activeIdx = j;
        }
      });
      const wayward = !!seg.miss && activeIdx === 0;
      const s = t >= active.impact ? flightEase(clamp((t - active.impact) / active.flight)) : 0;
      const arc = 4 * s * (1 - s);
      const landT = active.impact + active.flight;
      // two skips and a short release, unless it plugged in the trees or sand
      const u = clamp((t - landT) / 0.1);
      let bounce = 0;
      if (t > landT && u < 1) {
        const h1 = wayward ? 6 : 13;
        if (u < 0.55) bounce = h1 * 4 * (u / 0.55) * (1 - u / 0.55);
        else if (!wayward) bounce = 5 * 4 * ((u - 0.55) / 0.45) * (1 - (u - 0.55) / 0.45);
      }
      const span = Math.hypot(active.b.x - active.a.x, active.b.y - active.a.y) || 1;
      const short = wayward ? 0 : Math.min(14 * scale, span * 0.2) / span;
      const along = s * (1 - short) + short * (1 - Math.pow(1 - u, 2));
      const gx = lerp(active.a.x, active.b.x, along);
      const gy = lerp(active.a.y, active.b.y, along);
      let alpha = 1;
      if (seg.miss?.kind === "trees" && activeIdx === 0) {
        // the ball vanishes into the leaves until he walks up and finds it
        alpha = t < 0.34 ? 1 - clamp((s - 0.9) / 0.1) : clamp((t - 0.34) / 0.04);
      }
      setBall(gx, gy, arc * active.peak + bounce * scale, 1 + arc * 0.7, alpha, 1 - arc * 0.45, s * 1080 + u * 360);
      setDivot((t - active.impact) / 0.07, active.a.x, active.a.y, i === 0 && activeIdx === 0);
      set("flag", "rotate(0)");

      // walking: step length drives the leg cycle, and he turns to face where he is headed
      const walkAt = (tt: number) => {
        let pos = seg.walks[0].from;
        let ph = 0, amp = 0, face = 1;
        for (const wk of seg.walks) {
          if (tt >= wk.t0) {
            const raw = clamp((tt - wk.t0) / (wk.t1 - wk.t0));
            const kk = easeInOut(raw);
            pos = { x: lerp(wk.from.x, wk.to.x, kk), y: lerp(wk.from.y, wk.to.y, kk) };
            const dist = Math.hypot(wk.to.x - wk.from.x, wk.to.y - wk.from.y);
            ph = ((kk * dist) / (44 * scale)) * Math.PI * 2;
            amp = raw > 0 && raw < 1 ? clamp(Math.min(raw, 1 - raw) / 0.07) : 0;
            const dx = wk.to.x - wk.from.x;
            const dir = Math.abs(dx) > 30 ? Math.sign(dx) : 1;
            const turn = raw < 1 ? clamp(raw / 0.05) : 0;
            const turnBack = clamp((raw - 0.95) / 0.05);
            face = lerp(1, dir, turn * (1 - turnBack));
            if (Math.abs(face) < 0.12) face = face < 0 ? -0.12 : 0.12;
          }
        }
        return { pos, ph, amp, face };
      };
      const g = walkAt(t);
      const [a, c, lean] = pose(t, seg.keys);
      setGolfer(g.pos.x, g.pos.y, g.face, a, c, lean, g.ph, g.amp);

      // Roxie sets off a beat after him and catches up a beat later
      // on the move she falls in single file behind him, so she crosses the bridges too
      const dg = walkAt(t - 0.04);
      const spread = 1 - dg.amp;
      setDog(dg.pos.x + dogOff.x * spread, dg.pos.y + dogOff.y * spread, dg.face, dg.ph * 1.7, dg.amp, spread, wag);

      // sand / leaf burst where the miss lands, and a shout
      const puff = el.puff as SVGGElement;
      if (seg.miss) {
        const first = seg.shots[0];
        const e = clamp((t - first.impact - first.flight) / 0.1);
        if (e > 0 && e < 1) {
          puff.setAttribute("transform", `translate(${seg.miss.m.x} ${seg.miss.m.y})`);
          puff.style.opacity = String(1 - e);
          const spread = 28 * (mobile ? 0.7 : 1);
          Array.from(puff.children).forEach((dot, idx) => {
            const ang = (idx * Math.PI) / 3 + 0.4;
            const r = lerp(2, spread, easeOut(e));
            dot.setAttribute("cx", String(Math.cos(ang) * r));
            dot.setAttribute("cy", String(Math.sin(ang) * r * 0.7 - e * 12));
            dot.setAttribute("fill", seg.miss!.kind === "bunker" ? "#e0d29b" : "#7fb76c");
          });
        } else {
          puff.style.opacity = "0";
        }
        const t0 = first.impact + 0.02;
        setBubble(
          seg.miss.kind === "trees" ? "FORE!" : "Sand trap…",
          Math.sin(Math.PI * clamp((t - t0) / 0.2)),
          g.pos.x,
          g.pos.y - 66 * scale - 12,
        );
      } else {
        puff.style.opacity = "0";
        bubble.style.opacity = "0";
      }
    },
    [geo],
  );

  useEffect(() => {
    place(smooth.get());
  }, [place, smooth]);
  useMotionValueEvent(smooth, "change", place);

  if (reduce) return <StaticList events={events} />;

  return (
    <div ref={wrapRef} className="w-full px-0">
      <div ref={trackRef} className="relative" style={{ height: geo ? geo.H : 0 }}>
        {geo && (
          <>
            <Course geo={geo} w={w} />

            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-[5] overflow-visible"
              width={w}
              height={geo.H}
            >
              {geo.segs.map((seg, i) =>
                seg.shots.map((shot, j) => (
                  <Arc key={`${i}-${j}`} shot={shot} y0={seg.y0} len={seg.len} H={geo.H} progress={smooth} />
                )),
              )}

              <defs>
                {[
                  ["aloha", "#f2674a"],
                  ["alohaShade", "#c94a32"],
                ].map(([id, base]) => (
                  <pattern key={id} id={id} width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
                    <rect width={10} height={10} fill={base} />
                    <path d="M 7.2 0.6 Q 10.4 1.6 9.4 4.6 Q 7 3.6 7.2 0.6 Z" fill="#1f8a5b" />
                    <path d="M 0.4 6.4 Q 3.2 6.6 3.4 9.6 Q 0.4 9.2 0.4 6.4 Z" fill="#2fae6e" />
                    {[0, 72, 144, 216, 288].map((r) => (
                      <ellipse key={r} cx={3.4} cy={1.8} rx={1.15} ry={1.7} fill="#fff3e0" transform={`rotate(${r} 3.4 3.4)`} />
                    ))}
                    <circle cx={3.4} cy={3.4} r={0.8} fill="#ffd23f" />
                    {[0, 90, 180, 270].map((r) => (
                      <ellipse key={r} cx={7.8} cy={6.9} rx={0.75} ry={1.1} fill="#ffd23f" transform={`rotate(${r} 7.8 7.8)`} />
                    ))}
                    <circle cx={7.8} cy={7.8} r={0.5} fill="#ff5fa2" />
                  </pattern>
                ))}
              </defs>

              {/* flag */}
              <g>
                <line x1={geo.cup.x} y1={geo.cup.y} x2={geo.cup.x} y2={geo.cup.y - 64} stroke="#f4f1e6" strokeWidth={2} strokeLinecap="round" />
                <polygon
                  ref={part("flag")}
                  points={`${geo.cup.x},${geo.cup.y - 64} ${geo.cup.x + 26},${geo.cup.y - 56} ${geo.cup.x},${geo.cup.y - 48}`}
                  fill="#e07a5f"
                />
              </g>

              <ellipse ref={part("ballShadow")} cx={0} cy={0} rx={7} ry={3} fill="#000" />

              {/* sand / leaf burst */}
              <g ref={part("puff")} style={{ opacity: 0 }}>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <circle key={n} r={3.2} fill="#e0d29b" />
                ))}
              </g>

              {/* Roxie, facing +x */}
              <g ref={part("dog")}>
                <ellipse ref={part("dogShadow")} cx={1} cy={0.5} rx={13} ry={3} fill="#000" opacity={0.28} />
                <g ref={part("dogLegBB")}>
                  <line x1={-8} y1={-10} x2={-9} y2={-0.8} stroke="#0d0f10" strokeWidth={2.8} strokeLinecap="round" />
                  <circle cx={-8.6} cy={-0.9} r={1.7} fill="#9a6a3c" />
                </g>
                <g ref={part("dogBody")}>
                  <g ref={part("dogLegFB")}>
                      <line x1={7} y1={-10} x2={7.5} y2={-0.8} stroke="#0d0f10" strokeWidth={2.6} strokeLinecap="round" />
                      <circle cx={7.9} cy={-0.9} r={1.6} fill="#9a6a3c" />
                  </g>
                  <g ref={part("dogTail")}>
                    <path d="M -10.5 -14 Q -16 -17 -15.5 -23" fill="none" stroke="#17191b" strokeWidth={2.6} strokeLinecap="round" />
                  </g>
                  <path d="M -11.5 -13.5 Q -11 -19 -3 -18.6 L 8 -18.4 Q 12.5 -17.5 12 -12.5 Q 11 -8.2 5 -8.4 L -6 -8 Q -11.8 -8 -11.5 -13.5 Z" fill="#17191b" />
                  <path d="M 8.5 -12 Q 12.4 -12.5 11.6 -9.6 Q 9.5 -8 6 -8.4 Z" fill="#a8743f" />
                  <g ref={part("dogHead")}>
                    <path d="M 8 -16 L 11 -21 L 14.5 -17.5 Z" fill="#17191b" />
                    <ellipse cx={13.4} cy={-20.2} rx={4.9} ry={4.4} fill="#17191b" />
                    <path d="M 9.6 -23.4 L 9.2 -29.6 L 13.4 -24.6 Z" fill="#17191b" />
                    <path d="M 12.6 -24.2 L 13.6 -29.8 L 16.6 -23.6 Z" fill="#0d0f10" />
                    <path d="M 15.2 -21.2 L 21.6 -20.4 Q 22.6 -18.6 21.2 -17.4 L 15 -16.6 Z" fill="#a8743f" />
                    <circle cx={21.7} cy={-19.6} r={1.15} fill="#0d0f10" />
                    <circle cx={15} cy={-21.8} r={0.75} fill="#a8743f" />
                    <circle cx={15.6} cy={-20.9} r={0.6} fill="#f4f1e6" />
                    <path d="M 9.5 -17.2 Q 12 -15.4 14.6 -16.4" fill="none" stroke="#ff5fa2" strokeWidth={1.5} strokeLinecap="round" />
                    <circle cx={12.2} cy={-14.9} r={0.95} fill="#ffd23f" />
                  </g>
                  <g ref={part("dogLegFA")}>
                    <line x1={7} y1={-10} x2={7.5} y2={-0.8} stroke="#17191b" strokeWidth={2.8} strokeLinecap="round" />
                    <circle cx={8} cy={-0.9} r={1.7} fill="#a8743f" />
                  </g>
                </g>
                <g ref={part("dogLegBA")}>
                  <line x1={-8} y1={-10} x2={-9} y2={-0.8} stroke="#17191b" strokeWidth={3.2} strokeLinecap="round" />
                  <circle cx={-8.6} cy={-0.9} r={1.8} fill="#a8743f" />
                </g>
              </g>

              {/* golfer, facing +x with the ball in front of his feet */}
              <g ref={part("golfer")}>
                <ellipse ref={part("golferShadow")} cx={1} cy={0.5} rx={11} ry={3} fill="#000" opacity={0.3} />
                <g ref={part("rig")}>
                  {/* trail leg */}
                  <g ref={part("legA")}>
                    <line x1={0} y1={-24} x2={0} y2={-12} stroke="#c69c7c" strokeWidth={4.2} strokeLinecap="round" />
                    <line x1={0} y1={-24} x2={0} y2={-15.5} stroke="#171c20" strokeWidth={6.4} strokeLinecap="round" />
                    <g ref={part("shinA")}>
                      <line x1={0} y1={0} x2={0} y2={10.5} stroke="#c69c7c" strokeWidth={3.6} strokeLinecap="round" />
                      <line x1={0} y1={7.4} x2={0} y2={10} stroke="#dedbd0" strokeWidth={3.8} />
                      <path d="M -2.4 9.6 L 3 9.6 Q 7.4 10.2 7.4 12.4 L -2.4 12.4 Z" fill="#dedbd0" />
                    </g>
                  </g>
                  {/* lead leg */}
                  <g ref={part("legB")}>
                    <line x1={0} y1={-24} x2={0} y2={-12} stroke="#e3b796" strokeWidth={4.4} strokeLinecap="round" />
                    <line x1={0} y1={-24} x2={0} y2={-15.5} stroke="#222a30" strokeWidth={6.8} strokeLinecap="round" />
                    <g ref={part("shinB")}>
                      <line x1={0} y1={0} x2={0} y2={10.5} stroke="#e3b796" strokeWidth={3.8} strokeLinecap="round" />
                      <line x1={0} y1={7.4} x2={0} y2={10} stroke="#f4f1e6" strokeWidth={4} />
                      <path d="M -2.4 9.6 L 3 9.6 Q 7.6 10.2 7.6 12.4 L -2.4 12.4 Z" fill="#f4f1e6" />
                      <line x1={-2.4} y1={12.3} x2={7.6} y2={12.3} stroke="#9aa39a" strokeWidth={0.7} />
                    </g>
                  </g>
                  <g ref={part("body")}>
                    {/* far (left) arm, gloved */}
                    <line ref={part("farUpper")} stroke="url(#alohaShade)" strokeWidth={4.6} strokeLinecap="round" />
                    <line ref={part("farFore")} stroke="#c69c7c" strokeWidth={3} strokeLinecap="round" />
                    <circle ref={part("farHand")} r={2.2} fill="#f4f1e6" />
                    {/* shorts, then an untucked Hawaiian shirt */}
                    <path d="M -4.4 -28 L 5.2 -28 L 5.6 -21.5 Q 0.5 -19.5 -4.6 -21.5 Z" fill="#222a30" />
                    <path d="M -5.2 -24.6 L -3.5 -38.2 Q -2.5 -42.8 3 -42.8 Q 8.2 -42.8 8.2 -38.2 L 6.6 -24.6 Q 0.7 -23.4 -5.2 -24.6 Z" fill="url(#aloha)" stroke="#b8402a" strokeWidth={0.5} />
                    <line x1={3} y1={-39} x2={2.6} y2={-24} stroke="#b8402a" strokeWidth={0.5} opacity={0.8} />
                    <path d="M 1.1 -42.7 L 3 -39.4 L 4.9 -42.7 Z" fill="#e3b796" />
                    <path d="M -0.6 -42.4 L 3 -38.6 L 2.2 -42.8 Z" fill="#fff3e0" />
                    <path d="M 6.6 -42.4 L 3 -38.6 L 3.8 -42.8 Z" fill="#fff3e0" />
                    {/* flower lei */}
                    {Array.from({ length: 9 }, (_, n) => {
                      const th = (n / 8) * Math.PI;
                      return (
                        <circle
                          key={n}
                          cx={3 + 4 * Math.cos(th)}
                          cy={-42.2 + 4.6 * Math.sin(th)}
                          r={1.05}
                          fill={["#ff5fa2", "#ffd23f", "#b77bff", "#fff3e0"][n % 4]}
                        />
                      );
                    })}
                    <g ref={part("head")}>
                      <line x1={2.6} y1={-41.5} x2={3.2} y2={-46.5} stroke="#e3b796" strokeWidth={3.6} strokeLinecap="round" />
                      <ellipse cx={3.6} cy={-51} rx={5.3} ry={5.8} fill="#e3b796" />
                      <circle cx={8.9} cy={-50.2} r={1.15} fill="#e3b796" />
                      <path d="M -1.7 -52.4 Q -2.6 -47.2 0.6 -45.8 L 2.4 -49.6 L 2.2 -52.4 Z" fill="#2b211a" />
                      <circle cx={2.4} cy={-50.2} r={1.25} fill="#cf9f7e" />
                      <circle cx={7.1} cy={-51.4} r={0.6} fill="#2b211a" />
                      <path d="M 6.6 -48.2 Q 7.8 -47.6 8.6 -48.1" fill="none" stroke="#a9745a" strokeWidth={0.6} strokeLinecap="round" />
                      <path d="M -2 -52.6 Q -1.4 -58.6 3.8 -58.8 Q 8.6 -58.6 9.2 -53.4 L -2 -52.2 Z" fill="#15191c" />
                      <path d="M 8.2 -54.4 L 15.2 -53.2 Q 16.2 -52.2 15 -51.9 L 8.6 -52.6 Z" fill="#0d1012" />
                      <circle cx={5.4} cy={-55.6} r={0.9} fill="#90a68a" />
                    </g>
                    {/* lead arm and club */}
                    <g ref={part("arm")}>
                      <g ref={part("club")}>
                        <line x1={0} y1={0} x2={0} y2={23} stroke="#cfd3d6" strokeWidth={1.3} strokeLinecap="round" />
                        <line x1={0} y1={-3.5} x2={0} y2={4.5} stroke="#15191c" strokeWidth={2.2} strokeLinecap="round" />
                        <path d="M -1.2 21.6 Q 4 20.4 7.6 22 Q 8.8 24.6 6.4 25.6 L -0.4 25.4 Q -2 23.6 -1.2 21.6 Z" fill="#23282c" />
                        <line x1={-0.6} y1={25.3} x2={6.3} y2={25.5} stroke="#cfd3d6" strokeWidth={0.7} />
                      </g>
                      <line x1={3} y1={-39} x2={3} y2={-20} stroke="#e3b796" strokeWidth={3.4} strokeLinecap="round" />
                      <line x1={3} y1={-39} x2={3} y2={-31} stroke="url(#aloha)" strokeWidth={5.6} strokeLinecap="round" />
                      <circle cx={3} cy={-19} r={2.3} fill="#e3b796" />
                    </g>
                  </g>
                </g>
              </g>

              {/* turf and tee kicked up at impact */}
              <g ref={part("divot")} style={{ opacity: 0 }}>
                <rect x={-0.7} y={-4} width={1.4} height={6} rx={0.6} fill="#f4f1e6" />
                <rect x={-2} y={-1.2} width={4.4} height={2.2} rx={1} fill="#5c8f4f" />
                <rect x={-1.6} y={-1} width={3.4} height={1.9} rx={0.9} fill="#6b5a3c" />
                <rect x={-1.3} y={-0.9} width={2.8} height={1.7} rx={0.8} fill="#7fb76c" />
                <circle r={1.1} fill="#5c8f4f" />
              </g>

              <g ref={part("ball")}>
                <g ref={part("ballBody")}>
                  <circle r={6.5} fill="#f4f1e6" stroke="#b9b6a8" strokeWidth={0.8} />
                  <circle cx={-2} cy={-1.5} r={0.9} fill="#b9b6a8" />
                  <circle cx={1.8} cy={1} r={0.9} fill="#b9b6a8" />
                  <circle cx={1.5} cy={-3} r={0.9} fill="#b9b6a8" />
                </g>
              </g>

              <text
                ref={part("bubble")}
                textAnchor="middle"
                className="font-label"
                fontSize={15}
                fontWeight={700}
                fill="#f4f1e6"
                stroke="#0f1a12"
                strokeWidth={4}
                strokeLinejoin="round"
                paintOrder="stroke"
                style={{ opacity: 0 }}
              />
            </svg>

            {events.map((event, i) => (
              <StopCard key={event.title} event={event} stop={geo.stops[i]} progress={smooth} H={geo.H} priority={i < 2} />
            ))}

            <p
              className="absolute font-headline italic text-primary/60 text-lg"
              style={
                geo.mobile
                  ? { left: 28, top: geo.H - 90 }
                  : { left: 0, right: 0, top: geo.H - 90, textAlign: "center" }
              }
            >
              On to the next hole…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
