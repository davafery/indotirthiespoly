(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'), require('./rooms.js'));
  } else {
    root.KonohapolyNet = factory(root.KonohapolyEngine, root.KonohapolyRooms);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Engine, Rooms) {
  'use strict';

  const LS_USER = 'kp_user_v1';
  const LS_ROOMS = 'kp_rooms_v1';
  const SS_ACTIVE_ROOM = 'kp_active_room_v1';

  let currentUser = null;
  let activeRoomId = null;
  let thinkingPid = null;
  let botTimer = null;
  let memoryRoomsFallback = {};
  const listeners = new Set();

  function safeSessionGet(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeSessionSet(key, val) {
    try {
      if (val === null || val === undefined) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, String(val));
      }
    } catch (_) {}
  }

  function safeReadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (_) {
      try { localStorage.removeItem(key); } catch (__) {}
      return fallback;
    }
  }

  function safeWriteJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      if (key === LS_ROOMS) memoryRoomsFallback = value;
    }
  }

  function isRoomFinished(room) {
    if (!room) return true;
    return room.status === 'finished' || Boolean(room.game && room.game.phase === 'gameover');
  }

  function hasActiveHumans(room) {
    if (!room || !Array.isArray(room.seats)) return false;
    return room.seats.some(s => s.player && !s.player.isBot && !s.player.isLocal && !s.player.afk);
  }

  function loadAllRooms() {
    let map = safeReadJSON(LS_ROOMS, null);
    if (!map || typeof map !== 'object' || Array.isArray(map)) {
      map = memoryRoomsFallback || {};
    }

    const now = Date.now();
    let changed = false;
    Object.keys(map).forEach(id => {
      const r = map[id];
      if (!r || !r.id || !Array.isArray(r.seats)) {
        delete map[id];
        changed = true;
      } else if (r.status === 'waiting' && now - (r.hostLastActiveAt || 0) > 65000) {
        delete map[id];
        changed = true;
      } else if (r.status !== 'waiting' && !hasActiveHumans(r)) {
        delete map[id];
        changed = true;
      } else if (isRoomFinished(r) && now - (r.finishedAt || r.hostLastActiveAt || 0) > 10000) {
        delete map[id];
        changed = true;
      }
    });
    if (changed) saveAllRooms(map);
    return map;
  }

  function saveAllRooms(map) {
    memoryRoomsFallback = map;
    safeWriteJSON(LS_ROOMS, map);
  }

  function notify() {
    const room = getActiveRoom();
    listeners.forEach(fn => {
      try { fn(room, thinkingPid); } catch (err) { console.error(err); }
    });
  }

  function init() {
    currentUser = safeReadJSON(LS_USER, null);
    activeRoomId = safeSessionGet(SS_ACTIVE_ROOM) || null;

    if (activeRoomId) {
      const existingRoom = getActiveRoom();
      if (existingRoom && !isRoomFinished(existingRoom)) {
        scheduleBotIfNeeded(existingRoom);
      } else {
        if (existingRoom && isRoomFinished(existingRoom)) {
          const map = loadAllRooms();
          delete map[activeRoomId];
          saveAllRooms(map);
        }
        activeRoomId = null;
        safeSessionSet(SS_ACTIVE_ROOM, null);
      }
    }

    window.addEventListener('storage', e => {
      if (e.key === LS_ROOMS && activeRoomId) {
        const room = getActiveRoom();
        if (room) scheduleBotIfNeeded(room);
        notify();
      }
    });

    return currentUser;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function login(name) {
    const clean = String(name || '').trim().slice(0, 18) || 'Warga +62';
    const uid = (currentUser && currentUser.uid)
      ? currentUser.uid
      : `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    currentUser = { uid, name: clean };
    safeWriteJSON(LS_USER, currentUser);
    return currentUser;
  }

  function getUser() {
    if (!currentUser) {
      currentUser = safeReadJSON(LS_USER, null);
    }
    return currentUser;
  }

  function listRooms() {
    const map = loadAllRooms();
    return Object.values(map)
      .filter(r => !isRoomFinished(r) && (r.status === 'waiting' || hasActiveHumans(r)))
      .map(r => Rooms.summarizeRoom(r));
  }

  function createRoom(roomName) {
    const user = getUser() || login('Warga +62');
    const room = Rooms.createRoom(user, roomName);
    const map = loadAllRooms();
    map[room.id] = room;
    saveAllRooms(map);

    activeRoomId = room.id;
    safeSessionSet(SS_ACTIVE_ROOM, room.id);
    thinkingPid = null;
    notify();
    return { ok: true, room };
  }

  function joinRoom(roomId) {
    const user = getUser() || login('Warga +62');
    const map = loadAllRooms();
    const room = map[roomId];
    if (!room || isRoomFinished(room)) {
      return { ok: false, error: 'Room tidak ditemukan atau permainan sudah selesai.' };
    }

    const res = Rooms.joinRoom(room, user);
    if (!res.ok) return res;

    map[room.id] = room;
    saveAllRooms(map);
    activeRoomId = room.id;
    safeSessionSet(SS_ACTIVE_ROOM, room.id);
    scheduleBotIfNeeded(room);
    notify();
    return { ok: true, room };
  }

  function getActiveRoom() {
    if (!activeRoomId) {
      activeRoomId = safeSessionGet(SS_ACTIVE_ROOM) || null;
    }
    if (!activeRoomId) return null;
    const map = loadAllRooms();
    return map[activeRoomId] || null;
  }

  function getThinkingPid() {
    return thinkingPid;
  }

  function returnToWaitingRoom() {
    if (botTimer) {
      clearTimeout(botTimer);
      botTimer = null;
    }
    thinkingPid = null;

    const user = getUser();
    const targetRoomId = activeRoomId || safeSessionGet(SS_ACTIVE_ROOM);
    if (!targetRoomId) return false;

    const map = loadAllRooms();
    const room = map[targetRoomId];
    if (!room) {
      activeRoomId = null;
      safeSessionSet(SS_ACTIVE_ROOM, null);
      notify();
      return false;
    }

    room.status = 'waiting';
    room.game = null;
    delete room.finishedAt;
    room.hostLastActiveAt = Date.now();
    room.ver = (room.ver || 0) + 1;

    if (Array.isArray(room.seats)) {
      room.seats.forEach(s => {
        if (s.player) {
          s.player.afk = false;
        }
      });
      if (user) {
        const hostStillHere = room.seats.some(s => s.player && s.player.uid === room.hostUid && !s.player.isBot);
        if (!hostStillHere) {
          room.hostUid = user.uid;
          room.hostName = user.name;
        }
      }
    }

    map[targetRoomId] = room;
    saveAllRooms(map);
    activeRoomId = targetRoomId;
    safeSessionSet(SS_ACTIVE_ROOM, targetRoomId);
    notify();
    return true;
  }

  function leaveRoom() {
    if (botTimer) {
      clearTimeout(botTimer);
      botTimer = null;
    }
    thinkingPid = null;

    const user = getUser();
    const targetRoomId = activeRoomId || safeSessionGet(SS_ACTIVE_ROOM);
    const map = loadAllRooms();

    if (targetRoomId && map[targetRoomId]) {
      const room = map[targetRoomId];
      const finished = isRoomFinished(room);

      if (user) {
        const res = Rooms.leaveRoom(room, user) || {};
        if (Array.isArray(room.seats)) {
          room.seats.forEach(s => {
            if (s.player && (s.player.uid === user.uid || s.player.ownerUid === user.uid)) {
              s.player.afk = true;
            }
          });
        }

        if (
          res.deleted ||
          finished ||
          room.hostUid === user.uid ||
          !hasActiveHumans(room)
        ) {
          delete map[targetRoomId];
        } else {
          map[targetRoomId] = room;
        }
      } else {
        delete map[targetRoomId];
      }
    }

    if (user) {
      Object.keys(map).forEach(id => {
        const r = map[id];
        if (r && r.hostUid === user.uid && isRoomFinished(r)) {
          delete map[id];
        }
      });
    }

    saveAllRooms(map);
    activeRoomId = null;
    safeSessionSet(SS_ACTIVE_ROOM, null);
    notify();
  }

  function op(roomId, opName, payload) {
    const user = getUser();
    if (!user) return;
    const map = loadAllRooms();
    const room = map[roomId];
    if (!room) return;

    Rooms.applyOp(room, user, opName, payload || {});
    if (room.game && room.game.phase === 'gameover') {
      room.status = 'finished';
      if (!room.finishedAt) room.finishedAt = Date.now();
    }
    map[roomId] = room;
    saveAllRooms(map);

    scheduleBotIfNeeded(room);
    notify();
  }

  function scheduleBotIfNeeded(room) {
    if (botTimer) {
      clearTimeout(botTimer);
      botTimer = null;
    }
    thinkingPid = null;

    if (!room || room.status !== 'playing' || !room.game || isRoomFinished(room)) {
      return;
    }

    const user = getUser();
    if (!user || room.hostUid !== user.uid) return;

    const G = room.game;

    const activeTurnPlayer = G.players[G.turnIdx];
    if (G.phase !== 'vote' && activeTurnPlayer && activeTurnPlayer.bankrupt) {
      room.game = Engine.applyAction(G, activeTurnPlayer.id, { type: 'timeout' });
      room.ver = (room.ver || 0) + 1;
      if (room.game && room.game.phase === 'gameover') {
        room.status = 'finished';
        if (!room.finishedAt) room.finishedAt = Date.now();
      }
      const map = loadAllRooms();
      map[room.id] = room;
      saveAllRooms(map);
      scheduleBotIfNeeded(room);
      return;
    }

    let botToAct = null;
    if (G.phase === 'vote' && G.voteState) {
      botToAct = G.players.find(p => p.isBot && !p.bankrupt && !G.voteState.votes[p.id]) || null;
    } else if (activeTurnPlayer && activeTurnPlayer.isBot && !activeTurnPlayer.bankrupt) {
      botToAct = activeTurnPlayer;
    }

    if (!botToAct) return;

    thinkingPid = botToAct.id;
    const hasRecentDice = Array.isArray(G.ev) && G.ev.some(e => e.k === 'dice');
    const moveEv = Array.isArray(G.ev) ? G.ev.find(e => e.k === 'move') : null;
    const moveSteps = moveEv ? Math.abs(Number(moveEv.steps) || 6) : 0;
    const delayMs = hasRecentDice
      ? Math.min(4800, 2450 + moveSteps * 135)
      : (moveEv ? 1750 : 1050);

    botTimer = setTimeout(() => {
      botTimer = null;
      const latest = getActiveRoom();
      if (!latest || latest.status !== 'playing' || !latest.game || isRoomFinished(latest)) return;
      const action = Engine.chooseBotAction(latest.game, botToAct.id);
      thinkingPid = null;
      if (action) {
        op(latest.id, 'act', { actorId: botToAct.id, action });
      } else {
        notify();
      }
    }, delayMs);
  }

  return {
    init,
    subscribe,
    login,
    getUser,
    listRooms,
    createRoom,
    joinRoom,
    getActiveRoom,
    getThinkingPid,
    returnToWaitingRoom,
    leaveRoom,
    op
  };
}));
