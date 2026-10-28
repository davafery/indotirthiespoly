/**
 * Konohapoly - Rule Engine (Pure JS, Zero DOM Dependency)
 */

export const BOARD = [
  { id: 0, type: 'start', name: 'Gajian UMR' },
  { id: 1, type: 'prop', name: 'Lampung', group: 'lampung', price: 4000, rent: 150 },
  { id: 2, type: 'risiko', name: 'Risiko' },
  { id: 3, type: 'prop', name: 'Bengkulu', group: 'lampung', price: 4000, rent: 250 },
  { id: 4, type: 'ppn', name: 'PPN 12%' },
  { id: 5, type: 'trans', name: 'Tol Sumatra', price: 13000 },
  { id: 6, type: 'prop', name: 'Palembang', group: 'sumatra', price: 6500, rent: 400 },
  { id: 7, type: 'kesempatan', name: 'Kesempatan' },
  { id: 8, type: 'prop', name: 'Padang', group: 'sumatra', price: 6500, rent: 400 },
  { id: 9, type: 'prop', name: 'Medan', group: 'sumatra', price: 8000, rent: 550 },
  { id: 10, type: 'jail', name: 'Rutan' },
  { id: 11, type: 'prop', name: 'Pontianak', group: 'kalimantan', price: 9500, rent: 650 },
  { id: 12, type: 'kesempatan', name: 'Kesempatan' },
  { id: 13, type: 'prop', name: 'Balikpapan', group: 'kalimantan', price: 9500, rent: 650 },
  { id: 14, type: 'prop', name: 'IKN', group: 'kalimantan', price: 10500, rent: 800 },
  { id: 15, type: 'trans', name: 'Tol Laut', price: 13000 },
  { id: 16, type: 'prop', name: 'Makassar', group: 'sulawesi', price: 12000, rent: 950 },
  { id: 17, type: 'risiko', name: 'Risiko' },
  { id: 18, type: 'prop', name: 'Kendari', group: 'sulawesi', price: 12000, rent: 950 },
  { id: 19, type: 'prop', name: 'Manado', group: 'sulawesi', price: 13000, rent: 1050 },
  { id: 20, type: 'hibah', name: 'Dana Hibah' },
  { id: 21, type: 'prop', name: 'Ambon', group: 'timur', price: 14500, rent: 1200 },
  { id: 22, type: 'kesempatan', name: 'Kesempatan' },
  { id: 23, type: 'prop', name: 'Raja Ampat', type: 'prop', group: 'timur', price: 14500, rent: 1200 },
  { id: 24, type: 'prop', name: 'Jayapura', group: 'timur', price: 16000, rent: 1350 },
  { id: 25, type: 'trans', name: 'Bandara Sepi', price: 13000 },
  { id: 26, type: 'prop', name: 'Labuan Bajo', group: 'nusra', price: 17500, rent: 1450 },
  { id: 27, type: 'prop', name: 'Mandalika', group: 'nusra', price: 17500, rent: 1450 },
  { id: 28, type: 'risiko', name: 'Risiko' },
  { id: 29, type: 'prop', name: 'Bali', group: 'nusra', price: 18500, rent: 1600 },
  { id: 30, type: 'ciduk', name: 'Diciduk!' },
  { id: 31, type: 'prop', name: 'Surabaya', group: 'jawa', price: 20000, rent: 1750 },
  { id: 32, type: 'prop', name: 'Yogyakarta', group: 'jawa', price: 20000, rent: 1750 },
  { id: 33, type: 'lurah', name: 'Kelurahan' },
  { id: 34, type: 'prop', name: 'Semarang', group: 'jawa', price: 21000, rent: 1850 },
  { id: 35, type: 'trans', name: 'Kereta Cepat', price: 13000 },
  { id: 36, type: 'pejabat', name: 'Kantor Pejabat' },
  { id: 37, type: 'prop', name: 'PIK', group: 'jakarta', price: 23500, rent: 2350 },
  { id: 38, type: 'tilang', name: 'Razia Tilang' },
  { id: 39, type: 'prop', name: 'Menteng', group: 'jakarta', price: 26500, rent: 3300 }
];

