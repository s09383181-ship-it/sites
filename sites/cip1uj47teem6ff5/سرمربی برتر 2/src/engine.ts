import { ALL_PLAYERS, PackDef, PTemplate, Pos } from "./data";

// ---------- ارزش بازیکن ----------
export const valueOf = (rating: number) =>
  Math.round(Math.pow(1.16, rating - 55) * 400 + rating * 30);

// ---------- ساخت نمونه بازیکن ----------
export interface Player extends PTemplate {
  uid: string; energy: number; boost: number; goals: number; matches: number;
}
let uidCounter = 0;
export const makePlayer = (t: PTemplate): Player => ({
  ...t, uid: `p${Date.now().toString(36)}_${uidCounter++}_${Math.random().toString(36).slice(2, 6)}`,
  energy: 100, boost: 0, goals: 0, matches: 0,
});
export const effRating = (p: Player) => Math.min(99, p.rating + p.boost);

// ---------- باز کردن پک ----------
export function rollPack(pack: PackDef): PTemplate[] {
  const out: PTemplate[] = [];
  const pickInBand = (lo: number, hi: number): PTemplate => {
    let pool = ALL_PLAYERS.filter(p => p.rating >= lo && p.rating <= hi);
    let w = 0;
    while (pool.length === 0 && w < 20) { w++; pool = ALL_PLAYERS.filter(p => p.rating >= lo - w * 2 && p.rating <= hi + w * 2); }
    return pool[(Math.random() * pool.length) | 0];
  };
  const totalW = pack.bands.reduce((s, b) => s + b[2], 0);
  for (let i = 0; i < pack.cards; i++) {
    let r = Math.random() * totalW;
    let band = pack.bands[0];
    for (const b of pack.bands) { if (r < b[2]) { band = b; break; } r -= b[2]; }
    out.push(pickInBand(band[0], band[1]));
  }
  if (pack.guaranteed && !out.some(p => p.rating >= pack.guaranteed!)) {
    out[out.length - 1] = pickInBand(pack.guaranteed, 99);
  }
  return out.sort((a, b) => a.rating - b.rating); // بهترین آخر — هیجان!
}

// ---------- قدرت تیم ----------
export function teamStrength(squad: Player[], lineup: string[], coachLvl: number): number {
  const xi = lineup.map(id => squad.find(p => p.uid === id)).filter(Boolean) as Player[];
  if (xi.length === 0) return 50;
  const avg = xi.reduce((s, p) => s + effRating(p) * (0.7 + 0.3 * (p.energy / 100)), 0) / xi.length;
  return Math.min(99, avg + coachLvl);
}

