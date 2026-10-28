/**
 * Konohapoly - UI Renderer & HUD Manager with Mobile Fixed Controls
 */
import { BOARD } from './engine.js';
import { sfx } from './sfx.js';

export class UIRenderer {
  constructor(appEl, netAdapter, gameScene = null) {
    this.app = appEl;
    this.net = netAdapter;
    this.scene = gameScene;
    this.currentRoom = null;
    this.notifications = [];
    this.lastTurnIdx = -1;

    // Power Bar Dadu
    this.isChargingPower = false;
    this.powerValue = 0;
    this.powerInterval = null;

    this.net.subscribe(room => {
      this.currentRoom = room;
      this.render();
      this.checkTurnNotification();
      if (this.scene && room && room.gameState) {
        this.scene.updateState(room.gameState);
      }
    });
  }

  formatMoney(amount) {
    if (amount >= 100000) return `Rp${(amount / 1000).toFixed(0)}jt`;
    if (amount >= 1000) return `Rp${(amount / 1000).toFixed(1).replace('.0', '')}jt`;
    return `Rp${amount}rb`;
  }

  checkTurnNotification() {
    if (!this.currentRoom || this.currentRoom.status !== 'playing') return;
    const S = this.currentRoom.gameState;
    if (S.turnIdx !== this.lastTurnIdx) {
      this.lastTurnIdx = S.turnIdx;
      const activePlayer = S.players[S.turnIdx];
      if (!activePlayer.isBot && !activePlayer.afk) {
        sfx.playTurnAlert();
        this.addNotification(`🔔 Giliranmu bertindak, ${activePlayer.name}!`, 'info');
      }
    }
  }