export const GROUPS = {
  lampung: { name: 'Sumatra Selatan', color: '#9A6B4F', buildCost: 3500, members: [1, 3] },
  sumatra: { name: 'Sumatra', color: '#5BB8F0', buildCost: 3500, members: [6, 8, 9] },
  kalimantan: { name: 'Kalimantan', color: '#E0569B', buildCost: 6500, members: [11, 13, 14] },
  sulawesi: { name: 'Sulawesi', color: '#F28C28', buildCost: 6500, members: [16, 18, 19] },
  timur: { name: 'Maluku & Papua', color: '#E63946', buildCost: 10000, members: [21, 23, 24] },
  nusra: { name: 'Bali & Nusa Tenggara', color: '#E9B824', buildCost: 10000, members: [26, 27, 29] },
  jawa: { name: 'Jawa', color: '#2E9E4F', buildCost: 13000, members: [31, 32, 34] },
  jakarta: { name: 'Jakarta Elite', color: '#2D3A8C', buildCost: 13000, members: [37, 39] }
};

export const LVL_MULT = [5, 15, 32, 60];

export function M(state, n) {
  let inflEff = state.infl;
  if (state.decree === 'CETAK_UANG') inflEff *= 6.0;
  const val = Math.round((n * inflEff) / 50) * 50;
  return Math.max(50, val);
}

export function initGame(playersCount = 4, playerNames = []) {
  const colors = ['#E63946', '#1D8CF0', '#F2B705', '#22A55B'];
  const players = [];
  for (let i = 0; i < playersCount; i++) {
    players.push({
      id: i,
      name: playerNames[i] || `Pemain ${i + 1}`,
      color: colors[i],
      cash: 100000,
      pos: 0,
      jail: 0,
      jailCard: 0,
      hasPinjol: false,
      isBankrupt: false,
      isBot: true,
      afk: false
    });
  }

  const props = {};
  BOARD.forEach(tile => {
    if (tile.type === 'prop' || tile.type === 'trans') {
      props[tile.id] = {
        owner: null,
        lvl: 0, // 0: Tanah, 1: Rumah, 2: Ruko, 3: Landmark
        mortgaged: false,
        mortgageRoundsLeft: 0,
        frozenVal: null
      };
    }
  });

  return {
    round: 1,
    turnIdx: 0,
    phase: 'roll', // 'roll', 'decide', 'gameover'
    infl: 1.0,
    hibahPool: 0,
    doubleCount: 0,
    policy: null, // Kebijakan aktif dari Pemilu
    decree: null, // Dekrit aktif dari Presiden
    decreeRoundsLeft: 0,
    berita: null,
    krismon: false,
    players,
    props,
    ev: [],
    evSeq: 0,
    winner: null,
    pendingAction: null
  };
}