// ---------- جدول رفت و برگشت ----------
export function roundRobin(n: number): [number, number][][] {
  const teams = Array.from({ length: n }, (_, i) => i);
  const rounds: [number, number][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [number, number][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = teams[i], b = teams[n - 1 - i];
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    teams.splice(1, 0, teams.pop()!);
  }
  const back = rounds.map(rd => rd.map(([a, b]) => [b, a] as [number, number]));
  return [...rounds, ...back];
}

// ---------- شبیه‌سازی سریع نتیجه ----------
export function simScore(strA: number, strB: number): [number, number] {
  const diff = (strA - strB) / 10;
  const expA = Math.max(0.25, 1.35 + diff * 0.55);
  const expB = Math.max(0.25, 1.35 - diff * 0.55);
  const poisson = (lambda: number) => {
    let L = Math.exp(-lambda), k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  };
  return [Math.min(7, poisson(expA)), Math.min(7, poisson(expB))];
}

// ---------- رویدادهای مسابقه زنده ----------
export interface MatchEvent {
  minute: number; side: "home" | "away" | "none"; type: "goal" | "chance" | "save" | "card" | "info" | "sub" | "injury";
  text: string;
}
const CHANCE_TXT = ["شوت محکم از پشت محوطه — بالای دروازه!", "ضربه سر خطرناک، تیر دروازه!", "نفوذ از جناح راست، دفع شد!", "پاس عمقی عالی اما آفساید!", "ضربه ایستگاهی خطرناک، دروازه‌بان مشت کرد!"];
const SAVE_TXT = ["سیو فوق‌العاده دروازه‌بان! 🧤", "واکنش دیدنی روی خط دروازه!", "دروازه‌بان یک‌نفره تیم را نجات داد!"];
const GOAL_TXT = ["گـــــل! ضربه تمام‌کننده داخل محوطه ⚽", "گـــــل! شلیک سرکش به سقف دروازه 🚀", "گـــــل! ضربه سر دقیق روی ارسال کرنر 🎯", "گـــــل! حرکت انفرادی تماشایی 🌟", "گـــــل! ضدحمله برق‌آسا ⚡"];
const CARD_TXT = ["کارت زرد برای تکل خطرناک 🟨", "خطای تاکتیکی و کارت زرد 🟨"];

export function tickMinute(minute: number, myStr: number, oppStr: number, iAmHome: boolean): MatchEvent | null {
  const r = Math.random();
  if (r > 0.34) return null;
  const total = myStr + oppStr;
  const mySide: "home" | "away" = iAmHome ? "home" : "away";
  const oppSide: "home" | "away" = iAmHome ? "away" : "home";
  const myTurn = Math.random() < (myStr / total) * (iAmHome ? 1.08 : 0.97);
  const side = myTurn ? mySide : oppSide;
  const atk = myTurn ? myStr : oppStr;
  const def = myTurn ? oppStr : myStr;
  const e = Math.random();
  if (e < 0.30) {
    const goalP = 0.32 + (atk - def) * 0.012;
    if (Math.random() < goalP)
      return { minute, side, type: "goal", text: GOAL_TXT[(Math.random() * GOAL_TXT.length) | 0] };
    return { minute, side, type: "save", text: SAVE_TXT[(Math.random() * SAVE_TXT.length) | 0] };
  }
  if (e < 0.75) return { minute, side, type: "chance", text: CHANCE_TXT[(Math.random() * CHANCE_TXT.length) | 0] };
  if (e < 0.92) return { minute, side, type: "card", text: CARD_TXT[(Math.random() * CARD_TXT.length) | 0] };
  return { minute, side, type: "info", text: "مالکیت توپ در میانه میدان در جریان است..." };
}

// ---------- انتخاب ترکیب خودکار ----------
export function bestLineup(squad: Player[]): string[] {
  const by = (pos: Pos, n: number, used: Set<string>) =>
    squad.filter(p => p.pos === pos && !used.has(p.uid))
      .sort((a, b) => effRating(b) - effRating(a)).slice(0, n);
  const used = new Set<string>();
  const pick: Player[] = [];
  const add = (arr: Player[]) => arr.forEach(p => { used.add(p.uid); pick.push(p); });
  add(by("GK", 1, used)); add(by("DF", 4, used)); add(by("MF", 3, used)); add(by("FW", 3, used));
  if (pick.length < 11) {
    const rest = squad.filter(p => !used.has(p.uid)).sort((a, b) => effRating(b) - effRating(a));
    for (const p of rest) { if (pick.length >= 11) break; pick.push(p); used.add(p.uid); }
  }
  return pick.slice(0, 11).map(p => p.uid);
}

// ---------- ترکیب اولیه بازی جدید ----------
export function starterSquad(): Player[] {
  const rng = () => Math.random();
  const pickPool = (pos: Pos, lo: number, hi: number, n: number, taken: Set<number>) => {
    const pool = ALL_PLAYERS.filter(p => p.pos === pos && p.rating >= lo && p.rating <= hi && !taken.has(p.id));
    const res: PTemplate[] = [];
    for (let i = 0; i < n && pool.length; i++) {
      const idx = (rng() * pool.length) | 0;
      res.push(pool[idx]); taken.add(pool[idx].id); pool.splice(idx, 1);
    }
    return res;
  };
  const taken = new Set<number>();
  const t: PTemplate[] = [
    ...pickPool("GK", 58, 68, 2, taken),
    ...pickPool("DF", 56, 68, 6, taken),
    ...pickPool("MF", 56, 68, 6, taken),
    ...pickPool("FW", 56, 68, 3, taken),
    ...pickPool("FW", 72, 78, 1, taken), // یک ستاره شروع
  ];
  return t.map(makePlayer);
}

export const XP_PER_LEVEL = 500;
export const levelOf = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
