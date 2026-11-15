(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.KonohapolyEngine = api;
    root.Engine = root.Engine || api;
    root.GameEngine = root.GameEngine || api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LVL_NAMES = ['Tanah Kosong', 'Rumah', 'Ruko', 'Landmark'];
  const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
  const BOT_NAMES = ['Bot Pak RT', 'Bot Bu Lurah', 'Bot Kang Parkir', 'Bot Sultan KW'];

  const DEFAULT_GROUPS = {
    coklat: { name: 'Pinggiran Kota', color: '#92400e' },
    biru_muda: { name: 'Kawasan Padat', color: '#38bdf8' },
    merah_muda: { name: 'Sentra Kuliner', color: '#ec4899' },
    oranye: { name: 'Zona Niaga', color: '#f97316' },
    merah: { name: 'Distrik Hiburan', color: '#ef4444' },
    kuning: { name: 'Kawasan Bisnis', color: '#eab308' },
    hijau: { name: 'Perumahan Elit', color: '#22c55e' },
    biru_tua: { name: 'Pusat Kekuasaan', color: '#2563eb' },
    transport: { name: 'Simpul Transportasi', color: '#64748b' },
    utilitas: { name: 'Infrastruktur Publik', color: '#14b8a6' }
  };

  const DEFAULT_BOARD = [
    { id: 0, name: 'START', desc: 'Titik awal perjuangan. Lewati untuk menerima gaji (dan penagihan pinjol jika ada).', price: 0, rent: 0, group: null, type: 'start' },
    { id: 1, name: 'Gang Senggol', desc: 'Kontrakan padat merayap, selalu ramai penghuni.', price: 1200000, rent: 180000, group: 'coklat', type: 'prop' },
    { id: 2, name: 'Kesempatan', desc: 'Ambil satu Kartu Kesempatan.', price: 0, rent: 0, group: null, type: 'kesempatan' },
    { id: 3, name: 'Pasar Inpres', desc: 'Pusat perputaran uang receh dan sembako.', price: 1400000, rent: 220000, group: 'coklat', type: 'prop' },
    { id: 4, name: 'Pajak Penghasilan', desc: 'Setor pajak 10% dari kas atau minimal Rp1,5jt × inflasi ke Kas Hibah.', price: 0, rent: 0, group: null, type: 'pajak' },
    { id: 5, name: 'Terminal Pulo Gebang', desc: 'Simpul bus antarkota.', price: 2500000, rent: 400000, group: 'transport', type: 'station' },
    { id: 6, name: 'Kampung Melayu', desc: 'Kawasan strategis yang rawan genangan musiman.', price: 1800000, rent: 280000, group: 'biru_muda', type: 'prop' },
    { id: 7, name: 'Risiko', desc: 'Ambil satu Kartu Risiko.', price: 0, rent: 0, group: null, type: 'risiko' },
    { id: 8, name: 'Cipinang', desc: 'Permukiman ramai di jalur utama.', price: 1900000, rent: 300000, group: 'biru_muda', type: 'prop' },
    { id: 9, name: 'Jatinegara', desc: 'Pasar grosir dan stasiun persimpangan.', price: 2100000, rent: 340000, group: 'biru_muda', type: 'prop' },
    { id: 10, name: 'Rutan Nusakambangan', desc: 'Hanya lewat atau sedang menjalani masa tahanan.', price: 0, rent: 0, group: null, type: 'rutan' },
    { id: 11, name: 'Blok M', desc: 'Tongkrongan legendaris lintas generasi.', price: 2400000, rent: 390000, group: 'merah_muda', type: 'prop' },
    { id: 12, name: 'Kantor Kelurahan', desc: 'Urus surat pengantar: bayar pelicin atau antre 1 giliran.', price: 0, rent: 0, group: null, type: 'kelurahan' },
    { id: 13, name: 'Sabang', desc: 'Surga kuliner malam pusat kota.', price: 2500000, rent: 410000, group: 'merah_muda', type: 'prop' },
    { id: 14, name: 'Tebet', desc: 'Kawasan kafe dan distro anak muda.', price: 2700000, rent: 450000, group: 'merah_muda', type: 'prop' },
    { id: 15, name: 'Stasiun Gambir', desc: 'Gerbang utama kereta jarak jauh.', price: 2500000, rent: 400000, group: 'transport', type: 'station' },
    { id: 16, name: 'Mangga Dua', desc: 'Pusat grosir elektronik dan tekstil.', price: 3000000, rent: 500000, group: 'oranye', type: 'prop' },
    { id: 17, name: 'Kesempatan', desc: 'Ambil satu Kartu Kesempatan.', price: 0, rent: 0, group: null, type: 'kesempatan' },
    { id: 18, name: 'Tanah Abang', desc: 'Pusat tekstil terbesar se-Negeri Konoha.', price: 3200000, rent: 540000, group: 'oranye', type: 'prop' },
    { id: 19, name: 'Glodok', desc: 'Kawasan niaga bersejarah.', price: 3400000, rent: 580000, group: 'oranye', type: 'prop' },
    { id: 20, name: 'Dana Hibah Nasional', desc: 'Mendarat di sini memborong seluruh saldo Kas Hibah!', price: 0, rent: 0, group: null, type: 'hibah' },
    { id: 21, name: 'Kemang', desc: 'Kawasan galeri, kafe, dan hiburan malam.', price: 3700000, rent: 640000, group: 'merah', type: 'prop' },
    { id: 22, name: 'Risiko', desc: 'Ambil satu Kartu Risiko.', price: 0, rent: 0, group: null, type: 'risiko' },
    { id: 23, name: 'Senopati', desc: 'Deretan restoran kelas atas.', price: 3900000, rent: 680000, group: 'merah', type: 'prop' },
    { id: 24, name: 'Pantai Indah', desc: 'Kawasan reklamasi dan wisata pesisir.', price: 4200000, rent: 740000, group: 'merah', type: 'prop' },
    { id: 25, name: 'Pelabuhan Tanjung Priok', desc: 'Jalur ekspor-impor utama negeri.', price: 2500000, rent: 400000, group: 'transport', type: 'station' },
    { id: 26, name: 'Sudirman', desc: 'Koridor gedung pencakar langit.', price: 4600000, rent: 820000, group: 'kuning', type: 'prop' },
    { id: 27, name: 'Kuningan', desc: 'Kawasan kedutaan dan perkantoran.', price: 4800000, rent: 860000, group: 'kuning', type: 'prop' },
    { id: 28, name: 'Kantor Pejabat', desc: 'Lobi proyek: setor upeti untuk peluang menang tender besar.', price: 0, rent: 0, group: null, type: 'pejabat' },
    { id: 29, name: 'SCBD', desc: 'Distrik finansial paling bergengsi.', price: 5200000, rent: 950000, group: 'kuning', type: 'prop' },
    { id: 30, name: 'Operasi Tangkap Tangan', desc: 'Diciduk aparat! Negosiasi atau langsung masuk Rutan.', price: 0, rent: 0, group: null, type: 'ciduk' },
    { id: 31, name: 'Pondok Indah', desc: 'Kawasan hunian mewah legendaris.', price: 5600000, rent: 1050000, group: 'hijau', type: 'prop' },
    { id: 32, name: 'Kelapa Gading', desc: 'Kota mandiri dengan perputaran ekonomi tinggi.', price: 5800000, rent: 1100000, group: 'hijau', type: 'prop' },
    { id: 33, name: 'Kesempatan', desc: 'Ambil satu Kartu Kesempatan.', price: 0, rent: 0, group: null, type: 'kesempatan' },
    { id: 34, name: 'Kebon Jeruk', desc: 'Pusat media dan penyiaran nasional.', price: 6100000, rent: 1180000, group: 'hijau', type: 'prop' },
    { id: 35, name: 'Bandara Soekarno-Hatta', desc: 'Pintu gerbang udara internasional.', price: 2500000, rent: 400000, group: 'transport', type: 'station' },
    { id: 36, name: 'Risiko', desc: 'Ambil satu Kartu Risiko.', price: 0, rent: 0, group: null, type: 'risiko' },
    { id: 37, name: 'Menteng', desc: 'Kawasan elit bersejarah para tokoh penting.', price: 7000000, rent: 1400000, group: 'biru_tua', type: 'prop' },
    { id: 38, name: 'Razia Tilang', desc: 'Kena operasi gabungan: bayar denda resmi atau damai di tempat.', price: 0, rent: 0, group: null, type: 'tilang' },
    { id: 39, name: 'Istana Negara Konoha', desc: 'Puncak simbol kekuasaan dengan sewa selangit.', price: 8500000, rent: 1800000, group: 'biru_tua', type: 'prop' }
  ];

  const DEFAULT_ECONOMY = {
    startCashBase: 15000000,
    startSalaryBase: 2000000,
    bailBase: 1500000,
    jailBribeBase: 1000000,
    pinjolMaxBase: 20000000
  };

  const KESEMPATAN_CARDS = [
    { title: 'Bansos Cair Tepat Sasaran', desc: 'Terima bantuan tunai Rp2.500.000 × inflasi dari negara.', effect: 'cash', base: 2500000 },
    { title: 'Kartu Sakti Bebas Rutan', desc: 'Simpan kartu ini untuk keluar dari Rutan Nusakambangan kapan saja.', effect: 'jail_card' },
    { title: 'Menang Tender Pengadaan', desc: 'Komisi proyek cair! Terima Rp3.500.000 × inflasi.', effect: 'cash', base: 3500000 },
    { title: 'Maju Langsung ke START', desc: 'Meluncur ke petak START dan klaim gaji putaran.', effect: 'goto', target: 0 },
    { title: 'Dividen BUMN Konoha', desc: 'Terima bagi hasil Rp2.000.000 × inflasi.', effect: 'cash', base: 2000000 },
    { title: 'Kunjungan Kerja ke SCBD', desc: 'Maju ke SCBD. Jika melewati START, tetap terima gaji.', effect: 'goto', target: 29 }
  ];

  const RISIKO_CARDS = [
    { title: 'Kena Tilang Elektronik (ETLE)', desc: 'Bayar denda Rp1.800.000 × inflasi ke Kas Hibah.', effect: 'pay_hibah', base: 1800000 },
    { title: 'Harga Sembako Meroket', desc: 'Inflasi nasional naik +0.15x!', effect: 'infl', delta: 0.15 },
    { title: 'Terjaring OTT Mendadak', desc: 'Langsung masuk Rutan Nusakambangan tanpa lewat START!', effect: 'jail' },
    { title: 'Tagihan Pajak Kurang Bayar', desc: 'Bayar tunggakan Rp2.500.000 × inflasi ke Kas Hibah.', effect: 'pay_hibah', base: 2500000 },
    { title: 'Renovasi Darurat Bangunan', desc: 'Bayar biaya perbaikan Rp1.500.000 × inflasi ke Kas Hibah.', effect: 'pay_hibah', base: 1500000 },
    { title: 'Mundur 3 Langkah', desc: 'Jalanan macet total, terpaksa mundur 3 petak.', effect: 'back', steps: 3 }
  ];

  const DECREES = [
    { id: 'cetak_uang', icon: '🖨️', title: 'Cetak Uang Besar-Besaran', desc: 'Semua warga dapat Rp2jt, tapi inflasi melonjak +0.25x!', roundsLeft: 3 },
    { id: 'pajak_ekstra', icon: '🧾', title: 'Pajak Darurat Nasional', desc: 'Setiap lewat START, potongan pajak Rp1jt × inflasi masuk Kas Hibah.', roundsLeft: 4 },
    { id: 'subsidi_sewa', icon: '🏘️', title: 'Subsidi Sewa Rakyat', desc: 'Tarif sewa properti didiskon 25% selama dekret berlaku.', roundsLeft: 3 }
  ];

  const POLICIES = [
    { id: 'pro_bisnis', icon: '📈', title: 'Deregulasi Pro-Pengusaha', desc: 'Tarif sewa naik +25% selama 10 putaran.', roundsLeft: 10 },
    { id: 'pro_rakyat', icon: '🌾', title: 'Bansos & Stabilisasi Harga', desc: 'Gaji lewat START naik +50% selama 10 putaran.', roundsLeft: 10 },
    { id: 'pajak_progresif', icon: '⚖️', title: 'Pajak Progresif Aset', desc: 'Inflasi tertahan (-50% kenaikan inflasi putaran) selama 10 putaran.', roundsLeft: 10 }
  ];

  const DISASTERS = [
    { id: 'banjir', icon: '🌊', title: 'Banjir Bandang Musiman', groups: ['biru_muda', 'coklat'], roundsLeft: 3 },
    { id: 'macet', icon: '🚧', title: 'Galian Kabel Tak Kunjung Usai', groups: ['oranye', 'merah_muda'], roundsLeft: 3 }
  ];

  function formatMoney(val) {
    const num = Math.round(Number(val) || 0);
    const sign = num < 0 ? '-' : '';
    return `${sign}Rp${Math.abs(num).toLocaleString('id-ID')}`;
  }

  function calcMoney(G, base) {
    return Math.round((Number(base) || 0) * (G.infl || 1));
  }

  function getPawnInfl(G) {
    return G.suddenDeath ? (G.frozenInfl || G.infl || 1) : (G.infl || 1);
  }

  function calcTilePrice(G, idx) {
    const tile = G.theme && G.theme.board ? G.theme.board[idx] : null;
    if (!tile || !tile.price) return 0;
    return Math.round(tile.price * (G.infl || 1));
  }

  function calcBuildCost(G, idx) {
    const price = calcTilePrice(G, idx);
    return Math.round(price * 0.65);
  }

  function calcAssetValue(G, idx) {
    const ts = G.tiles[idx];
    const basePrice = calcTilePrice(G, idx);
    if (!ts || !basePrice) return 0;
    const bldgVal = (ts.level || 0) * calcBuildCost(G, idx);
    return basePrice + bldgVal;
  }

  function calcMortgageValue(G, idx) {
    const tile = G.theme && G.theme.board ? G.theme.board[idx] : null;
    if (!tile || !tile.price) return 0;
    return Math.round(tile.price * getPawnInfl(G) * 0.5);
  }

  function calcRedeemCost(G, idx) {
    const tile = G.theme && G.theme.board ? G.theme.board[idx] : null;
    if (!tile || !tile.price) return 0;
    return Math.round(tile.price * getPawnInfl(G) * 0.55);
  }

  function calcSellBuildingValue(G, idx) {
    return Math.round(calcBuildCost(G, idx) * 0.5);
  }

  function calcSellTileValue(G, idx) {
    return Math.round(calcTilePrice(G, idx) * 0.6);
  }

  function calcRent(G, idx) {
    const tile = G.theme && G.theme.board ? G.theme.board[idx] : null;
    const ts = G.tiles ? G.tiles[idx] : null;
    if (!tile || !ts || !ts.owner || ts.mortgaged > 0 || !tile.rent) return 0;

    if (G.disaster && tile.group && G.disaster.groups.includes(tile.group)) {
      return 0;
    }

    let mult = 1;
    if (tile.group === 'transport') {
      const ownedStations = G.theme.board.filter((t, i) => t.group === 'transport' && G.tiles[i].owner === ts.owner && G.tiles[i].mortgaged === 0).length;
      mult = Math.pow(2, Math.max(0, ownedStations - 1));
    } else {
      const levelMults = [1, 2.6, 5.5, 10.5];
      mult = levelMults[Math.min(3, ts.level || 0)];
      if (tile.group) {
        const grpTiles = G.theme.board.filter(t => t.group === tile.group);
        const ownsAll = grpTiles.length > 0 && grpTiles.every(t => G.tiles[t.id].owner === ts.owner);
        if (ownsAll && (ts.level || 0) === 0) mult *= 1.5;
      }
    }

    let rent = tile.rent * mult * (G.infl || 1);
    if (G.decree && G.decree.id === 'subsidi_sewa') rent *= 0.75;
    if (G.policy && G.policy.id === 'pro_bisnis') rent *= 1.25;
    return Math.round(rent);
  }

  function getMaxPinjolPrincipal(G) {
    const base = (G.theme && G.theme.economy && G.theme.economy.pinjolMaxBase) || DEFAULT_ECONOMY.pinjolMaxBase;
    return calcMoney(G, base);
  }

  function getPinjolOffer(G, shortfall) {
    const maxP = getMaxPinjolPrincipal(G);
    const need = Math.max(0, Math.round(shortfall || 0));
    const buffer = calcMoney(G, 1000000);
    const minOffer = calcMoney(G, 4000000);
    const principal = Math.min(maxP, Math.max(need + buffer, minOffer));
    const totalDebt = Math.round(principal * 1.5);
    const installmentAmt = Math.ceil(totalDebt / 3);
    return {
      principal,
      totalDebt,
      installmentsCount: 3,
      installmentAmt
    };
  }

  function cloneState(G) {
    return JSON.parse(JSON.stringify(G));
  }

  function pushEv(G, evObj) {
    G.ev.push(evObj);
  }

  function normalizePlayersInput(input) {
    let rawList = [];
    if (Array.isArray(input)) {
      rawList = input;
    } else if (input && Array.isArray(input.seats)) {
      rawList = input.seats;
    } else if (input && Array.isArray(input.players)) {
      rawList = input.players;
    }

    const extracted = [];
    rawList.forEach(item => {
      if (!item) return;
      if (item.player && typeof item.player === 'object') {
        extracted.push(item.player);
      } else if (item.id || item.name || item.uid) {
        extracted.push(item);
      }
    });
    return extracted;
  }

  function createGame(playersOrSeatsInput, customTheme) {
    const extractedPlayers = normalizePlayersInput(playersOrSeatsInput);
    const resolvedTheme = customTheme || (playersOrSeatsInput && playersOrSeatsInput.theme) || null;

    const mergedTheme = {
      id: (resolvedTheme && resolvedTheme.id) || 'nusantara',
      name: (resolvedTheme && resolvedTheme.name) || 'Nusantara Klasik',
      board: (resolvedTheme && Array.isArray(resolvedTheme.board) && resolvedTheme.board.length === 40)
        ? resolvedTheme.board
        : DEFAULT_BOARD,
      groups: (resolvedTheme && resolvedTheme.groups) ? Object.assign({}, DEFAULT_GROUPS, resolvedTheme.groups) : DEFAULT_GROUPS,
      economy: Object.assign({}, DEFAULT_ECONOMY, (resolvedTheme && resolvedTheme.economy) || {})
    };

    const startCash = mergedTheme.economy.startCashBase;

    const players = extractedPlayers.map((p, idx) => ({
      id: p.id || `p_${idx + 1}`,
      name: p.name || `Warga ${idx + 1}`,
      color: p.color || PLAYER_COLORS[idx % PLAYER_COLORS.length],
      isBot: Boolean(p.isBot),
      pos: 0,
      cash: startCash,
      bankrupt: false,
      jail: 0,
      jailCards: 0,
      skipTurn: 0,
      pinjolDebt: 0,
      pinjolUsed: false,
      pinjolPlan: null,
      pinjolInstallment: 0,
      pinjolInstallmentsLeft: 0,
      doublesCount: 0
    }));

    return {
      status: 'playing',
      started: true,
      board: mergedTheme.board,
      players,
      turnIdx: 0,
      round: 1,
      infl: 1.0,
      frozenInfl: 1.0,
      suddenDeath: false,
      hibah: 3000000,
      theme: mergedTheme,
      tiles: Array.from({ length: 40 }, () => ({ owner: null, level: 0, mortgaged: 0 })),
      phase: 'roll',
      pending: null,
      voteState: null,
      news: null,
      decree: null,
      policy: null,
      disaster: null,
      ev: [],
      evSeq: 1,
      winner: null
    };
  }

  function getAlivePlayers(G) {
    return G.players.filter(p => !p.bankrupt);
  }

  function canPlayerRescueShortfall(G, p, isPinjolRepay) {
    if (!p || p.bankrupt) return false;
    const hasAsset = G.tiles.some(ts => ts.owner === p.id && (ts.level > 0 || ts.mortgaged === 0));
    const canPinjol = !p.pinjolUsed && !isPinjolRepay;
    return hasAsset || canPinjol;
  }

  function checkWinner(G) {
    const alive = getAlivePlayers(G);
    if (alive.length <= 1) {
      G.phase = 'gameover';
      G.pending = null;
      G.winner = alive.length === 1 ? alive[0].id : null;
      return true;
    }
    return false;
  }

  function declareBankrupt(G, p, creditorId) {
    if (!p || p.bankrupt) return;
    p.bankrupt = true;
    const remCash = Math.max(0, p.cash);
    p.cash = 0;
    p.pinjolDebt = 0;
    p.pinjolPlan = null;
    p.pinjolInstallment = 0;
    p.pinjolInstallmentsLeft = 0;

    const creditor = creditorId ? G.players.find(x => x.id === creditorId && !x.bankrupt) : null;
    if (creditor && remCash > 0) {
      creditor.cash += remCash;
      pushEv(G, { k: 'cash', pid: creditor.id, a: remCash, w: `Sitaan dari ${p.name}` });
    } else if (remCash > 0) {
      G.hibah += remCash;
    }

    G.tiles.forEach((ts, idx) => {
      if (ts.owner === p.id) {
        if (creditor) {
          ts.owner = creditor.id;
        } else {
          ts.owner = null;
          ts.level = 0;
          ts.mortgaged = 0;
        }
        pushEv(G, { k: 'seized', pid: p.id, tile: idx, w: creditor ? `Diserahkan ke ${creditor.name}` : 'Disita Negara' });
      }
    });

    pushEv(G, { k: 'bankrupt', pid: p.id });
    checkWinner(G);
  }

  function chargeOrPromptShortfall(G, p, opts) {
    const amount = Math.max(0, Math.round(opts.amount || 0));
    if (amount === 0 || p.cash >= amount) {
      if (amount > 0) {
        p.cash -= amount;
        pushEv(G, { k: 'cash', pid: p.id, a: -amount, w: opts.reason || 'Pembayaran' });
        if (opts.creditorId) {
          const cred = G.players.find(x => x.id === opts.creditorId && !x.bankrupt);
          if (cred) {
            cred.cash += amount;
            pushEv(G, { k: 'cash', pid: cred.id, a: amount, w: opts.creditorReason || opts.reason || 'Terima Pembayaran' });
          }
        } else if (opts.toHibah) {
          G.hibah += amount;
        }
      }
      return true;
    }

    const isPinjolRepay = Boolean(opts.isPinjolRepay);
    if (!canPlayerRescueShortfall(G, p, isPinjolRepay)) {
      declareBankrupt(G, p, opts.creditorId || null);
      if (G.phase !== 'gameover') advanceTurn(G);
      return false;
    }

    G.phase = 'decide';
    G.pending = {
      kind: 'shortfall',
      reason: opts.reason || 'Kewajiban Pembayaran',
      amount,
      creditorId: opts.creditorId || null,
      creditorReason: opts.creditorReason || '',
      toHibah: Boolean(opts.toHibah),
      isPinjolRepay,
      resumeLanding: Boolean(opts.resumeLanding),
      allowTakeoverAfter: Boolean(opts.allowTakeoverAfter),
      afterTile: opts.afterTile !== undefined ? opts.afterTile : null
    };
    return false;
  }

  function advanceTurn(G) {
    if (checkWinner(G)) return;

    const total = G.players.length;
    let nextIdx = G.turnIdx;
    let wrappedRound = false;

    for (let i = 1; i <= total; i++) {
      const candidateIdx = (G.turnIdx + i) % total;
      if (candidateIdx <= G.turnIdx) wrappedRound = true;
      if (!G.players[candidateIdx].bankrupt) {
        nextIdx = candidateIdx;
        break;
      }
    }

    G.turnIdx = nextIdx;
    G.pending = null;
    G.phase = 'roll';

    const nextPlayer = G.players[G.turnIdx];
    if (nextPlayer) {
      nextPlayer.doublesCount = 0;
    }

    if (wrappedRound) {
      onNewRound(G);
    }

    if (G.phase === 'roll' && nextPlayer && nextPlayer.skipTurn > 0 && nextPlayer.jail === 0) {
      nextPlayer.skipTurn -= 1;
      pushEv(G, { k: 'news', news: { title: 'Antrean Kelurahan', desc: `${nextPlayer.name} melewatkan 1 giliran mengurus berkas.` } });
      advanceTurn(G);
    }
  }

  function onNewRound(G) {
    G.round += 1;

    G.tiles.forEach((ts, idx) => {
      if (ts.owner && ts.mortgaged > 0) {
        ts.mortgaged -= 1;
        if (ts.mortgaged === 0) {
          const victim = G.players.find(p => p.id === ts.owner);
          ts.owner = null;
          ts.level = 0;
          pushEv(G, { k: 'seized', pid: victim ? victim.id : '', tile: idx, w: 'Gagal Tebus Gadai' });
        }
      }
    });

    if (G.decree) {
      G.decree.roundsLeft -= 1;
      if (G.decree.roundsLeft <= 0) G.decree = null;
    }
    if (G.policy) {
      G.policy.roundsLeft -= 1;
      if (G.policy.roundsLeft <= 0) G.policy = null;
    }
    if (G.disaster) {
      G.disaster.roundsLeft -= 1;
      if (G.disaster.roundsLeft <= 0) G.disaster = null;
    }

    if (G.round === 37) {
      pushEv(G, { k: 'crisis_warn', targetRound: 40 });
    }
    if (G.round >= 40) {
      if (!G.suddenDeath) {
        G.suddenDeath = true;
        G.frozenInfl = G.infl;
        pushEv(G, { k: 'crisis_start' });
      }
      G.infl = Number((G.infl + 1.0).toFixed(2));
    } else {
      let inflStep = 0.08;
      if (G.policy && G.policy.id === 'pajak_progresif') inflStep *= 0.5;
      G.infl = Number((G.infl + inflStep).toFixed(2));
    }

    if (G.round % 10 === 0 && getAlivePlayers(G).length > 1) {
      G.phase = 'vote';
      G.voteState = {
        candidates: POLICIES.map(p => Object.assign({}, p)),
        votes: {}
      };
      return;
    }

    if (G.round % 6 === 0 && !G.decree) {
      const dec = Object.assign({}, DECREES[Math.floor(Math.random() * DECREES.length)]);
      G.decree = dec;
      if (dec.id === 'cetak_uang') {
        const bonus = calcMoney(G, 2000000);
        G.players.forEach(p => {
          if (!p.bankrupt) {
            p.cash += bonus;
            pushEv(G, { k: 'cash', pid: p.id, a: bonus, w: 'Cetak Uang' });
          }
        });
        G.infl = Number((G.infl + 0.25).toFixed(2));
      }
      pushEv(G, { k: 'decree', decree: dec });
    } else if (G.round % 5 === 0 && !G.disaster) {
      const dis = Object.assign({}, DISASTERS[Math.floor(Math.random() * DISASTERS.length)]);
      G.disaster = dis;
      pushEv(G, { k: 'disaster', disaster: dis });
    }
  }

  function handlePassStart(G, p) {
    let salary = calcMoney(G, G.theme.economy.startSalaryBase);
    if (G.policy && G.policy.id === 'pro_rakyat') salary = Math.round(salary * 1.5);
    p.cash += salary;
    pushEv(G, { k: 'cash', pid: p.id, a: salary, w: 'Gaji START' });

    if (G.decree && G.decree.id === 'pajak_ekstra') {
      const extraTax = Math.min(p.cash, calcMoney(G, 1000000));
      if (extraTax > 0) {
        p.cash -= extraTax;
        G.hibah += extraTax;
        pushEv(G, { k: 'cash', pid: p.id, a: -extraTax, w: 'Pajak Dekret' });
      }
    }

    if (p.pinjolDebt > 0) {
      const isInstallment = p.pinjolPlan === 'installment';
      const due = isInstallment
        ? Math.min(p.pinjolDebt, p.pinjolInstallment || Math.ceil(p.pinjolDebt / 3))
        : p.pinjolDebt;

      const label = isInstallment ? 'Cicilan Pinjol (Lewat START)' : 'Pelunasan Pinjol (Lewat START)';
      if (p.cash >= due) {
        p.cash -= due;
        p.pinjolDebt = Math.max(0, p.pinjolDebt - due);
        if (isInstallment) {
          p.pinjolInstallmentsLeft = Math.max(0, (p.pinjolInstallmentsLeft || 1) - 1);
        }
        if (p.pinjolDebt <= 0) {
          p.pinjolPlan = null;
          p.pinjolInstallment = 0;
          p.pinjolInstallmentsLeft = 0;
        }
        pushEv(G, { k: 'cash', pid: p.id, a: -due, w: label });
        return true;
      }

      chargeOrPromptShortfall(G, p, {
        amount: due,
        reason: label,
        isPinjolRepay: true,
        resumeLanding: true
      });
      return false;
    }

    return true;
  }

  function movePlayerSteps(G, p, steps) {
    const prevPos = p.pos;
    const rawNext = prevPos + steps;
    const passedStart = steps > 0 && rawNext >= 40;
    const newPos = ((rawNext % 40) + 40) % 40;
    p.pos = newPos;
    pushEv(G, { k: 'move', pid: p.id, from: prevPos, to: newPos, steps });

    if (passedStart) {
      const ok = handlePassStart(G, p);
      if (!ok) return;
    }

    resolveLanding(G, p);
  }

  function resolveLanding(G, p) {
    if (!p || p.bankrupt) {
      advanceTurn(G);
      return;
    }

    const idx = p.pos;
    const tile = G.theme.board[idx];
    const ts = G.tiles[idx];

    if (!tile) {
      advanceTurn(G);
      return;
    }

    if (tile.type === 'start' || tile.type === 'rutan') {
      advanceTurn(G);
      return;
    }

    if (tile.type === 'hibah') {
      const pot = G.hibah;
      if (pot > 0) {
        p.cash += pot;
        G.hibah = calcMoney(G, 1500000);
        pushEv(G, { k: 'cash', pid: p.id, a: pot, w: 'Dana Hibah Nasional!' });
      }
      advanceTurn(G);
      return;
    }

    if (tile.type === 'ciduk') {
      G.phase = 'decide';
      G.pending = {
        kind: 'ciduk',
        bribeCost: calcMoney(G, 2000000)
      };
      return;
    }

    if (tile.type === 'kelurahan') {
      G.phase = 'decide';
      G.pending = {
        kind: 'kelurahan',
        bribeCost: calcMoney(G, 1000000)
      };
      return;
    }

    if (tile.type === 'pejabat') {
      G.phase = 'decide';
      G.pending = {
        kind: 'pejabat',
        cost: calcMoney(G, 3000000)
      };
      return;
    }

    if (tile.type === 'tilang') {
      G.phase = 'decide';
      G.pending = {
        kind: 'tilang',
        bribeCost: calcMoney(G, 800000),
        fineCost: calcMoney(G, 1500000)
      };
      return;
    }

    if (tile.type === 'pajak') {
      const tax = Math.max(calcMoney(G, 1500000), Math.round(p.cash * 0.1));
      const paid = chargeOrPromptShortfall(G, p, {
        amount: tax,
        reason: 'Pajak Penghasilan',
        toHibah: true
      });
      if (paid) advanceTurn(G);
      return;
    }

    if (tile.type === 'kesempatan' || tile.type === 'risiko') {
      const deck = tile.type === 'kesempatan' ? KESEMPATAN_CARDS : RISIKO_CARDS;
      const card = deck[Math.floor(Math.random() * deck.length)];
      pushEv(G, { k: 'card', pid: p.id, deck: tile.type, card });

      if (card.effect === 'cash') {
        const amt = calcMoney(G, card.base);
        p.cash += amt;
        pushEv(G, { k: 'cash', pid: p.id, a: amt, w: card.title });
        advanceTurn(G);
      } else if (card.effect === 'pay_hibah') {
        const amt = calcMoney(G, card.base);
        const paid = chargeOrPromptShortfall(G, p, {
          amount: amt,
          reason: card.title,
          toHibah: true
        });
        if (paid) advanceTurn(G);
      } else if (card.effect === 'jail_card') {
        p.jailCards += 1;
        advanceTurn(G);
      } else if (card.effect === 'infl') {
        G.infl = Number((G.infl + card.delta).toFixed(2));
        advanceTurn(G);
      } else if (card.effect === 'jail') {
        sendToJail(G, p);
        advanceTurn(G);
      } else if (card.effect === 'goto') {
        const steps = (card.target - p.pos + 40) % 40 || 40;
        movePlayerSteps(G, p, steps);
      } else if (card.effect === 'back') {
        movePlayerSteps(G, p, -card.steps);
      } else {
        advanceTurn(G);
      }
      return;
    }

    if (tile.price > 0) {
      if (!ts.owner) {
        const price = calcTilePrice(G, idx);
        G.phase = 'decide';
        G.pending = { kind: 'buy', tile: idx, price };
        return;
      }

      if (ts.owner === p.id) {
        if (ts.mortgaged === 0 && tile.group !== 'transport' && ts.level < 3) {
          const officialCost = calcBuildCost(G, idx);
          const bribeCost = Math.round(officialCost * 1.35);
          G.phase = 'decide';
          G.pending = {
            kind: 'build',
            tile: idx,
            nextLevel: ts.level + 1,
            officialCost,
            bribeCost
          };
          return;
        }
        advanceTurn(G);
        return;
      }

      const owner = G.players.find(x => x.id === ts.owner);
      if (!owner || owner.bankrupt || ts.mortgaged > 0) {
        advanceTurn(G);
        return;
      }

      const rent = calcRent(G, idx);
      const paid = chargeOrPromptShortfall(G, p, {
        amount: rent,
        reason: `Sewa ${tile.name}`,
        creditorId: owner.id,
        creditorReason: `Sewa ${tile.name} dari ${p.name}`,
        allowTakeoverAfter: true,
        afterTile: idx
      });

      if (paid) {
        maybeOfferTakeover(G, p, idx);
      }
      return;
    }

    advanceTurn(G);
  }

  function maybeOfferTakeover(G, p, tileIdx) {
    const ts = G.tiles[tileIdx];
    if (!ts || !ts.owner || ts.owner === p.id || ts.mortgaged > 0 || ts.level >= 3) {
      advanceTurn(G);
      return;
    }
    const cost = calcAssetValue(G, tileIdx) * 2;
    if (p.cash >= cost) {
      G.phase = 'decide';
      G.pending = {
        kind: 'takeover',
        tile: tileIdx,
        owner: ts.owner,
        cost
      };
      return;
    }
    advanceTurn(G);
  }

  function sendToJail(G, p) {
    p.pos = 10;
    p.jail = 3;
    p.doublesCount = 0;
    pushEv(G, { k: 'jail', pid: p.id });
  }

  function applyAction(prevG, actorId, action) {
    const G = cloneState(prevG);
    G.ev = [];
    G.evSeq = (G.evSeq || 0) + 1;

    if (!G || G.phase === 'gameover') return G;

    if (G.phase === 'vote' && G.voteState) {
      const voter = G.players.find(p => p.id === actorId && !p.bankrupt);
      if (!voter || G.voteState.votes[voter.id]) return G;

      const polIdx = action && action.type === 'vote'
        ? Math.max(0, Math.min(G.voteState.candidates.length - 1, Number(action.policyIdx) || 0))
        : 0;
      const fajarUnit = calcMoney(G, 5000);
      const maxFajar = Math.min(2, Math.floor(voter.cash / fajarUnit));
      const fajar = action && action.type === 'vote'
        ? Math.max(0, Math.min(maxFajar, Number(action.fajar) || 0))
        : 0;

      if (fajar > 0) {
        const cost = fajar * fajarUnit;
        voter.cash -= cost;
        G.hibah += cost;
        pushEv(G, { k: 'cash', pid: voter.id, a: -cost, w: 'Serangan Fajar' });
      }

      G.voteState.votes[voter.id] = { policyIdx: polIdx, weight: 1 + fajar };

      const aliveVoters = getAlivePlayers(G);
      const allVoted = aliveVoters.every(p => Boolean(G.voteState.votes[p.id]));
      if (allVoted) {
        const tally = G.voteState.candidates.map(() => 0);
        Object.values(G.voteState.votes).forEach(v => {
          tally[v.policyIdx] = (tally[v.policyIdx] || 0) + v.weight;
        });
        let winIdx = 0;
        for (let i = 1; i < tally.length; i++) {
          if (tally[i] > tally[winIdx]) winIdx = i;
        }
        G.policy = Object.assign({}, G.voteState.candidates[winIdx]);
        G.voteState = null;
        G.phase = 'roll';
        pushEv(G, { k: 'election_result', policy: G.policy });
      }
      return G;
    }

    const activePlayer = G.players[G.turnIdx];
    if (!activePlayer || activePlayer.id !== actorId) return G;

    if (activePlayer.bankrupt) {
      advanceTurn(G);
      return G;
    }

    if (action.type === 'timeout') {
      if (G.phase === 'roll') {
        if (activePlayer.jail > 0) {
          return applyAction(prevG, actorId, { type: 'jail', choice: 'roll' });
        }
        return applyAction(prevG, actorId, { type: 'roll' });
      }
      if (G.phase === 'decide' && G.pending) {
        const botChoice = chooseBotAction(G, actorId);
        if (botChoice) return applyAction(prevG, actorId, botChoice);
      }
      return G;
    }

    if (G.phase === 'roll' && action.type === 'manage') {
      const idx = Number(action.tile);
      const ts = G.tiles[idx];
      if (!ts || ts.owner !== activePlayer.id) return G;

      if (action.sub === 'sellBuilding' && ts.level > 0) {
        const val = calcSellBuildingValue(G, idx);
        ts.level -= 1;
        activePlayer.cash += val;
        pushEv(G, { k: 'cash', pid: activePlayer.id, a: val, w: 'Jual Bangunan' });
      } else if (action.sub === 'sellTile' && ts.level === 0 && ts.mortgaged === 0) {
        const val = calcSellTileValue(G, idx);
        ts.owner = null;
        activePlayer.cash += val;
        pushEv(G, { k: 'cash', pid: activePlayer.id, a: val, w: 'Jual Tanah' });
      } else if (action.sub === 'mortgage' && ts.level === 0 && ts.mortgaged === 0) {
        const val = calcMortgageValue(G, idx);
        ts.mortgaged = 4;
        activePlayer.cash += val;
        pushEv(G, { k: 'cash', pid: activePlayer.id, a: val, w: 'Gadai Tanah' });
      } else if (action.sub === 'redeem' && ts.mortgaged > 0) {
        const cost = calcRedeemCost(G, idx);
        if (activePlayer.cash >= cost) {
          activePlayer.cash -= cost;
          ts.mortgaged = 0;
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -cost, w: 'Tebus Gadai' });
        }
      }
      return G;
    }

    if (G.phase === 'roll' && activePlayer.jail > 0 && action.type === 'jail') {
      const choice = action.choice;
      if (choice === 'card' && activePlayer.jailCards > 0) {
        activePlayer.jailCards -= 1;
        activePlayer.jail = 0;
        return G;
      }
      if (choice === 'pay') {
        const bail = calcMoney(G, G.theme.economy.bailBase);
        if (activePlayer.cash >= bail) {
          activePlayer.cash -= bail;
          G.hibah += bail;
          activePlayer.jail = 0;
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -bail, w: 'Uang Jaminan Rutan' });
        }
        return G;
      }
      if (choice === 'bribe') {
        const bribe = calcMoney(G, G.theme.economy.jailBribeBase);
        if (activePlayer.cash >= bribe) {
          activePlayer.cash -= bribe;
          G.hibah += bribe;
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -bribe, w: 'Suap Sipir' });
          if (Math.random() < 0.7) {
            activePlayer.jail = 0;
          } else {
            activePlayer.jail += 1;
            advanceTurn(G);
          }
        }
        return G;
      }

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      pushEv(G, { k: 'dice', pid: activePlayer.id, dice: [d1, d2] });
      if (d1 === d2) {
        activePlayer.jail = 0;
        movePlayerSteps(G, activePlayer, d1 + d2);
      } else {
        activePlayer.jail -= 1;
        if (activePlayer.jail <= 0) {
          activePlayer.jail = 0;
          const bail = calcMoney(G, G.theme.economy.bailBase);
          const paid = chargeOrPromptShortfall(G, activePlayer, {
            amount: bail,
            reason: 'Jaminan Wajib Keluar Rutan',
            toHibah: true
          });
          if (paid) advanceTurn(G);
        } else {
          advanceTurn(G);
        }
      }
      return G;
    }

    if (G.phase === 'roll' && action.type === 'roll') {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      pushEv(G, { k: 'dice', pid: activePlayer.id, dice: [d1, d2] });
      movePlayerSteps(G, activePlayer, d1 + d2);
      return G;
    }

    if (G.phase === 'decide' && G.pending && action.type === 'decide') {
      const pend = G.pending;
      const choice = action.choice;

      if (pend.kind === 'shortfall') {
        if (choice === 'sellBuilding') {
          const idx = Number(action.tile);
          const ts = G.tiles[idx];
          if (ts && ts.owner === activePlayer.id && ts.level > 0) {
            const val = calcSellBuildingValue(G, idx);
            ts.level -= 1;
            activePlayer.cash += val;
            pushEv(G, { k: 'cash', pid: activePlayer.id, a: val, w: 'Jual Bangunan' });
          }
          return G;
        }

        if (choice === 'sellTile') {
          const idx = Number(action.tile);
          const ts = G.tiles[idx];
          if (ts && ts.owner === activePlayer.id && ts.level === 0 && ts.mortgaged === 0) {
            const val = calcSellTileValue(G, idx);
            ts.owner = null;
            activePlayer.cash += val;
            pushEv(G, { k: 'cash', pid: activePlayer.id, a: val, w: 'Jual Tanah' });
          }
          return G;
        }

        if (choice === 'mortgage') {
          const idx = Number(action.tile);
          const ts = G.tiles[idx];
          if (ts && ts.owner === activePlayer.id && ts.level === 0 && ts.mortgaged === 0) {
            const val = calcMortgageValue(G, idx);
            ts.mortgaged = 4;
            activePlayer.cash += val;
            pushEv(G, { k: 'cash', pid: activePlayer.id, a: val, w: 'Gadai Tanah' });
          }
          return G;
        }

        if (choice === 'pinjol') {
          if (!activePlayer.pinjolUsed && !pend.isPinjolRepay) {
            const shortfall = Math.max(0, pend.amount - activePlayer.cash);
            const offer = getPinjolOffer(G, shortfall);
            const plan = action.plan === 'installment' ? 'installment' : 'lump';

            activePlayer.pinjolUsed = true;
            activePlayer.pinjolPlan = plan;
            activePlayer.pinjolDebt = offer.totalDebt;
            activePlayer.pinjolInstallmentsLeft = plan === 'installment' ? offer.installmentsCount : 1;
            activePlayer.pinjolInstallment = plan === 'installment' ? offer.installmentAmt : offer.totalDebt;
            activePlayer.cash += offer.principal;

            pushEv(G, {
              k: 'cash',
              pid: activePlayer.id,
              a: offer.principal,
              w: plan === 'installment' ? 'Cair Pinjol (Cicil 3×)' : 'Cair Pinjol (Bayar Sekali)'
            });
          }
          return G;
        }

        if (choice === 'pay') {
          if (activePlayer.cash < pend.amount) return G;

          activePlayer.cash -= pend.amount;
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -pend.amount, w: pend.reason || 'Bayar Tagihan' });

          if (pend.creditorId) {
            const cred = G.players.find(x => x.id === pend.creditorId && !x.bankrupt);
            if (cred) {
              cred.cash += pend.amount;
              pushEv(G, { k: 'cash', pid: cred.id, a: pend.amount, w: pend.creditorReason || pend.reason });
            }
          } else if (pend.toHibah) {
            G.hibah += pend.amount;
          }

          if (pend.isPinjolRepay) {
            activePlayer.pinjolDebt = Math.max(0, activePlayer.pinjolDebt - pend.amount);
            if (activePlayer.pinjolPlan === 'installment') {
              activePlayer.pinjolInstallmentsLeft = Math.max(0, (activePlayer.pinjolInstallmentsLeft || 1) - 1);
            }
            if (activePlayer.pinjolDebt <= 0) {
              activePlayer.pinjolPlan = null;
              activePlayer.pinjolInstallment = 0;
              activePlayer.pinjolInstallmentsLeft = 0;
            }
          }

          const resumeLanding = pend.resumeLanding;
          const allowTakeoverAfter = pend.allowTakeoverAfter;
          const afterTile = pend.afterTile;
          G.pending = null;
          G.phase = 'roll';

          if (resumeLanding) {
            resolveLanding(G, activePlayer);
          } else if (allowTakeoverAfter && afterTile !== null) {
            maybeOfferTakeover(G, activePlayer, afterTile);
          } else {
            advanceTurn(G);
          }
          return G;
        }

        if (choice === 'bankrupt') {
          declareBankrupt(G, activePlayer, pend.creditorId || null);
          if (G.phase !== 'gameover') advanceTurn(G);
          return G;
        }

        return G;
      }

      if (pend.kind === 'buy') {
        if (choice === 'buy' && activePlayer.cash >= pend.price) {
          activePlayer.cash -= pend.price;
          G.tiles[pend.tile].owner = activePlayer.id;
          G.tiles[pend.tile].level = 0;
          G.tiles[pend.tile].mortgaged = 0;
          pushEv(G, { k: 'buy', pid: activePlayer.id, tile: pend.tile });
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -pend.price, w: 'Beli Tanah' });
        }
        advanceTurn(G);
        return G;
      }

      if (pend.kind === 'build') {
        if (choice === 'official' && activePlayer.cash >= pend.officialCost) {
          activePlayer.cash -= pend.officialCost;
          G.hibah += pend.officialCost;
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -pend.officialCost, w: 'Izin Bangunan' });
          if (Math.random() >= 0.3) {
            G.tiles[pend.tile].level = pend.nextLevel;
            pushEv(G, { k: 'build', pid: activePlayer.id, tile: pend.tile });
          } else {
            pushEv(G, { k: 'news', news: { title: 'Berkas Kurang Satu', desc: `Izin bangunan ${activePlayer.name} ditolak loket!` } });
          }
        } else if (choice === 'bribe' && activePlayer.cash >= pend.bribeCost) {
          activePlayer.cash -= pend.bribeCost;
          G.hibah += pend.bribeCost;
          G.tiles[pend.tile].level = pend.nextLevel;
          pushEv(G, { k: 'build', pid: activePlayer.id, tile: pend.tile });
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -pend.bribeCost, w: 'Pelicin Izin' });
        }
        advanceTurn(G);
        return G;
      }

      if (pend.kind === 'takeover') {
        if (choice === 'takeover' && activePlayer.cash >= pend.cost) {
          const prevOwner = G.players.find(x => x.id === pend.owner);
          activePlayer.cash -= pend.cost;
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -pend.cost, w: 'Takeover Aset' });
          if (prevOwner && !prevOwner.bankrupt) {
            prevOwner.cash += pend.cost;
            pushEv(G, { k: 'cash', pid: prevOwner.id, a: pend.cost, w: 'Hasil Takeover' });
          }
          G.tiles[pend.tile].owner = activePlayer.id;
          pushEv(G, { k: 'buy', pid: activePlayer.id, tile: pend.tile });
        }
        advanceTurn(G);
        return G;
      }

      if (pend.kind === 'ciduk') {
        if (choice === 'bribe' && activePlayer.cash >= pend.bribeCost) {
          activePlayer.cash -= pend.bribeCost;
          G.hibah += pend.bribeCost;
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -pend.bribeCost, w: 'Negosiasi Aparat' });
          if (Math.random() < 0.5) {
            advanceTurn(G);
            return G;
          }
        }
        sendToJail(G, activePlayer);
        advanceTurn(G);
        return G;
      }

      if (pend.kind === 'kelurahan') {
        if (choice === 'bribe' && activePlayer.cash >= pend.bribeCost) {
          activePlayer.cash -= pend.bribeCost;
          G.hibah += pend.bribeCost;
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -pend.bribeCost, w: 'Pelicin Kelurahan' });
        } else {
          activePlayer.skipTurn = 1;
        }
        advanceTurn(G);
        return G;
      }

      if (pend.kind === 'pejabat') {
        if (choice === 'tribute' && activePlayer.cash >= pend.cost) {
          activePlayer.cash -= pend.cost;
          G.hibah += pend.cost;
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -pend.cost, w: 'Setor Upeti' });
          const roll = Math.random();
          if (roll < 0.55) {
            const win = calcMoney(G, 10000000);
            activePlayer.cash += win;
            pushEv(G, { k: 'cash', pid: activePlayer.id, a: win, w: 'Menang Tender!' });
          } else if (roll >= 0.8) {
            sendToJail(G, activePlayer);
          }
        }
        advanceTurn(G);
        return G;
      }

      if (pend.kind === 'tilang') {
        if (choice === 'bribe' && activePlayer.cash >= pend.bribeCost) {
          activePlayer.cash -= pend.bribeCost;
          G.hibah += pend.bribeCost;
          pushEv(G, { k: 'cash', pid: activePlayer.id, a: -pend.bribeCost, w: 'Damai di Tempat' });
          if (Math.random() < 0.25) {
            sendToJail(G, activePlayer);
          }
          advanceTurn(G);
          return G;
        }
        const paid = chargeOrPromptShortfall(G, activePlayer, {
          amount: pend.fineCost,
          reason: 'Denda Resmi Razia Tilang',
          toHibah: true
        });
        if (paid) advanceTurn(G);
        return G;
      }
    }

    return G;
  }

  function chooseBotAction(G, botId) {
    if (!G || G.phase === 'gameover') return null;

    if (G.phase === 'vote' && G.voteState) {
      const bot = G.players.find(p => p.id === botId);
      if (!bot || G.voteState.votes[botId]) return null;
      const idx = Math.floor(Math.random() * G.voteState.candidates.length);
      return { type: 'vote', policyIdx: idx, fajar: 0 };
    }

    const active = G.players[G.turnIdx];
    if (!active || active.id !== botId) return null;

    if (G.phase === 'roll') {
      if (active.jail > 0) {
        if (active.jailCards > 0) return { type: 'jail', choice: 'card' };
        const bail = calcMoney(G, G.theme.economy.bailBase);
        if (active.cash >= bail * 2.5) return { type: 'jail', choice: 'pay' };
        return { type: 'jail', choice: 'roll' };
      }
      return { type: 'roll' };
    }

    if (G.phase === 'decide' && G.pending) {
      const pend = G.pending;

      if (pend.kind === 'shortfall') {
        if (active.cash >= pend.amount) {
          return { type: 'decide', choice: 'pay' };
        }
        const mortgageIdx = G.tiles.findIndex(ts => ts.owner === botId && ts.level === 0 && ts.mortgaged === 0);
        if (mortgageIdx !== -1) {
          return { type: 'decide', choice: 'mortgage', tile: mortgageIdx };
        }
        const bldgIdx = G.tiles.findIndex(ts => ts.owner === botId && ts.level > 0);
        if (bldgIdx !== -1) {
          return { type: 'decide', choice: 'sellBuilding', tile: bldgIdx };
        }
        const sellIdx = G.tiles.findIndex(ts => ts.owner === botId && ts.level === 0 && ts.mortgaged === 0);
        if (sellIdx !== -1) {
          return { type: 'decide', choice: 'sellTile', tile: sellIdx };
        }
        if (!active.pinjolUsed && !pend.isPinjolRepay) {
          return { type: 'decide', choice: 'pinjol', plan: 'installment' };
        }
        return { type: 'decide', choice: 'bankrupt' };
      }

      if (pend.kind === 'buy') {
        return { type: 'decide', choice: active.cash >= pend.price * 1.3 ? 'buy' : 'skip' };
      }
      if (pend.kind === 'build') {
        if (active.cash >= pend.officialCost * 1.5) return { type: 'decide', choice: 'official' };
        return { type: 'decide', choice: 'skip' };
      }
      if (pend.kind === 'takeover') {
        return { type: 'decide', choice: active.cash >= pend.cost * 1.8 ? 'takeover' : 'skip' };
      }
      if (pend.kind === 'ciduk') {
        return { type: 'decide', choice: active.cash >= pend.bribeCost * 2 ? 'bribe' : 'surrender' };
      }
      if (pend.kind === 'kelurahan') {
        return { type: 'decide', choice: active.cash >= pend.bribeCost * 2.5 ? 'bribe' : 'queue' };
      }
      if (pend.kind === 'pejabat') {
        return { type: 'decide', choice: active.cash >= pend.cost * 2.5 ? 'tribute' : 'leave' };
      }
      if (pend.kind === 'tilang') {
        return { type: 'decide', choice: active.cash >= pend.fineCost ? 'fine' : 'bribe' };
      }
    }

    return null;
  }

  return {
    LVL_NAMES,
    PLAYER_COLORS,
    BOT_NAMES,
    formatMoney,
    calcMoney,
    calcTilePrice,
    calcBuildCost,
    calcRent,
    calcAssetValue,
    calcMortgageValue,
    calcRedeemCost,
    calcSellBuildingValue,
    calcSellTileValue,
    getPinjolOffer,
    canPlayerRescueShortfall,
    createGame,
    newGame: createGame,
    initGame: createGame,
    startGame: createGame,
    applyAction,
    chooseBotAction
  };
}));
