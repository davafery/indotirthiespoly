(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    root.KonohapolyRooms = factory(root.KonohapolyEngine);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Engine) {
  'use strict';

  const SEAT_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
  const BOT_NAMES = ['Bot Pak RT', 'Bot Sultan PIK', 'Bot Aktivis', 'Bot Stafsus'];

  function makeId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }

  function createRoom(hostUser, rawName) {
    const cleanName = String(rawName || '').trim() || `Meja ${hostUser.name}`;
    const now = Date.now();
    return {
      id: makeId('room'),
      name: cleanName.slice(0, 28),
      hostUid: hostUser.uid,
      hostName: hostUser.name,
      hostLastActiveAt: now,
      status: 'waiting',
      ver: 1,
      seats: [
        {
          locked: false,
          player: {
            id: `p_${hostUser.uid}`,
            uid: hostUser.uid,
            ownerUid: hostUser.uid,
            name: hostUser.name,
            color: SEAT_COLORS[0],
            isBot: false,
            isLocal: false,
            afk: false
          }
        },
        { locked: false, player: null },
        { locked: false, player: null },
        { locked: false, player: null }
      ],
      game: null,
      chat: []
    };
  }

  function summarizeRoom(room) {
    const seats = Array.isArray(room.seats) ? room.seats : [];
    const activeCount = seats.filter(s => s && s.player).length;
    const maxSeats = seats.filter(s => s && !s.locked).length;
    return {
      id: room.id,
      name: room.name,
      hostName: room.hostName || 'Host',
      status: room.status || 'waiting',
      activeCount,
      maxSeats,
      round: room.game ? room.game.round : 1
    };
  }

  function joinRoom(room, user) {
    if (!room || !user) {
      return { ok: false, error: 'Room tidak ditemukan.' };
    }

    const existing = room.seats.find(s => s.player && s.player.uid === user.uid);
    if (existing) {
      return { ok: true, room };
    }

    if (room.status === 'waiting') {
      const emptyIdx = room.seats.findIndex(s => !s.locked && !s.player);
      if (emptyIdx === -1) {
        return { ok: false, error: 'Semua kursi di room ini sudah penuh.' };
      }
      room.seats[emptyIdx].player = {
        id: `p_${user.uid}`,
        uid: user.uid,
        ownerUid: user.uid,
        name: user.name,
        color: SEAT_COLORS[emptyIdx % SEAT_COLORS.length],
        isBot: false,
        isLocal: false,
        afk: false
      };
      room.ver = (room.ver || 0) + 1;
      return { ok: true, room };
    }

    return { ok: true, room };
  }

  function leaveRoom(room, user) {
    if (!room || !user) return { deleted: false };

    if (room.status === 'waiting') {
      if (room.hostUid === user.uid) {
        return { deleted: true };
      }
      room.seats.forEach(s => {
        if (s.player && s.player.ownerUid === user.uid) {
          s.player = null;
        }
      });
      room.ver = (room.ver || 0) + 1;
      return { deleted: false };
    }

    if (room.status === 'playing' && room.game) {
      room.seats.forEach(s => {
        if (s.player && s.player.ownerUid === user.uid && !s.player.isBot) {
          s.player.isBot = true;
          s.player.afk = true;
          const gp = room.game.players.find(p => p.id === s.player.id);
          if (gp) gp.isBot = true;
        }
      });
      room.ver = (room.ver || 0) + 1;
    }

    return { deleted: false };
  }

  function applyOp(room, user, opName, payload) {
    if (!room || !user) return room;
    const isHost = room.hostUid === user.uid;

    if (opName === 'keepalive' && isHost) {
      room.hostLastActiveAt = Date.now();
      return room;
    }

    if (opName === 'addBot' && isHost && room.status === 'waiting') {
      const idx = room.seats.findIndex(s => !s.locked && !s.player);
      if (idx !== -1) {
        const usedNames = new Set(room.seats.filter(s => s.player).map(s => s.player.name));
        const botName = BOT_NAMES.find(n => !usedNames.has(n)) || `Bot Warga ${idx + 1}`;
        room.seats[idx].player = {
          id: makeId('bot'),
          uid: null,
          ownerUid: null,
          name: botName,
          color: SEAT_COLORS[idx % SEAT_COLORS.length],
          isBot: true,
          isLocal: false,
          afk: false
        };
        room.hostLastActiveAt = Date.now();
        room.ver = (room.ver || 0) + 1;
      }
      return room;
    }

    if (opName === 'addLocal' && isHost && room.status === 'waiting') {
      const idx = room.seats.findIndex(s => !s.locked && !s.player);
      if (idx !== -1) {
        const customName = String((payload && payload.name) || '').trim() || `Warga ${idx + 1}`;
        room.seats[idx].player = {
          id: makeId('loc'),
          uid: `${user.uid}_loc_${idx}`,
          ownerUid: user.uid,
          name: customName.slice(0, 18),
          color: SEAT_COLORS[idx % SEAT_COLORS.length],
          isBot: false,
          isLocal: true,
          afk: false
        };
        room.hostLastActiveAt = Date.now();
        room.ver = (room.ver || 0) + 1;
      }
      return room;
    }

    if (opName === 'lock' && isHost && room.status === 'waiting') {
      const idx = Number(payload && payload.seatIdx);
      const seat = room.seats[idx];
      if (seat && !seat.player) {
        seat.locked = !seat.locked;
        room.hostLastActiveAt = Date.now();
        room.ver = (room.ver || 0) + 1;
      }
      return room;
    }

    if (opName === 'kick' && isHost && room.status === 'waiting') {
      const idx = Number(payload && payload.seatIdx);
      const seat = room.seats[idx];
      if (seat && seat.player && !(seat.player.uid === room.hostUid && !seat.player.isLocal)) {
        seat.player = null;
        room.hostLastActiveAt = Date.now();
        room.ver = (room.ver || 0) + 1;
      }
      return room;
    }

    if (opName === 'start' && isHost && room.status === 'waiting') {
      const occupied = room.seats.filter(s => s.player).map(s => s.player);
      if (occupied.length < 3) return room;

      const specs = occupied.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isBot: Boolean(p.isBot)
      }));

      const chosenTheme = payload && payload.theme;
      const game = Engine.createInitialState(specs, chosenTheme);
      if (!game.theme) {
        game.theme = chosenTheme || {
          board: game.board || [],
          groups: game.groups || {},
          economy: game.economy || { bailBase: 5000, jailBribeBase: 7500 }
        };
      }
      if (!game.theme.economy) {
        game.theme.economy = { bailBase: 5000, jailBribeBase: 7500 };
      }

      room.game = game;
      room.status = 'playing';
      room.ver = (room.ver || 0) + 1;
      return room;
    }

    if (opName === 'act' && room.status === 'playing' && room.game) {
      room.game = Engine.applyAction(room.game, payload.actorId, payload.action);
      room.ver = (room.ver || 0) + 1;
      return room;
    }

    if (opName === 'chat') {
      if (!Array.isArray(room.chat)) room.chat = [];
      const text = String((payload && payload.text) || '').trim().slice(0, 140);
      if (!text) return room;
      const seat = room.seats.find(s => s.player && s.player.ownerUid === user.uid);
      room.chat.push({
        id: makeId('msg'),
        name: (payload && payload.senderName) || user.name,
        color: seat && seat.player ? seat.player.color : '#38bdf8',
        text,
        ts: Date.now()
      });
      if (room.chat.length > 50) {
        room.chat = room.chat.slice(-50);
      }
      room.ver = (room.ver || 0) + 1;
      return room;
    }

    return room;
  }

  return {
    createRoom,
    summarizeRoom,
    joinRoom,
    leaveRoom,
    applyOp
  };
}));