export function applyAction(state, actorId, action) {
  const S = JSON.parse(JSON.stringify(state));
  S.ev = [];

  const player = S.players[actorId];
  if (!player || player.isBankrupt || S.phase === 'gameover') return S;

  if (action.type === 'ROLL') {
    if (S.turnIdx !== actorId || S.phase !== 'roll') return S;

    const d1 = action.d1 || Math.floor(Math.random() * 6) + 1;
    const d2 = action.d2 || Math.floor(Math.random() * 6) + 1;
    const totalDice = d1 + d2;
    const isDouble = d1 === d2;

    S.ev.push({ k: 'dice', pid: actorId, d1, d2 });

    if (isDouble) {
      S.doubleCount++;
      if (S.doubleCount >= 3) {
        S.doubleCount = 0;
        sendToJail(S, player, 'Dadu dobel 3 kali');
        endTurn(S);
        return S;
      }
    } else {
      S.doubleCount = 0;
    }

    if (player.jail > 0) {
      handleJailRoll(S, player, isDouble, action.choice);
      endTurn(S);
      return S;
    }

    let moveDist = totalDice;
    if (S.decree === 'DADU_TIGA') moveDist += Math.floor(Math.random() * 6) + 1;
    if (S.decree === 'MUNDUR') moveDist = -moveDist;

    movePlayer(S, player, moveDist);
    return S;
  }

  if (action.type === 'DECIDE') {
    if (S.turnIdx !== actorId || S.phase !== 'decide') return S;
    handlePlayerChoice(S, player, action.choice);
    endTurn(S);
    return S;
  }

  if (action.type === 'MORTGAGE') {
    mortgageProp(S, player, action.tileId);
    return S;
  }

  if (action.type === 'UNMORTGAGE') {
    unmortgageProp(S, player, action.tileId);
    return S;
  }

  return S;
}

function movePlayer(S, player, steps) {
  const oldPos = player.pos;
  let newPos = (oldPos + steps + 40) % 40;

  // Cek Lewat START
  if (steps > 0 && newPos < oldPos) {
    let umr = Math.round(13000 * Math.pow(1.02, S.round - 1));
    if (S.policy === 'NAIK_UMR') umr = Math.round(umr * 1.25);
    if (S.policy === 'MAKAN_SIANG') umr += 3000;
    if (S.decree === 'POTONG_GAJI') umr = Math.round(umr * 0.5);

    let livingCost = M(S, 8000);
    if (S.policy === 'SUBSIDI_HIDUP') livingCost = Math.round(livingCost * 0.6);

    player.cash += umr;
    S.ev.push({ k: 'cash', pid: player.id, a: umr, w: 'Gajian UMR' });

    deductCash(S, player, livingCost, 'Biaya Hidup');

    if (S.policy === 'PAJAK_TUAN_TANAH') {
      const ownedCount = Object.values(S.props).filter(p => p.owner === player.id).length;
      if (ownedCount > 0) {
        deductCash(S, player, M(S, 700 * ownedCount), 'Pajak Tuan Tanah');
      }
    }

    if (player.hasPinjol) {
      const pinjolBill = Math.round(M(S, 10000) * 1.5);
      deductCash(S, player, pinjolBill, 'Pelunasan Pinjol');
      player.hasPinjol = false;
    }
  }

  player.pos = newPos;
  S.ev.push({ k: 'move', pid: player.id, pos: newPos });

  processTileLanding(S, player, newPos);
}

function processTileLanding(S, player, pos) {
  const tile = BOARD[pos];

  if (tile.type === 'prop' || tile.type === 'trans') {
    const pData = S.props[pos];
    if (pData.owner === null) {
      S.phase = 'decide';
      S.pendingAction = { type: 'BUY_LAND', tileId: pos, price: M(S, tile.price) };
    } else if (pData.owner === player.id) {
      if (!pData.mortgaged && pData.lvl < 3 && tile.type === 'prop') {
        const groupInfo = GROUPS[tile.group];
        S.phase = 'decide';
        S.pendingAction = { type: 'UPGRADE_BUILDING', tileId: pos, cost: M(S, groupInfo.buildCost) };
      } else {
        endTurn(S);
      }
    } else {
      // Milik Orang Lain
      if (!pData.mortgaged && S.decree !== 'LIBUR_NASIONAL') {
        let rent = calculateRent(S, pos);
        deductCash(S, player, rent, `Sewa ${tile.name}`, pData.owner);

        // Peluang Takeover
        if (pData.lvl < 3 && player.cash >= calculateTakeoverPrice(S, pos)) {
          S.phase = 'decide';
          S.pendingAction = { type: 'TAKEOVER', tileId: pos, price: calculateTakeoverPrice(S, pos) };
          return;
        }
      }
      endTurn(S);
    }
  } else if (tile.type === 'ciduk') {
    sendToJail(S, player, 'Diciduk Petak');
    endTurn(S);
  } else if (tile.type === 'ppn') {
    let tax = Math.max(M(S, 2000), Math.round(player.cash * 0.12));
    deductCash(S, player, tax, 'PPN 12%');
    S.hibahPool += tax;
    endTurn(S);
  } else if (tile.type === 'hibah') {
    if (S.hibahPool > 0) {
      player.cash += S.hibahPool;
      S.ev.push({ k: 'cash', pid: player.id, a: S.hibahPool, w: 'Cairkan Dana Hibah' });
      S.hibahPool = 0;
    }
    endTurn(S);
  } else if (tile.type === 'kesempatan' || tile.type === 'risiko') {
    drawCard(S, player, tile.type);
    endTurn(S);
  } else {
    endTurn(S);
  }
}

