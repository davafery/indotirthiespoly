/**
 * Konohapoly - Engine Lengkap (Aturan, Ekonomi, Kartu, Berita, Pemilu, Dekrit, Bencana)
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
  { id: 23, type: 'prop', name: 'Raja Ampat', group: 'timur', price: 14500, rent: 1200 },
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

// Kartu Kesempatan (25)
export const DECK_KESEMPATAN = [
  { text: 'Jalan Rusak Viral! Gubernur panik dan memperbaiki jalanmu.', type: 'CASH', amount: 8000 },
  { text: 'Endorse Produk Lokal masuk, bayaran lumayan.', type: 'CASH', amount: 5000 },
  { text: 'Juara Panjat Pinang Tingkat Kecamatan!', type: 'CASH', amount: 3000 },
  { text: 'Proyek Mangkrak Akhirnya Dibayar.', type: 'CASH', amount: 15000 },
  { text: 'Sertifikat Pagar Laut dijual ke pengembang.', type: 'CASH', amount: 18000 },
  { text: 'THR Cair dari Tempat Kerja.', type: 'CASH', amount: 7000 },
  { text: 'Dapat Warisan Tante dari Belanda.', type: 'CASH', amount: 20000 },
  { text: 'Menang Undian Bank BUMN.', type: 'CASH', amount: 10000 },
  { text: 'Jadi Buzzer Bayaran, dapat dana segar dari yang terkayu.', type: 'BUZZER' },
  { text: 'Dapat Proyek Bansos Sembako.', type: 'CASH', amount: 12000 },
  { text: 'Es Teh Viral Laris Manis di Pinggir Jalan.', type: 'CASH', amount: 4000 },
  { text: 'Insentif Kartu Prakerja Cair.', type: 'CASH', amount: 3500 },
  { text: 'Kenal Orang Dalam di Kepolisian.', type: 'JAIL_CARD' },
  { text: 'Kenal Jaksa Senior.', type: 'JAIL_CARD' },
  { text: 'Naik Kereta Cepat Gratis ke Transportasi Terdekat.', type: 'MOVE_TRANS' },
  { text: 'Jalan-jalan ke Menteng, mengagumi rumah pejabat.', type: 'MOVE_TO', pos: 39 },
  { text: 'Pindah ke IKN untuk investasi masa depan.', type: 'MOVE_TO', pos: 14 },
  { text: 'Mudik Gratis dari BUMN, maju 5 petak.', type: 'MOVE_REL', steps: 5 },
  { text: 'Pulang Kampung! Maju ke tanah milikmu terdekat.', type: 'MOVE_OWNED' },
  { text: 'Renovasi Rumah dari Dana CSR Perusahaan.', type: 'UPGRADE_FREE' },
  { text: 'Lapor ke KPK! Pemain teratas diperiksa.', type: 'KPK_ATTACK' },
  { text: 'Bawa Satpol PP! Gusur tanah kosong lawan termahal.', type: 'GUSUR_OPP' },
  { text: 'Main Slot Gacor! (Bisa menang / kalah).', type: 'SLOT' },
  { text: 'Rombongan Pejabat Lewat! Mundur 3 petak.', type: 'MOVE_REL', steps: -3 },
  { text: 'Hoaks Kamu Viral! Dapat royalti klikbaite.', type: 'CASH', amount: 6000 }
];

// Kartu Risiko (21)
export const DECK_RISIKO = [
  { text: 'Kena OTT KPK karena ketahuan bagi-bagi proyek!', type: 'JAIL' },
  { text: 'PHK Massal di Perusahaan Startup!', type: 'CASH', amount: -8000 },
  { text: 'Investasi Bodong Kripto Bodong Krismon!', type: 'CASH', amount: -12000 },
  { text: 'Banjir Kiriman! Biaya perbaikan per bangunan.', type: 'REPAIR_FEE', cost: 2000 },
  { text: 'Pinjol Menagih dengan Bunga Mencekik!', type: 'CASH', amount: -6000 },
  { text: 'Harga Beras Naik 30%!', type: 'CASH', amount: -4000 },
  { text: 'Potongan Iuran Tapera Otomatis.', type: 'CASH', amount: -3500 },
  { text: 'Iuran BPJS Kesehatan Naik Lagi.', type: 'CASH', amount: -3000 },
  { text: 'Tilang Elektronik (ETLE) Melayang.', type: 'CASH', amount: -2500 },
  { text: 'Bayar Uang Keamanan Ormas Lokal.', type: 'CASH', amount: -4000 },
  { text: 'Pajak Bumi dan Bangunan Naik.', type: 'CASH', amount: -5000 },
  { text: 'Gempa Bumi! Bangunan tertinggimu turun 1 level.', type: 'DOWNGRADE' },
  { text: 'Kecopetan Dompet di KRL Jabodetabek.', type: 'CASH', amount: -3000 },
  { text: 'Dibegal di Jalan Lintas Sumatra.', type: 'CASH', amount: -7000 },
  { text: 'Utang Teman Ditagih Tapi Dihapus.', type: 'CASH', amount: -4500 },
  { text: 'Digusur Satpol PP! Tanah kosongmu disita.', type: 'DISITA_SATPOL' },
  { text: 'Dipanggil Kelurahan untuk Klarifikasi Berkas.', type: 'MOVE_TO', pos: 33 },
  { text: 'Ijazah Dipertanyakan, Bayar Pengacara.', type: 'CASH', amount: -9000 },
  { text: 'Kena Proyek Tol! Bangunan digusur ganti rugi seadanya.', type: 'GUSUR_TOL' },
  { text: 'Arisan RT Bayar Iuran Bulanan.', type: 'CASH', amount: -2000 },
  { text: 'Bansos Dipotong Oknum Kelurahan.', type: 'CASH', amount: -1500 }
];

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
        lvl: 0,
        mortgaged: false,
        mortgageRoundsLeft: 0,
        frozenVal: null
      };
    }
  });

  return {
    round: 1,
    turnIdx: 0,
    phase: 'roll',
    infl: 1.0,
    hibahPool: 0,
    doubleCount: 0,
    policy: null,
    decree: null,
    decreeRoundsLeft: 0,
    berita: null,
    bencana: null,
    bencanaRoundsLeft: 0,
    krismon: false,
    players,
    props,
    ev: [],
    evSeq: 0,
    winner: null,
    pendingAction: null,
    votingState: null
  };
}

export function applyAction(state, actorId, action) {
  const S = JSON.parse(JSON.stringify(state));
  S.ev = [];

  const player = S.players[actorId];
  if (!player || player.isBankrupt || S.phase === 'gameover') return S;

  if (action.type === 'VOTE_POLICY') {
    if (S.votingState && S.votingState.active) {
      S.votingState.votes[actorId] = action.policy;
      S.votingState.bribes[actorId] = action.bribe || 0;

      if (action.bribe > 0) {
        deductCash(S, player, action.bribe, 'Serangan Fajar Pemilu');
      }

      const totalVotesNeeded = S.players.filter(p => !p.isBankrupt).length;
      if (Object.keys(S.votingState.votes).length >= totalVotesNeeded) {
        // Tentukan pemenang pemilu
        const counts = {};
        Object.keys(S.votingState.votes).forEach(pid => {
          const pol = S.votingState.votes[pid];
          const bribeBonus = Math.floor((S.votingState.bribes[pid] || 0) / 5000);
          counts[pol] = (counts[pol] || 0) + 1 + Math.min(2, bribeBonus);
        });

        let winPolicy = Object.keys(counts)[0];
        let maxV = -1;
        Object.keys(counts).forEach(pol => {
          if (counts[pol] > maxV) {
            maxV = counts[pol];
            winPolicy = pol;
          }
        });

        S.policy = winPolicy;
        S.votingState = null;
        S.ev.push({ k: 'notif', text: `🗳️ Hasil Pemilu: Kebijakan ${winPolicy} Berlaku!` });
      }
    }
    return S;
  }

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
    if (S.decree === 'EFF_DADU') moveDist = Math.floor(Math.random() * 6) + 1;
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
      if (!pData.mortgaged && S.decree !== 'LIBUR_NASIONAL' && S.bencana !== 'BANJIR') {
        let rent = calculateRent(S, pos);
        deductCash(S, player, rent, `Sewa ${tile.name}`, pData.owner);

        if (pData.lvl < 3 && player.cash >= calculateTakeoverPrice(S, pos)) {
          S.phase = 'decide';
          S.pendingAction = { type: 'TAKEOVER', tileId: pos, price: calculateTakeoverPrice(S, pos) };
          return;
        }
      }
      endTurn(S);
    }
  } else if (tile.type === 'ciduk') {
    S.phase = 'decide';
    S.pendingAction = { type: 'CIDUK_CHOICE' };
  } else if (tile.type === 'pejabat') {
    S.phase = 'decide';
    S.pendingAction = { type: 'PEJABAT_CHOICE' };
  } else if (tile.type === 'lurah') {
    S.phase = 'decide';
    S.pendingAction = { type: 'LURAH_CHOICE' };
  } else if (tile.type === 'tilang') {
    S.phase = 'decide';
    S.pendingAction = { type: 'TILANG_CHOICE' };
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
  } else if (pAct.type === 'CIDUK_CHOICE') {
    if (choice === 'SOGOK' && player.cash >= M(S, 8000)) {
      deductCash(S, player, M(S, 8000), 'Uang Sogok Penyidik');
      if (Math.random() < 0.5) {
        S.ev.push({ k: 'notif', text: 'Sogokan berhasil! Kamu lolos.' });
      } else {
        sendToJail(S, player, 'Sogokan Ketahuan!');
      }
    } else {
      sendToJail(S, player, 'Pasrah Diciduk');
    }
  } else if (pAct.type === 'PEJABAT_CHOICE') {
    if (choice === 'UPETI' && player.cash >= M(S, 8000)) {
      deductCash(S, player, M(S, 8000), 'Setor Upeti Pejabat');
      const roll = Math.random();
      if (roll < 0.55) {
        const reward = M(S, 20000);
        player.cash += reward;
        S.ev.push({ k: 'cash', pid: player.id, a: reward, w: 'Menang Tender Proyek' });
      } else if (roll < 0.75) {
        S.ev.push({ k: 'notif', text: 'Zonk! Upeti dimakan pejabat tanpa tender.' });
      } else {
        sendToJail(S, player, 'Kena OTT di Kantor Pejabat');
      }
    }
  } else if (pAct.type === 'TILANG_CHOICE') {
    if (choice === 'DAMAI' && player.cash >= M(S, 2500)) {
      deductCash(S, player, M(S, 2500), 'Uang Damai Tilang');
      if (Math.random() < 0.25) {
        S.ev.push({ k: 'notif', text: 'Damai terekam kamera warga dan viral! Kena sanksi.' });
        deductCash(S, player, M(S, 3000), 'Denda Viral');
      }
    } else if (choice === 'RESMI' && player.cash >= M(S, 6500)) {
      deductCash(S, player, M(S, 6500), 'Denda Resmi Tilang');
      S.hibahPool += M(S, 6500);
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

  if (player.cash < 0) {
    for (const id of ownedProps) {
      const pData = S.props[id];
      if (pData.lvl === 0 && !pData.mortgaged && player.cash < 0) {
        mortgageProp(S, player, id);
      }
    }
  }

  if (player.cash < 0 && !player.hasPinjol) {
    const pinjolAmount = M(S, 10000);
    player.cash += pinjolAmount;
    player.hasPinjol = true;
    S.ev.push({ k: 'cash', pid: player.id, a: pinjolAmount, w: 'Pinjol Darurat' });
  }

  if (player.cash < 0) {
    player.isBankrupt = true;
    player.cash = 0;
    S.ev.push({ k: 'bankrupt', pid: player.id });

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
  const deck = deckType === 'kesempatan' ? DECK_KESEMPATAN : DECK_RISIKO;
  const card = deck[Math.floor(Math.random() * deck.length)];

  S.ev.push({ k: 'card', pid: player.id, text: card.text });

  if (card.type === 'CASH') {
    if (card.amount > 0) {
      const gain = M(S, card.amount);
      player.cash += gain;
      S.ev.push({ k: 'cash', pid: player.id, a: gain, w: card.text });
    } else {
      const loss = M(S, Math.abs(card.amount));
      deductCash(S, player, loss, card.text);
    }
  } else if (card.type === 'JAIL') {
    sendToJail(S, player, card.text);
  } else if (card.type === 'JAIL_CARD') {
    player.jailCard++;
  } else if (card.type === 'MOVE_TO') {
    player.pos = card.pos;
    processTileLanding(S, player, card.pos);
  } else if (card.type === 'MOVE_REL') {
    player.pos = (player.pos + card.steps + 40) % 40;
    processTileLanding(S, player, player.pos);
  }
}

function endTurn(S) {
  S.phase = 'roll';
  S.pendingAction = null;

  const activePlayers = S.players.filter(p => !p.isBankrupt);
  if (activePlayers.length <= 1) {
    S.phase = 'gameover';
    S.winner = activePlayers[0] ? activePlayers[0].id : null;
    return;
  }

  let nextIdx = (S.turnIdx + 1) % S.players.length;
  while (S.players[nextIdx].isBankrupt) {
    nextIdx = (nextIdx + 1) % S.players.length;
  }

  if (nextIdx <= S.turnIdx) {
    advanceRound(S);
  }

  S.turnIdx = nextIdx;
}

function advanceRound(S) {
  S.round++;

  let rate = 0.022 + Math.min(0.01, S.round * 0.0004);
  if (S.policy === 'MAKAN_SIANG') rate += 0.01;

  if (S.round >= 40) {
    S.krismon = true;
    rate += 1.0;
  }

  S.infl *= (1 + rate);

  Object.keys(S.props).forEach(id => {
    const pData = S.props[id];
    if (pData.mortgaged) {
      pData.mortgageRoundsLeft--;
      if (pData.mortgageRoundsLeft <= 0) {
        pData.owner = null;
        pData.mortgaged = false;
        pData.lvl = 0;
        S.ev.push({ k: 'confiscate', tileId: Number(id) });
      }
    }
  });

  if (S.decreeRoundsLeft > 0) {
    S.decreeRoundsLeft--;
    if (S.decreeRoundsLeft <= 0) S.decree = null;
  }

  if (S.round % 10 === 0) {
    S.votingState = {
      active: true,
      options: ['NAIK_UMR', 'SUBSIDI_HIDUP', 'MAKAN_SIANG', 'PAJAK_TUAN_TANAH', 'OMNIBUS', 'TRANSPORT_GRATIS'],
      votes: {},
      bribes: {}
    };
  }

  if (S.round >= 4 && !S.decree && Math.random() < 0.3) {
    const decrees = ['MUNDUR', 'DADU_TIGA', 'EFF_DADU', 'CETAK_UANG', 'LIBUR_NASIONAL', 'PAJAK_NASIONALISME', 'POTONG_GAJI'];
    S.decree = decrees[Math.floor(Math.random() * decrees.length)];
    S.decreeRoundsLeft = 2;
    S.ev.push({ k: 'notif', text: `📜 DEKRIT PRESIDEN: ${S.decree} berlaku 2 putaran!` });
  }
}
