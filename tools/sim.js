#!/usr/bin/env node
'use strict';

const Engine = require('../src/engine.js');

const BOT_POOL = [
  { name: 'Pak RT', isBot: true },
  { name: 'Bu Lurah', isBot: true },
  { name: 'Mas Ordal', isBot: true },
  { name: 'Bang Buzzer', isBot: true }
];

function validateState(S, stepLabel) {
  if (!Number.isFinite(S.infl) || S.infl <= 0) {
    throw new Error(`Invalid inflation (${S.infl}) at ${stepLabel}`);
  }
  if (!Number.isFinite(S.hibah) || S.hibah < 0) {
    throw new Error(`Invalid hibah (${S.hibah}) at ${stepLabel}`);
  }
  for (const p of S.players) {
    if (!Number.isFinite(p.cash)) {
      throw new Error(`NaN/Infinite cash for ${p.name} at ${stepLabel}`);
    }
    if (p.cash < 0) {
      throw new Error(`Negative cash (${p.cash}) for ${p.name} at ${stepLabel}`);
    }
    if (p.pos < 0 || p.pos >= 40 || !Number.isInteger(p.pos)) {
      throw new Error(`Invalid position (${p.pos}) for ${p.name} at ${stepLabel}`);
    }
  }
}

function runSingleGame(playerCount, seed) {
  const players = BOT_POOL.slice(0, playerCount).map((b, i) => ({
    id: `p${i + 1}`,
    name: b.name,
    isBot: true
  }));

  let S = Engine.createInitialState({ players, seed });
  validateState(S, 'init');

  let steps = 0;
  const maxSteps = 5000;
  let pinjolCount = 0;
  let suddenDeathTriggered = false;

  while (S.phase !== 'gameover' && steps < maxSteps) {
    steps += 1;

    if (S.phase === 'vote' && S.voteState) {
      const pendingVoters = S.players.filter(p => !p.bankrupt && !S.voteState.votes[p.id]);
      if (pendingVoters.length === 0) {
        throw new Error(`Stuck in vote phase at round ${S.round}`);
      }
      for (const voter of pendingVoters) {
        const act = Engine.chooseBotAction(S, voter.id);
        const res = Engine.apply(S, voter.id, act);
        S = res.state;
        validateState(S, `round=${S.round} vote(${voter.id})`);
      }
      continue;
    }

    const active = S.players[S.turnIdx];
    if (!active || active.bankrupt) {
      throw new Error(`Active player invalid/bankrupt at round ${S.round}, turnIdx=${S.turnIdx}`);
    }

    const action = Engine.chooseBotAction(S, active.id);
    if (!action) {
      throw new Error(`Bot returned null action in phase=${S.phase} at round ${S.round}`);
    }

    const res = Engine.apply(S, active.id, action);
    S = res.state;
    validateState(S, `round=${S.round} step=${steps} phase=${S.phase}`);

    if (S.suddenDeath) suddenDeathTriggered = true;
    for (const ev of res.events) {
      if (ev.k === 'pinjol') pinjolCount += 1;
    }
  }

  if (S.phase !== 'gameover') {
    throw new Error(`Game did not finish within ${maxSteps} steps (stuck at round ${S.round})`);
  }

  return {
    playerCount,
    seed,
    rounds: S.round,
    steps,
    winner: S.winner,
    suddenDeathTriggered,
    pinjolCount
  };
}

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = (sortedArr.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedArr[lo];
  return sortedArr[lo] + (sortedArr[hi] - sortedArr[lo]) * (idx - lo);
}

function summarize(results) {
  const rounds = results.map(r => r.rounds).sort((a, b) => a - b);
  const mean = rounds.reduce((a, b) => a + b, 0) / rounds.length;
  const sdRate = (results.filter(r => r.suddenDeathTriggered).length / results.length) * 100;
  const avgPinjol = results.reduce((a, b) => a + b.pinjolCount, 0) / results.length;

  return {
    count: results.length,
    min: rounds[0],
    p10: percentile(rounds, 0.10),
    p25: percentile(rounds, 0.25),
    median: percentile(rounds, 0.50),
    mean: Number(mean.toFixed(2)),
    p75: percentile(rounds, 0.75),
    p90: percentile(rounds, 0.90),
    max: rounds[rounds.length - 1],
    sdRate: Number(sdRate.toFixed(1)),
    avgPinjol: Number(avgPinjol.toFixed(2))
  };
}

function main() {
  const args = process.argv.slice(2);
  let totalGames = 300;
  let baseSeed = 202601;

  for (const arg of args) {
    if (arg.startsWith('--games=')) totalGames = Math.max(2, parseInt(arg.split('=')[1], 10) || 300);
    if (arg.startsWith('--seed=')) baseSeed = parseInt(arg.split('=')[1], 10) || 202601;
  }

  const half = Math.floor(totalGames / 2);
  const results3p = [];
  const results4p = [];
  const errors = [];

  const t0 = Date.now();

  for (let i = 0; i < half; i++) {
    try {
      results3p.push(runSingleGame(3, baseSeed + i * 2));
    } catch (err) {
      errors.push({ playerCount: 3, seed: baseSeed + i * 2, message: err.message });
    }
  }

  for (let i = 0; i < totalGames - half; i++) {
    try {
      results4p.push(runSingleGame(4, baseSeed + i * 2 + 1));
    } catch (err) {
      errors.push({ playerCount: 4, seed: baseSeed + i * 2 + 1, message: err.message });
    }
  }

  const elapsedMs = Date.now() - t0;
  const allResults = results3p.concat(results4p);
  const s3 = summarize(results3p);
  const s4 = summarize(results4p);
  const sAll = summarize(allResults);

  console.log('=================================================================');
  console.log(`KONOHAPOLY SIMULATOR — ${totalGames} Game Bot-vs-Bot (${elapsedMs} ms)`);
  console.log('=================================================================');
  console.table({
    '3 Pemain': s3,
    '4 Pemain': s4,
    'Gabungan (300)': sAll
  });

  if (errors.length > 0) {
    console.error(`\n[GAGAL] Ditemukan ${errors.length} error:`);
    errors.slice(0, 5).forEach(e => console.error(` - (${e.playerCount}p, seed=${e.seed}): ${e.message}`));
    process.exit(1);
  }

  const checks = [
    { label: '0 Error / Exception', pass: errors.length === 0, val: `${errors.length}` },
    { label: '0 Uang Negatif / NaN', pass: true, val: 'Terverifikasi tiap langkah' },
    { label: 'Median 40–45 putaran', pass: sAll.median >= 40 && sAll.median <= 45, val: `${sAll.median}` },
    { label: 'p90 di bawah 50 putaran', pass: sAll.p90 < 50, val: `${sAll.p90.toFixed(1)}` },
    { label: 'Maksimal sekitar 55 putaran', pass: sAll.max <= 58, val: `${sAll.max}` }
  ];

  console.log('\nVerifikasi Kriteria Tahap 1:');
  let allPassed = true;
  for (const c of checks) {
    console.log(` [${c.pass ? 'PASS' : 'FAIL'}] ${c.label} -> ${c.val}`);
    if (!c.pass) allPassed = false;
  }

  if (!allPassed) process.exit(1);
}

main();