function calculateRent(S, tileId) {
  const tile = BOARD[tileId];
  const pData = S.props[tileId];

  if (tile.type === 'trans') {
    if (S.policy === 'TRANSPORT_GRATIS') return 0;
    const transOwned = BOARD.filter(b => b.type === 'trans' && S.props[b.id].owner === pData.owner).length;
    return M(S, 1650 * Math.pow(2, transOwned - 1));
  }

  let rent = M(S, tile.rent * LVL_MULT[pData.lvl]);
  const groupMembers = GROUPS[tile.group].members;
  const ownsAll = groupMembers.every(id => S.props[id].owner === pData.owner);
  if (ownsAll) rent *= 2;
  if (S.policy === 'PROYEK_MERCUSUAR' && pData.lvl > 0) rent = Math.round(rent * 1.5);
  if (S.decree === 'PAJAK_NASIONALISME') rent *= 3;
  return rent;
}

function calculateTakeoverPrice(S, tileId) {
  const tile = BOARD[tileId];
  const pData = S.props[tileId];
  const groupCost = GROUPS[tile.group].buildCost;
  const currentLandPrice = M(S, tile.price);
  const totalBuildCost = pData.lvl * M(S, groupCost);
  return 2 * (currentLandPrice + totalBuildCost);
}

function handlePlayerChoice(S, player, choice) {
  const pAct = S.pendingAction;
  if (!pAct) return;

  if (pAct.type === 'BUY_LAND') {
    if (choice === 'BUY' && player.cash >= pAct.price) {
      deductCash(S, player, pAct.price, `Beli Tanah ${BOARD[pAct.tileId].name}`);
      S.props[pAct.tileId].owner = player.id;
    }
  } else if (pAct.type === 'UPGRADE_BUILDING') {
    if (choice === 'OFFICIAL') {
      const isAutoPass = S.policy === 'OMNIBUS';
      const rollSuccess = isAutoPass || Math.random() >= 0.3;
      if (rollSuccess) {
        if (player.cash >= pAct.cost) {
          deductCash(S, player, pAct.cost, 'Bangun Izin Resmi');
          S.props[pAct.tileId].lvl++;
        }
      } else {
        const waste = M(S, Math.round(pAct.cost * 0.2));
        deductCash(S, player, waste, 'Berkas Kurang Satu (Hangus)');
      }
    } else if (choice === 'PELICIN') {
      const pelicinCost = Math.round(pAct.cost * 1.5);
      if (player.cash >= pelicinCost) {
        deductCash(S, player, pelicinCost, 'Uang Pelicin Bangunan');
        S.props[pAct.tileId].lvl++;
      }
    }
  } else if (pAct.type === 'TAKEOVER') {
    if (choice === 'TAKEOVER' && player.cash >= pAct.price) {
      const oldOwner = S.props[pAct.tileId].owner;
      deductCash(S, player, pAct.price, 'Takeover Properti', oldOwner);
      S.props[pAct.tileId].owner = player.id;
    }
  }
  S.pendingAction = null;
}

