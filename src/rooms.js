/**
 * Konohapoly - Room & Lobby Manager (Pure Logic, Shared with Edge Function)
 */
import { initGame, applyAction } from './engine.js';

export const ROOM_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

export function createRoom(roomId, hostUser) {
  return {
    id: roomId,
    ver: 1,
    status: ROOM_STATUS.WAITING,
    hostId: hostUser.id,
    maxPlayers: 4,
    minPlayers: 3,
    lockedSeats: [false, false, false, false],
    members: [
      {
        id: hostUser.id,
        name: hostUser.name,
        isBot: false,
        isHotseat: false,
        seat: 0,
        afk: false
      }
    ],
    gameState: null,
    updatedAt: Date.now()
  };
}

export function reduceRoom(room, uid, op, args = {}) {
  const R = JSON.parse(JSON.stringify(room));
  R.ver++;
  R.updatedAt = Date.now();

  const isHost = R.hostId === uid;

  switch (op) {
    case 'JOIN': {
      if (R.status !== ROOM_STATUS.WAITING) return R;
      if (R.members.some(m => m.id === uid)) return R;

      const freeSeat = [0, 1, 2, 3].find(
        s => !R.lockedSeats[s] && !R.members.some(m => m.seat === s)
      );

      if (freeSeat === undefined) return R;

      R.members.push({
        id: uid,
        name: args.name || `Warga ${uid.slice(0, 4)}`,
        isBot: false,
        isHotseat: false,
        seat: freeSeat,
        afk: false
      });
      return R;
    }

    case 'ADD_BOT': {
      if (!isHost || R.status !== ROOM_STATUS.WAITING) return R;
      const freeSeat = [0, 1, 2, 3].find(
        s => !R.lockedSeats[s] && !R.members.some(m => m.seat === s)
      );
      if (freeSeat === undefined) return R;

      const botNames = ['Pak RT', 'Bu Lurah', 'Mas Ordal', 'Bang Buzzer', 'Om Kontraktor', 'Tante Arisan'];
      const usedNames = R.members.map(m => m.name);
      const availableName = botNames.find(n => !usedNames.includes(n)) || `Bot ${freeSeat + 1}`;

      R.members.push({
        id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: availableName,
        isBot: true,
        isHotseat: false,
        seat: freeSeat,
        afk: false
      });
      return R;
    }

    case 'ADD_HOTSEAT': {
      if (!isHost || R.status !== ROOM_STATUS.WAITING) return R;
      const freeSeat = [0, 1, 2, 3].find(
        s => !R.lockedSeats[s] && !R.members.some(m => m.seat === s)
      );
      if (freeSeat === undefined) return R;

      R.members.push({
        id: `hs_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: args.name || `Teman Mabar ${freeSeat + 1}`,
        isBot: false,
        isHotseat: true,
        seat: freeSeat,
        afk: false
      });
      return R;
    }

    case 'TOGGLE_LOCK': {
      if (!isHost || R.status !== ROOM_STATUS.WAITING) return R;
      const seat = args.seat;
      if (seat === undefined || seat < 0 || seat > 3) return R;
      if (R.members.some(m => m.seat === seat)) return R;

      R.lockedSeats[seat] = !R.lockedSeats[seat];
      return R;
    }

    case 'KICK': {
      if (!isHost || R.status !== ROOM_STATUS.WAITING) return R;
      R.members = R.members.filter(m => m.id !== args.targetId);
      return R;
    }

    case 'START_GAME': {
      if (!isHost || R.status !== ROOM_STATUS.WAITING) return R;
      if (R.members.length < R.minPlayers) return R;

      R.members.sort((a, b) => a.seat - b.seat);
      const names = R.members.map(m => m.name);

      R.gameState = initGame(R.members.length, names);
      
      // Sinkronkan status bot ke engine
      R.members.forEach((m, idx) => {
        R.gameState.players[idx].isBot = m.isBot;
      });

      R.status = ROOM_STATUS.PLAYING;
      return R;
    }

    case 'ACT': {
      if (R.status !== ROOM_STATUS.PLAYING || !R.gameState) return R;
      const playerIdx = R.members.findIndex(m => m.id === uid || (m.isHotseat && isHost));
      if (playerIdx === -1) return R;

      R.gameState = applyAction(R.gameState, playerIdx, args.action);

      if (R.gameState.phase === 'gameover') {
        R.status = ROOM_STATUS.FINISHED;
      }
      return R;
    }

    case 'BOT_ACT': {
      if (R.status !== ROOM_STATUS.PLAYING || !R.gameState) return R;
      const currentActor = R.gameState.turnIdx;
      const currentPlayer = R.gameState.players[currentActor];
      
      if (!currentPlayer || (!currentPlayer.isBot && !currentPlayer.afk)) return R;

      R.gameState = applyAction(R.gameState, currentActor, args.action);

      if (R.gameState.phase === 'gameover') {
        R.status = ROOM_STATUS.FINISHED;
      }
      return R;
    }

    default:
      return R;
  }
}