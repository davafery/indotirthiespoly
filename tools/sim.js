/**
 * Konohapoly - Simulation Tool (300 Games Validation)
 */

import { initGame, applyAction, BOARD } from '../src/engine.js';

function runBotGame(playersCount) {
  let S = initGame(playersCount);
  let steps = 0;
  const maxSteps = 10000;

  while (S.phase !== 'gameover' && steps < maxSteps) {
    steps++;
    const actor = S.turnIdx;
    const player = S.players[actor];

    if (S.phase === 'roll') {
      let choice = null;
      if (player.jail > 0) {
        choice = player.cash > 20000 ? 'PAY' : 'ROLL';
      }

      // Bot unmortgage jika punya cukup uang
      Object.keys(S.props).forEach(id => {
        const pData = S.props[id];
        if (pData.owner === actor && pData.mortgaged && player.cash > 30000) {
          S = applyAction(S, actor, { type: 'UNMORTGAGE', tileId: Number(id) });
        }
      });

      S = applyAction(S, actor, { type: 'ROLL', choice });
    } else if (S.phase === 'decide') {
      const pAct = S.pendingAction;
      let choice = 'SKIP';

      if (pAct) {
        if (pAct.type === 'BUY_LAND') {
          choice = player.cash >= pAct.price ? 'BUY' : 'SKIP';
        } else if (pAct.type === 'UPGRADE_BUILDING') {
          if (player.cash >= pAct.cost * 1.5) choice = 'PELICIN';
          else if (player.cash >= pAct.cost) choice = 'OFFICIAL';
        } else if (pAct.type === 'TAKEOVER') {
          choice = player.cash >= pAct.price * 1.3 ? 'TAKEOVER' : 'SKIP';
        }
      }

      S = applyAction(S, actor, { type: 'DECIDE', choice });
    }
  }

  return S;
}

function runSimulation() {
  console.log("=== MEMULAI SIMULASI 300 GAME KONOHAPOLY ===");
  const totalGames = 300;
  const roundResults = [];
  let errorCount = 0;
  let negativeCashCount = 0;
  let nanCount = 0;

  for (let i = 0; i < totalGames; i++) {
    const playerCount = (i % 2 === 0) ? 3 : 4;
    try {
      const finalState = runBotGame(playerCount);

      // Verifikasi integritas angka & uang
      finalState.players.forEach(p => {
        if (isNaN(p.cash) || isNaN(p.pos)) nanCount++;
        if (p.cash < 0) negativeCashCount++;
      });

      roundResults.push(finalState.round);
    } catch (err) {
      errorCount++;
      console.error(`Error pada game #${i + 1}:`, err);
    }
  }

  roundResults.sort((a, b) => a - b);
  const median = roundResults[Math.floor(roundResults.length / 2)];
  const p90 = roundResults[Math.floor(roundResults.length * 0.9)];
  const max = Math.max(...roundResults);
  const min = Math.min(...roundResults);

  console.log("\n=== HASIL SIMULASI ===");
  console.log(`Total Game         : ${totalGames}`);
  console.log(`Error Status       : ${errorCount} error`);
  console.log(`Negative Cash Check: ${negativeCashCount} kasus`);
  console.log(`NaN Value Check    : ${nanCount} kasus`);
  console.log(`-----------------------------------`);
  console.log(`Min Putaran        : ${min}`);
  console.log(`Median Putaran     : ${median} (Target: 40–45)`);
  console.log(`P90 Putaran        : ${p90} (Target: < 50)`);
  console.log(`Max Putaran        : ${max} (Target: ~55)`);

  const passed = errorCount === 0 && negativeCashCount === 0 && nanCount === 0 && median >= 40 && median <= 45 && p90 <= 50;
  console.log(`\nKESIMPULAN TAHAP 1 : ${passed ? "✅ LULUS KRITERIA" : "⚠️ PERLU PENYESUAIAN BALANSING"}`);
}

runSimulation();