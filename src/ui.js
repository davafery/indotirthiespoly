(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./engine.js'),
      require('./rooms.js'),
      require('./net.js'),
      require('./scene.js'),
      require('./sound.js'),
      require('./themes.js')
    );
  } else {
    root.KonohapolyUI = factory(
      root.KonohapolyEngine,
      root.KonohapolyRooms,
      root.KonohapolyNet,
      root.KonohapolyScene,
      root.KonohapolySound,
      root.KonohapolyThemes
    );
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Engine, Rooms, Net, Scene, RawSound, RawThemes) {
  'use strict';

  const LVL_NAMES = (Engine && Engine.LVL_NAMES) || ['Tanah Kosong', 'Rumah', 'Ruko', 'Landmark'];

  const SafeEngine = {
    formatMoney: val => (Engine && Engine.formatMoney ? Engine.formatMoney(val) : `Rp${Number(val || 0).toLocaleString('id-ID')}`),
    calcMoney: (G, base) => (Engine && Engine.calcMoney ? Engine.calcMoney(G, base) : Math.round((base || 0) * (G.infl || 1))),
    calcTilePrice: (G, idx) => (Engine && Engine.calcTilePrice ? Engine.calcTilePrice(G, idx) : SafeEngine.calcMoney(G, G.theme.board[idx]?.price || 0)),
    calcRent: (G, idx) => (Engine && Engine.calcRent ? Engine.calcRent(G, idx) : 0),
    calcAssetValue: (G, idx) => (Engine && Engine.calcAssetValue ? Engine.calcAssetValue(G, idx) : SafeEngine.calcTilePrice(G, idx)),
    calcMortgageValue: (G, idx) => (Engine && Engine.calcMortgageValue ? Engine.calcMortgageValue(G, idx) : Math.round(SafeEngine.calcTilePrice(G, idx) * 0.5)),
    calcRedeemCost: (G, idx) => (Engine && Engine.calcRedeemCost ? Engine.calcRedeemCost(G, idx) : Math.round(SafeEngine.calcTilePrice(G, idx) * 0.55)),
    calcSellBuildingValue: (G, idx) => (Engine && Engine.calcSellBuildingValue ? Engine.calcSellBuildingValue(G, idx) : Math.round(SafeEngine.calcTilePrice(G, idx) * 0.35)),
    calcSellTileValue: (G, idx) => (Engine && Engine.calcSellTileValue ? Engine.calcSellTileValue(G, idx) : Math.round(SafeEngine.calcTilePrice(G, idx) * 0.6))
  };

  const Sound = {
    unlock: () => { if (RawSound && RawSound.unlock) RawSound.unlock(); },
    play: k => { if (RawSound && RawSound.play) RawSound.play(k); },
    isMuted: () => Boolean(RawSound && RawSound.isMuted && RawSound.isMuted()),
    toggleMute: () => (RawSound && RawSound.toggleMute ? RawSound.toggleMute() : false)
  };

  const Themes = {
    THEMES: (RawThemes && RawThemes.THEMES) || {},
    getSavedThemeId: () => (RawThemes && RawThemes.getSavedThemeId ? RawThemes.getSavedThemeId() : 'nusantara'),
    getTheme: id => (RawThemes && RawThemes.getTheme ? RawThemes.getTheme(id) : null),
    setTheme: id => (RawThemes && RawThemes.setTheme ? RawThemes.setTheme(id) : null),
    applyThemeToDOM: t => { if (RawThemes && RawThemes.applyThemeToDOM && t) RawThemes.applyThemeToDOM(t); }
  };

  const QUICK_CHATS = [
    'Berkas kurang satu 📄',
    'Ampun Bang Jago 🙏',
    'Waduh inflasi 😭',
    'Aman terkendali 😎',
    'Siap-siap krismon 🚨'
  ];

  let rootEl = null;
  let currentScreen = 'login';
  let lobbyHovered = false;
  let lastLobbyHash = '';
  let lobbyPollTimer = null;
  let hostIdleTimer = null;
  let turnTimerInterval = null;
  let turnTimerKey = '';
  let turnDeadline = 0;
  let lastShownEventSeq = -1;
  let notifQueue = [];
  let activeNotif = null;
  let notifTimer = null;
  let activeModalHtml = '';
  let isAssetsModalOpen = false;
  let assetsModalPid = '';
  let powerHolding = false;
  let powerValue = 0;
  let powerRaf = null;
  let rollSubmitting = false;
  let voteSelection = 0;
  let voteFajar = 0;

  let visualHoldUntil = 0;
  let visualHoldTimer = null;

  let chatOpen = false;
  let lastSeenChatCount = 0;
  let renderedChatHash = '';

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resetPowerState() {
    powerHolding = false;
    rollSubmitting = false;
    powerValue = 0;
    if (powerRaf) {
      cancelAnimationFrame(powerRaf);
      powerRaf = null;
    }
  }

  function clearVisualHold() {
    visualHoldUntil = 0;
    if (visualHoldTimer) {
      clearTimeout(visualHoldTimer);
      visualHoldTimer = null;
    }
  }

  function isVisualHolding() {
    return Date.now() < visualHoldUntil;
  }

  function init(container) {
    rootEl = typeof container === 'string' ? document.querySelector(container) : container;
    if (!rootEl) return;

    const activeTheme = Themes.getTheme(Themes.getSavedThemeId());
    Themes.applyThemeToDOM(activeTheme);

    window.addEventListener('pointerdown', () => {
      Sound.unlock();
    }, { once: true });

    const savedUser = Net.init();
    Net.subscribe(onRoomStateChanged);

    if (savedUser && Net.getActiveRoom()) {
      showRoom();
    } else if (savedUser) {
      showLobby();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    currentScreen = 'login';
    stopBackgroundTimers();
    clearVisualHold();
    resetPowerState();
    rootEl.innerHTML = `
      <div class="kp-screen kp-center">
        <div class="kp-card kp-login-box">
          <div class="kp-badge">EDISI SATIRE NEGERI KONOHA</div>
          <h1 class="kp-title">KONOHAPOLY</h1>
          <p class="kp-sub">Bukan soal jadi paling kaya, tapi siapa yang paling lama bertahan hidup menghadapi inflasi, razia, dan janji manis.</p>
          <form id="kp-login-form" class="kp-stack">
            <label class="kp-label">Nama Panggilan Warga</label>
            <input id="kp-username" class="kp-input" type="text" maxlength="18" placeholder="Contoh: Warga +62" required autofocus />
            <button type="submit" class="kp-btn kp-btn-primary">Masuk ke Balai Warga</button>
          </form>
        </div>
      </div>
    `;
    document.getElementById('kp-login-form').addEventListener('submit', e => {
      e.preventDefault();
      Sound.play('click');
      const val = document.getElementById('kp-username').value;
      Net.login(val);
      showLobby();
    });
  }

  function showLobby() {
    currentScreen = 'lobby';
    stopBackgroundTimers();
    clearVisualHold();
    resetPowerState();
    const user = Net.getUser() || Net.login('Warga +62');
    const hasThemes = Object.keys(Themes.THEMES).length > 0;

    rootEl.innerHTML = `
      <div class="kp-screen kp-lobby">
        <header class="kp-lobby-head">
          <div>
            <h2 class="kp-logo-sm">KONOHAPOLY</h2>
            <span class="kp-muted">Halo, <strong>${esc(user.name)}</strong></span>
          </div>
          <div class="kp-row kp-wrap">
            <button id="kp-btn-sound" type="button" class="kp-btn kp-btn-ghost">${Sound.isMuted() ? '🔇 Bisu' : '🔊 Suara'}</button>
            ${hasThemes ? `<button id="kp-btn-theme" type="button" class="kp-btn kp-btn-ghost">🎨 Tema</button>` : ''}
            <button id="kp-btn-rules" type="button" class="kp-btn kp-btn-ghost">? Aturan</button>
            <button id="kp-btn-logout" type="button" class="kp-btn kp-btn-ghost">Ganti Nama</button>
          </div>
        </header>

        <div class="kp-lobby-grid">
          <section class="kp-card">
            <h3>Buat Meja Baru</h3>
            <p class="kp-muted kp-sm">Main sendiri lawan Bot, atau tambah pemain Hotseat di perangkat yang sama (3–4 pemain).</p>
            <form id="kp-create-form" class="kp-stack kp-mt">
              <input id="kp-room-name" class="kp-input" type="text" maxlength="26" value="Meja ${esc(user.name)}" placeholder="Nama room..." />
              <button type="submit" class="kp-btn kp-btn-primary">+ Buat Room</button>
            </form>
          </section>

          <section class="kp-card">
            <div class="kp-row-between">
              <h3>Daftar Room</h3>
              <span class="kp-muted kp-xs">Arahkan kursor untuk menahan daftar</span>
            </div>
            <div id="kp-room-list" class="kp-room-list"></div>
          </section>
        </div>
      </div>
      <div id="kp-modal-layer"></div>
    `;

    const listEl = document.getElementById('kp-room-list');
    listEl.addEventListener('mouseenter', () => { lobbyHovered = true; });
    listEl.addEventListener('mouseleave', () => { lobbyHovered = false; });

    document.getElementById('kp-create-form').addEventListener('submit', e => {
      e.preventDefault();
      Sound.play('click');
      const name = document.getElementById('kp-room-name').value;
      Net.createRoom(name);
      showRoom();
    });

    document.getElementById('kp-btn-sound').addEventListener('click', e => {
      const nowMuted = Sound.toggleMute();
      e.currentTarget.textContent = nowMuted ? '🔇 Bisu' : '🔊 Suara';
      if (!nowMuted) Sound.play('click');
    });
    const themeBtn = document.getElementById('kp-btn-theme');
    if (themeBtn) themeBtn.addEventListener('click', openThemeModal);
    document.getElementById('kp-btn-rules').addEventListener('click', openRulesModal);
    document.getElementById('kp-btn-logout').addEventListener('click', showLogin);

    lastLobbyHash = '';
    renderLobbyList(true);
    lobbyPollTimer = setInterval(() => renderLobbyList(false), 3000);
  }

  function renderLobbyList(force) {
    if (currentScreen !== 'lobby') return;
    if (lobbyHovered && !force) return;

    const list = Net.listRooms();
    const hash = JSON.stringify(list);
    if (hash === lastLobbyHash && !force) return;
    lastLobbyHash = hash;

    const listEl = document.getElementById('kp-room-list');
    if (!listEl) return;

    if (list.length === 0) {
      listEl.innerHTML = `<div class="kp-empty">Belum ada room aktif. Buat room baru di sebelah kiri!</div>`;
      return;
    }

    listEl.innerHTML = list.map(r => {
      const statusBadge = r.status === 'waiting'
        ? `<span class="kp-tag kp-tag-wait">Menunggu (${r.activeCount}/${r.maxSeats})</span>`
        : `<span class="kp-tag kp-tag-play">Sedang Main · Putaran ${r.round}</span>`;
      const btnLabel = r.status === 'waiting' ? 'Gabung' : 'Masuk / Tonton';
      return `
        <div class="kp-room-item">
          <div>
            <div class="kp-room-title">${esc(r.name)}</div>
            <div class="kp-muted kp-xs">Host: ${esc(r.hostName)} · ${statusBadge}</div>
          </div>
          <button type="button" class="kp-btn kp-btn-sm kp-btn-primary" data-join="${esc(r.id)}">${btnLabel}</button>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-join]').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.play('click');
        const res = Net.joinRoom(btn.getAttribute('data-join'));
        if (!res.ok) {
          alert(res.error);
          renderLobbyList(true);
          return;
        }
        showRoom();
      });
    });
  }

  function showRoom() {
    currentScreen = 'room';
    stopBackgroundTimers();
    clearVisualHold();
    resetPowerState();
    lastShownEventSeq = -1;
    notifQueue = [];
    activeNotif = null;
    activeModalHtml = '';
    isAssetsModalOpen = false;
    assetsModalPid = '';
    chatOpen = false;
    lastSeenChatCount = 0;
    renderedChatHash = '';

    const room = Net.getActiveRoom();
    if (!room) {
      showLobby();
      return;
    }
    onRoomStateChanged(room, Net.getThinkingPid());
  }

  function onRoomStateChanged(room, thinkingPid) {
    if (currentScreen !== 'room') return;
    if (!room) {
      alert('Room telah ditutup.');
      showLobby();
      return;
    }

    if (room.status === 'waiting') {
      stopBackgroundTimers();
      clearVisualHold();
      resetPowerState();
      activeModalHtml = '';
      isAssetsModalOpen = false;
      lastShownEventSeq = -1;
      renderWaitingRoom(room);
    } else {
      renderGameScreen(room, thinkingPid);
    }
  }

  function renderWaitingRoom(room) {
    const user = Net.getUser() || Net.login('Warga +62');
    const isHost = room.hostUid === user.uid;
    const occupiedCount = room.seats.filter(s => s.player).length;
    const idleSec = Math.floor((Date.now() - room.hostLastActiveAt) / 1000);

    rootEl.innerHTML = `
      <div class="kp-screen kp-center">
        <div class="kp-card kp-wait-box">
          <div class="kp-row-between">
            <div>
              <span class="kp-badge">LOBBY ROOM</span>
              <h2 class="kp-mt-sm">${esc(room.name)}</h2>
            </div>
            <button id="kp-leave-room" type="button" class="kp-btn kp-btn-danger kp-btn-sm">Keluar ke Lobi</button>
          </div>

          ${isHost && idleSec >= 40 ? `
            <div class="kp-warn-banner">
              <span>⚠️ Room otomatis bubar dalam <strong>${Math.max(0, 60 - idleSec)} detik</strong> jika diam.</span>
              <button id="kp-keepalive" type="button" class="kp-btn kp-btn-sm kp-btn-primary">Saya masih di sini</button>
            </div>
          ` : ''}

          <div class="kp-seats-grid">
            ${room.seats.map((seat, idx) => {
              if (seat.locked) {
                return `
                  <div class="kp-seat kp-seat-locked">
                    <div>🔒 Kursi ${idx + 1} Terkunci</div>
                    ${isHost ? `<button type="button" class="kp-btn kp-btn-xs kp-btn-ghost" data-lock="${idx}">Buka</button>` : ''}
                  </div>
                `;
              }
              if (!seat.player) {
                return `
                  <div class="kp-seat kp-seat-empty">
                    <div class="kp-muted">Kursi ${idx + 1} Kosong</div>
                    ${isHost ? `
                      <div class="kp-row kp-wrap">
                        <button type="button" class="kp-btn kp-btn-xs kp-btn-primary" data-addbot="1">+ Bot</button>
                        <button type="button" class="kp-btn kp-btn-xs kp-btn-ghost" data-addlocal="1">+ Hotseat</button>
                        <button type="button" class="kp-btn kp-btn-xs kp-btn-ghost" data-lock="${idx}">🔒</button>
                      </div>
                    ` : ''}
                  </div>
                `;
              }
              const pl = seat.player;
              const badge = pl.isBot ? '🤖 Bot' : (pl.isLocal ? '📱 Hotseat' : '👤 Pemain');
              const canKick = isHost && !(pl.uid === room.hostUid && !pl.isLocal);
              return `
                <div class="kp-seat" style="border-left: 5px solid ${esc(pl.color)}">
                  <div>
                    <strong>${esc(pl.name)}</strong>
                    <div class="kp-muted kp-xs">${badge}</div>
                  </div>
                  ${canKick ? `<button type="button" class="kp-btn kp-btn-xs kp-btn-danger" data-kick="${idx}">Kick</button>` : ''}
                </div>
              `;
            }).join('')}
          </div>

          <div class="kp-row-between kp-mt">
            <span class="kp-muted kp-sm">Minimal 3 pemain (${occupiedCount}/4 siap)</span>
            ${isHost ? `
              <button id="kp-start-game" type="button" class="kp-btn kp-btn-primary" ${occupiedCount < 3 ? 'disabled' : ''}>
                🚀 Mulai Permainan
              </button>
            ` : `<span class="kp-muted">Menunggu host memulai...</span>`}
          </div>
        </div>
      </div>
    `;

    document.getElementById('kp-leave-room').addEventListener('click', () => {
      Sound.play('click');
      Net.leaveRoom();
      showLobby();
    });

    const kaBtn = document.getElementById('kp-keepalive');
    if (kaBtn) {
      kaBtn.addEventListener('click', () => Net.op(room.id, 'keepalive', {}));
    }

    rootEl.querySelectorAll('[data-addbot]').forEach(b =>
      b.addEventListener('click', () => { Sound.play('click'); Net.op(room.id, 'addBot', {}); })
    );
    rootEl.querySelectorAll('[data-addlocal]').forEach(b =>
      b.addEventListener('click', () => {
        const customName = prompt('Nama pemain lokal (Hotseat):', '');
        if (customName !== null) Net.op(room.id, 'addLocal', { name: customName });
      })
    );
    rootEl.querySelectorAll('[data-lock]').forEach(b =>
      b.addEventListener('click', () => { Sound.play('click'); Net.op(room.id, 'lock', { seatIdx: Number(b.getAttribute('data-lock')) }); })
    );
    rootEl.querySelectorAll('[data-kick]').forEach(b =>
      b.addEventListener('click', () => { Sound.play('click'); Net.op(room.id, 'kick', { seatIdx: Number(b.getAttribute('data-kick')) }); })
    );

    const startBtn = document.getElementById('kp-start-game');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        Sound.play('buy');
        const activeTheme = Themes.getTheme(Themes.getSavedThemeId());
        Net.op(room.id, 'start', { theme: activeTheme });
      });
    }

    if (!hostIdleTimer) {
      hostIdleTimer = setInterval(() => {
        const r = Net.getActiveRoom();
        if (!r || r.status !== 'waiting') {
          clearInterval(hostIdleTimer);
          hostIdleTimer = null;
          return;
        }
        if (Date.now() - r.hostLastActiveAt > 60000) {
          Net.leaveRoom();
          alert('Room ditutup otomatis karena host diam selama 60 detik.');
          showLobby();
        } else if (Date.now() - r.hostLastActiveAt >= 40000) {
          renderWaitingRoom(r);
        }
      }, 1000);
    }
  }

  function getControlledSeatForTurn(room) {
    const user = Net.getUser();
    const G = room.game;
    if (!G || !user) return null;

    if (G.phase === 'vote' && G.voteState) {
      return room.seats.find(s =>
        s.player && s.player.ownerUid === user.uid && !s.player.isBot &&
        !G.voteState.votes[s.player.id] &&
        !G.players.find(gp => gp.id === s.player.id)?.bankrupt
      ) || null;
    }

    const activePlayer = G.players[G.turnIdx];
    if (!activePlayer || activePlayer.bankrupt) return null;
    const seat = room.seats.find(s => s.player && s.player.id === activePlayer.id);
    if (seat && seat.player && seat.player.ownerUid === user.uid && !seat.player.isBot) {
      return seat;
    }
    return null;
  }

  function hasMandatoryDecisionForPlayer(G, controlledSeat) {
    if (!G) return false;
    if (G.phase === 'gameover') return true;
    if (!controlledSeat) return false;
    if (G.phase === 'vote' && G.voteState) return true;
    if (G.phase === 'decide' && G.pending) return true;
    if (G.phase === 'roll') {
      const me = G.players.find(p => p.id === controlledSeat.player.id);
      if (me && me.jail > 0) return true;
    }
    return false;
  }

  function openExitChoiceModal(isGameOver) {
    isAssetsModalOpen = false;
    Sound.play('click');

    openCustomOverlay(`
      <div class="kp-backdrop" id="kp-exit-backdrop">
        <div class="kp-modal kp-center-text">
          <div class="kp-badge">${isGameOver ? 'PERMAINAN SELESAI' : 'KONFIRMASI KELUAR'}</div>
          <h3 class="kp-mt-sm">Mau keluar ke mana?</h3>
          <p class="kp-muted kp-sm kp-mt-sm">
            ${isGameOver
              ? 'Pilih kembali ke ruang tunggu room untuk main lagi, atau keluar ke lobi utama.'
              : 'Kembali ke ruang tunggu akan mereset permainan saat ini untuk room ini.'}
          </p>
          <div class="kp-stack kp-mt">
            <button id="kp-exit-waiting" type="button" class="kp-btn kp-btn-primary">🪑 Ke Ruang Tunggu Room</button>
            <button id="kp-exit-lobby" type="button" class="kp-btn kp-btn-danger">🏠 Keluar ke Lobi</button>
            ${!isGameOver ? `<button id="kp-exit-cancel" type="button" class="kp-btn kp-btn-ghost">Lanjut Bermain</button>` : ''}
          </div>
        </div>
      </div>
    `);

    document.getElementById('kp-exit-waiting').addEventListener('click', () => {
      Sound.play('click');
      closeCustomOverlay();
      if (!Net.returnToWaitingRoom()) {
        showLobby();
      }
    });

    document.getElementById('kp-exit-lobby').addEventListener('click', () => {
      Sound.play('click');
      Net.leaveRoom();
      showLobby();
    });

    const cancelBtn = document.getElementById('kp-exit-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        Sound.play('click');
        closeCustomOverlay();
      });
    }

    const backdrop = document.getElementById('kp-exit-backdrop');
    if (backdrop && !isGameOver) {
      backdrop.addEventListener('click', e => {
        if (e.target && e.target.id === 'kp-exit-backdrop') {
          closeCustomOverlay();
        }
      });
    }
  }

  function renderGameScreen(room, thinkingPid) {
    const G = room.game;
    if (!G) return;
    const user = Net.getUser() || Net.login('Warga +62');
    const myPrimarySeat = room.seats.find(s => s.player && s.player.uid === user.uid && !s.player.isLocal);
    const controlledSeat = getControlledSeatForTurn(room);
    const viewPlayerId = controlledSeat ? controlledSeat.player.id : (myPrimarySeat ? myPrimarySeat.player.id : G.players[0].id);
    const viewPlayer = G.players.find(p => p.id === viewPlayerId) || G.players[0];
    const activePlayer = G.players[G.turnIdx];
    const hasThemes = Object.keys(Themes.THEMES).length > 0;

    if (!document.getElementById('kp-game-shell')) {
      rootEl.innerHTML = `
        <div id="kp-game-shell" class="kp-game-shell">
          <header id="kp-hud-top" class="kp-hud-top"></header>
          <div id="kp-ticker" class="kp-ticker"></div>
          <div id="kp-pill-bar" class="kp-pill-bar"></div>
          <main id="kp-board-wrap" class="kp-board-wrap"></main>
          <div id="kp-notif-area" class="kp-notif-area"></div>
          <aside id="kp-chat-panel" class="kp-chat-panel kp-hidden">
            <div class="kp-chat-head">
              <strong>💬 Obrolan Warga</strong>
              <button id="kp-chat-close" type="button" class="kp-btn kp-btn-xs kp-btn-ghost">✕</button>
            </div>
            <div id="kp-chat-messages" class="kp-chat-messages"></div>
            <div class="kp-chat-quick">
              ${QUICK_CHATS.map(q => `<button type="button" class="kp-quick-chip" data-qchat="${esc(q)}">${esc(q)}</button>`).join('')}
            </div>
            <form id="kp-chat-form" class="kp-chat-form">
              <input id="kp-chat-input" class="kp-input kp-input-sm" type="text" maxlength="140" placeholder="Tulis pesan..." />
              <button type="submit" class="kp-btn kp-btn-xs kp-btn-primary">Kirim</button>
            </form>
          </aside>
          <footer id="kp-hud-bottom" class="kp-hud-bottom"></footer>
          <div id="kp-modal-layer"></div>
        </div>
      `;

      Scene.init(document.getElementById('kp-board-wrap'), {
        theme: Themes.getTheme(Themes.getSavedThemeId()),
        onTileClick: idx => {
          Sound.play('click');
          showTileInspect(idx);
        }
      });

      bindChatPanelEvents();
    }

    Scene.syncState(G);

    const chatList = Array.isArray(room.chat) ? room.chat : [];
    if (chatOpen) {
      lastSeenChatCount = chatList.length;
    } else if (chatList.length > lastSeenChatCount) {
      Sound.play('chat');
    }
    const unreadChat = chatOpen ? 0 : Math.max(0, chatList.length - lastSeenChatCount);

    const topEl = document.getElementById('kp-hud-top');
    topEl.innerHTML = `
      <div class="kp-chips">
        ${G.players.map(p => {
          const seat = room.seats.find(s => s.player && s.player.id === p.id);
          const icons = [
            p.isBot ? '🤖' : '',
            seat && seat.player && seat.player.afk ? '💤' : '',
            p.jail > 0 ? '🔒' : '',
            p.jailCards > 0 ? '🎫' : '',
            p.pinjolDebt > 0 ? '📱' : ''
          ].filter(Boolean).join('');
          const isTurn = activePlayer && activePlayer.id === p.id && G.phase !== 'gameover';
          return `
            <div class="kp-chip ${isTurn ? 'kp-chip-turn' : ''} ${p.bankrupt ? 'kp-chip-dead' : ''}" style="border-top: 3px solid ${esc(p.color)}">
              <div class="kp-chip-name">${esc(p.name)} ${icons}</div>
              <div class="kp-chip-cash">${p.bankrupt ? 'BANGKRUT' : SafeEngine.formatMoney(p.cash)}</div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="kp-meta-pills">
        <span class="kp-stat">Putaran <strong>${G.round}</strong></span>
        <span class="kp-stat">Inflasi <strong>${(G.infl || 1).toFixed(2)}x</strong></span>
        <span class="kp-stat">Hibah <strong class="kp-green">${SafeEngine.formatMoney(G.hibah)}</strong></span>
        <button id="kp-ingame-sound" type="button" class="kp-btn kp-btn-xs kp-btn-ghost" title="Suara">${Sound.isMuted() ? '🔇' : '🔊'}</button>
        ${hasThemes ? `<button id="kp-ingame-theme" type="button" class="kp-btn kp-btn-xs kp-btn-ghost" title="Tema">🎨</button>` : ''}
        <button id="kp-ingame-chat" type="button" class="kp-btn kp-btn-xs kp-btn-ghost">
          💬 ${unreadChat > 0 ? `<span class="kp-unread-dot">${unreadChat}</span>` : ''}
        </button>
        <button id="kp-ingame-rules" type="button" class="kp-btn kp-btn-xs kp-btn-ghost">?</button>
        <button id="kp-ingame-exit" type="button" class="kp-btn kp-btn-xs kp-btn-danger">Keluar</button>
      </div>
    `;

    document.getElementById('kp-ingame-sound').addEventListener('click', e => {
      const nowMuted = Sound.toggleMute();
      e.currentTarget.textContent = nowMuted ? '🔇' : '🔊';
      if (!nowMuted) Sound.play('click');
    });
    const ingameThemeBtn = document.getElementById('kp-ingame-theme');
    if (ingameThemeBtn) {
      ingameThemeBtn.addEventListener('click', () => {
        Sound.play('click');
        openThemeModal();
      });
    }
    document.getElementById('kp-ingame-chat').addEventListener('click', () => {
      Sound.play('click');
      toggleChatPanel(room);
    });
    document.getElementById('kp-ingame-rules').addEventListener('click', () => {
      Sound.play('click');
      openRulesModal();
    });
    document.getElementById('kp-ingame-exit').addEventListener('click', () => {
      openExitChoiceModal(G.phase === 'gameover');
    });

    updateChatMessagesDOM(room);

    const tickerEl = document.getElementById('kp-ticker');
    const newsText = G.news
      ? `📰 KABAR TERKINI: ${G.news.title} — ${G.news.desc}`
      : '📰 KABAR TERKINI: Situasi ekonomi Negeri Konoha terpantau kondusif (untuk sementara).';
    tickerEl.textContent = newsText;

    const pillBar = document.getElementById('kp-pill-bar');
    const pills = [];
    if (G.suddenDeath) pills.push(`<span class="kp-pill kp-pill-red">🚨 KRISIS MONETER (+100% inflasi/putaran)</span>`);
    if (G.decree) pills.push(`<span class="kp-pill kp-pill-yellow">${G.decree.icon} Dekret: ${esc(G.decree.title)} (${G.decree.roundsLeft} putaran)</span>`);
    if (G.policy) pills.push(`<span class="kp-pill kp-pill-blue">${G.policy.icon} Kebijakan: ${esc(G.policy.title)} (${G.policy.roundsLeft} putaran)</span>`);
    if (G.disaster) pills.push(`<span class="kp-pill kp-pill-orange">${G.disaster.icon} ${esc(G.disaster.title)} (${G.disaster.roundsLeft} putaran)</span>`);
    pillBar.innerHTML = pills.join('');

    processNewEvents(room, viewPlayerId);
    const holding = isVisualHolding();

    const bottomEl = document.getElementById('kp-hud-bottom');
    const isMyTurnToRoll = !holding && controlledSeat && G.phase === 'roll' && viewPlayer.jail === 0;
    const thinkingName = thinkingPid ? (G.players.find(p => p.id === thinkingPid)?.name || 'Bot') : '';
    const statusText = holding
      ? `👀 Melihat pergerakan di papan...`
      : (G.phase === 'gameover'
          ? 'Permainan Selesai'
          : (thinkingPid
              ? `🤔 ${thinkingName} sedang mikir…`
              : (controlledSeat
                  ? `Giliran ${controlledSeat.player.name}!`
                  : `Giliran ${activePlayer ? activePlayer.name : '...'}`)));

    bottomEl.innerHTML = `
      <div class="kp-my-wallet">
        <span class="kp-muted kp-xs">Uang ${esc(viewPlayer.name)}</span>
        <strong class="kp-wallet-val">${SafeEngine.formatMoney(viewPlayer.cash)}</strong>
      </div>
      <div class="kp-turn-status">
        <span>${esc(statusText)}</span>
        <span id="kp-timer-badge" class="kp-timer-badge"></span>
      </div>
      <div class="kp-dock-actions">
        <button id="kp-btn-assets" type="button" class="kp-btn kp-btn-ghost">Aset</button>
        ${isMyTurnToRoll ? `
          <div class="kp-roll-wrap">
            <div id="kp-power-bar" class="kp-power-bar"><div id="kp-power-fill" class="kp-power-fill"></div></div>
            <button id="kp-btn-roll" type="button" class="kp-btn kp-btn-primary"
              style="touch-action:none;user-select:none;-webkit-user-select:none;">🎲 Tahan, lalu lepas</button>
          </div>
        ` : `<button type="button" class="kp-btn kp-btn-primary" disabled>🎲 Lempar Dadu</button>`}
      </div>
    `;

    const assetsBtn = document.getElementById('kp-btn-assets');
    if (assetsBtn) {
      assetsBtn.addEventListener('click', () => {
        Sound.play('click');
        openAssetsModal(room, viewPlayer.id);
      });
    }

    const rollBtn = document.getElementById('kp-btn-roll');
    if (rollBtn && isMyTurnToRoll) {
      bindPowerRollButton(rollBtn, room, controlledSeat.player.id);
    } else {
      resetPowerState();
    }

    if (!holding) {
      if (G.phase === 'gameover') {
        isAssetsModalOpen = false;
        activeModalHtml = '';
      } else if (isAssetsModalOpen && hasMandatoryDecisionForPlayer(G, controlledSeat)) {
        isAssetsModalOpen = false;
        activeModalHtml = '';
      }

      if (isAssetsModalOpen) {
        openAssetsModal(room, assetsModalPid || viewPlayer.id);
      } else if (!activeModalHtml) {
        renderActivePhaseModal(room, controlledSeat);
      }
    }

    syncTurnTimer(room, holding ? null : controlledSeat);
  }

  function bindChatPanelEvents() {
    const closeBtn = document.getElementById('kp-chat-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        chatOpen = false;
        const panel = document.getElementById('kp-chat-panel');
        if (panel) panel.classList.add('kp-hidden');
      });
    }

    document.querySelectorAll('[data-qchat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = Net.getActiveRoom();
        const u = Net.getUser();
        if (!r) return;
        const text = btn.getAttribute('data-qchat');
        Net.op(r.id, 'chat', { text, senderName: u ? u.name : 'Warga' });
      });
    });

    const form = document.getElementById('kp-chat-form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const r = Net.getActiveRoom();
        const u = Net.getUser();
        const inp = document.getElementById('kp-chat-input');
        if (!r || !inp) return;
        const text = inp.value.trim();
        if (!text) return;
        inp.value = '';
        Net.op(r.id, 'chat', { text, senderName: u ? u.name : 'Warga' });
      });
    }
  }

  function toggleChatPanel(room) {
    chatOpen = !chatOpen;
    const panel = document.getElementById('kp-chat-panel');
    if (!panel) return;
    if (chatOpen) {
      panel.classList.remove('kp-hidden');
      lastSeenChatCount = (room.chat || []).length;
      const badgeBtn = document.getElementById('kp-ingame-chat');
      if (badgeBtn) badgeBtn.innerHTML = '💬';
      updateChatMessagesDOM(room);
    } else {
      panel.classList.add('kp-hidden');
    }
  }

  function updateChatMessagesDOM(room) {
    const box = document.getElementById('kp-chat-messages');
    if (!box) return;
    const list = Array.isArray(room.chat) ? room.chat : [];
    const hash = `${list.length}_${list.length ? list[list.length - 1].id : ''}`;
    if (hash === renderedChatHash) return;
    renderedChatHash = hash;

    if (list.length === 0) {
      box.innerHTML = `<div class="kp-muted kp-xs" style="text-align:center;padding:16px;">Belum ada obrolan. Sapa warga lainnya!</div>`;
      return;
    }

    box.innerHTML = list.map(m => `
      <div class="kp-chat-msg">
        <strong style="color:${esc(m.color)}">${esc(m.name)}:</strong>
        <span>${esc(m.text)}</span>
      </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
  }

  function openThemeModal() {
    isAssetsModalOpen = false;
    const activeId = Themes.getSavedThemeId();
    const list = Object.values(Themes.THEMES);
    if (list.length === 0) return;

    openCustomOverlay(`
      <div class="kp-backdrop" id="kp-theme-backdrop">
        <div class="kp-modal">
          <div class="kp-row-between">
            <h3>🎨 Pilih Tema Papan & Atmosfer</h3>
            <button id="kp-close-ov" type="button" class="kp-btn kp-btn-xs kp-btn-ghost">✕</button>
          </div>
          <div class="kp-stack kp-mt">
            ${list.map(t => `
              <div class="kp-radio-card ${t.id === activeId ? 'kp-selected' : ''}" data-pick-theme="${esc(t.id)}">
                <div style="width:28px;height:28px;border-radius:8px;flex-shrink:0;background:${esc(t.ui.accent)};border:2px solid #fff;"></div>
                <div style="flex:1;">
                  <div class="kp-row-between">
                    <strong>${esc(t.name)}</strong>
                    <span class="kp-badge">${esc(t.badge)}</span>
                  </div>
                  <div class="kp-muted kp-xs kp-mt-sm">${esc(t.desc)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `);

    document.getElementById('kp-close-ov').addEventListener('click', closeCustomOverlay);
    document.getElementById('kp-theme-backdrop').addEventListener('click', e => {
      if (e.target && e.target.id === 'kp-theme-backdrop') closeCustomOverlay();
    });
    document.querySelectorAll('[data-pick-theme]').forEach(card => {
      card.addEventListener('click', () => {
        Sound.play('click');
        const chosen = Themes.setTheme(card.getAttribute('data-pick-theme'));
        if (Scene && Scene.applyTheme && chosen) Scene.applyTheme(chosen);
        closeCustomOverlay();
      });
    });
  }

  function bindPowerRollButton(btn, room, actorId) {
    resetPowerState();
    const fill = document.getElementById('kp-power-fill');

    const cleanupReleaseListeners = () => {
      btn.removeEventListener('pointerup', finishHold);
      btn.removeEventListener('pointercancel', finishHold);
      btn.removeEventListener('lostpointercapture', finishHold);
      window.removeEventListener('pointerup', finishHold);
      window.removeEventListener('mouseup', finishHold);
      window.removeEventListener('touchend', finishHold);
      window.removeEventListener('blur', cancelHold);
    };

    const cancelHold = () => {
      cleanupReleaseListeners();
      resetPowerState();
      if (fill) fill.style.width = '0%';
    };

    const finishHold = e => {
      if (!powerHolding || rollSubmitting) return;
      if (e && e.cancelable) e.preventDefault();
      cleanupReleaseListeners();
      powerHolding = false;
      rollSubmitting = true;
      if (powerRaf) {
        cancelAnimationFrame(powerRaf);
        powerRaf = null;
      }
      if (Scene && Scene.setThrowPower) Scene.setThrowPower(powerValue);
      btn.disabled = true;
      btn.textContent = '🎲 Melempar...';
      Net.op(room.id, 'act', { actorId, action: { type: 'roll' } });
    };

    const startHold = e => {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.cancelable) e.preventDefault();
      if (powerHolding || rollSubmitting) return;

      Sound.unlock();
      powerHolding = true;
      powerValue = 20;
      let dir = 1;

      if (e.pointerId !== undefined && btn.setPointerCapture) {
        try { btn.setPointerCapture(e.pointerId); } catch (_) {}
      }

      btn.addEventListener('pointerup', finishHold);
      btn.addEventListener('pointercancel', finishHold);
      btn.addEventListener('lostpointercapture', finishHold);
      window.addEventListener('pointerup', finishHold);
      window.addEventListener('mouseup', finishHold);
      window.addEventListener('touchend', finishHold);
      window.addEventListener('blur', cancelHold);

      const step = () => {
        if (!powerHolding) return;
        powerValue += dir * 3.4;
        if (powerValue >= 100) { powerValue = 100; dir = -1; }
        if (powerValue <= 15) { powerValue = 15; dir = 1; }
        if (fill) fill.style.width = `${powerValue}%`;
        powerRaf = requestAnimationFrame(step);
      };
      powerRaf = requestAnimationFrame(step);
    };

    btn.addEventListener('pointerdown', startHold);
  }

  function renderActivePhaseModal(room, controlledSeat) {
    if (isVisualHolding()) return;
    const G = room.game;
    const layer = document.getElementById('kp-modal-layer');
    if (!layer) return;

    if (G.phase === 'gameover') {
      activeModalHtml = '';
      isAssetsModalOpen = false;
      const winner = G.players.find(p => p.id === G.winner);
      layer.innerHTML = `
        <div class="kp-backdrop">
          <div class="kp-modal kp-center-text">
            <div class="kp-badge">PERMAINAN SELESAI · PUTARAN ${G.round}</div>
            <h2 class="kp-mt-sm">🏆 ${winner ? esc(winner.name) : 'Tidak Ada'} Bertahan Hidup!</h2>
            <p class="kp-muted kp-mt-sm">Sisa kas: <strong>${winner ? SafeEngine.formatMoney(winner.cash) : 'Rp0'}</strong></p>
            <div class="kp-stack kp-mt">
              <button id="kp-go-waiting" type="button" class="kp-btn kp-btn-primary">🪑 Ke Ruang Tunggu Room</button>
              <button id="kp-back-lobby" type="button" class="kp-btn kp-btn-danger">🏠 Keluar ke Lobi</button>
            </div>
          </div>
        </div>
      `;
      document.getElementById('kp-go-waiting').addEventListener('click', () => {
        Sound.play('click');
        if (!Net.returnToWaitingRoom()) {
          showLobby();
        }
      });
      document.getElementById('kp-back-lobby').addEventListener('click', () => {
        Sound.play('click');
        Net.leaveRoom();
        showLobby();
      });
      return;
    }

    if (G.phase === 'vote' && G.voteState && controlledSeat) {
      activeModalHtml = '';
      isAssetsModalOpen = false;
      const voter = G.players.find(p => p.id === controlledSeat.player.id);
      const fajarUnit = SafeEngine.calcMoney(G, 5000);
      const maxFajar = Math.min(2, Math.floor(voter.cash / fajarUnit));
      if (voteFajar > maxFajar) voteFajar = maxFajar;

      layer.innerHTML = `
        <div class="kp-backdrop">
          <div class="kp-modal">
            <div class="kp-badge">🗳️ PEMILU NEGERI KONOHA (Putaran ${G.round})</div>
            <h3 class="kp-mt-sm">Pilih Kebijakan 10 Putaran ke Depan</h3>
            <p class="kp-muted kp-sm">Pemilih: <strong>${esc(voter.name)}</strong> (Kas: ${SafeEngine.formatMoney(voter.cash)})</p>
            <div class="kp-stack kp-mt">
              ${G.voteState.candidates.map((pol, idx) => `
                <label class="kp-radio-card ${voteSelection === idx ? 'kp-selected' : ''}">
                  <input type="radio" name="kp_pol" value="${idx}" ${voteSelection === idx ? 'checked' : ''} />
                  <div>
                    <strong>${pol.icon} ${esc(pol.title)}</strong>
                    <div class="kp-muted kp-xs">${esc(pol.desc)}</div>
                  </div>
                </label>
              `).join('')}
            </div>

            <div class="kp-fajar-box kp-mt">
              <div class="kp-row-between">
                <span>💸 Serangan Fajar (+1 suara per ${SafeEngine.formatMoney(fajarUnit)})</span>
                <strong>+${voteFajar} suara</strong>
              </div>
              <div class="kp-row kp-mt-sm">
                ${[0, 1, 2].map(n => `
                  <button type="button" class="kp-btn kp-btn-xs ${voteFajar === n ? 'kp-btn-primary' : 'kp-btn-ghost'}"
                    data-fajar="${n}" ${n > maxFajar ? 'disabled' : ''}>
                    ${n === 0 ? 'Jujur (Rp0)' : `+${n} Suara (${SafeEngine.formatMoney(n * fajarUnit)})`}
                  </button>
                `).join('')}
              </div>
            </div>

            <button id="kp-submit-vote" type="button" class="kp-btn kp-btn-primary kp-full kp-mt">Coblos Sekarang</button>
          </div>
        </div>
      `;

      layer.querySelectorAll('input[name="kp_pol"]').forEach(inp => {
        inp.addEventListener('change', () => {
          voteSelection = Number(inp.value);
          renderActivePhaseModal(room, controlledSeat);
        });
      });
      layer.querySelectorAll('[data-fajar]').forEach(btn => {
        btn.addEventListener('click', () => {
          voteFajar = Number(btn.getAttribute('data-fajar'));
          renderActivePhaseModal(room, controlledSeat);
        });
      });
      document.getElementById('kp-submit-vote').addEventListener('click', () => {
        Sound.play('click');
        const chosen = voteSelection;
        const fajar = voteFajar;
        voteSelection = 0;
        voteFajar = 0;
        Net.op(room.id, 'act', {
          actorId: controlledSeat.player.id,
          action: { type: 'vote', policyIdx: chosen, fajar }
        });
      });
      return;
    }

    if (G.phase === 'roll' && controlledSeat) {
      const me = G.players.find(p => p.id === controlledSeat.player.id);
      if (me && me.jail > 0) {
        activeModalHtml = '';
        isAssetsModalOpen = false;
        const bail = SafeEngine.calcMoney(G, G.theme.economy.bailBase);
        const bribe = SafeEngine.calcMoney(G, G.theme.economy.jailBribeBase);
        layer.innerHTML = `
          <div class="kp-backdrop">
            <div class="kp-modal">
              <div class="kp-badge">🔒 RUTAN NUSAKAMBANGAN (Sisa ${me.jail} hari)</div>
              <h3 class="kp-mt-sm">Giliran ${esc(me.name)} di Dalam Rutan</h3>
              <div class="kp-stack kp-mt">
                ${me.jailCards > 0 ? `<button type="button" class="kp-btn kp-btn-primary" data-jail="card">🎫 Pakai Kartu Bebas Rutan (${me.jailCards})</button>` : ''}
                <button type="button" class="kp-btn kp-btn-ghost" data-jail="pay" ${me.cash < bail ? 'disabled' : ''}>💰 Bayar Jaminan (${SafeEngine.formatMoney(bail)})</button>
                <button type="button" class="kp-btn kp-btn-warn" data-jail="bribe" ${me.cash < bribe ? 'disabled' : ''}>🤫 Suap Sipir (${SafeEngine.formatMoney(bribe)} · Risiko 30% ketahuan)</button>
                <button type="button" class="kp-btn kp-btn-primary" data-jail="roll">🎲 Coba Lempar Dadu Dobel</button>
              </div>
            </div>
          </div>
        `;
        layer.querySelectorAll('[data-jail]').forEach(btn => {
          btn.addEventListener('click', () => {
            Net.op(room.id, 'act', {
              actorId: me.id,
              action: { type: 'jail', choice: btn.getAttribute('data-jail') }
            });
          });
        });
        return;
      }
    }

    if (G.phase === 'decide' && G.pending && controlledSeat) {
      activeModalHtml = '';
      isAssetsModalOpen = false;
      const pend = G.pending;
      const me = G.players.find(p => p.id === controlledSeat.player.id);
      const tile = pend.tile !== undefined ? G.theme.board[pend.tile] : null;
      let title = '';
      let desc = '';
      let buttonsHtml = '';

      if (pend.kind === 'buy') {
        title = `Beli ${tile.name}?`;
        desc = `${tile.desc} · Sewa saat ini ${SafeEngine.formatMoney(SafeEngine.calcRent(G, tile.id))} (ikut naik bersama inflasi)`;
        buttonsHtml = `
          <button type="button" class="kp-btn kp-btn-primary" data-dec="buy" ${me.cash < pend.price ? 'disabled' : ''}>Beli (${SafeEngine.formatMoney(pend.price)})</button>
          <button type="button" class="kp-btn kp-btn-ghost" data-dec="skip">Lewati</button>
        `;
      } else if (pend.kind === 'build') {
        const lvlName = LVL_NAMES[pend.nextLevel] || 'Bangunan';
        title = `Bangun ${lvlName} di ${tile.name}?`;
        desc = 'Izin resmi berisiko 30% ditolak ("berkas kurang satu"). Pelicin lebih mahal tapi langsung jadi.';
        buttonsHtml = `
          <button type="button" class="kp-btn kp-btn-primary" data-dec="official" ${me.cash < pend.officialCost ? 'disabled' : ''}>📄 Urus Izin Resmi (${SafeEngine.formatMoney(pend.officialCost)})</button>
          <button type="button" class="kp-btn kp-btn-warn" data-dec="bribe" ${me.cash < pend.bribeCost ? 'disabled' : ''}>💸 Uang Pelicin (${SafeEngine.formatMoney(pend.bribeCost)})</button>
          <button type="button" class="kp-btn kp-btn-ghost" data-dec="skip">Nanti Saja</button>
        `;
      } else if (pend.kind === 'takeover') {
        const owner = G.players.find(p => p.id === pend.owner);
        title = `Takeover ${tile.name}?`;
        desc = `Beli paksa aset milik ${owner ? owner.name : 'lawan'} beserta bangunannya (2× nilai aset berinflasi).`;
        buttonsHtml = `
          <button type="button" class="kp-btn kp-btn-warn" data-dec="takeover" ${me.cash < pend.cost ? 'disabled' : ''}>🤝 Takeover (${SafeEngine.formatMoney(pend.cost)})</button>
          <button type="button" class="kp-btn kp-btn-ghost" data-dec="skip">Tidak Usah</button>
        `;
      } else if (pend.kind === 'ciduk') {
        title = '🚨 Diciduk Aparat!';
        desc = 'Rompi oranye sudah menanti. Mau pasrah atau coba negosiasi?';
        buttonsHtml = `
          <button type="button" class="kp-btn kp-btn-warn" data-dec="bribe" ${me.cash < pend.bribeCost ? 'disabled' : ''}>🤫 Sogok Penyidik (${SafeEngine.formatMoney(pend.bribeCost)} · 50% lolos)</button>
          <button type="button" class="kp-btn kp-btn-danger" data-dec="surrender">Pasrah Masuk Rutan</button>
        `;
      } else if (pend.kind === 'kelurahan') {
        title = '🏛️ Kantor Kelurahan';
        desc = '"Berkas kurang satu, Pak." Antre berarti melewatkan 1 giliran.';
        buttonsHtml = `
          <button type="button" class="kp-btn kp-btn-warn" data-dec="bribe" ${me.cash < pend.bribeCost ? 'disabled' : ''}>💸 Uang Pelicin (${SafeEngine.formatMoney(pend.bribeCost)})</button>
          <button type="button" class="kp-btn kp-btn-ghost" data-dec="queue">⏳ Antre (Lewati 1 Giliran)</button>
        `;
      } else if (pend.kind === 'pejabat') {
        title = '💼 Kantor Pejabat';
        desc = 'Setor upeti: 55% menang tender (+Rp20jt × inflasi), 25% zonk, 20% kena OTT!';
        buttonsHtml = `
          <button type="button" class="kp-btn kp-btn-warn" data-dec="tribute" ${me.cash < pend.cost ? 'disabled' : ''}>🤝 Setor Upeti (${SafeEngine.formatMoney(pend.cost)})</button>
          <button type="button" class="kp-btn kp-btn-ghost" data-dec="leave">Pulang Saja</button>
        `;
      } else if (pend.kind === 'tilang') {
        title = '🚔 Razia Tilang';
        desc = 'Bayar denda resmi ke Dana Hibah, atau damai di tempat (risiko 25% direkam & viral!).';
        buttonsHtml = `
          <button type="button" class="kp-btn kp-btn-warn" data-dec="bribe" ${me.cash < pend.bribeCost ? 'disabled' : ''}>🤫 Damai di Tempat (${SafeEngine.formatMoney(pend.bribeCost)})</button>
          <button type="button" class="kp-btn kp-btn-primary" data-dec="fine">🧾 Denda Resmi (${SafeEngine.formatMoney(pend.fineCost)})</button>
        `;
      }

      layer.innerHTML = `
        <div class="kp-backdrop">
          <div class="kp-modal">
            <div class="kp-badge">PILIHAN ${esc(me.name).toUpperCase()}</div>
            <h3 class="kp-mt-sm">${esc(title)}</h3>
            <p class="kp-muted kp-mt-sm">${esc(desc)}</p>
            <div class="kp-stack kp-mt">${buttonsHtml}</div>
          </div>
        </div>
      `;

      layer.querySelectorAll('[data-dec]').forEach(btn => {
        btn.addEventListener('click', () => {
          Net.op(room.id, 'act', {
            actorId: me.id,
            action: { type: 'decide', choice: btn.getAttribute('data-dec') }
          });
        });
      });
      return;
    }

    if (!activeModalHtml) {
      layer.innerHTML = '';
    }
  }

  function openCustomOverlay(html) {
    activeModalHtml = html;
    const layer = document.getElementById('kp-modal-layer');
    if (layer) layer.innerHTML = html;
  }

  function closeCustomOverlay() {
    activeModalHtml = '';
    isAssetsModalOpen = false;
    const layer = document.getElementById('kp-modal-layer');
    if (layer) layer.innerHTML = '';
    const room = Net.getActiveRoom();
    if (room && room.status === 'playing' && !isVisualHolding()) {
      renderActivePhaseModal(room, getControlledSeatForTurn(room));
    }
  }

  function openAssetsModal(room, pid) {
    const G = room.game;
    const user = Net.getUser();
    const targetPlayer = G.players.find(p => p.id === pid) || G.players[0];
    const selectedPid = targetPlayer.id;

    isAssetsModalOpen = true;
    assetsModalPid = selectedPid;

    const controlled = getControlledSeatForTurn(room);
    const canManage = Boolean(
      !isVisualHolding() &&
      controlled &&
      G.phase === 'roll' &&
      controlled.player.id === selectedPid &&
      targetPlayer.jail === 0
    );
    const isMySeat = Boolean(user && room.seats.some(
      s => s.player && s.player.id === selectedPid && s.player.ownerUid === user.uid
    ));

    const owned = G.tiles
      .map((ts, idx) => ({ ts, tile: G.theme.board[idx], idx }))
      .filter(x => x.ts.owner === selectedPid);

    const totalAssetVal = owned.reduce((sum, x) => sum + SafeEngine.calcAssetValue(G, x.idx), 0);

    const playerTabs = G.players.map(p => {
      const count = G.tiles.filter(t => t.owner === p.id).length;
      const active = p.id === selectedPid;
      return `
        <button type="button" class="kp-btn kp-btn-xs ${active ? 'kp-btn-primary' : 'kp-btn-ghost'}"
          data-asset-tab="${esc(p.id)}" style="border-bottom: 2px solid ${esc(p.color)}">
          ${esc(p.name)} (${count})
        </button>
      `;
    }).join('');

    const hintBanner = canManage
      ? `<div class="kp-muted kp-xs kp-mt-sm" style="background:var(--kp-surface-2);padding:7px 10px;border-radius:8px;">
          📈 Inflasi <strong>${(G.infl || 1).toFixed(2)}x</strong>: Nilai taksiran & harga jual aset ikut naik (Total aset: <strong>${SafeEngine.formatMoney(totalAssetVal)}</strong>). Saldo tunai tidak ikut naik.
        </div>`
      : `<div class="kp-muted kp-xs kp-mt-sm" style="background:var(--kp-surface-2);padding:7px 10px;border-radius:8px;">
          ${isMySeat
            ? '👁️ Mode pantau — jual aset, gadai, atau tebus bisa dilakukan saat giliranmu melempar dadu.'
            : `👁️ Melihat daftar aset milik ${esc(targetPlayer.name)} (Total nilai: ${SafeEngine.formatMoney(totalAssetVal)}).`}
        </div>`;

    const rows = owned.length === 0
      ? `<p class="kp-muted kp-sm">${esc(targetPlayer.name)} belum memiliki tanah atau aset apa pun.</p>`
      : owned.map(({ ts, tile, idx }) => {
          const redeemCost = SafeEngine.calcRedeemCost(G, idx);
          const pawnVal = SafeEngine.calcMortgageValue(G, idx);
          const rentVal = SafeEngine.calcRent(G, idx);
          const sellBldgVal = SafeEngine.calcSellBuildingValue(G, idx);
          const sellTileVal = SafeEngine.calcSellTileValue(G, idx);
          const grpColor = tile.group && G.theme.groups[tile.group] ? G.theme.groups[tile.group].color : '#64748b';

          const statusLine = ts.mortgaged > 0
            ? `🔒 Digadai (sisa ${ts.mortgaged} putaran · Tebus ${SafeEngine.formatMoney(redeemCost)})`
            : `${LVL_NAMES[ts.level] || 'Tanah'} · Sewa ${SafeEngine.formatMoney(rentVal)}/mampir`;

          const actionButtons = canManage ? `
            <div class="kp-row kp-wrap">
              ${ts.level > 0 ? `<button type="button" class="kp-btn kp-btn-xs kp-btn-warn" data-asset="sellBuilding" data-tile="${idx}">Jual Bangunan (+${SafeEngine.formatMoney(sellBldgVal)})</button>` : ''}
              ${ts.level === 0 && ts.mortgaged === 0 ? `<button type="button" class="kp-btn kp-btn-xs kp-btn-danger" data-asset="sellTile" data-tile="${idx}">Jual Tanah (+${SafeEngine.formatMoney(sellTileVal)})</button>` : ''}
              ${ts.level === 0 && ts.mortgaged === 0 ? `<button type="button" class="kp-btn kp-btn-xs kp-btn-ghost" data-asset="mortgage" data-tile="${idx}">Gadai (+${SafeEngine.formatMoney(pawnVal)})</button>` : ''}
              ${ts.mortgaged > 0 ? `<button type="button" class="kp-btn kp-btn-xs kp-btn-primary" data-asset="redeem" data-tile="${idx}" ${targetPlayer.cash < redeemCost ? 'disabled' : ''}>Tebus (−${SafeEngine.formatMoney(redeemCost)})</button>` : ''}
            </div>
          ` : '';

          return `
            <div class="kp-asset-row" style="border-left: 4px solid ${esc(grpColor)}">
              <div>
                <strong>${esc(tile.name)}</strong>
                <div class="kp-muted kp-xs">${statusLine}</div>
              </div>
              ${actionButtons}
            </div>
          `;
        }).join('');

    openCustomOverlay(`
      <div class="kp-backdrop" id="kp-asset-backdrop">
        <div class="kp-modal">
          <div class="kp-row-between">
            <h3>🏦 Daftar Aset & Pegadaian</h3>
            <button id="kp-close-ov" type="button" class="kp-btn kp-btn-xs kp-btn-ghost">✕</button>
          </div>
          <div class="kp-row kp-wrap kp-mt-sm">${playerTabs}</div>
          ${hintBanner}
          <div class="kp-stack kp-mt">${rows}</div>
        </div>
      </div>
    `);

    document.getElementById('kp-close-ov').addEventListener('click', closeCustomOverlay);
    document.getElementById('kp-asset-backdrop').addEventListener('click', e => {
      if (e.target && e.target.id === 'kp-asset-backdrop') closeCustomOverlay();
    });
    document.querySelectorAll('[data-asset-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.play('click');
        openAssetsModal(room, btn.getAttribute('data-asset-tab'));
      });
    });
    document.querySelectorAll('[data-asset]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeCustomOverlay();
        Net.op(room.id, 'act', {
          actorId: selectedPid,
          action: {
            type: 'manage',
            sub: btn.getAttribute('data-asset'),
            tile: Number(btn.getAttribute('data-tile'))
          }
        });
      });
    });
  }

  function showTileInspect(idx) {
    const room = Net.getActiveRoom();
    if (!room || !room.game) return;
    const G = room.game;
    const tile = G.theme.board[idx];
    const ts = G.tiles[idx];
    const owner = ts.owner ? G.players.find(p => p.id === ts.owner) : null;
    isAssetsModalOpen = false;

    openCustomOverlay(`
      <div class="kp-backdrop" id="kp-tile-backdrop">
        <div class="kp-modal">
          <div class="kp-row-between">
            <span class="kp-badge">${tile.group && G.theme.groups[tile.group] ? esc(G.theme.groups[tile.group].name) : 'PETAK KHUSUS'}</span>
            <button id="kp-close-ov" type="button" class="kp-btn kp-btn-xs kp-btn-ghost">✕</button>
          </div>
          <h3 class="kp-mt-sm">${esc(tile.name)}</h3>
          <p class="kp-muted kp-mt-sm">${esc(tile.desc)}</p>
          ${tile.price > 0 ? `
            <div class="kp-kv-list kp-mt">
              <div><span>Harga Tanah (Inflasi ${(G.infl || 1).toFixed(2)}x)</span><strong>${SafeEngine.formatMoney(SafeEngine.calcTilePrice(G, idx))}</strong></div>
              <div><span>Harga Jual Tanah</span><strong>${SafeEngine.formatMoney(SafeEngine.calcSellTileValue(G, idx))}</strong></div>
              <div><span>Pemilik</span><strong>${owner ? esc(owner.name) : 'Belum ada'}</strong></div>
              <div><span>Status</span><strong>${ts.mortgaged > 0 ? `Digadai (${ts.mortgaged} putaran)` : (LVL_NAMES[ts.level] || 'Tanah')}</strong></div>
              <div><span>Tarif Sewa Saat Ini</span><strong>${SafeEngine.formatMoney(SafeEngine.calcRent(G, idx))}</strong></div>
            </div>
          ` : ''}
        </div>
      </div>
    `);
    document.getElementById('kp-close-ov').addEventListener('click', closeCustomOverlay);
    document.getElementById('kp-tile-backdrop').addEventListener('click', e => {
      if (e.target && e.target.id === 'kp-tile-backdrop') closeCustomOverlay();
    });
  }

  function openRulesModal() {
    isAssetsModalOpen = false;
    openCustomOverlay(`
      <div class="kp-backdrop" id="kp-rules-backdrop">
        <div class="kp-modal kp-rules-modal">
          <div class="kp-row-between">
            <h3>📖 Aturan Singkat Konohapoly</h3>
            <button id="kp-close-ov" type="button" class="kp-btn kp-btn-xs kp-btn-ghost">✕</button>
          </div>
          <ul class="kp-rules-list kp-mt">
            <li><strong>Tujuan:</strong> Bertahan hidup paling akhir! Bukan menjadi yang paling kaya.</li>
            <li><strong>Inflasi & Aset vs Tunai:</strong> Saldo uang tunai tidak ikut naik saat inflasi naik, sedangkan harga tanah, harga jual aset, dan tarif sewa ikut naik sesuai inflasi.</li>
            <li><strong>Beli & Bangun per Kunjungan:</strong> Hanya bisa beli saat mendarat, dan naik 1 level (Rumah → Ruko → Landmark) saat mendarat lagi di tanah sendiri.</li>
            <li><strong>Takeover:</strong> Setelah bayar sewa di properti lawan (bukan Landmark & tidak digadai), boleh ambil alih seharga 2× nilai aset berinflasi.</li>
            <li><strong>Jual & Gadai Aset:</strong> Bisa jual tanah (+60%), jual bangunan (+50%), atau gadai (+50%, tebus 55% dalam 4 putaran).</li>
            <li><strong>Pinjol Darurat:</strong> Otomatis cair sekali seumur hidup jika kas habis, ditagih 150% saat lewat START berikutnya.</li>
            <li><strong>Krisis Moneter:</strong> Mulai putaran 40, inflasi melonjak +100% per putaran dan taksiran Pegadaian dibekukan.</li>
          </ul>
        </div>
      </div>
    `);
    document.getElementById('kp-close-ov').addEventListener('click', closeCustomOverlay);
    document.getElementById('kp-rules-backdrop').addEventListener('click', e => {
      if (e.target && e.target.id === 'kp-rules-backdrop') closeCustomOverlay();
    });
  }

  function processNewEvents(room, myPlayerId) {
    const G = room.game;
    if (!G || G.evSeq === lastShownEventSeq) return;
    lastShownEventSeq = G.evSeq;

    const u = Net.getUser();
    const myUid = u ? u.uid : '';
    const hasDice = Array.isArray(G.ev) && G.ev.some(e => e.k === 'dice');
    const moveEv = Array.isArray(G.ev) ? G.ev.find(e => e.k === 'move') : null;
    const steps = moveEv ? Math.abs(Number(moveEv.steps) || 0) : 0;

    let delayMs = 0;
    if (hasDice) {
      delayMs = Math.min(3600, Math.max(1850, 1050 + steps * 140));
    } else if (moveEv) {
      delayMs = Math.min(2400, Math.max(1000, 450 + steps * 140));
    } else if (Array.isArray(G.ev) && G.ev.some(e => ['card', 'decree', 'news', 'disaster', 'bankrupt', 'seized', 'election_result'].includes(e.k))) {
      delayMs = 650;
    }

    if (delayMs > 0) {
      visualHoldUntil = Math.max(visualHoldUntil, Date.now() + delayMs);
    }

    const delayedToasts = [];
    let delayedModalFn = null;

    for (const ev of (G.ev || [])) {
      if (ev.k === 'dice') {
        Sound.play('dice');
      } else if (ev.k === 'buy') {
        Sound.play('buy');
      } else if (ev.k === 'build') {
        Sound.play('build');
      } else if (ev.k === 'jail') {
        Sound.play('siren');
      } else if (ev.k === 'cash' && ev.a !== 0) {
        Sound.play(ev.a > 0 ? 'cash_in' : 'cash_out');
      } else if (ev.k === 'card') {
        const actor = G.players.find(p => p.id === ev.pid);
        const isMine = ev.pid === myPlayerId || room.seats.some(s => s.player && s.player.id === ev.pid && s.player.ownerUid === myUid);
        if (isMine) {
          delayedModalFn = () => {
            Sound.play('card');
            isAssetsModalOpen = false;
            const isChance = ev.deck === 'kesempatan';
            openCustomOverlay(`
              <div class="kp-backdrop">
                <div class="kp-modal kp-center-text">
                  <div class="kp-badge ${isChance ? 'kp-badge-blue' : 'kp-badge-red'}">
                    ${isChance ? '🍀 KARTU KESEMPATAN' : '⚡ KARTU RISIKO'}
                  </div>
                  <h3 class="kp-mt-sm">${esc(ev.card.title)}</h3>
                  <p class="kp-muted kp-mt-sm">${esc(ev.card.desc)}</p>
                  <button id="kp-close-ov" type="button" class="kp-btn kp-btn-primary kp-mt">Siap, Lanjut</button>
                </div>
              </div>
            `);
            document.getElementById('kp-close-ov').addEventListener('click', closeCustomOverlay);
          };
        } else {
          delayedToasts.push(`🃏 ${actor ? actor.name : 'Pemain'} dapat kartu: ${ev.card.title}`);
        }
      } else if (ev.k === 'decree') {
        delayedModalFn = () => {
          Sound.play('decree');
          isAssetsModalOpen = false;
          openCustomOverlay(`
            <div class="kp-backdrop">
              <div class="kp-modal kp-center-text">
                <div class="kp-badge kp-badge-yellow">🎙️ PIDATO PRESIDEN NEGERI KONOHA</div>
                <svg viewBox="0 0 220 150" width="180" height="122" style="margin:8px auto;display:block">
                  <rect x="65" y="102" width="90" height="44" rx="6" fill="#78350f"/>
                  <rect x="75" y="108" width="70" height="8" rx="3" fill="#facc15"/>
                  <ellipse cx="110" cy="88" rx="36" ry="26" fill="#f8fafc"/>
                  <path d="M104 68 L116 68 L113 96 L107 96 Z" fill="#dc2626"/>
                  <circle cx="110" cy="46" r="19" fill="#fed7aa"/>
                  <rect x="92" y="22" width="36" height="12" rx="4" fill="#0f172a"/>
                  <circle cx="104" cy="44" r="2.2" fill="#0f172a"/>
                  <circle cx="116" cy="44" r="2.2" fill="#0f172a"/>
                  <path d="M104 53 Q110 58 116 53" stroke="#0f172a" stroke-width="2" fill="none"/>
                  <line x1="88" y1="84" x2="88" y2="102" stroke="#94a3b8" stroke-width="3"/>
                  <circle cx="88" cy="82" r="4" fill="#334155"/>
                </svg>
                <h3>${ev.decree.icon} ${esc(ev.decree.title)}</h3>
                <p class="kp-muted kp-mt-sm">${esc(ev.decree.desc)}</p>
                <button id="kp-close-ov" type="button" class="kp-btn kp-btn-primary kp-mt">Siap Paduka!</button>
              </div>
            </div>
          `);
          document.getElementById('kp-close-ov').addEventListener('click', closeCustomOverlay);
        };
      } else if (ev.k === 'news') {
        delayedToasts.push(`📰 Berita: ${ev.news.title} — ${ev.news.desc}`);
      } else if (ev.k === 'disaster') {
        delayedToasts.push(`${ev.disaster.icon} Bencana: ${ev.disaster.title} melanda wilayah terdampak!`);
      } else if (ev.k === 'election_result') {
        delayedToasts.push(`🗳️ Hasil Pemilu: ${ev.policy.icon} ${ev.policy.title} berlaku 10 putaran!`);
      } else if (ev.k === 'crisis_warn') {
        delayedToasts.push(`⚠️ Peringatan: Krisis Moneter diprediksi pecah di Putaran ${ev.targetRound}!`);
      } else if (ev.k === 'crisis_start') {
        delayedToasts.push(`🚨 KRISIS MONETER DIMULAI! Inflasi +100% tiap putaran!`);
      } else if (ev.k === 'bankrupt') {
        const victim = G.players.find(p => p.id === ev.pid);
        delayedToasts.push(`💀 ${victim ? victim.name : 'Pemain'} dinyatakan BANGKRUT!`);
      } else if (ev.k === 'seized') {
        const victim = G.players.find(p => p.id === ev.pid);
        const tile = G.theme.board[ev.tile];
        delayedToasts.push(`🏛️ ${tile ? tile.name : 'Tanah'} milik ${victim ? victim.name : 'pemain'} disita (${ev.w})!`);
      }
    }

    const flushDelayed = () => {
      if (currentScreen !== 'room') return;
      if (Array.isArray(G.ev) && G.ev.some(e => e.k === 'disaster' || e.k === 'crisis_start')) Sound.play('siren');
      if (Array.isArray(G.ev) && G.ev.some(e => e.k === 'bankrupt')) Sound.play('bankrupt');

      delayedToasts.forEach(msg => enqueueNotif(msg));
      if (delayedModalFn) delayedModalFn();

      const latestRoom = Net.getActiveRoom();
      if (latestRoom && latestRoom.status === 'playing') {
        renderGameScreen(latestRoom, Net.getThinkingPid());
      }
    };

    if (delayMs > 0) {
      if (visualHoldTimer) clearTimeout(visualHoldTimer);
      visualHoldTimer = setTimeout(() => {
        visualHoldTimer = null;
        flushDelayed();
      }, delayMs);
    } else {
      delayedToasts.forEach(msg => enqueueNotif(msg));
      if (delayedModalFn) delayedModalFn();
    }
  }

  function enqueueNotif(text) {
    notifQueue.push(text);
    if (!activeNotif) pumpNotifQueue();
  }

  function pumpNotifQueue() {
    const area = document.getElementById('kp-notif-area');
    if (!area) return;
    if (notifQueue.length === 0) {
      activeNotif = null;
      area.innerHTML = '';
      return;
    }
    activeNotif = notifQueue.shift();
    const readMs = Math.min(6000, Math.max(2800, activeNotif.length * 65));
    area.innerHTML = `
      <div class="kp-toast">
        <span>${esc(activeNotif)}</span>
        <button id="kp-toast-close" type="button" class="kp-toast-x">✕</button>
      </div>
    `;
    document.getElementById('kp-toast-close').addEventListener('click', () => {
      if (notifTimer) clearTimeout(notifTimer);
      pumpNotifQueue();
    });
    if (notifTimer) clearTimeout(notifTimer);
    notifTimer = setTimeout(pumpNotifQueue, readMs);
  }

  function syncTurnTimer(room, controlledSeat) {
    const G = room.game;
    if (!G || G.phase === 'gameover' || !controlledSeat || isVisualHolding()) {
      turnTimerKey = '';
      if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
      }
      const badge = document.getElementById('kp-timer-badge');
      if (badge) badge.textContent = '';
      return;
    }

    const key = `${room.ver}_${G.phase}_${controlledSeat.player.id}`;
    if (key !== turnTimerKey) {
      turnTimerKey = key;
      const limitSec = G.phase === 'roll' ? 35 : (G.phase === 'decide' ? 40 : 30);
      turnDeadline = Date.now() + limitSec * 1000;
    }

    if (!turnTimerInterval) {
      turnTimerInterval = setInterval(() => {
        const r = Net.getActiveRoom();
        if (!r || r.status !== 'playing' || !r.game) return;
        const left = Math.max(0, Math.ceil((turnDeadline - Date.now()) / 1000));
        const badge = document.getElementById('kp-timer-badge');
        if (badge) badge.textContent = left > 0 ? `⏱️ ${left}d` : '';

        if (left <= 0) {
          clearInterval(turnTimerInterval);
          turnTimerInterval = null;
          const seat = getControlledSeatForTurn(r);
          if (seat) {
            Net.op(r.id, 'act', { actorId: seat.player.id, action: { type: 'timeout' } });
          }
        }
      }, 500);
    }
  }

  function stopBackgroundTimers() {
    if (lobbyPollTimer) { clearInterval(lobbyPollTimer); lobbyPollTimer = null; }
    if (hostIdleTimer) { clearInterval(hostIdleTimer); hostIdleTimer = null; }
    if (turnTimerInterval) { clearInterval(turnTimerInterval); turnTimerInterval = null; }
    if (notifTimer) { clearTimeout(notifTimer); notifTimer = null; }
    if (visualHoldTimer) { clearTimeout(visualHoldTimer); visualHoldTimer = null; }
  }

  return { init };
}));