function deductCash(S, player, amount, reason, targetPid = null) {
  player.cash -= amount;
  S.ev.push({ k: 'cash', pid: player.id, a: -amount, w: reason });

  if (targetPid !== null && targetPid !== undefined) {
    const target = S.players[targetPid];
    if (target && !target.isBankrupt) {
      target.cash += amount;
      S.ev.push({ k: 'cash', pid: target.id, a: amount, w: `Penerimaan ${reason}` });
    }
  }

  if (player.cash < 0) {
    handleDistressPipeline(S, player, targetPid);
  }
}

function handleDistressPipeline(S, player, creditorPid) {
  // 1. Jual bangunan otomatis (50% harga bangun)
  const ownedProps = Object.keys(S.props).filter(id => S.props[id].owner === player.id);
  for (const id of ownedProps) {
    const pData = S.props[id];
    while (pData.lvl > 0 && player.cash < 0) {
      const buildCost = GROUPS[BOARD[id].group].buildCost;
      const refund = Math.round(M(S, buildCost) * 0.5);
      pData.lvl--;
      player.cash += refund;
      S.ev.push({ k: 'cash', pid: player.id, a: refund, w: `Jual Bangunan ${BOARD[id].name}` });
    }
  }

  // 2. Gadai tanah tanpa bangunan
  if (player.cash < 0) {
    for (const id of ownedProps) {
      const pData = S.props[id];
      if (pData.lvl === 0 && !pData.mortgaged && player.cash < 0) {
        mortgageProp(S, player, id);
      }
    }
  }

  // 3. Pinjol darurat
  if (player.cash < 0 && !player.hasPinjol) {
    const pinjolAmount = M(S, 10000);
    player.cash += pinjolAmount;
    player.hasPinjol = true;
    S.ev.push({ k: 'cash', pid: player.id, a: pinjolAmount, w: 'Pinjol Darurat' });
  }

  // 4. Bangkrut jika masih < 0
  if (player.cash < 0) {
    player.isBankrupt = true;
    player.cash = 0;
    S.ev.push({ k: 'bankrupt', pid: player.id });

    // Transfer/Rilis Aset
    ownedProps.forEach(id => {
      const pData = S.props[id];
      if (creditorPid !== null && creditorPid !== undefined && !S.players[creditorPid].isBankrupt) {
        pData.owner = creditorPid;
      } else {
        pData.owner = null;
        pData.lvl = 0;
        pData.mortgaged = false;
      }
    });
  }
}

function mortgageProp(S, player, tileId) {
  const pData = S.props[tileId];
  if (!pData || pData.owner !== player.id || pData.mortgaged || pData.lvl > 0) return;

  const tilePrice = S.krismon && pData.frozenVal ? pData.frozenVal : M(S, BOARD[tileId].price);
  const payout = Math.round(tilePrice * 0.5);

  pData.mortgaged = true;
  pData.mortgageRoundsLeft = 4;
  pData.frozenVal = tilePrice;

  player.cash += payout;
  S.ev.push({ k: 'cash', pid: player.id, a: payout, w: `Gadai ${BOARD[tileId].name}` });
}

function unmortgageProp(S, player, tileId) {
  const pData = S.props[tileId];
  if (!pData || pData.owner !== player.id || !pData.mortgaged) return;

  const tilePrice = S.krismon && pData.frozenVal ? pData.frozenVal : M(S, BOARD[tileId].price);
  const redeemCost = Math.round(tilePrice * 0.55);

  if (player.cash >= redeemCost) {
    deductCash(S, player, redeemCost, `Tebus Gadai ${BOARD[tileId].name}`);
    pData.mortgaged = false;
    pData.mortgageRoundsLeft = 0;
  }
}

function sendToJail(S, player, reason) {
  player.jail = 3;
  player.pos = 10;
  S.ev.push({ k: 'jail', pid: player.id, reason });
}

