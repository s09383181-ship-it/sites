import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ALL_PLAYERS, DAILY_REWARDS, LEAGUES, PACKS, WC_TEAMS } from "./data";
import {
  Player, bestLineup, makePlayer, rollPack, roundRobin, simScore, starterSquad, teamStrength, valueOf,
} from "./engine";

const COIN_CAP = 999_999_999; // ضد تقلب: سقف پول
const GEM_CAP = 99_999;
const MIN_SQUAD = 15; // ضد تقلب: حداقل بازیکن

export interface TableRow { p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; }
const emptyRow = (): TableRow => ({ p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
const applyRes = (t: TableRow[], a: number, b: number, ga: number, gb: number) => {
  t[a].p++; t[b].p++; t[a].gf += ga; t[a].ga += gb; t[b].gf += gb; t[b].ga += ga;
  if (ga > gb) { t[a].w++; t[b].l++; t[a].pts += 3; }
  else if (ga < gb) { t[b].w++; t[a].l++; t[b].pts += 3; }
  else { t[a].d++; t[b].d++; t[a].pts++; t[b].pts++; }
};
export const sortIdx = (table: TableRow[], idxs: number[]) =>
  [...idxs].sort((x, y) => table[y].pts - table[x].pts || (table[y].gf - table[y].ga) - (table[x].gf - table[x].ga) || table[y].gf - table[x].gf);

export interface LeagueState {
  defId: string; teams: { name: string; str: number }[];
  fixtures: [number, number][][]; round: number; table: TableRow[]; done: boolean;
}
export interface WCState {
  stage: "group" | "qf" | "sf" | "final" | "done";
  groupRound: number; table: TableRow[];
  qualified: number[]; sfTeams: number[]; finalTeams: number[];
  champion: number; out: boolean; myResult: string;
}
export interface ActiveMatch {
  kind: "league" | "wc" | "friendly"; oppName: string; oppFlag: string; oppStr: number; home: boolean;
}
export interface LastResult { mg: number; og: number; note: string; coins: number; }

const today = () => new Date().toISOString().slice(0, 10);
const WC_GROUPS = [[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]];
const groupPairs = (g: number[], r: number): [number, number][] =>
  r === 0 ? [[g[0], g[1]], [g[2], g[3]]] : r === 1 ? [[g[0], g[2]], [g[1], g[3]]] : [[g[0], g[3]], [g[1], g[2]]];

function rollMarket(): number[] {
  const ids = new Set<number>();
  let guard = 0;
  while (ids.size < 12 && guard++ < 500) {
    const r = Math.random();
    const [lo, hi] = r < 0.4 ? [55, 68] : r < 0.7 ? [66, 76] : r < 0.9 ? [74, 84] : [82, 93];
    const pool = ALL_PLAYERS.filter(p => p.rating >= lo && p.rating <= hi);
    ids.add(pool[(Math.random() * pool.length) | 0].id);
  }
  return [...ids];
}

interface State {
  started: boolean; manager: string; club: string;
  coins: number; gems: number; xp: number;
  squad: Player[]; lineup: string[];
  staff: Record<string, number>;
  league: LeagueState | null; wc: WCState | null;
  match: ActiveMatch | null; lastResult: LastResult | null;
  marketPool: number[]; marketDay: string;
  lastDaily: string; streak: number; lastQuiz: string;
  vip: boolean; deviceId: string; tutorialDone: boolean;
  trophies: string[]; stats: { w: number; d: number; l: number; gf: number; ga: number; packs: number };
  news: number;
}
interface Actions {
  newGame(manager: string, club: string): void;
  resetGame(): void;
  earn(coins: number, gems?: number, xp?: number): void;
  spend(coins: number, gems?: number): boolean;
  openPack(packId: string): Player[] | null;
  buyPlayer(tid: number): boolean;
  sellPlayer(uid: string): boolean;
  setLineupSlot(slot: number, uid: string): void;
  autoLineup(): void;
  trainPlayer(uid: string): boolean;
  restSquad(): boolean;
  hireStaff(id: string): boolean;
  startLeague(defId: string): void;
  startWC(): void;
  myStrength(): number;
  nextLeagueOpp(): { name: string; str: number } | null;
  nextWCOpp(): { name: string; flag: string; str: number } | null;
  playNext(kind: "league" | "wc" | "friendly"): void;
  substitute(outUid: string, inUid: string): void;
  resolveMatch(mg: number, og: number): void;
  clearResult(): void;
  claimDaily(): { coins: number; gems: number } | null;
  finishQuiz(correct: number): number;
  activateVip(code: string): boolean;
  finishTutorial(): void;
  dailyTick(): void;
  refreshMarket(paid: boolean): void;
}

const genDeviceId = () =>
  "SM-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();

export const useGame = create<State & Actions>()(
  persist(
    (set, get) => ({
      started: false, manager: "", club: "",
      coins: 0, gems: 0, xp: 0,
      squad: [], lineup: [],
      staff: { coach: 0, fitness: 0, scout: 0, doctor: 0 },
      league: null, wc: null, match: null, lastResult: null,
      marketPool: [], marketDay: "",
      lastDaily: "", streak: 0, lastQuiz: "",
      vip: false, deviceId: genDeviceId(), tutorialDone: false,
      trophies: [], stats: { w: 0, d: 0, l: 0, gf: 0, ga: 0, packs: 0 },
      news: 0,

      newGame(manager, club) {
        const squad = starterSquad();
        set({
          started: true, manager, club, coins: 20000, gems: 60, xp: 0,
          squad, lineup: bestLineup(squad),
          staff: { coach: 0, fitness: 0, scout: 0, doctor: 0 },
          league: null, wc: null, match: null, lastResult: null,
          marketPool: rollMarket(), marketDay: today(),
          lastDaily: "", streak: 0, lastQuiz: "", vip: get().vip,
          tutorialDone: false, trophies: [],
          stats: { w: 0, d: 0, l: 0, gf: 0, ga: 0, packs: 0 },
        });
      },
      resetGame() { set({ started: false }); },

      earn(coins, gems = 0, xp = 0) {
        const mult = get().vip ? 1.5 : 1;
        set(s => ({
          coins: Math.min(COIN_CAP, s.coins + Math.round(coins * mult)),
          gems: Math.min(GEM_CAP, s.gems + gems),
          xp: s.xp + xp,
        }));
      },
      spend(coins, gems = 0) {
        const s = get();
        if (s.coins < coins || s.gems < gems) return false;
        set({ coins: s.coins - coins, gems: s.gems - gems });
        return true;
      },

      openPack(packId) {
        const pack = PACKS.find(p => p.id === packId)!;
        const s = get();
        if (pack.vipOnly && !s.vip) return null;
        if (!get().spend(pack.currency === "coins" ? pack.cost : 0, pack.currency === "gems" ? pack.cost : 0)) return null;
        const players = rollPack(pack).map(makePlayer);
        set(st => ({ squad: [...st.squad, ...players], stats: { ...st.stats, packs: st.stats.packs + 1 }, xp: st.xp + 50 }));
        return players;
      },

      buyPlayer(tid) {
        const t = ALL_PLAYERS.find(p => p.id === tid)!;
        const s = get();
        const price = Math.round(valueOf(t.rating) * (1 - s.staff.scout * 0.03));
        if (!get().spend(price)) return false;
        set(st => ({ squad: [...st.squad, makePlayer(t)], marketPool: st.marketPool.filter(i => i !== tid) }));
        return true;
      },

      sellPlayer(uid) {
        const s = get();
        if (s.squad.length <= MIN_SQUAD) return false; // ضد تقلب
        if (s.lineup.includes(uid)) return false;
        const p = s.squad.find(x => x.uid === uid);
        if (!p) return false;
        const gain = Math.round(valueOf(p.rating + p.boost) * 0.7); // مالیات ۳۰٪
        set(st => ({
          squad: st.squad.filter(x => x.uid !== uid),
          coins: Math.min(COIN_CAP, st.coins + gain),
        }));
        return true;
      },

      setLineupSlot(slot, uid) {
        set(s => {
          const lineup = [...s.lineup];
          const existing = lineup.indexOf(uid);
          if (existing >= 0) { const tmp = lineup[slot]; lineup[slot] = uid; lineup[existing] = tmp; }
          else lineup[slot] = uid;
          return { lineup };
        });
      },
      autoLineup() { set(s => ({ lineup: bestLineup(s.squad) })); },

      trainPlayer(uid) {
        const s = get();
        const p = s.squad.find(x => x.uid === uid);
        if (!p || p.boost >= 5 || p.energy < 20 || p.rating + p.boost >= 99) return false;
        const cost = Math.round((p.rating + p.boost) * 140 * (p.boost + 1));
        if (!get().spend(cost)) return false;
        set(st => ({
          squad: st.squad.map(x => x.uid === uid ? { ...x, boost: x.boost + 1, energy: Math.max(0, x.energy - 20) } : x),
          xp: st.xp + 20,
        }));
        return true;
      },

      restSquad() {
        const s = get();
        const cost = Math.max(500, (5 - s.staff.doctor) * 400);
        if (!get().spend(cost)) return false;
        set(st => ({ squad: st.squad.map(p => ({ ...p, energy: 100 })) }));
        return true;
      },

      hireStaff(id) {
        const s = get();
        const lvl = s.staff[id] ?? 0;
        if (lvl >= 5) return false;
        const base = { coach: 5000, fitness: 4000, scout: 4500, doctor: 3500 }[id] ?? 5000;
        const cost = base * (lvl + 1);
        if (!get().spend(cost)) return false;
        set(st => ({ staff: { ...st.staff, [id]: lvl + 1 } }));
        return true;
      },

      startLeague(defId) {
        const def = LEAGUES.find(l => l.id === defId)!;
        const teams = [{ name: get().club, str: 0 }, ...def.teams];
        set({
          league: {
            defId, teams, fixtures: roundRobin(teams.length).slice(0, 14),
            round: 0, table: teams.map(emptyRow), done: false,
          },
        });
      },

      startWC() {
        set({
          wc: {
            stage: "group", groupRound: 0, table: WC_TEAMS.map(emptyRow),
            qualified: [], sfTeams: [], finalTeams: [], champion: -1, out: false, myResult: "",
          },
        });
      },

      myStrength() {
        const s = get();
        return teamStrength(s.squad, s.lineup, s.staff.coach);
      },

      nextLeagueOpp() {
        const s = get();
        if (!s.league || s.league.done) return null;
        const round = s.league.fixtures[s.league.round];
        if (!round) return null;
        const my = round.find(([a, b]) => a === 0 || b === 0);
        if (!my) return null;
        const oppIdx = my[0] === 0 ? my[1] : my[0];
        return s.league.teams[oppIdx];
      },
      nextWCOpp() {
        const s = get();
        const wc = s.wc;
        if (!wc || wc.out || wc.stage === "done") return null;
        if (wc.stage === "group") {
          const pairs = groupPairs(WC_GROUPS[0], wc.groupRound);
          const my = pairs.find(([a, b]) => a === 0 || b === 0)!;
          const idx = my[0] === 0 ? my[1] : my[0];
          return WC_TEAMS[idx];
        }
        const arr = wc.stage === "qf" ? wc.qualified : wc.stage === "sf" ? wc.sfTeams : wc.finalTeams;
        for (let i = 0; i < arr.length; i += 2) {
          if (arr[i] === 0) return WC_TEAMS[arr[i + 1]];
          if (arr[i + 1] === 0) return WC_TEAMS[arr[i]];
        }
        return null;
      },

      playNext(kind) {
        const s = get();
        if (kind === "league") {
          const opp = get().nextLeagueOpp();
          if (!opp) return;
          const round = s.league!.fixtures[s.league!.round];
          const my = round.find(([a, b]) => a === 0 || b === 0)!;
          set({ match: { kind, oppName: opp.name, oppFlag: "🏟️", oppStr: opp.str, home: my[0] === 0 } });
        } else if (kind === "wc") {
          const opp = get().nextWCOpp();
          if (!opp) return;
          set({ match: { kind, oppName: opp.name, oppFlag: opp.flag, oppStr: opp.str, home: true } });
        } else {
          const def = LEAGUES[(Math.random() * LEAGUES.length) | 0];
          const t = def.teams[(Math.random() * def.teams.length) | 0];
          set({ match: { kind, oppName: t.name, oppFlag: def.flag, oppStr: t.str, home: Math.random() < 0.5 } });
        }
      },

      substitute(outUid, inUid) {
        set(s => ({ lineup: s.lineup.map(id => (id === outUid ? inUid : id)) }));
      },

      resolveMatch(mg, og) {
        const s = get();
        const m = s.match;
        if (!m) return;
        let note = "";
        const myStr = get().myStrength();
        // ضربات پنالتی در حذفی جام جهانی
        if (m.kind === "wc" && s.wc && s.wc.stage !== "group" && mg === og) {
          const winP = myStr / (myStr + m.oppStr);
          if (Math.random() < winP) { mg++; note = "برد در ضربات پنالتی! 🎯"; }
          else { og++; note = "باخت تلخ در ضربات پنالتی 😢"; }
        }
        const win = mg > og, draw = mg === og;
        const baseCoins = m.kind === "friendly" ? (win ? 900 : draw ? 400 : 200)
          : m.kind === "wc" ? (win ? 4000 : draw ? 1500 : 700)
          : (win ? 2000 : draw ? 800 : 350);
        get().earn(baseCoins, win && m.kind === "wc" ? 3 : 0, win ? 100 : draw ? 40 : 15);

        // انرژی و آمار بازیکنان
        const drop = Math.max(6, 16 - s.staff.fitness * 2);
        const scorers = new Set<string>();
        const attackers = s.lineup.filter(id => {
          const p = s.squad.find(x => x.uid === id);
          return p && (p.pos === "FW" || p.pos === "MF");
        });
        for (let i = 0; i < mg && attackers.length; i++) scorers.add(attackers[(Math.random() * attackers.length) | 0]);
        set(st => ({
          squad: st.squad.map(p => st.lineup.includes(p.uid)
            ? { ...p, energy: Math.max(0, p.energy - drop), matches: p.matches + 1, goals: p.goals + (scorers.has(p.uid) ? 1 : 0) }
            : p),
          stats: { ...st.stats, w: st.stats.w + (win ? 1 : 0), d: st.stats.d + (draw ? 1 : 0), l: st.stats.l + (!win && !draw ? 1 : 0), gf: st.stats.gf + mg, ga: st.stats.ga + og },
        }));

        // ---- لیگ ----
        if (m.kind === "league" && s.league) {
          const L = { ...s.league, table: s.league.table.map(r => ({ ...r })) };
          const round = L.fixtures[L.round];
          for (const [a, b] of round) {
            if (a === 0 || b === 0) {
              const [ga, gb] = a === 0 ? [mg, og] : [og, mg];
              applyRes(L.table, a, b, ga, gb);
            } else {
              const [ga, gb] = simScore(L.teams[a].str, L.teams[b].str);
              applyRes(L.table, a, b, ga, gb);
            }
          }
          L.round++;
          if (L.round >= L.fixtures.length) {
            L.done = true;
            const order = sortIdx(L.table, L.teams.map((_, i) => i));
            const place = order.indexOf(0);
            const def = LEAGUES.find(x => x.id === L.defId)!;
            const prize = place === 0 ? def.prize : place === 1 ? Math.round(def.prize / 2) : Math.round(def.prize / 5);
            get().earn(prize, place === 0 ? 20 : 0, 300);
            if (place === 0) set(st => ({ trophies: [...st.trophies, `🏆 قهرمان ${def.name}`] }));
            note += (note ? " — " : "") + (place === 0 ? `قهرمان ${def.name} شدی! 🏆 (+${prize} سکه)` : `پایان فصل: رتبه ${place + 1} (+${prize} سکه)`);
          }
          set({ league: L });
        }

        // ---- جام جهانی ----
        if (m.kind === "wc" && s.wc) {
          const wc: WCState = { ...s.wc, table: s.wc.table.map(r => ({ ...r })) };
          const strOf = (i: number) => (i === 0 ? myStr : WC_TEAMS[i].str);
          const simKO = (a: number, b: number): number => {
            const [ga, gb] = simScore(strOf(a), strOf(b));
            if (ga > gb) return a; if (gb > ga) return b;
            return Math.random() < strOf(a) / (strOf(a) + strOf(b)) ? a : b;
          };
          if (wc.stage === "group") {
            for (const g of WC_GROUPS) {
              for (const [a, b] of groupPairs(g, wc.groupRound)) {
                if (a === 0 || b === 0) {
                  const [ga, gb] = a === 0 ? [mg, og] : [og, mg];
                  applyRes(wc.table, a, b, ga, gb);
                } else {
                  const [ga, gb] = simScore(strOf(a), strOf(b));
                  applyRes(wc.table, a, b, ga, gb);
                }
              }
            }
            wc.groupRound++;
            if (wc.groupRound >= 3) {
              const tops = WC_GROUPS.map(g => sortIdx(wc.table, g));
              // QF: A1-B2 , B1-A2 , C1-D2 , D1-C2
              wc.qualified = [tops[0][0], tops[1][1], tops[1][0], tops[0][1], tops[2][0], tops[3][1], tops[3][0], tops[2][1]];
              if (wc.qualified.includes(0)) {
                wc.stage = "qf";
                note += (note ? " — " : "") + "صعود به مرحله حذفی! 🎉";
              } else {
                wc.out = true; wc.stage = "done";
                let rem = wc.qualified;
                while (rem.length > 1) { const nx: number[] = []; for (let i = 0; i < rem.length; i += 2) nx.push(simKO(rem[i], rem[i + 1])); rem = nx; }
                wc.champion = rem[0];
                wc.myResult = "حذف در مرحله گروهی";
                note += (note ? " — " : "") + "از گروه صعود نکردی 😔";
              }
            }
          } else {
            // مرحله حذفی
            const arr = wc.stage === "qf" ? wc.qualified : wc.stage === "sf" ? wc.sfTeams : wc.finalTeams;
            const winners: number[] = [];
            for (let i = 0; i < arr.length; i += 2) {
              const a = arr[i], b = arr[i + 1];
              if (a === 0 || b === 0) winners.push(mg > og ? 0 : (a === 0 ? b : a));
              else winners.push(simKO(a, b));
            }
            const iWon = winners.includes(0);
            if (wc.stage === "qf") {
              if (iWon) { wc.sfTeams = winners; wc.stage = "sf"; note += (note ? " — " : "") + "صعود به نیمه‌نهایی! 🔥"; }
              else {
                wc.out = true; wc.stage = "done"; wc.myResult = "حذف در یک‌چهارم نهایی";
                let rem = winners; while (rem.length > 1) { const nx: number[] = []; for (let i = 0; i < rem.length; i += 2) nx.push(simKO(rem[i], rem[i + 1])); rem = nx; }
                wc.champion = rem[0];
              }
            } else if (wc.stage === "sf") {
              if (iWon) { wc.finalTeams = winners; wc.stage = "final"; note += (note ? " — " : "") + "فینال جام جهانی! 🌟"; }
              else {
                wc.out = true; wc.stage = "done"; wc.myResult = "حذف در نیمه‌نهایی";
                wc.champion = simKO(winners[0], winners[1]);
              }
            } else {
              wc.stage = "done";
              if (iWon) {
                wc.champion = 0; wc.myResult = "قهرمان جام جهانی! 🏆";
                get().earn(100000, 100, 1000);
                set(st => ({ trophies: [...st.trophies, "🌍 قهرمان جام جهانی"] }));
                note += (note ? " — " : "") + "تو قهرمان جام جهانی شدی!!! 🏆🎉 (+۱۰۰,۰۰۰ سکه)";
              } else {
                wc.out = true; wc.champion = winners[0] === 0 ? winners[1] ?? winners[0] : winners[0];
                wc.myResult = "نایب‌قهرمان جام جهانی 🥈";
                get().earn(40000, 40, 500);
                note += (note ? " — " : "") + "نایب‌قهرمانی جام جهانی 🥈 (+۴۰,۰۰۰ سکه)";
              }
            }
          }
          set({ wc });
        }

        set({ match: null, lastResult: { mg, og, note, coins: baseCoins } });
      },
      clearResult() { set({ lastResult: null }); },

      claimDaily() {
        const s = get();
        const t = today();
        if (s.lastDaily === t) return null;
        const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
        const streak = s.lastDaily === yesterday ? (s.streak % 7) + 1 : 1;
        const r = DAILY_REWARDS[streak - 1];
        set({ lastDaily: t, streak });
        get().earn(r.coins, r.gems, 30);
        return r;
      },

      finishQuiz(correct) {
        const t = today();
        if (get().lastQuiz === t) return 0;
        const reward = correct * 300;
        set({ lastQuiz: t });
        get().earn(reward, correct === 5 ? 5 : 0, correct * 20);
        return reward;
      },

      activateVip(code) {
        if (code.trim().toUpperCase().replace(/[-_ ]/g, "") === "ZODIACVIP") {
          set({ vip: true });
          get().earn(50000, 200, 500);
          return true;
        }
        return false;
      },
      finishTutorial() { set({ tutorialDone: true }); },

      dailyTick() {
        const s = get();
        const t = today();
        if (s.marketDay !== t) {
          set({
            marketDay: t, marketPool: rollMarket(),
            squad: s.squad.map(p => ({ ...p, energy: Math.min(100, p.energy + 40 + s.staff.doctor * 5) })),
          });
        }
      },
      refreshMarket(paid) {
        if (paid && !get().spend(1000)) return;
        set({ marketPool: rollMarket() });
      },
    }),
    {
      name: "smb-pro-save-v1",
      partialize: (s) => { const { match, lastResult, ...rest } = s as State & Actions; return rest as unknown as State; },
    }
  )
);