  addNotification(text, type = 'info') {
    const id = Date.now();
    this.notifications.push({ id, text, type });
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.renderNotifications();
    }, 4000);
    this.renderNotifications();
  }

  renderNotifications() {
    const container = document.getElementById('notif-container');
    if (!container) return;
    container.innerHTML = this.notifications.map(n => `
      <div class="notif-toast notif-${n.type}">${n.text}</div>
    `).join('');
  }

  render() {
    if (!this.currentRoom) {
      this.renderLogin();
      return;
    }

    if (this.currentRoom.status === 'waiting') {
      this.renderLobby();
    } else if (this.currentRoom.status === 'playing' || this.currentRoom.status === 'finished') {
      this.renderGame();
    }
  }

  renderLogin() {
    this.app.innerHTML = `
      <div class="card-modal">
        <h1 class="title">🇮🇩 Konohapoly</h1>
        <p class="subtitle">Monopoli Satire "Bertahan Hidup"</p>
        <div class="form-group">
          <label>Nama Pengguna:</label>
          <input type="text" id="username-input" class="input-field" placeholder="Masukkan nama..." value="Rakyat 1" />
        </div>
        <button id="btn-create-local" class="btn btn-primary">🎮 Main Lokal / Hotseat</button>
      </div>
    `;

    document.getElementById('btn-create-local').onclick = () => {
      const name = document.getElementById('username-input').value.trim();
      this.net.setCurrentUser(name);
      this.net.createRoom();
    };
  }

  renderLobby() {
    const room = this.currentRoom;
    const isHost = room.hostId === this.net.currentUser.id;

    this.app.innerHTML = `
      <div class="card-modal">
        <h2>Lobby Kamar #${room.id}</h2>
        <div class="member-list">
          ${[0, 1, 2, 3].map(seatIdx => {
            const member = room.members.find(m => m.seat === seatIdx);
            const isLocked = room.lockedSeats[seatIdx];

            if (member) {
              return `
                <div class="member-card">
                  <span>${member.name} ${member.isBot ? '🤖' : ''} ${member.isHotseat ? '📱' : ''}</span>
                  ${isHost && member.id !== this.net.currentUser.id ? `<button class="btn-sm btn-danger" onclick="window.uiKick('${member.id}')">Kick</button>` : ''}
                </div>
              `;
            } else if (isLocked) {
              return `
                <div class="member-card empty locked">
                  <span>🔒 Kursi Dikunci</span>
                  ${isHost ? `<button class="btn-sm" onclick="window.uiToggleLock(${seatIdx})">Buka</button>` : ''}
                </div>
              `;
            } else {
              return `
                <div class="member-card empty">
                  <span>Sisa Kursi</span>
                  ${isHost ? `<button class="btn-sm" onclick="window.uiToggleLock(${seatIdx})">Kunci</button>` : ''}
                </div>
              `;
            }
          }).join('')}
        </div>

        <div class="lobby-actions">
          ${isHost ? `
            <button class="btn btn-secondary" onclick="window.uiAddBot()">+ Bot 🤖</button>
            <button class="btn btn-secondary" onclick="window.uiAddHotseat()">+ Hotseat 📱</button>
            <button class="btn btn-primary" ${room.members.length < 3 ? 'disabled' : ''} onclick="window.uiStartGame()">🚀 Mulai Game (${room.members.length}/4)</button>
          ` : '<p>Menunggu Host memulai game...</p>'}
        </div>
      </div>
    `;

    window.uiAddBot = () => this.net.dispatch('ADD_BOT');
    window.uiAddHotseat = () => this.net.dispatch('ADD_HOTSEAT');
    window.uiToggleLock = (seat) => this.net.dispatch('TOGGLE_LOCK', { seat });
    window.uiKick = (targetId) => this.net.dispatch('KICK', { targetId });
    window.uiStartGame = () => this.net.dispatch('START_GAME');
  }

  renderGame() {
    const S = this.currentRoom.gameState;

    if (!document.getElementById('scene-3d-container')) {
      this.app.innerHTML = `
        <div class="game-layout">
          <div class="top-bar">
            <div class="chips-row" id="chips-row"></div>
            <div class="game-info-bar" id="game-info-bar"></div>
          </div>

          <div id="notif-container" class="notif-container"></div>
          
          <button id="btn-camera-toggle" class="btn-cam-toggle">🎯 Kamera</button>

          <!-- Canvas 3D Three.js -->
          <div id="scene-3d-container" class="scene-3d-container"></div>

          <div class="dock-bottom" id="dock-bottom"></div>
        </div>
      `;

      document.getElementById('btn-camera-toggle').onclick = () => {
        if (this.scene) {
          const mode = this.scene.toggleCameraMode();
          this.addNotification(`Kamera: ${mode === 'follow' ? 'Ikuti Bidak 🎯' : 'Overview 🗺️'}`);
        }
      };

      if (this.scene) {
        const container = document.getElementById('scene-3d-container');
        container.appendChild(this.scene.renderer.domElement);
        this.scene.onWindowResize();
      }
    }

    // Update Top Bar
    document.getElementById('chips-row').innerHTML = S.players.map(p => `
      <div class="player-chip ${p.id === S.turnIdx ? 'active' : ''} ${p.isBankrupt ? 'bankrupt' : ''}" style="border-left: 4px solid ${p.color}">
        <div class="p-name">${p.name} ${p.isBot ? '🤖' : ''}</div>
        <div class="p-cash">${p.isBankrupt ? 'BANGKRUT' : this.formatMoney(p.cash)}</div>
      </div>
    `).join('');

    document.getElementById('game-info-bar').innerHTML = `
      <span> Putaran: <b>${S.round}</b></span>
      <span> Inflasi: <b>${(S.infl * 100).toFixed(1)}%</b></span>
      <span> Dana Hibah: <b>${this.formatMoney(S.hibahPool)}</b></span>
    `;

    // Update Bottom Dock Controls
    const dock = document.getElementById('dock-bottom');
    if (S.phase === 'gameover') {
      dock.innerHTML = `
        <div class="popup-box">
          <h2>🏆 GAME OVER!</h2>
          <p>Pemenang: <b>${S.winner !== null ? S.players[S.winner].name : 'Tidak Ada'}</b></p>
        </div>
      `;
    } else {
      if (S.phase === 'roll') {
        dock.innerHTML = `
          <div class="power-bar-container">
            <div class="power-bar-fill" id="power-bar-fill"></div>
          </div>
          <button id="btn-roll-dice" class="btn btn-primary btn-xl">🎲 Tahan Lalu Lepas</button>
        `;
        this.attachDicePowerEvents();
      } else if (S.phase === 'decide' && S.pendingAction) {
        dock.innerHTML = this.renderDecideOptions(S);
      } else {
        dock.innerHTML = `<div class="status-waiting">🤔 Menunggu keputusan...</div>`;
      }
    }

    this.renderNotifications();

    window.uiDecide = (choice) => {
      this.net.dispatch('ACT', { action: { type: 'DECIDE', choice } });
    };
  }

  attachDicePowerEvents() {
    const btn = document.getElementById('btn-roll-dice');
    const fill = document.getElementById('power-bar-fill');
    if (!btn) return;

    const startCharge = (e) => {
      if (e) e.preventDefault();
      if (this.isChargingPower) return;
      this.isChargingPower = true;
      this.powerValue = 0;
      clearInterval(this.powerInterval);
      this.powerInterval = setInterval(() => {
        this.powerValue = (this.powerValue + 5) % 100;
        if (fill) fill.style.width = `${this.powerValue}%`;
      }, 30);
    };

    const releaseCharge = (e) => {
      if (e) e.preventDefault();
      if (!this.isChargingPower) return;
      this.isChargingPower = false;
      clearInterval(this.powerInterval);

      sfx.playDice();
      
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      
      if (this.scene) {
        this.scene.triggerDiceRoll(d1, d2);
      }

      this.net.dispatch('ACT', { action: { type: 'ROLL', d1, d2 } });
    };

    btn.onmousedown = startCharge;
    btn.onmouseup = releaseCharge;
    btn.ontouchstart = startCharge;
    btn.ontouchend = releaseCharge;
  }

  renderDecideOptions(S) {
    const act = S.pendingAction;
    const tile = BOARD[act.tileId];

    if (act.type === 'BUY_LAND') {
      return `
        <div class="popup-box">
          <h3>Beli Tanah: ${tile.name}?</h3>
          <p>Harga: <b>${this.formatMoney(act.price)}</b></p>
          <button class="btn btn-success" onclick="window.uiDecide('BUY')">Beli Tanah</button>
          <button class="btn btn-secondary" onclick="window.uiDecide('SKIP')">Lewati</button>
        </div>
      `;
    } else if (act.type === 'UPGRADE_BUILDING') {
      return `
        <div class="popup-box">
          <h3>Tingkatkan Bangunan: ${tile.name}</h3>
          <button class="btn btn-primary" onclick="window.uiDecide('OFFICIAL')">Izin Resmi (${this.formatMoney(act.cost)})</button>
          <button class="btn btn-warning" onclick="window.uiDecide('PELICIN')">Uang Pelicin (${this.formatMoney(Math.round(act.cost * 1.5))})</button>
          <button class="btn btn-secondary" onclick="window.uiDecide('SKIP')">Nanti Saja</button>
        </div>
      `;
    } else if (act.type === 'TAKEOVER') {
      return `
        <div class="popup-box">
          <h3>Takeover Properti ${tile.name}?</h3>
          <p>Biaya: <b>${this.formatMoney(act.price)}</b></p>
          <button class="btn btn-danger" onclick="window.uiDecide('TAKEOVER')">Beli Paksa (Takeover)</button>
          <button class="btn btn-secondary" onclick="window.uiDecide('SKIP')">Lewati</button>
        </div>
      `;
    }
    return '';
  }
}