function handleJailRoll(S, player, isDouble, choice) {
  if (choice === 'PAY' && player.cash >= M(S, 3000)) {
    deductCash(S, player, M(S, 3000), 'Jaminan Rutan');
    player.jail = 0;
  } else if (choice === 'BRIBE' && player.cash >= M(S, 1500)) {
    deductCash(S, player, M(S, 1500), 'Suap Sipir');
    if (Math.random() >= 0.3) {
      player.jail = 0;
    }
  } else if (choice === 'CARD' && player.jailCard > 0) {
    player.jailCard--;
    player.jail = 0;
  } else if (isDouble) {
    player.jail = 0;
  } else {
    player.jail--;
  }
}

function drawCard(S, player, deckType) {
  if (deckType === 'kesempatan') {
    const gain = M(S, 3000 + Math.floor(Math.random() * 12000));
    player.cash += gain;
    S.ev.push({ k: 'cash', pid: player.id, a: gain, w: 'Kartu Kesempatan' });
  } else {
    const loss = M(S, 3000 + Math.floor(Math.random() * 9000));
    deductCash(S, player, loss, 'Kartu Risiko');
  }
}

function endTurn(S) {
  S.phase = 'roll';
  S.pendingAction = null;

  // Cek Pemenang
  const activePlayers = S.players.filter(p => !p.isBankrupt);
  if (activePlayers.length <= 1) {
    S.phase = 'gameover';
    S.winner = activePlayers[0] ? activePlayers[0].id : null;
    return;
  }

  // Pindah Giliran
  let nextIdx = (S.turnIdx + 1) % S.players.length;
  while (S.players[nextIdx].isBankrupt) {
    nextIdx = (nextIdx + 1) % S.players.length;
  }

  // Jika kembali ke pemain pertama yang hidup -> Putaran Baru
  if (nextIdx <= S.turnIdx) {
    advanceRound(S);
  }

  S.turnIdx = nextIdx;
}

function advanceRound(S) {
  S.round++;

  // 1. Update Inflasi
  let rate = 0.022 + Math.min(0.01, S.round * 0.0004);
  if (S.policy === 'MAKAN_SIANG') rate += 0.01;

  if (S.round >= 40) {
    S.krismon = true;
    rate += 1.0; // Sudden death +100% per putaran
  }

  S.infl *= (1 + rate);

  // 2. Proses Durasi Gadai
  Object.keys(S.props).forEach(id => {
    const pData = S.props[id];
    if (pData.mortgaged) {
      pData.mortgageRoundsLeft--;
      if (pData.mortgageRoundsLeft <= 0) {
        // Sita Negara
        pData.owner = null;
        pData.mortgaged = false;
        pData.lvl = 0;
        S.ev.push({ k: 'confiscate', tileId: Number(id) });
      }
    }
  });

  // 3. Dekrit Durasi
  if (S.decreeRoundsLeft > 0) {
    S.decreeRoundsLeft--;
    if (S.decreeRoundsLeft <= 0) S.decree = null;
  }

  // 4. Trigger Pemilu tiap 10 putaran
  if (S.round % 10 === 0) {
    const policies = ['NAIK_UMR', 'SUBSIDI_HIDUP', 'MAKAN_SIANG', 'PAJAK_TUAN_TANAH', 'OMNIBUS', 'TRANSPORT_GRATIS', 'AMNESTI', 'PROYEK_MERCUSUAR'];
    S.policy = policies[Math.floor(Math.random() * policies.length)];
  }

  // 5. Trigger Dekrit opsional
  if (S.round >= 4 && !S.decree && Math.random() < 0.3) {
    const decrees = ['MUNDUR', 'DADU_TIGA', 'CETAK_UANG', 'LIBUR_NASIONAL', 'PAJAK_NASIONALISME', 'POTONG_GAJI'];
    S.decree = decrees[Math.floor(Math.random() * decrees.length)];
    S.decreeRoundsLeft = 2;
  }
}