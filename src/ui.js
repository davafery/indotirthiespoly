/**
 * Konohapoly - UI Renderer & HUD Manager (Local & Online standard DOM)
 */
import { BOARD, M } from './engine.js';
import { sfx } from './sfx.js';

export class UIRenderer {
  constructor(appEl, netAdapter) {
    this.app = appEl;
    this.net = netAdapter;
    this.currentRoom = null;
    this.notifications = [];
    this.lastTurnIdx = -1;

    this.net.subscribe(room => {
      this.currentRoom = room;
      this.render();
      this.checkTurnNotification();
    });
  }

  formatMoney(amount) {
    if (amount >= 100000) {
      return `Rp${(amount / 1000).toFixed(0)}jt`;
    } else if (amount >= 1000) {
      const jt = (amount / 1000).toFixed(1).replace('.0', '');
      return `Rp${jt}jt`;
    } else {
      return `Rp${amount}rb`;
    }
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
    let container = document.getElementById('notif-container');
    if (!container) return;
    container.innerHTML = this.notifications.map(n => `
      <div class="notif-toast notif-${n.type}">
        ${n.text}
      </div>
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
                  <span>Empty Seat</span>
                  ${isHost ? `<button class="btn-sm" onclick="window.uiToggleLock(${seatIdx})">Kunci</button>` : ''}
                </div>
              `;
            }
          }).join('')}
        </div>

        <div class="lobby-actions">
          ${isHost ? `
            <button class="btn btn-secondary" onclick="window.uiAddBot()">+ Tambah Bot 🤖</button>
            <button class="btn btn-secondary" onclick="window.uiAddHotseat()">+ Mabar HP Sama 📱</button>
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
    const activePlayer = S.players[S.turnIdx];
    const isMyTurn = activePlayer.id === S.turnIdx; // Simplified local check

    this.app.innerHTML = `
      <div class="game-layout">
        <div class="top-bar">
          <div class="chips-row">
            ${S.players.map(p => `
              <div class="player-chip ${p.id === S.turnIdx ? 'active' : ''} ${p.isBankrupt ? 'bankrupt' : ''}" style="border-left: 4px solid ${p.color}">
                <div class="p-name">${p.name} ${p.isBot ? '🤖' : ''}</div>
                <div class="p-cash">${p.isBankrupt ? 'BANGKRUT' : this.formatMoney(p.cash)}</div>
              </div>
            `).join('')}
          </div>
          <div class="game-info-bar">
            <span> Putaran: <b>${S.round}</b></span>
            <span> Inflasi: <b>${(S.infl * 100).toFixed(1)}%</b></span>
            <span> Dana Hibah: <b>${this.formatMoney(S.hibahPool)}</b></span>
          </div>
        </div>

        <div id="notif-container" class="notif-container"></div>

        <div class="board-container 2d-fallback">
          <div class="board-grid">
            ${BOARD.map(tile => {
              const pData = S.props[tile.id];
              let ownerColor = 'transparent';
              if (pData && pData.owner !== null) {
                ownerColor = S.players[pData.owner].color;
              }
              const playersOnTile = S.players.filter(p => !p.isBankrupt && p.pos === tile.id);

              return `
                <div class="tile-card" style="border-top: 5px solid ${ownerColor}">
                  <div class="tile-id">#${tile.id}</div>
                  <div class="tile-name">${tile.name}</div>
                  ${pData && pData.mortgaged ? `<span class="badge-mortgage">🔒 DIGADAI</span>` : ''}
                  <div class="tile-tokens">
                    ${playersOnTile.map(pt => `<span class="token" style="background:${pt.color}"></span>`).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="dock-bottom">
          ${S.phase === 'gameover' ? `
            <div class="popup-box">
              <h2>🏆 GAME OVER!</h2>
              <p>Pemenang: <b>${S.winner !== null ? S.players[S.winner].name : 'Tidak Ada'}</b></p>
            </div>
          ` : `
            <div class="controls-row">
              ${S.phase === 'roll' ? `
                <button class="btn btn-primary btn-xl" onclick="window.uiRollDice()">🎲 Lempar Dadu</button>
              ` : ''}

              ${S.phase === 'decide' && S.pendingAction ? this.renderDecideOptions(S) : ''}
            </div>
          `}
        </div>
      </div>
    `;

    this.renderNotifications();

    window.uiRollDice = () => {
      sfx.playDice();
      this.net.dispatch('ACT', { action: { type: 'ROLL' } });
    };

    window.uiDecide = (choice) => {
      this.net.dispatch('ACT', { action: { type: 'DECIDE', choice } });
    };
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