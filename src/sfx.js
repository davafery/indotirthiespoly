/**
 * Konohapoly - Network & Local Adapter Layer
 */
import { createRoom, reduceRoom } from './rooms.js';

export class LocalAdapter {
  constructor() {
    this.room = null;
    this.currentUser = { id: 'local_host', name: 'Pemain Utama' };
    this.listeners = [];
  }

  setCurrentUser(name) {
    this.currentUser.name = name || 'Pemain Utama';
  }

  createRoom() {
    this.room = createRoom(`ROOM_${Math.floor(Math.random() * 9000 + 1000)}`, this.currentUser);
    this.notify();
    return this.room;
  }

  dispatch(op, args = {}) {
    if (!this.room) return;
    this.room = reduceRoom(this.room, this.currentUser.id, op, args);
    this.notify();
    this.checkBotTurn();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.room);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.room));
  }

  checkBotTurn() {
    if (!this.room || this.room.status !== 'playing' || !this.room.gameState) return;

    const S = this.room.gameState;
    if (S.phase === 'gameover') return;

    const currentActor = S.turnIdx;
    const currentPlayer = S.players[currentActor];

    if (currentPlayer && (currentPlayer.isBot || currentPlayer.afk)) {
      const delay = Math.floor(Math.random() * 1500) + 1500; // 1.5s - 3.0s thinking delay
      setTimeout(() => {
        if (!this.room || !this.room.gameState) return;
        if (this.room.gameState.turnIdx !== currentActor) return;

        let botAction = { type: 'ROLL' };
        if (S.phase === 'decide') {
          const pAct = S.pendingAction;
          let choice = 'SKIP';
          if (pAct) {
            if (pAct.type === 'BUY_LAND') {
              choice = currentPlayer.cash >= pAct.price ? 'BUY' : 'SKIP';
            } else if (pAct.type === 'UPGRADE_BUILDING') {
              choice = currentPlayer.cash >= pAct.cost * 1.4 ? 'PELICIN' : (currentPlayer.cash >= pAct.cost ? 'OFFICIAL' : 'SKIP');
            } else if (pAct.type === 'TAKEOVER') {
              choice = currentPlayer.cash >= pAct.price * 1.5 ? 'TAKEOVER' : 'SKIP';
            }
          }
          botAction = { type: 'DECIDE', choice };
        }

        this.dispatch('BOT_ACT', { action: botAction });
      }, delay);
    }
  }
}