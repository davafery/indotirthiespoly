(function (root, factory) {
  const api = factory(typeof root !== 'undefined' ? root.KonohapolyEngine : null);
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  }
  if (root) {
    root.KonohapolyRooms = api;
    root.Rooms = root.Rooms || api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (InjectedEngine) {
  'use strict';

  const DEFAULT_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
  const DEFAULT_BOTS = ['Bot Pak RT', 'Bot Bu Lurah', 'Bot Kang Parkir', 'Bot Sultan KW'];

  function getEngine() {
    if (InjectedEngine && typeof InjectedEngine.createGame === 'function') {
      return InjectedEngine;
    }
    if (typeof globalThis !== 'undefined') {
      return globalThis.KonohapolyEngine || globalThis.Engine || globalThis.GameEngine || null;
    }
    return null;
  }

  function getColors() {
    const eng = getEngine();
    return (eng && Array.isArray(eng.PLAYER_COLORS) && eng.PLAYER_COLORS.length >= 4)
      ? eng.PLAYER_COLORS
      : DEFAULT_COLORS;
  }

  function getBotNames() {
    const eng = getEngine();
    return (eng && Array.isArray(eng.BOT_NAMES) && eng.BOT_NAMES.length > 0)
      ? eng.BOT_NAMES
      : DEFAULT_BOTS;
  }

  function createRoom(user, roomName) {
    const colors = getColors();
    const cleanRoomName = String(roomName || '').trim().slice(0, 26) || `Meja ${user.name}`;
    const id = `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    const seats = [
      {
        locked: false,
        player: {
          id: 'p_1',
          uid: user.uid,
          ownerUid: user.uid,
          name: user.name,
          color: colors[0],
          isBot: false,
          isLocal: false,
          afk: false
        }
      },
      { locked: false, player: null },
      { locked: false, player: null },
      { locked: false, player: null }
    ];

    return {
      id,
      name: cleanRoomName,
      hostUid: user.uid,
      hostName: user.name,
      hostLastActiveAt: Date.now(),
      status: 'waiting',
      ver: 1,
      seats,
      game: null,
      chat: []
    };
  }

  function summarizeRoom(room) {
    const seats = Array.isArray(room.seats) ? room.seats : [];
    const activeCount = seats.filter(s => s && s.player).length;
    const maxSeats = seats.filter(s => s && !s.locked).length || 4;
    return {
      id: room.id,
      name: room.name,
      hostName: room.hostName,
      status: room.status,
      activeCount,
      maxSeats,
      round: room.game ? (room.game.round || 1) : 1
    };
  }

  function joinRoom(room, user) {
    if (!room || !user) return { ok: false, error: 'Data room atau pengguna tidak valid.' };

    const existingSeats = room.seats.filter(
      s => s.player && (s.player.uid === user.uid || s.player.ownerUid === user.uid)
    );
    if (existingSeats.length > 0) {
      existingSeats.forEach(s => {
        s.player.afk = false;
      });
      room.ver = (room.ver || 0) + 1;
      return { ok: true };
    }

    if (room.status === 'waiting') {
      const openIdx = room.seats.findIndex(s => !s.locked && !s.player);
      if (openIdx === -1) {
        return { ok: false, error: 'Semua kursi sudah terisi atau terkunci.' };
      }
      const colors = getColors();
      room.seats[openIdx].player = {
        id: `p_${openIdx + 1}`,
        uid: user.uid,
        ownerUid: user.uid,
        name: user.name,
        color: colors[openIdx % colors.length],
        isBot: false,
        isLocal: false,
        afk: false
      };
      room.ver = (room.ver || 0) + 1;
      return { ok: true };
    }

    return { ok: true };
  }

  function leaveRoom(room, user) {
    if (!room || !user) return { deleted: false };

    if (room.status === 'waiting') {
      if (room.hostUid === user.uid) {
        return { deleted: true };
      }
      room.seats.forEach(s => {
        if (s.player && (s.player.uid === user.uid || s.player.ownerUid === user.uid)) {
          s.player = null;
        }
      });
      room.ver = (room.ver || 0) + 1;
      return { deleted: false };
    }

    room.seats.forEach(s => {
      if (s.player && (s.player.uid === user.uid || s.player.ownerUid === user.uid)) {
        s.player.afk = true;
      }
    });
    room.ver = (room.ver || 0) + 1;
    return { deleted: room.hostUid === user.uid };
  }

  function applyOp(room, user, opName, payload) {
    if (!room || !user) return room;
    const isHost = room.hostUid === user.uid;

    if (isHost) {
      room.hostLastActiveAt = Date.now();
    }

    if (opName === 'keepalive') {
      room.ver = (room.ver || 0) + 1;
      return room;
    }

    if (opName === 'chat') {
      const text = String((payload && payload.text) || '').trim().slice(0, 140);
      if (!text) return room;
      if (!Array.isArray(room.chat)) room.chat = [];

      const senderSeat = room.seats.find(
        s => s.player && (s.player.uid === user.uid || s.player.ownerUid === user.uid)
      );
      const senderName = String((payload && payload.senderName) || user.name || 'Warga').slice(0, 22);
      const senderColor = senderSeat && senderSeat.player ? senderSeat.player.color : '#38bdf8';

      room.chat.push({
        id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
        name: senderName,
        color: senderColor,
        text,
        at: Date.now()
      });
      if (room.chat.length > 60) {
        room.chat = room.chat.slice(room.chat.length - 60);
      }
      room.ver = (room.ver || 0) + 1;
      return room;
    }

    if (room.status === 'waiting' && isHost) {
      if (opName === 'addBot') {
        const openIdx = room.seats.findIndex(s => !s.locked && !s.player);
        if (openIdx !== -1) {
          const usedNames = new Set(room.seats.filter(s => s.player).map(s => s.player.name));
          const botPool = getBotNames();
          const botName = botPool.find(n => !usedNames.has(n)) || `Bot Warga ${openIdx + 1}`;
          const colors = getColors();

          room.seats[openIdx].player = {
            id: `p_${openIdx + 1}`,
            uid: null,
            ownerUid: room.hostUid,
            name: botName,
            color: colors[openIdx % colors.length],
            isBot: true,
            isLocal: false,
            afk: false
          };
          room.ver = (room.ver || 0) + 1;
        }
        return room;
      }

      if (opName === 'addLocal') {
        const openIdx = room.seats.findIndex(s => !s.locked && !s.player);
        if (openIdx !== -1) {
          const rawName = String((payload && payload.name) || '').trim().slice(0, 18);
          const localName = rawName || `Warga Lokal ${openIdx + 1}`;
          const colors = getColors();

          room.seats[openIdx].player = {
            id: `p_${openIdx + 1}`,
            uid: user.uid,
            ownerUid: user.uid,
            name: localName,
            color: colors[openIdx % colors.length],
            isBot: false,
            isLocal: true,
            afk: false
          };
          room.ver = (room.ver || 0) + 1;
        }
        return room;
      }

      if (opName === 'lock') {
        const idx = Number(payload && payload.seatIdx);
        if (room.seats[idx] && !room.seats[idx].player) {
          room.seats[idx].locked = !room.seats[idx].locked;
          room.ver = (room.ver || 0) + 1;
        }
        return room;
      }

      if (opName === 'kick') {
        const idx = Number(payload && payload.seatIdx);
        const target = room.seats[idx] && room.seats[idx].player;
        if (target && !(target.uid === room.hostUid && !target.isLocal)) {
          room.seats[idx].player = null;
          room.ver = (room.ver || 0) + 1;
        }
        return room;
      }

      if (opName === 'start') {
        const activePlayers = room.seats.filter(s => s && s.player).map(s => s.player);
        if (activePlayers.length < 3) return room;

        const eng = getEngine();
        if (!eng || typeof eng.createGame !== 'function') {
          console.error('KonohapolyEngine belum termuat saat memulai permainan.');
          return room;
        }

        room.game = eng.createGame(activePlayers, payload ? payload.theme : null);
        room.status = 'playing';
        room.ver = (room.ver || 0) + 1;
        return room;
      }
    }

    if (room.status === 'playing' && room.game && opName === 'act') {
      const actorId = payload && payload.actorId;
      const action = payload && payload.action;
      if (!actorId || !action) return room;

      const seat = room.seats.find(s => s && s.player && s.player.id === actorId);
      const allowed = Boolean(
        seat && (
          seat.player.ownerUid === user.uid ||
          (seat.player.isBot && isHost)
        )
      );
      if (!allowed) return room;

      const eng = getEngine();
      if (!eng || typeof eng.applyAction !== 'function') return room;

      room.game = eng.applyAction(room.game, actorId, action);
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
