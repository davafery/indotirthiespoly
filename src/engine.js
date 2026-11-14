(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KonohapolyEngine = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LVL_NAMES = ['Tanah Kosong', 'Rumah', 'Ruko', 'Landmark'];
  const LVL_RENT_MULT = [1.0, 2.6, 5.5, 11.0];

  const GROUPS = {
    pinggiran: { name: 'Pinggiran Kota', color: '#92400e', buildCost: 2500 },
    industri:  { name: 'Kawasan Industri', color: '#0284c7', buildCost: 3500 },
    kuliner:   { name: 'Sentra Kuliner', color: '#d97706', buildCost: 4500 },
    kampus:    { name: 'Zona Pendidikan', color: '#16a34a', buildCost: 5500 },
    bisnis:    { name: 'Distrik Bisnis', color: '#dc2626', buildCost: 7000 },
    wisata:    { name: 'Kawasan Wisata', color: '#9333ea', buildCost: 8500 },
    elit:      { name: 'Kompleks Elit', color: '#0d9488', buildCost: 10000 },
    pusat:     { name: 'Ring 1 Istana', color: '#eab308', buildCost: 12500 }
  };

  const BOARD = [
    { id: 0,  type: 'start',     name: 'BALAI KOTA (START)', price: 0, rent: 0, desc: 'Terima UMR lalu dipotong biaya hidup bulanan.' },
    { id: 1,  type: 'prop',      group: 'pinggiran', name: 'Gang Senggol', price: 4000, rent: 600, desc: 'Padat merayap, tapi selalu ramai.' },
    { id: 2,  type: 'kesempatan',name: 'Kesempatan', price: 0, rent: 0, desc: 'Ambil kartu Kesempatan.' },
    { id: 3,  type: 'prop',      group: 'pinggiran', name: 'Kontrakan Petak', price: 4500, rent: 700, desc: 'Favorit perantau baru.' },
    { id: 4,  type: 'tax',       name: 'Pajak Penghasilan', price: 0, rent: 0, desc: 'Setor pajak ke Kas Hibah.' },
    { id: 5,  type: 'kelurahan', name: 'Kantor Kelurahan', price: 0, rent: 0, desc: 'Urus surat: antre atau pelicin.' },
    { id: 6,  type: 'prop',      group: 'industri', name: 'Pabrik Tekstil', price: 6000, rent: 950, desc: 'Lembur terus sampai pagi.' },
    { id: 7,  type: 'risiko',    name: 'Kartu Risiko', price: 0, rent: 0, desc: 'Uji nasib warga Konoha.' },
    { id: 8,  type: 'prop',      group: 'industri', name: 'Gudang Logistik', price: 6500, rent: 1050, desc: 'Pusat distribusi barang.' },
    { id: 9,  type: 'prop',      group: 'industri', name: 'Kawasan Berikat', price: 7000, rent: 1150, desc: 'Zona industri bebas bea.' },
    { id: 10, type: 'jail',      name: 'Rutan Nusakambangan', price: 0, rent: 0, desc: 'Cuma lewat, kecuali kena ciduk.' },
    { id: 11, type: 'prop',      group: 'kuliner', name: 'Warteg Bahari', price: 8000, rent: 1300, desc: 'Penyelamat tanggal tua.' },
    { id: 12, type: 'tilang',    name: 'Razia Tilang', price: 0, rent: 0, desc: 'Siapkan surat-surat kendaraan.' },
    { id: 13, type: 'prop',      group: 'kuliner', name: 'Kopi Senja', price: 8500, rent: 1400, desc: 'Tempat nongkrong diskusi startup.' },
    { id: 14, type: 'prop',      group: 'kuliner', name: 'Pujasera Alun-Alun', price: 9000, rent: 1500, desc: 'Kuliner malam tak pernah tidur.' },
    { id: 15, type: 'pejabat',   name: 'Kantor Pejabat', price: 0, rent: 0, desc: 'Lobi tender proyek negara.' },
    { id: 16, type: 'prop',      group: 'kampus', name: 'Kos Eksklusif', price: 10000, rent: 1650, desc: 'WiFi kencang, parkir luas.' },
    { id: 17, type: 'kesempatan',name: 'Kesempatan', price: 0, rent: 0, desc: 'Ambil kartu Kesempatan.' },
    { id: 18, type: 'prop',      group: 'kampus', name: 'Fotokopi & Print', price: 10500, rent: 1750, desc: 'Cetak skripsi 24 jam.' },
    { id: 19, type: 'prop',      group: 'kampus', name: 'Rektorat Swasta', price: 11500, rent: 1900, desc: 'Uang pangkal naik tiap tahun.' },
    { id: 20, type: 'hibah',     name: 'Dana Hibah', price: 0, rent: 0, desc: 'Klaim seluruh saldo Kas Hibah!' },
    { id: 21, type: 'prop',      group: 'bisnis', name: 'Menara Sudirman', price: 13000, rent: 2200, desc: 'Perkantoran elit ibu kota.' },
    { id: 22, type: 'risiko',    name: 'Kartu Risiko', price: 0, rent: 0, desc: 'Ambil kartu Risiko.' },
    { id: 23, type: 'prop',      group: 'bisnis', name: 'Bursa Efek Konoha', price: 14000, rent: 2400, desc: 'Saham gorengan tiap hari.' },
    { id: 24, type: 'prop',      group: 'bisnis', name: 'Mal Mega Kuningan', price: 15000, rent: 2600, desc: 'Pusat belanja kaum sosialita.' },
    { id: 25, type: 'kelurahan', name: 'Samsat Keliling', price: 0, rent: 0, desc: 'Perpanjang pajak atau bayar calo.' },
    { id: 26, type: 'prop',      group: 'wisata', name: 'Pantai Pasir Putih', price: 16500, rent: 2850, desc: 'Tiket masuk + parkir berlapis.' },
    { id: 27, type: 'prop',      group: 'wisata', name: 'Villa Puncak', price: 17500, rent: 3050, desc: 'Macet total tiap akhir pekan.' },
    { id: 28, type: 'tilang',    name: 'Operasi Patuh', price: 0, rent: 0, desc: 'Razia gabungan akhir bulan.' },
    { id: 29, type: 'prop',      group: 'wisata', name: 'Resor Nusa Dua', price: 18500, rent: 3250, desc: 'Tarif dolar rasa lokal.' },
    { id: 30, type: 'ciduk',     name: 'DICIDUK APARAT!', price: 0, rent: 0, desc: 'Langsung menuju Rutan!' },
    { id: 31, type: 'prop',      group: 'elit', name: 'Menteng Residence', price: 20000, rent: 3600, desc: 'Kawasan hunian pejabat senior.' },
    { id: 32, type: 'prop',      group: 'elit', name: 'Pondok Indah', price: 21500, rent: 3900, desc: 'Rumah megah pagar tinggi.' },
    { id: 33, type: 'kesempatan',name: 'Kesempatan', price: 0, rent: 0, desc: 'Ambil kartu Kesempatan.' },
    { id: 34, type: 'prop',      group: 'elit', name: 'PIK Boulevard', price: 23000, rent: 4200, desc: 'Kawasan reklamasi super elit.' },
    { id: 35, type: 'pejabat',   name: 'Kementerian Proyek', price: 0, rent: 0, desc: 'Tender strategis nasional.' },
    { id: 36, type: 'risiko',    name: 'Kartu Risiko', price: 0, rent: 0, desc: 'Ambil kartu Risiko.' },
    { id: 37, type: 'prop',      group: 'pusat', name: 'Istana Negara', price: 26000, rent: 4800, desc: 'Pusat kekuasaan Negeri Konoha.' },
    { id: 38, type: 'tax',       name: 'Pajak Barang Mewah', price: 0, rent: 0, desc: 'Pungutan khusus sultan.' },
    { id: 39, type: 'prop',      group: 'pusat', name: 'Ibu Kota Nusantara', price: 30000, rent: 5600, desc: 'Proyek mercusuar masa depan.' }
  ];

  const CHANCE_CARDS = [
    { id: 'c1', title: 'Bansos Cair!', desc: 'Dana bantuan sosial mendarat di rekening (+Rp6jt × inflasi).', kind: 'cash', mult: 6000 },
    { id: 'c2', title: 'Dividen BUMN', desc: 'Bagi hasil proyek infrastruktur (+Rp8jt × inflasi).', kind: 'cash', mult: 8000 },
    { id: 'c3', title: 'Kartu Sakti Bebas Rutan', desc: 'Simpan kartu ini untuk keluar gratis dari Rutan!', kind: 'jail_card' },
    { id: 'c4', title: 'Maju ke START', desc: 'Langsung meluncur ke Balai Kota (START).', kind: 'goto', target: 0 },
    { id: 'c5', title: 'Klaim Dana Hibah', desc: 'Menuju petak Dana Hibah sekarang juga!', kind: 'goto', target: 20 },
    { id: 'c6', title: 'Tender Tanpa Lelang', desc: 'Dapat komisi proyek (+Rp10jt × inflasi).', kind: 'cash', mult: 10000 }
  ];

  const RISK_CARDS = [
    { id: 'r1', title: 'Salah Transfer Pajak', desc: 'Setor denda administrasi ke Kas Hibah (−Rp5jt × inflasi).', kind: 'pay_hibah', mult: 5000 },
    { id: 'r2', title: 'Harga BBM Naik', desc: 'Biaya transportasi membengkak (−Rp4jt × inflasi).', kind: 'pay_hibah', mult: 4000 },
    { id: 'r3', title: 'Kena OTT Mendadak!', desc: 'Langsung masuk Rutan Nusakambangan!', kind: 'jail' },
    { id: 'r4', title: 'Renovasi Paksa', desc: 'Bayar perawatan Rp1,5jt × inflasi per bangunan milikmu.', kind: 'repair', mult: 1500 },
    { id: 'r5', title: 'Mundur 3 Langkah', desc: 'Jalanan dialihkan karena iring-iringan pejabat.', kind: 'back', steps: 3 },
    { id: 'r6', title: 'Pungli Parkir Liar', desc: 'Bayar uang keamanan ke Kas Hibah (−Rp3,5jt × inflasi).', kind: 'pay_hibah', mult: 3500 }
  ];

  const DECREES = [
    { id: 'd_triple', icon: '🎲', title: 'Dekret Dadu Tiga', desc: 'Semua warga melempar 3 dadu sekaligus selama 3 putaran!' },
    { id: 'd_tax', icon: '💸', title: 'Pajak Darurat Nasional', desc: 'Semua pajak & denda naik +50% selama 3 putaran.' },
    { id: 'd_rent', icon: '🏢', title: 'Kenaikan Tarif Sewa', desc: 'Seluruh tarif sewa properti naik +40% selama 3 putaran.' },
    { id: 'd_subsidi', icon: '🌾', title: 'Subsidi Biaya Hidup', desc: 'Biaya hidup saat lewat START didiskon 50% selama 3 putaran.' }
  ];

  const POLICIES = [
    { id: 'p_pro_rakyat', icon: '🛡️', title: 'Subsidi Rakyat', desc: 'UMR lewat START +30% selama 10 putaran.' },
    { id: 'p_pro_investor', icon: '📈', title: 'Karpet Merah Investor', desc: 'Biaya bangun & takeover diskon 25% selama 10 putaran.' },
    { id: 'p_pajak_tinggi', icon: '🏛️', title: 'Pajak Progresif', desc: 'Sewa properti +25%, pajak masuk Kas Hibah 2× lipat.' }
  ];

  const DISASTERS = [
    { id: 'banjir', icon: '🌊', title: 'Banjir Tahunan', groups: ['pinggiran', 'kuliner', 'elit'] },
    { id: 'macet', icon: '🚧', title: 'Galian Kabel Abadi', groups: ['industri', 'bisnis', 'pusat'] },
    { id: 'longsor', icon: '⛰️', title: 'Cuaca Ekstrem', groups: ['kampus', 'wisata'] }
  ];

  const NEWS_ITEMS = [
    { title: 'Harga Beras & Cabai Meroket', desc: 'Inflasi terus menggerus nilai uang tunai warga.' },
    { title: 'Investor Borong Lahan Strategis', desc: 'Harga tanah dan tarif sewa ikut terkerek inflasi.' },
    { title: 'Anggaran Infrastruktur Cair', desc: 'Kontraktor berlomba menaikkan level bangunan.' },
    { title: 'Pegadaian Ramai Nasabah', desc: 'Warga menggadaikan tanah demi bertahan hidup.' }
  ];

  function roundMoney(val) {
    return Math.round(val / 50) * 50;
  }

  function formatMoney(amount) {
    const n = Number(amount) || 0;
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1000) {
      const jt = abs / 1000;
      const str = Number.isInteger(jt) ? String(jt) : jt.toFixed(1).replace('.', ',');
      return `${sign}Rp${str}jt`;
    }
    return `${sign}Rp${Math.round(abs)}rb`;
  }

  function calcMoney(S, baseAmount) {
    return roundMoney(baseAmount * (S ? S.infl : 1));
  }

  function getAppraisalInfl(S) {
    if (S && S.suddenDeath && S.crisisFreezeInfl) {
      return S.crisisFreezeInfl;
    }
    return S ? S.infl : 1;
  }

  function calcTilePrice(S, idx) {
    const tile = S.theme.board[idx];
    if (!tile || !tile.price) return 0;
    return roundMoney(tile.price * S.infl);
  }

  function calcBuildCost(S, idx, mode) {
    const tile = S.theme.board[idx];
    if (!tile || !tile.group) return 0;
    const grp = S.theme.groups[tile.group];
    const polMult = (S.policy && S.policy.id === 'p_pro_investor') ? 0.75 : 1;
    const modeMult = mode === 'bribe' ? 1.5 : 1;
    return roundMoney(grp.buildCost * S.infl * polMult * modeMult);
  }

  function calcAssetValue(S, idx) {
    const tile = S.theme.board[idx];
    const ts = S.tiles[idx];
    if (!tile || !tile.price) return 0;
    const landVal = calcTilePrice(S, idx);
    const bldgUnit = tile.group ? roundMoney(S.theme.groups[tile.group].buildCost * S.infl) : 0;
    return landVal + (ts.level * bldgUnit);
  }

  function calcSellTileValue(S, idx) {
    return roundMoney(calcTilePrice(S, idx) * 0.6);
  }

  function calcSellBuildingValue(S, idx) {
    const tile = S.theme.board[idx];
    if (!tile || !tile.group) return 0;
    return roundMoney(S.theme.groups[tile.group].buildCost * S.infl * 0.5);
  }

  function calcMortgageValue(S, idx) {
    const tile = S.theme.board[idx];
    if (!tile || !tile.price) return 0;
    return roundMoney(tile.price * getAppraisalInfl(S) * 0.5);
  }

  function calcRedeemCost(S, idx) {
    const tile = S.theme.board[idx];
    if (!tile || !tile.price) return 0;
    return roundMoney(tile.price * getAppraisalInfl(S) * 0.55);
  }

  function calcTakeoverCost(S, idx) {
    const polMult = (S.policy && S.policy.id === 'p_pro_investor') ? 0.75 : 1;
    return roundMoney(calcAssetValue(S, idx) * 2 * polMult);
  }

  function calcRent(S, idx) {
    const tile = S.theme.board[idx];
    const ts = S.tiles[idx];
    if (!tile || !tile.rent) return 0;
    if (ts && ts.mortgaged > 0) return 0;

    const lvl = ts ? ts.level : 0;
    let rent = tile.rent * (LVL_RENT_MULT[lvl] || 1) * S.infl;

    if (ts && ts.owner && tile.group) {
      const groupTiles = S.theme.board.filter(t => t.group === tile.group);
      const ownsAll = groupTiles.every(t => S.tiles[t.id].owner === ts.owner && S.tiles[t.id].mortgaged === 0);
      if (ownsAll) rent *= 1.35;
    }

    if (S.decree && S.decree.id === 'd_rent') rent *= 1.4;
    if (S.policy && S.policy.id === 'p_pajak_tinggi') rent *= 1.25;
    if (S.disaster && tile.group && S.disaster.groups.includes(tile.group)) rent *= 0.5;

    return roundMoney(rent);
  }

  function createInitialState(playerSpecsOrOpts) {
    const rawList = Array.isArray(playerSpecsOrOpts)
      ? playerSpecsOrOpts
      : ((playerSpecsOrOpts && playerSpecsOrOpts.players) || []);

    const players = rawList.map((p, idx) => ({
      id: p.id || `p${idx + 1}`,
      name: p.name || `Pemain ${idx + 1}`,
      color: p.color || ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'][idx % 4],
      isBot: Boolean(p.isBot),
      cash: 45000,
      pos: 0,
      jail: 0,
      jailCards: 0,
      skipTurn: false,
      pinjolDebt: 0,
      pinjolUsed: false,
      bankrupt: false
    }));

    const tiles = BOARD.map(() => ({
      owner: null,
      level: 0,
      mortgaged: 0
    }));

    return {
      round: 1,
      infl: 1.0,
      hibah: 10000,
      suddenDeath: false,
      crisisFreezeInfl: null,
      phase: 'roll',
      turnIdx: 0,
      winner: null,
      doublesCount: 0,
      theme: {
        board: BOARD,
        groups: GROUPS,
        economy: {
          umrBase: 6000,
          livingCostBase: 2500,
          bailBase: 4000,
          jailBribeBase: 3000,
          kelurahanBribeBase: 2500,
          pejabatTributeBase: 5000,
          tilangFineBase: 3000,
          tilangBribeBase: 1800
        }
      },
      players,
      tiles,
      pending: null,
      voteState: null,
      news: NEWS_ITEMS[0],
      decree: null,
      policy: null,
      disaster: null,
      evSeq: 0,
      ev: []
    };
  }

  function cloneState(S) {
    return JSON.parse(JSON.stringify(S));
  }

  function emit(S, ev) {
    S.ev.push(ev);
  }

  function adjustCash(S, pid, delta, reason) {
    const p = S.players.find(x => x.id === pid);
    if (!p || p.bankrupt || delta === 0) return;

    p.cash = roundMoney(p.cash + delta);
    emit(S, { k: 'cash', pid, a: delta, w: reason });

    if (p.cash < 0 && !p.pinjolUsed) {
      const loan = calcMoney(S, 15000);
      p.pinjolUsed = true;
      p.pinjolDebt = roundMoney(loan * 1.5);
      p.cash = roundMoney(p.cash + loan);
      emit(S, { k: 'pinjol', pid, a: loan });
      emit(S, { k: 'cash', pid, a: loan, w: 'Pinjol Darurat' });
    }

    if (p.cash < 0) {
      declareBankrupt(S, p);
    }
  }

  function declareBankrupt(S, p) {
    if (p.bankrupt) return;
    p.bankrupt = true;
    p.cash = 0;
    p.jail = 0;
    p.skipTurn = false;
    S.tiles.forEach(ts => {
      if (ts.owner === p.id) {
        ts.owner = null;
        ts.level = 0;
        ts.mortgaged = 0;
      }
    });
    emit(S, { k: 'bankrupt', pid: p.id });

    if (checkWinner(S)) return;

    const active = S.players[S.turnIdx];
    if (S.phase !== 'vote' && active && active.id === p.id) {
      advanceTurn(S);
    }
  }

  function checkWinner(S) {
    const alive = S.players.filter(p => !p.bankrupt);
    if (alive.length <= 1) {
      S.phase = 'gameover';
      S.winner = alive[0] ? alive[0].id : null;
      S.pending = null;
      S.voteState = null;
      return true;
    }
    return false;
  }

  function passStart(S, p) {
    const umrInfl = 1 + (S.infl - 1) * 0.65;
    const polMult = (S.policy && S.policy.id === 'p_pro_rakyat') ? 1.3 : 1.0;
    const umr = roundMoney(S.theme.economy.umrBase * umrInfl * polMult);
    adjustCash(S, p.id, umr, 'Gaji UMR');
    if (p.bankrupt) return;

    const livingMult = (S.decree && S.decree.id === 'd_subsidi') ? 0.5 : 1.0;
    const livingCost = roundMoney(S.theme.economy.livingCostBase * S.infl * livingMult);
    adjustCash(S, p.id, -livingCost, 'Biaya Hidup');
    if (p.bankrupt) return;

    if (p.pinjolDebt > 0) {
      const debt = p.pinjolDebt;
      p.pinjolDebt = 0;
      adjustCash(S, p.id, -debt, 'Tagihan Pinjol');
    }
  }

  function movePlayerSteps(S, p, steps) {
    const from = p.pos;
    const rawTo = from + steps;
    const to = ((rawTo % 40) + 40) % 40;
    p.pos = to;
    emit(S, { k: 'move', pid: p.id, from, to, steps });

    if (steps > 0 && rawTo >= 40) {
      passStart(S, p);
    }
    if (!p.bankrupt) {
      resolveLanding(S, p);
    }
  }

  function sendToJail(S, p) {
    if (p.bankrupt) return;
    p.pos = 10;
    p.jail = 3;
    S.doublesCount = 0;
    emit(S, { k: 'jail', pid: p.id });
    advanceTurn(S);
  }

  function resolveLanding(S, p) {
    if (p.bankrupt) return;
    const idx = p.pos;
    const tile = S.theme.board[idx];
    const ts = S.tiles[idx];

    if (tile.type === 'start' || tile.type === 'jail') {
      endOrRepeatTurn(S, p);
      return;
    }

    if (tile.type === 'hibah') {
      const prize = S.hibah;
      S.hibah = calcMoney(S, 5000);
      if (prize > 0) adjustCash(S, p.id, prize, 'Dana Hibah');
      if (!p.bankrupt) endOrRepeatTurn(S, p);
      return;
    }

    if (tile.type === 'tax') {
      const decreeMult = (S.decree && S.decree.id === 'd_tax') ? 1.5 : 1.0;
      const taxAmt = roundMoney(3500 * S.infl * decreeMult);
      const hibahMult = (S.policy && S.policy.id === 'p_pajak_tinggi') ? 2 : 1;
      S.hibah = roundMoney(S.hibah + taxAmt * hibahMult);
      adjustCash(S, p.id, -taxAmt, tile.name);
      if (!p.bankrupt) endOrRepeatTurn(S, p);
      return;
    }

    if (tile.type === 'ciduk') {
      S.phase = 'decide';
      S.pending = {
        kind: 'ciduk',
        tile: idx,
        bribeCost: calcMoney(S, 5000)
      };
      return;
    }

    if (tile.type === 'kelurahan') {
      S.phase = 'decide';
      S.pending = {
        kind: 'kelurahan',
        tile: idx,
        bribeCost: calcMoney(S, S.theme.economy.kelurahanBribeBase)
      };
      return;
    }

    if (tile.type === 'pejabat') {
      S.phase = 'decide';
      S.pending = {
        kind: 'pejabat',
        tile: idx,
        cost: calcMoney(S, S.theme.economy.pejabatTributeBase)
      };
      return;
    }

    if (tile.type === 'tilang') {
      S.phase = 'decide';
      S.pending = {
        kind: 'tilang',
        tile: idx,
        fineCost: calcMoney(S, S.theme.economy.tilangFineBase),
        bribeCost: calcMoney(S, S.theme.economy.tilangBribeBase)
      };
      return;
    }

    if (tile.type === 'kesempatan' || tile.type === 'risiko') {
      drawAndResolveCard(S, p, tile.type);
      return;
    }

    if (tile.type === 'prop') {
      if (!ts.owner) {
        S.phase = 'decide';
        S.pending = {
          kind: 'buy',
          tile: idx,
          price: calcTilePrice(S, idx)
        };
        return;
      }

      if (ts.owner === p.id) {
        if (ts.mortgaged === 0 && ts.level < 3) {
          S.phase = 'decide';
          S.pending = {
            kind: 'build',
            tile: idx,
            nextLevel: ts.level + 1,
            officialCost: calcBuildCost(S, idx, 'official'),
            bribeCost: calcBuildCost(S, idx, 'bribe')
          };
          return;
        }
        endOrRepeatTurn(S, p);
        return;
      }

      const owner = S.players.find(x => x.id === ts.owner);
      const rent = calcRent(S, idx);
      if (rent > 0 && owner && !owner.bankrupt) {
        const maxPayable = Math.max(0, p.cash + (!p.pinjolUsed ? calcMoney(S, 15000) : 0));
        const receivedByOwner = Math.min(rent, maxPayable);
        adjustCash(S, p.id, -rent, `Sewa ${tile.name}`);
        if (receivedByOwner > 0 && !owner.bankrupt) {
          adjustCash(S, owner.id, receivedByOwner, `Sewa ${tile.name}`);
        }
      }
      if (p.bankrupt) return;

      if (ts.mortgaged === 0 && ts.level < 3) {
        const toCost = calcTakeoverCost(S, idx);
        if (p.cash >= toCost) {
          S.phase = 'decide';
          S.pending = {
            kind: 'takeover',
            tile: idx,
            owner: ts.owner,
            cost: toCost
          };
          return;
        }
      }

      endOrRepeatTurn(S, p);
    }
  }

  function drawAndResolveCard(S, p, deckName) {
    const pool = deckName === 'kesempatan' ? CHANCE_CARDS : RISK_CARDS;
    const card = pool[Math.floor(Math.random() * pool.length)];
    emit(S, { k: 'card', pid: p.id, deck: deckName, card: { title: card.title, desc: card.desc } });

    if (card.kind === 'cash') {
      adjustCash(S, p.id, calcMoney(S, card.mult), card.title);
      if (!p.bankrupt) endOrRepeatTurn(S, p);
    } else if (card.kind === 'pay_hibah') {
      const amt = calcMoney(S, card.mult);
      S.hibah = roundMoney(S.hibah + amt);
      adjustCash(S, p.id, -amt, card.title);
      if (!p.bankrupt) endOrRepeatTurn(S, p);
    } else if (card.kind === 'jail_card') {
      p.jailCards += 1;
      endOrRepeatTurn(S, p);
    } else if (card.kind === 'jail') {
      sendToJail(S, p);
    } else if (card.kind === 'goto') {
      const steps = (card.target - p.pos + 40) % 40 || 40;
      movePlayerSteps(S, p, steps);
    } else if (card.kind === 'back') {
      const from = p.pos;
      p.pos = (p.pos - card.steps + 40) % 40;
      emit(S, { k: 'move', pid: p.id, from, to: p.pos, steps: -card.steps });
      resolveLanding(S, p);
    } else if (card.kind === 'repair') {
      let bldgs = 0;
      S.tiles.forEach(ts => { if (ts.owner === p.id) bldgs += ts.level; });
      const total = calcMoney(S, card.mult * bldgs);
      if (total > 0) {
        S.hibah = roundMoney(S.hibah + total);
        adjustCash(S, p.id, -total, card.title);
      }
      if (!p.bankrupt) endOrRepeatTurn(S, p);
    }
  }

  function endOrRepeatTurn(S, p) {
    if (S.phase === 'gameover') return;
    S.pending = null;
    if (S.doublesCount > 0 && S.doublesCount < 3 && p.jail === 0 && !p.bankrupt) {
      S.phase = 'roll';
      return;
    }
    advanceTurn(S);
  }

  function advanceTurn(S) {
    if (checkWinner(S)) return;
    S.pending = null;
    S.doublesCount = 0;
    S.phase = 'roll';

    const n = S.players.length;
    let wrappedRound = false;
    for (let i = 1; i <= n; i++) {
      const nextIdx = (S.turnIdx + i) % n;
      if (nextIdx <= S.turnIdx) wrappedRound = true;
      const candidate = S.players[nextIdx];
      if (candidate && !candidate.bankrupt) {
        S.turnIdx = nextIdx;
        if (wrappedRound) onNewRound(S);
        if (S.phase === 'gameover' || S.phase === 'vote') return;
        if (candidate.skipTurn) {
          candidate.skipTurn = false;
          advanceTurn(S);
        }
        return;
      }
    }
  }

  function onNewRound(S) {
    S.round += 1;

    if (S.round >= 40) {
      if (!S.suddenDeath) {
        S.suddenDeath = true;
        S.crisisFreezeInfl = S.infl;
        emit(S, { k: 'crisis_start' });
      }
      S.infl = Number((S.infl + 1.0).toFixed(2));
    } else {
      if (S.round === 37) {
        emit(S, { k: 'crisis_warn', targetRound: 40 });
      }
      S.infl = Number((S.infl + 0.08).toFixed(2));
    }

    S.tiles.forEach((ts, idx) => {
      if (ts.owner && ts.mortgaged > 0) {
        ts.mortgaged -= 1;
        if (ts.mortgaged <= 0) {
          const prevOwner = ts.owner;
          ts.owner = null;
          ts.level = 0;
          ts.mortgaged = 0;
          emit(S, { k: 'seized', pid: prevOwner, tile: idx, w: 'Gadai Hangus' });
        }
      }
    });

    if (S.decree) {
      S.decree.roundsLeft -= 1;
      if (S.decree.roundsLeft <= 0) S.decree = null;
    }
    if (S.policy) {
      S.policy.roundsLeft -= 1;
      if (S.policy.roundsLeft <= 0) S.policy = null;
    }
    if (S.disaster) {
      S.disaster.roundsLeft -= 1;
      if (S.disaster.roundsLeft <= 0) S.disaster = null;
    }

    if (S.round % 3 === 0) {
      const news = NEWS_ITEMS[Math.floor(Math.random() * NEWS_ITEMS.length)];
      S.news = news;
      emit(S, { k: 'news', news });
    }

    if (S.round % 6 === 0 && !S.decree) {
      const dec = DECREES[Math.floor(Math.random() * DECREES.length)];
      S.decree = Object.assign({}, dec, { roundsLeft: 3 });
      emit(S, { k: 'decree', decree: S.decree });
    }

    if (S.round % 8 === 0 && !S.disaster) {
      const dis = DISASTERS[Math.floor(Math.random() * DISASTERS.length)];
      S.disaster = Object.assign({}, dis, { roundsLeft: 2 });
      emit(S, { k: 'disaster', disaster: S.disaster });
    }

    if (S.round % 10 === 0) {
      S.phase = 'vote';
      S.voteState = {
        candidates: POLICIES,
        votes: {}
      };
    }
  }

  function applyAction(rawState, actorId, action) {
    const S = cloneState(rawState);
    S.evSeq += 1;
    S.ev = [];

    if (S.phase === 'gameover') return S;

    if (S.phase !== 'vote' && S.players[S.turnIdx] && S.players[S.turnIdx].bankrupt) {
      advanceTurn(S);
      return S;
    }

    if (S.phase === 'vote' && S.voteState) {
      const voter = S.players.find(p => p.id === actorId);
      if (!voter || voter.bankrupt || S.voteState.votes[actorId]) return S;

      const idx = action.type === 'timeout' ? 0 : Math.max(0, Math.min(S.voteState.candidates.length - 1, Number(action.policyIdx) || 0));
      const fajarUnit = calcMoney(S, 5000);
      const maxFajar = Math.min(2, Math.floor(voter.cash / fajarUnit));
      const fajar = action.type === 'timeout' ? 0 : Math.max(0, Math.min(maxFajar, Number(action.fajar) || 0));

      if (fajar > 0) {
        adjustCash(S, voter.id, -(fajar * fajarUnit), 'Serangan Fajar');
      }
      S.voteState.votes[actorId] = { policyIdx: idx, weight: 1 + fajar };

      const aliveVoters = S.players.filter(p => !p.bankrupt);
      if (aliveVoters.every(p => Boolean(S.voteState.votes[p.id]))) {
        const tally = [0, 0, 0];
        Object.values(S.voteState.votes).forEach(v => {
          tally[v.policyIdx] = (tally[v.policyIdx] || 0) + v.weight;
        });
        let winIdx = 0;
        if (tally[1] > tally[winIdx]) winIdx = 1;
        if (tally[2] > tally[winIdx]) winIdx = 2;

        const chosen = S.voteState.candidates[winIdx];
        S.policy = Object.assign({}, chosen, { roundsLeft: 10 });
        S.voteState = null;
        S.phase = 'roll';
        emit(S, { k: 'election_result', policy: S.policy });

        const curTurnPlayer = S.players[S.turnIdx];
        if (!curTurnPlayer || curTurnPlayer.bankrupt) {
          advanceTurn(S);
        } else if (curTurnPlayer.skipTurn) {
          curTurnPlayer.skipTurn = false;
          advanceTurn(S);
        }
      }
      return S;
    }

    const active = S.players[S.turnIdx];
    if (!active || active.id !== actorId || active.bankrupt) return S;

    if (action.type === 'manage' && S.phase === 'roll' && active.jail === 0) {
      const idx = Number(action.tile);
      const ts = S.tiles[idx];
      if (!ts || ts.owner !== active.id) return S;

      if (action.sub === 'mortgage' && ts.level === 0 && ts.mortgaged === 0) {
        const val = calcMortgageValue(S, idx);
        ts.mortgaged = 4;
        adjustCash(S, active.id, val, 'Gadai Tanah');
      } else if (action.sub === 'redeem' && ts.mortgaged > 0) {
        const cost = calcRedeemCost(S, idx);
        if (active.cash >= cost) {
          ts.mortgaged = 0;
          adjustCash(S, active.id, -cost, 'Tebus Gadai');
        }
      } else if (action.sub === 'sellBuilding' && ts.level > 0) {
        const val = calcSellBuildingValue(S, idx);
        ts.level -= 1;
        emit(S, { k: 'sell', pid: active.id, tile: idx, sub: 'sellBuilding' });
        adjustCash(S, active.id, val, 'Jual Bangunan');
      } else if (action.sub === 'sellTile' && ts.level === 0 && ts.mortgaged === 0) {
        const val = calcSellTileValue(S, idx);
        ts.owner = null;
        ts.level = 0;
        ts.mortgaged = 0;
        emit(S, { k: 'sell', pid: active.id, tile: idx, sub: 'sellTile' });
        adjustCash(S, active.id, val, 'Jual Tanah');
      }
      return S;
    }

    if (S.phase === 'roll' && active.jail > 0) {
      const choice = action.type === 'timeout' ? 'roll' : action.choice;
      if (choice === 'card' && active.jailCards > 0) {
        active.jailCards -= 1;
        active.jail = 0;
      } else if (choice === 'pay') {
        const bail = calcMoney(S, S.theme.economy.bailBase);
        if (active.cash >= bail) {
          active.jail = 0;
          adjustCash(S, active.id, -bail, 'Jaminan Rutan');
        }
      } else if (choice === 'bribe') {
        const bribe = calcMoney(S, S.theme.economy.jailBribeBase);
        if (active.cash >= bribe) {
          adjustCash(S, active.id, -bribe, 'Suap Sipir');
          if (!active.bankrupt) {
            if (Math.random() < 0.3) {
              active.jail += 1;
              advanceTurn(S);
            } else {
              active.jail = 0;
            }
          }
        }
      } else {
        const d1 = 1 + Math.floor(Math.random() * 6);
        const d2 = 1 + Math.floor(Math.random() * 6);
        emit(S, { k: 'dice', pid: active.id, dice: [d1, d2] });
        if (d1 === d2) {
          active.jail = 0;
          movePlayerSteps(S, active, d1 + d2);
        } else {
          active.jail -= 1;
          advanceTurn(S);
        }
      }
      return S;
    }

    if (S.phase === 'roll' && (action.type === 'roll' || action.type === 'timeout')) {
      const count = (S.decree && S.decree.id === 'd_triple') ? 3 : 2;
      const dice = [];
      for (let i = 0; i < count; i++) {
        dice.push(1 + Math.floor(Math.random() * 6));
      }
      emit(S, { k: 'dice', pid: active.id, dice });

      const isDouble = dice.length >= 2 && dice[0] === dice[1];
      if (isDouble) {
        S.doublesCount += 1;
        if (S.doublesCount >= 3) {
          sendToJail(S, active);
          return S;
        }
      } else {
        S.doublesCount = 0;
      }

      const steps = dice.reduce((a, b) => a + b, 0);
      movePlayerSteps(S, active, steps);
      return S;
    }

    if (S.phase === 'decide' && S.pending) {
      const pend = S.pending;
      const choice = action.type === 'timeout' ? 'skip' : action.choice;
      const ts = pend.tile !== undefined ? S.tiles[pend.tile] : null;

      if (pend.kind === 'buy') {
        if (choice === 'buy' && active.cash >= pend.price) {
          ts.owner = active.id;
          emit(S, { k: 'buy', pid: active.id, tile: pend.tile });
          adjustCash(S, active.id, -pend.price, `Beli ${S.theme.board[pend.tile].name}`);
        }
        if (!active.bankrupt) endOrRepeatTurn(S, active);
      } else if (pend.kind === 'build') {
        if (choice === 'official' && active.cash >= pend.officialCost) {
          adjustCash(S, active.id, -pend.officialCost, 'Izin Bangunan');
          if (!active.bankrupt && Math.random() >= 0.3) {
            ts.level = pend.nextLevel;
            emit(S, { k: 'build', pid: active.id, tile: pend.tile, level: ts.level });
          }
        } else if (choice === 'bribe' && active.cash >= pend.bribeCost) {
          adjustCash(S, active.id, -pend.bribeCost, 'Pelicin Izin');
          if (!active.bankrupt) {
            ts.level = pend.nextLevel;
            emit(S, { k: 'build', pid: active.id, tile: pend.tile, level: ts.level });
          }
        }
        if (!active.bankrupt) endOrRepeatTurn(S, active);
      } else if (pend.kind === 'takeover') {
        if (choice === 'takeover' && active.cash >= pend.cost) {
          const prevOwner = ts.owner;
          ts.owner = active.id;
          emit(S, { k: 'buy', pid: active.id, tile: pend.tile });
          adjustCash(S, active.id, -pend.cost, 'Takeover Aset');
          if (prevOwner) adjustCash(S, prevOwner, pend.cost, 'Hasil Takeover');
        }
        if (!active.bankrupt) endOrRepeatTurn(S, active);
      } else if (pend.kind === 'ciduk') {
        if (choice === 'bribe' && active.cash >= pend.bribeCost) {
          adjustCash(S, active.id, -pend.bribeCost, 'Sogok Penyidik');
          if (!active.bankrupt) {
            if (Math.random() < 0.5) {
              endOrRepeatTurn(S, active);
            } else {
              sendToJail(S, active);
            }
          }
        } else {
          sendToJail(S, active);
        }
      } else if (pend.kind === 'kelurahan') {
        if (choice === 'bribe' && active.cash >= pend.bribeCost) {
          adjustCash(S, active.id, -pend.bribeCost, 'Pelicin Kelurahan');
        } else {
          active.skipTurn = true;
        }
        if (!active.bankrupt) endOrRepeatTurn(S, active);
      } else if (pend.kind === 'pejabat') {
        if (choice === 'tribute' && active.cash >= pend.cost) {
          adjustCash(S, active.id, -pend.cost, 'Upeti Proyek');
          if (!active.bankrupt) {
            const roll = Math.random();
            if (roll < 0.55) {
              adjustCash(S, active.id, calcMoney(S, 20000), 'Menang Tender');
              if (!active.bankrupt) endOrRepeatTurn(S, active);
            } else if (roll < 0.8) {
              endOrRepeatTurn(S, active);
            } else {
              sendToJail(S, active);
            }
          }
        } else {
          endOrRepeatTurn(S, active);
        }
      } else if (pend.kind === 'tilang') {
        if (choice === 'bribe' && active.cash >= pend.bribeCost) {
          adjustCash(S, active.id, -pend.bribeCost, 'Damai di Tempat');
          if (!active.bankrupt) {
            if (Math.random() < 0.25) {
              sendToJail(S, active);
            } else {
              endOrRepeatTurn(S, active);
            }
          }
        } else {
          S.hibah = roundMoney(S.hibah + pend.fineCost);
          adjustCash(S, active.id, -pend.fineCost, 'Denda Tilang');
          if (!active.bankrupt) endOrRepeatTurn(S, active);
        }
      }
      return S;
    }

    return S;
  }

  function apply(rawState, actorId, action) {
    const next = applyAction(rawState, actorId, action);
    return { state: next, events: next.ev || [] };
  }

  function chooseBotAction(S, botId) {
    if (!S || S.phase === 'gameover') return null;
    const bot = S.players.find(p => p.id === botId);
    if (!bot || bot.bankrupt) return null;

    if (S.phase === 'vote' && S.voteState) {
      return { type: 'vote', policyIdx: Math.floor(Math.random() * 3), fajar: 0 };
    }

    if (S.phase === 'roll') {
      if (bot.jail > 0) {
        if (bot.jailCards > 0) return { type: 'jail', choice: 'card' };
        const bail = calcMoney(S, S.theme.economy.bailBase);
        if (bot.cash > bail * 2.5) return { type: 'jail', choice: 'pay' };
        return { type: 'jail', choice: 'roll' };
      }

      if (bot.cash < calcMoney(S, 4000)) {
        const myTileIdx = S.tiles.findIndex(t => t.owner === bot.id && t.mortgaged === 0);
        if (myTileIdx !== -1) {
          const ts = S.tiles[myTileIdx];
          if (ts.level > 0) return { type: 'manage', sub: 'sellBuilding', tile: myTileIdx };
          return { type: 'manage', sub: 'mortgage', tile: myTileIdx };
        }
      }

      return { type: 'roll' };
    }

    if (S.phase === 'decide' && S.pending) {
      const pend = S.pending;
      if (pend.kind === 'buy') {
        return { type: 'decide', choice: bot.cash >= pend.price * 1.45 ? 'buy' : 'skip' };
      }
      if (pend.kind === 'build') {
        if (bot.cash >= pend.bribeCost * 1.8) return { type: 'decide', choice: 'bribe' };
        if (bot.cash >= pend.officialCost * 1.5) return { type: 'decide', choice: 'official' };
        return { type: 'decide', choice: 'skip' };
      }
      if (pend.kind === 'takeover') {
        return { type: 'decide', choice: bot.cash >= pend.cost * 2.2 ? 'takeover' : 'skip' };
      }
      if (pend.kind === 'ciduk') {
        return { type: 'decide', choice: bot.cash >= pend.bribeCost * 2 ? 'bribe' : 'surrender' };
      }
      if (pend.kind === 'kelurahan') {
        return { type: 'decide', choice: bot.cash >= pend.bribeCost * 2 ? 'bribe' : 'queue' };
      }
      if (pend.kind === 'pejabat') {
        return { type: 'decide', choice: bot.cash >= pend.cost * 3 ? 'tribute' : 'leave' };
      }
      if (pend.kind === 'tilang') {
        return { type: 'decide', choice: bot.cash >= pend.fineCost ? 'fine' : 'bribe' };
      }
      return { type: 'decide', choice: 'skip' };
    }

    return null;
  }

  return {
    LVL_NAMES,
    GROUPS,
    BOARD,
    formatMoney,
    calcMoney,
    calcTilePrice,
    calcBuildCost,
    calcAssetValue,
    calcSellTileValue,
    calcSellBuildingValue,
    calcMortgageValue,
    calcRedeemCost,
    calcTakeoverCost,
    calcRent,
    createInitialState,
    applyAction,
    apply,
    chooseBotAction
  };
}));