(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    root.KonohapolyScene = factory(root.KonohapolyEngine);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Engine) {
  'use strict';

  let containerEl = null;
  let overlayLayer = null;
  let camBtn = null;
  let latestState = null;
  let onTileClickCb = null;
  let lastProcessedSeq = -1;
  let throwPower = 55;

  let themeScene = {
    skyHex: 0x091e36,
    seaHex: 0x0c4a6e,
    frameHex: 0x3b2314,
    fieldHex: 0x14532d,
    tileBg: '#f8f5ec',
    tileMortgagedBg: '#cbd5e1',
    tileBorder: '#334155',
    tileText: '#0f172a',
    monasFlameHex: 0xfacc15
  };

  let THREE = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let raycaster = null;
  let pointerNDC = null;
  let seaMesh = null;
  let frameMesh = null;
  let centerFieldMesh = null;
  let monasFlameMat = null;
  let centerPlaqueTex = null;
  let centerPlaqueCanvas = null;
  let lastPlaqueSig = '';

  let tileGroups = [];
  let tileMeshes = [];
  let tileCanvases = [];
  let tileTextures = [];
  let tileSigs = [];
  let buildingMeshes = [];
  let pawnStamps = [];
  let disasterFX = [];
  let hoveredTile = -1;

  let pawnGroups = {};
  let pawnRings = {};
  let visualPos = {};
  let hopPhase = {};
  let pawnMoveDelayUntil = {};
  let floatLabels = [];

  let diceRigs = [];
  let diceFocusUntil = 0;

  let cameraMode = 'follow';
  let camYaw = 0;
  let camPitch = 0.88;
  let camDist = 20.5;
  let targetCamDist = 20.5;
  let camTarget = { x: 0, y: 0.4, z: 0.8 };
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragMoved = 0;
  let pinchStartDist = 0;
  let pinchStartCamDist = 20.5;
  let rafId = null;

  let winResizeHandler = null;
  let winMoveHandler = null;
  let winUpHandler = null;

  const MIN_CAM_DIST = 8.5;
  const MAX_CAM_DIST = 46;
  const CORNER_W = 2.15;
  const EDGE_W = 1.42;
  const BOARD_SPAN = CORNER_W * 2 + EDGE_W * 9;
  const HALF_SPAN = BOARD_SPAN / 2;

  function fmtMoney(v) {
    return (Engine && Engine.formatMoney) ? Engine.formatMoney(v) : `Rp${Number(v || 0).toLocaleString('id-ID')}`;
  }

  function getTilePriceSafe(S, idx) {
    if (Engine && Engine.calcTilePrice) return Engine.calcTilePrice(S, idx);
    const tile = S.theme && S.theme.board ? S.theme.board[idx] : null;
    return tile ? Math.round((tile.price || 0) * (S.infl || 1)) : 0;
  }

  function getRentSafe(S, idx) {
    return (Engine && Engine.calcRent) ? Engine.calcRent(S, idx) : 0;
  }

  function getMobileZoomMultiplier() {
    if (!containerEl) return 1;
    const w = Math.max(300, containerEl.clientWidth);
    const h = Math.max(260, containerEl.clientHeight);
    const aspect = w / h;
    if (aspect < 0.85) {
      return Math.min(1.85, 0.95 / Math.max(0.45, aspect));
    }
    return 1;
  }

  function clampCamDist(val) {
    return Math.max(MIN_CAM_DIST, Math.min(MAX_CAM_DIST, val));
  }

  function drawRoundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function cleanupPreviousInstance() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (winResizeHandler) {
      window.removeEventListener('resize', winResizeHandler);
      winResizeHandler = null;
    }
    if (winMoveHandler) {
      window.removeEventListener('pointermove', winMoveHandler);
      winMoveHandler = null;
    }
    if (winUpHandler) {
      window.removeEventListener('pointerup', winUpHandler);
      winUpHandler = null;
    }
    if (renderer) {
      try { renderer.dispose(); } catch (_) {}
      renderer = null;
    }
  }

  function resetSceneCaches() {
    pawnGroups = {};
    pawnRings = {};
    visualPos = {};
    hopPhase = {};
    pawnMoveDelayUntil = {};
    floatLabels = [];
    diceRigs = [];
    diceFocusUntil = 0;
    lastProcessedSeq = -1;
    lastPlaqueSig = '';
    hoveredTile = -1;
    isDragging = false;
    pinchStartDist = 0;
  }

  function applyTheme(themeObj) {
    if (themeObj && themeObj.scene) {
      themeScene = Object.assign({}, themeScene, themeObj.scene);
    }
    if (!scene || !THREE) return;

    scene.background = new THREE.Color(themeScene.skyHex);
    if (scene.fog) scene.fog.color.setHex(themeScene.skyHex);
    if (seaMesh) seaMesh.material.color.setHex(themeScene.seaHex);
    if (frameMesh) frameMesh.material.color.setHex(themeScene.frameHex);
    if (centerFieldMesh) centerFieldMesh.material.color.setHex(themeScene.fieldHex);
    if (monasFlameMat) monasFlameMat.color.setHex(themeScene.monasFlameHex);

    tileSigs = tileSigs.map(() => '');
    if (latestState) updateTileVisuals(latestState);
  }

  function getTileGridCoord(idx) {
    if (idx === 0) return { col: 0, row: 10, corner: true };
    if (idx < 10) return { col: 0, row: 10 - idx, corner: false };
    if (idx === 10) return { col: 0, row: 0, corner: true };
    if (idx < 20) return { col: idx - 10, row: 0, corner: false };
    if (idx === 20) return { col: 10, row: 0, corner: true };
    if (idx < 30) return { col: 10, row: idx - 20, corner: false };
    if (idx === 30) return { col: 10, row: 10, corner: true };
    return { col: 40 - idx, row: 10, corner: false };
  }

  function getTileWorldBox(idx) {
    const { col, row } = getTileGridCoord(idx);
    const w = (col === 0 || col === 10) ? CORNER_W : EDGE_W;
    const d = (row === 0 || row === 10) ? CORNER_W : EDGE_W;

    let x = 0;
    if (col === 0) x = -HALF_SPAN + CORNER_W / 2;
    else if (col === 10) x = HALF_SPAN - CORNER_W / 2;
    else x = -HALF_SPAN + CORNER_W + (col - 0.5) * EDGE_W;

    let z = 0;
    if (row === 0) z = -HALF_SPAN + CORNER_W / 2;
    else if (row === 10) z = HALF_SPAN - CORNER_W / 2;
    else z = -HALF_SPAN + CORNER_W + (row - 0.5) * EDGE_W;

    return { x, z, w, d };
  }

  function getWorldPosAtFloat(posFloat) {
    const safePos = Number.isFinite(posFloat) ? posFloat : 0;
    const clean = ((safePos % 40) + 40) % 40;
    const i0 = Math.floor(clean);
    const i1 = (i0 + 1) % 40;
    const frac = clean - i0;
    const b0 = getTileWorldBox(i0);
    const b1 = getTileWorldBox(i1);
    return {
      x: b0.x + (b1.x - b0.x) * frac,
      z: b0.z + (b1.z - b0.z) * frac
    };
  }

  function init(container, opts) {
    if (!container) return;
    cleanupPreviousInstance();
    resetSceneCaches();

    containerEl = container;
    onTileClickCb = (opts && opts.onTileClick) || null;
    if (opts && opts.theme && opts.theme.scene) {
      themeScene = Object.assign({}, themeScene, opts.theme.scene);
    }

    containerEl.innerHTML = '';

    const mobMult = getMobileZoomMultiplier();
    const initialDist = clampCamDist((cameraMode === 'overview' ? 21.5 : 17.5) * Math.min(1.55, mobMult));
    camDist = initialDist;
    targetCamDist = initialDist;

    THREE = typeof window !== 'undefined' ? window.THREE : null;
    if (!THREE) {
      initFallback2D(container);
      return;
    }

    overlayLayer = document.createElement('div');
    overlayLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:10;';
    containerEl.appendChild(overlayLayer);

    camBtn = document.createElement('button');
    camBtn.type = 'button';
    camBtn.className = 'kp-cam-toggle';
    camBtn.textContent = cameraMode === 'follow' ? '🎥 Kamera: Ikuti' : '🗺️ Kamera: Papan Penuh';
    camBtn.addEventListener('pointerdown', e => e.stopPropagation());
    camBtn.addEventListener('click', e => {
      e.stopPropagation();
      const mult = getMobileZoomMultiplier();
      cameraMode = cameraMode === 'follow' ? 'overview' : 'follow';
      camBtn.textContent = cameraMode === 'follow' ? '🎥 Kamera: Ikuti' : '🗺️ Kamera: Papan Penuh';
      if (cameraMode === 'overview') {
        camYaw = 0;
        camPitch = 0.92;
        targetCamDist = clampCamDist(21.5 * mult);
      } else {
        targetCamDist = clampCamDist(17.5 * Math.min(1.55, mult));
      }
    });
    overlayLayer.appendChild(camBtn);

    const zoomBox = document.createElement('div');
    zoomBox.style.cssText = 'position:absolute;right:12px;bottom:14px;display:flex;flex-direction:column;gap:8px;pointer-events:auto;z-index:12;';

    const zoomBtnStyle = 'width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,0.22);background:rgba(15,23,42,0.86);color:#f8fafc;font-size:20px;font-weight:900;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.35);backdrop-filter:blur(6px);touch-action:manipulation;user-select:none;';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.type = 'button';
    zoomInBtn.title = 'Perbesar Peta (Zoom In)';
    zoomInBtn.setAttribute('aria-label', 'Perbesar Peta');
    zoomInBtn.textContent = '+';
    zoomInBtn.style.cssText = zoomBtnStyle;
    zoomInBtn.addEventListener('pointerdown', e => e.stopPropagation());
    zoomInBtn.addEventListener('click', e => {
      e.stopPropagation();
      targetCamDist = clampCamDist(targetCamDist - 3.6);
    });

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.type = 'button';
    zoomOutBtn.title = 'Perkecil Peta (Zoom Out)';
    zoomOutBtn.setAttribute('aria-label', 'Perkecil Peta');
    zoomOutBtn.textContent = '−';
    zoomOutBtn.style.cssText = zoomBtnStyle;
    zoomOutBtn.addEventListener('pointerdown', e => e.stopPropagation());
    zoomOutBtn.addEventListener('click', e => {
      e.stopPropagation();
      targetCamDist = clampCamDist(targetCamDist + 3.6);
    });

    zoomBox.appendChild(zoomInBtn);
    zoomBox.appendChild(zoomOutBtn);
    overlayLayer.appendChild(zoomBox);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;';
    containerEl.insertBefore(renderer.domElement, overlayLayer);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(themeScene.skyHex);
    scene.fog = new THREE.FogExp2(themeScene.skyHex, 0.012);

    camera = new THREE.PerspectiveCamera(42, 1, 0.5, 160);
    raycaster = new THREE.Raycaster();
    pointerNDC = new THREE.Vector2();

    setupLights();
    buildArchipelagoAndMonas();
    buildBoardTiles3D();
    bindCameraControls(renderer.domElement);

    winResizeHandler = resize;
    window.addEventListener('resize', winResizeHandler);
    resize();
    startLoop();
  }

  function setupLights() {
    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x1e3a2f, 0.95);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.35);
    sun.position.set(12, 24, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 4;
    sun.shadow.camera.far = 55;
    const d = 14;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
  }

  function buildArchipelagoAndMonas() {
    const seaGeo = new THREE.PlaneGeometry(150, 150, 32, 32);
    seaGeo.rotateX(-Math.PI / 2);
    const seaMat = new THREE.MeshStandardMaterial({
      color: themeScene.seaHex,
      roughness: 0.35,
      metalness: 0.25
    });
    seaMesh = new THREE.Mesh(seaGeo, seaMat);
    seaMesh.position.y = -0.35;
    seaMesh.receiveShadow = true;
    scene.add(seaMesh);

    const islandCoords = [
      { x: -13.5, z: -12.5, r: 2.8 },
      { x: 14.0, z: -11.5, r: 3.1 },
      { x: -14.2, z: 12.0, r: 2.5 },
      { x: 13.8, z: 13.0, r: 2.9 },
      { x: 0, z: -15.5, r: 2.2 }
    ];
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.85 });
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });

    islandCoords.forEach(isl => {
      const grp = new THREE.Group();
      grp.position.set(isl.x, -0.28, isl.z);

      const beach = new THREE.Mesh(new THREE.CylinderGeometry(isl.r * 0.85, isl.r * 1.15, 0.3, 14), sandMat);
      beach.receiveShadow = true;
      grp.add(beach);

      const hill = new THREE.Mesh(new THREE.CylinderGeometry(isl.r * 0.55, isl.r * 0.82, 0.45, 14), grassMat);
      hill.position.y = 0.22;
      hill.receiveShadow = true;
      grp.add(hill);

      for (let t = 0; t < 2; t++) {
        const px = (t === 0 ? -0.45 : 0.5) * (isl.r * 0.45);
        const pz = (t === 0 ? 0.35 : -0.4) * (isl.r * 0.45);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 1.1, 6), trunkMat);
        trunk.position.set(px, 0.85, pz);
        trunk.rotation.z = t === 0 ? 0.14 : -0.14;
        grp.add(trunk);

        const crown = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.6, 7), leafMat);
        crown.position.set(px + (t === 0 ? -0.08 : 0.08), 1.45, pz);
        grp.add(crown);
      }

      scene.add(grp);
    });

    const frameSize = BOARD_SPAN + 0.65;
    frameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(frameSize, 0.42, frameSize),
      new THREE.MeshStandardMaterial({ color: themeScene.frameHex, roughness: 0.65 })
    );
    frameMesh.position.y = -0.18;
    frameMesh.receiveShadow = true;
    scene.add(frameMesh);

    const innerSpan = BOARD_SPAN - CORNER_W * 2;
    centerFieldMesh = new THREE.Mesh(
      new THREE.BoxGeometry(innerSpan, 0.12, innerSpan),
      new THREE.MeshStandardMaterial({ color: themeScene.fieldHex, roughness: 0.8 })
    );
    centerFieldMesh.position.y = 0.02;
    centerFieldMesh.receiveShadow = true;
    scene.add(centerFieldMesh);

    const plazaRing = new THREE.Mesh(
      new THREE.RingGeometry(2.1, 3.6, 32),
      new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.85, side: THREE.DoubleSide })
    );
    plazaRing.rotation.x = -Math.PI / 2;
    plazaRing.position.y = 0.09;
    plazaRing.receiveShadow = true;
    scene.add(plazaRing);

    const monas = new THREE.Group();
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.05 });
    monasFlameMat = new THREE.MeshStandardMaterial({
      color: themeScene.monasFlameHex,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.85
    });

    const baseStep = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 3.0), marbleMat);
    baseStep.position.y = 0.16;
    baseStep.castShadow = true;
    baseStep.receiveShadow = true;
    monas.add(baseStep);

    const cawan = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 0.82, 0.52, 8), marbleMat);
    cawan.rotation.y = Math.PI / 8;
    cawan.position.y = 0.5;
    cawan.castShadow = true;
    monas.add(cawan);

    const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.44, 3.45, 4), marbleMat);
    obelisk.rotation.y = Math.PI / 4;
    obelisk.position.y = 2.45;
    obelisk.castShadow = true;
    monas.add(obelisk);

    const crownDeck = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.18, 0.76), marbleMat);
    crownDeck.position.y = 4.22;
    crownDeck.castShadow = true;
    monas.add(crownDeck);

    const flameBase = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), monasFlameMat);
    flameBase.position.y = 4.46;
    monas.add(flameBase);

    const flameTip = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.62, 10), monasFlameMat);
    flameTip.position.y = 4.78;
    monas.add(flameTip);

    scene.add(monas);

    centerPlaqueCanvas = document.createElement('canvas');
    centerPlaqueCanvas.width = 512;
    centerPlaqueCanvas.height = 160;
    centerPlaqueTex = new THREE.CanvasTexture(centerPlaqueCanvas);
    const plaqueMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 1.75),
      new THREE.MeshBasicMaterial({ map: centerPlaqueTex, transparent: true })
    );
    plaqueMesh.rotation.x = -Math.PI / 2;
    plaqueMesh.position.set(0, 0.11, 4.35);
    scene.add(plaqueMesh);
  }

  function updateCenterPlaque(S) {
    if (!centerPlaqueCanvas || !centerPlaqueTex || !S) return;
    const inflVal = S.infl || 1;
    const sig = `${S.round}|${inflVal.toFixed(2)}|${S.hibah}|${S.suddenDeath}`;
    if (sig === lastPlaqueSig) return;
    lastPlaqueSig = sig;

    const c = centerPlaqueCanvas.getContext('2d');
    c.clearRect(0, 0, 512, 160);
    c.fillStyle = 'rgba(15, 23, 42, 0.85)';
    drawRoundRect(c, 12, 10, 488, 140, 22);
    c.fill();
    c.strokeStyle = S.suddenDeath ? '#ef4444' : '#facc15';
    c.lineWidth = 4;
    c.stroke();

    c.textAlign = 'center';
    c.fillStyle = '#fde047';
    c.font = '800 28px system-ui, sans-serif';
    c.fillText(`PUTARAN ${S.round}  ·  INFLASI ${inflVal.toFixed(2)}x`, 256, 58);

    c.fillStyle = '#34d399';
    c.font = '900 34px system-ui, sans-serif';
    c.fillText(`KAS HIBAH: ${fmtMoney(S.hibah)}`, 256, 114);

    centerPlaqueTex.needsUpdate = true;
  }

  function buildBoardTiles3D() {
    tileGroups = [];
    tileMeshes = [];
    tileCanvases = [];
    tileTextures = [];
    tileSigs = [];
    buildingMeshes = [];
    pawnStamps = [];
    disasterFX = [];

    const sideMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });

    for (let i = 0; i < 40; i++) {
      const box = getTileWorldBox(i);
      const grp = new THREE.Group();
      grp.position.set(box.x, 0.08, box.z);

      const block = new THREE.Mesh(new THREE.BoxGeometry(box.w - 0.04, 0.14, box.d - 0.04), sideMat);
      block.receiveShadow = true;
      block.castShadow = true;
      grp.add(block);

      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 256;
      const tex = new THREE.CanvasTexture(cv);
      tex.anisotropy = 4;

      const topMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65 });
      const topPlane = new THREE.Mesh(new THREE.PlaneGeometry(box.w - 0.05, box.d - 0.05), topMat);
      topPlane.rotation.x = -Math.PI / 2;
      topPlane.position.y = 0.075;
      topPlane.receiveShadow = true;
      topPlane.userData = { tileIdx: i };
      grp.add(topPlane);

      const bldgGrp = new THREE.Group();
      bldgGrp.position.y = 0.08;
      grp.add(bldgGrp);

      const stampCanvas = document.createElement('canvas');
      stampCanvas.width = 256;
      stampCanvas.height = 96;
      const stampTex = new THREE.CanvasTexture(stampCanvas);
      const stampMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(box.w * 0.92, 0.42),
        new THREE.MeshBasicMaterial({ map: stampTex, transparent: true, side: THREE.DoubleSide })
      );
      stampMesh.position.set(0, 0.42, 0);
      stampMesh.rotation.set(-0.45, 0, -0.18);
      stampMesh.visible = false;
      stampMesh.userData = { canvas: stampCanvas, tex: stampTex, lastText: '' };
      grp.add(stampMesh);

      const disGrp = new THREE.Group();
      disGrp.visible = false;
      grp.add(disGrp);

      scene.add(grp);
      tileGroups.push(grp);
      tileMeshes.push(topPlane);
      tileCanvases.push(cv);
      tileTextures.push(tex);
      tileSigs.push('');
      buildingMeshes.push(bldgGrp);
      pawnStamps.push(stampMesh);
      disasterFX.push(disGrp);
    }
  }

  function wrapCanvasText(ctx, text, cx, cy, maxWidth, lineHeight) {
    const words = String(text).split(' ');
    let line = '';
    const lines = [];
    for (let n = 0; n < words.length; n++) {
      const test = line ? `${line} ${words[n]}` : words[n];
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = words[n];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    const startY = cy - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, idx) => ctx.fillText(l, cx, startY + idx * lineHeight));
  }

  function updateTileVisuals(S) {
    for (let i = 0; i < 40; i++) {
      const tile = S.theme.board[i];
      const ts = S.tiles[i];
      const owner = ts.owner ? S.players.find(p => p.id === ts.owner) : null;
      const isDisaster = Boolean(S.disaster && tile.group && S.disaster.groups.includes(tile.group));
      const isHover = hoveredTile === i;
      const priceVal = tile.price > 0 ? getTilePriceSafe(S, i) : 0;
      const rentVal = (tile.price > 0 && ts.owner && ts.mortgaged === 0) ? getRentSafe(S, i) : 0;

      const sig = `${ts.owner || ''}|${owner ? owner.color : ''}|${ts.level}|${ts.mortgaged}|${priceVal}|${rentVal}|${isDisaster}|${isHover}|${themeScene.tileBg}`;
      if (sig !== tileSigs[i]) {
        tileSigs[i] = sig;
        redrawTileTexture(i, S, tile, ts, owner, priceVal, rentVal, isHover);
        rebuildTileBuildings3D(i, ts.level);
        updatePawnStamp3D(i, ts.mortgaged);
      }

      const disGrp = disasterFX[i];
      if (isDisaster) {
        if (!disGrp.visible) {
          disGrp.visible = true;
          buildDisasterMesh(disGrp, i, S.disaster.id);
        }
      } else if (disGrp.visible) {
        disGrp.visible = false;
      }
    }
  }

  function redrawTileTexture(idx, S, tile, ts, owner, priceVal, rentVal, isHover) {
    const cv = tileCanvases[idx];
    const c = cv.getContext('2d');
    const isMort = ts.mortgaged > 0;

    c.fillStyle = isMort ? themeScene.tileMortgagedBg : themeScene.tileBg;
    c.fillRect(0, 0, 256, 256);

    c.strokeStyle = isHover ? '#eab308' : themeScene.tileBorder;
    c.lineWidth = isHover ? 14 : 6;
    c.strokeRect(3, 3, 250, 250);

    if (tile.group && S.theme.groups[tile.group]) {
      c.fillStyle = S.theme.groups[tile.group].color;
      const bar = 44;
      if (idx > 0 && idx < 10) c.fillRect(256 - bar, 0, bar, 256);
      else if (idx > 10 && idx < 20) c.fillRect(0, 256 - bar, 256, bar);
      else if (idx > 20 && idx < 30) c.fillRect(0, 0, bar, 256);
      else if (idx > 30) c.fillRect(0, 0, 256, bar);
    }

    if (owner) {
      c.fillStyle = owner.color;
      const rib = 24;
      if (idx > 0 && idx < 10) c.fillRect(0, 0, rib, 256);
      else if (idx > 10 && idx < 20) c.fillRect(0, 0, 256, rib);
      else if (idx > 20 && idx < 30) c.fillRect(256 - rib, 0, rib, 256);
      else if (idx > 30) c.fillRect(0, 256 - rib, 256, rib);
    }

    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = themeScene.tileText;
    c.font = '800 26px system-ui, sans-serif';
    wrapCanvasText(c, tile.name, 128, 114, 190, 30);

    if (tile.price > 0) {
      c.font = '700 22px system-ui, sans-serif';
      c.fillStyle = owner ? '#38bdf8' : '#64748b';
      const label = owner
        ? (isMort ? 'DIGADAI' : `Sewa ${fmtMoney(rentVal)}`)
        : fmtMoney(priceVal);
      c.fillText(label, 128, 198);
    }
    c.restore();

    tileTextures[idx].needsUpdate = true;
  }

  function rebuildTileBuildings3D(idx, level) {
    const grp = buildingMeshes[idx];
    while (grp.children.length > 0) {
      grp.remove(grp.children[0]);
    }
    if (level <= 0) return;

    let ox = 0;
    let oz = 0;
    if (idx > 0 && idx < 10) ox = 0.35;
    else if (idx > 10 && idx < 20) oz = 0.35;
    else if (idx > 20 && idx < 30) ox = -0.35;
    else if (idx > 30) oz = -0.35;

    if (level === 1) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.32, 0.42),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 })
      );
      wall.position.set(ox, 0.16, oz);
      wall.castShadow = true;
      grp.add(wall);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(0.38, 0.26, 4),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.set(ox, 0.44, oz);
      roof.castShadow = true;
      grp.add(roof);
    } else if (level === 2) {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.68, 0.48),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.45 })
      );
      body.position.set(ox, 0.34, oz);
      body.castShadow = true;
      grp.add(body);

      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.08, 0.56),
        new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 })
      );
      awning.position.set(ox, 0.36, oz);
      grp.add(awning);
    } else if (level >= 3) {
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 1.35, 0.58),
        new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: 0xb45309,
          emissiveIntensity: 0.25,
          metalness: 0.65,
          roughness: 0.25
        })
      );
      tower.position.set(ox, 0.68, oz);
      tower.castShadow = true;
      grp.add(tower);

      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.45, 6),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 0.5 })
      );
      spire.position.set(ox, 1.56, oz);
      grp.add(spire);
    }
  }

  function updatePawnStamp3D(idx, mortgagedRounds) {
    const stamp = pawnStamps[idx];
    if (mortgagedRounds <= 0) {
      stamp.visible = false;
      return;
    }
    stamp.visible = true;
    const label = `🔒 DIGADAI · ${mortgagedRounds}`;
    if (stamp.userData.lastText === label) return;
    stamp.userData.lastText = label;

    const c = stamp.userData.canvas.getContext('2d');
    c.clearRect(0, 0, 256, 96);
    c.fillStyle = 'rgba(185, 28, 28, 0.94)';
    drawRoundRect(c, 8, 12, 240, 72, 14);
    c.fill();
    c.strokeStyle = '#fecaca';
    c.lineWidth = 4;
    c.stroke();

    c.fillStyle = '#ffffff';
    c.font = '900 28px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, 128, 49);
    stamp.userData.tex.needsUpdate = true;
  }

  function buildDisasterMesh(disGrp, idx, disasterId) {
    while (disGrp.children.length > 0) disGrp.remove(disGrp.children[0]);
    const box = getTileWorldBox(idx);
    const isFlood = disasterId === 'banjir';
    const mat = new THREE.MeshStandardMaterial({
      color: isFlood ? 0x0284c7 : 0x57534e,
      transparent: true,
      opacity: 0.55,
      roughness: 0.3
    });
    const overlay = new THREE.Mesh(new THREE.BoxGeometry(box.w - 0.1, isFlood ? 0.22 : 0.35, box.d - 0.1), mat);
    overlay.position.y = 0.18;
    disGrp.add(overlay);
  }

  function createDiceMaterials() {
    const faceValues = [3, 4, 1, 6, 2, 5];
    const pipLayouts = {
      1: [[128, 128]],
      2: [[72, 72], [184, 184]],
      3: [[68, 68], [128, 128], [188, 188]],
      4: [[74, 74], [182, 74], [74, 182], [182, 182]],
      5: [[74, 74], [182, 74], [128, 128], [74, 182], [182, 182]],
      6: [[74, 64], [182, 64], [74, 128], [182, 128], [74, 192], [182, 192]]
    };

    return faceValues.map(val => {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 256;
      const c = cv.getContext('2d');
      c.fillStyle = '#fefce8';
      c.fillRect(0, 0, 256, 256);
      c.strokeStyle = '#ca8a04';
      c.lineWidth = 14;
      c.strokeRect(7, 7, 242, 242);

      c.fillStyle = (val === 1 || val === 6) ? '#dc2626' : '#0f172a';
      pipLayouts[val].forEach(([px, py]) => {
        c.beginPath();
        c.arc(px, py, 22, 0, Math.PI * 2);
        c.fill();
      });

      const tex = new THREE.CanvasTexture(cv);
      return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 });
    });
  }

  function getTargetEulerForFace(val) {
    switch (val) {
      case 1: return { x: 0, z: 0 };
      case 6: return { x: Math.PI, z: 0 };
      case 2: return { x: -Math.PI / 2, z: 0 };
      case 5: return { x: Math.PI / 2, z: 0 };
      case 3: return { x: 0, z: Math.PI / 2 };
      case 4: return { x: 0, z: -Math.PI / 2 };
      default: return { x: 0, z: 0 };
    }
  }

  function spawnDiceThrow3D(diceValues, actorId) {
    if (!scene || !THREE) return;
    diceRigs.forEach(d => scene.remove(d.rig));
    diceRigs = [];

    const mats = createDiceMaterials();
    const actorPos = visualPos[actorId] !== undefined ? getWorldPosAtFloat(visualPos[actorId]) : { x: 0, z: 8 };
    const now = performance.now();
    const powerFactor = 0.75 + (throwPower / 100) * 0.65;

    diceValues.forEach((val, i) => {
      const rig = new THREE.Group();
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.68), mats);
      mesh.castShadow = true;
      rig.add(mesh);

      const offsetSpread = (i - (diceValues.length - 1) / 2) * 1.15;
      const targetPos = {
        x: offsetSpread + (Math.random() - 0.5) * 0.35,
        y: 0.44,
        z: 2.35 + (Math.random() - 0.5) * 0.45
      };

      rig.position.set(actorPos.x * 0.65, 2.2, actorPos.z * 0.65);
      rig.rotation.y = (Math.random() - 0.5) * 1.2;
      scene.add(rig);

      diceRigs.push({
        rig,
        mesh,
        startPos: { x: rig.position.x, y: rig.position.y, z: rig.position.z },
        targetPos,
        targetEuler: getTargetEulerForFace(val),
        peakHeight: 3.4 * powerFactor,
        born: now,
        dur: 850
      });
    });

    // 850ms animasi dadu + 700ms jeda agar angka dadu terbaca jelas sebelum kamera berpindah ke karakter
    diceFocusUntil = now + 1550;
  }

  function ensurePawns3D(S) {
    if (!scene || !THREE) return;
    const activeIds = new Set(S.players.map(p => p.id));
    Object.keys(pawnGroups).forEach(pid => {
      if (!activeIds.has(pid)) {
        if (pawnGroups[pid]) scene.remove(pawnGroups[pid]);
        delete pawnGroups[pid];
        delete pawnRings[pid];
      }
    });

    S.players.forEach(p => {
      if (p.bankrupt) {
        if (pawnGroups[p.id]) pawnGroups[p.id].visible = false;
        return;
      }

      if (!pawnGroups[p.id] || pawnGroups[p.id].parent !== scene) {
        const grp = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(p.color || '#ef4444'),
          roughness: 0.35,
          metalness: 0.2
        });
        const trimMat = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.4
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.22, 16), mat);
        base.position.y = 0.11;
        base.castShadow = true;
        grp.add(base);

        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 16), trimMat);
        collar.position.y = 0.23;
        grp.add(collar);

        const body = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 16), mat);
        body.position.y = 0.52;
        body.castShadow = true;
        grp.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 14), mat);
        head.position.y = 0.9;
        head.castShadow = true;
        grp.add(head);

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.36, 0.49, 24),
          new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.03;
        ring.visible = false;
        grp.add(ring);

        scene.add(grp);
        pawnGroups[p.id] = grp;
        pawnRings[p.id] = ring;
      }
      pawnGroups[p.id].visible = true;
    });
  }

  function syncState(S) {
    if (!S) return;
    latestState = S;

    if (!THREE) {
      syncFallback2D(S);
      return;
    }

    for (const p of S.players) {
      const safePos = Number.isFinite(p.pos) ? p.pos : 0;
      if (!Number.isFinite(visualPos[p.id])) {
        visualPos[p.id] = safePos;
        hopPhase[p.id] = 0;
      }
    }

    ensurePawns3D(S);
    updateCenterPlaque(S);
    updateTileVisuals(S);

    if (S.evSeq !== lastProcessedSeq && Array.isArray(S.ev)) {
      lastProcessedSeq = S.evSeq;
      const now = performance.now();
      const hasDice = S.ev.some(e => e.k === 'dice');
      const moveEv = S.ev.find(e => e.k === 'move');
      const steps = moveEv ? Math.abs(Number(moveEv.steps) || 0) : 0;
      const cashDelay = hasDice ? (2300 + Math.min(12, steps) * 125) : 550;

      for (const ev of S.ev) {
        if (ev.k === 'dice') {
          spawnDiceThrow3D(ev.dice, ev.pid);
          // 1550ms fokus dadu + 700ms kamera berpindah ke karakter = 2250ms sebelum karakter jalan
          pawnMoveDelayUntil[ev.pid] = now + 2250;
        } else if (ev.k === 'move' && !hasDice) {
          pawnMoveDelayUntil[ev.pid] = Math.max(pawnMoveDelayUntil[ev.pid] || 0, now + 500);
        } else if (ev.k === 'cash' && ev.a !== 0) {
          spawnFloatingMoneyLabel(ev.pid, ev.a, ev.w, now, cashDelay);
        }
      }
    }
  }

  function spawnFloatingMoneyLabel(pid, amount, reason, now, delayMs) {
    if (!overlayLayer) return;
    const sign = amount > 0 ? '+' : '';
    const el = document.createElement('div');
    el.className = 'kp-float-cash';
    el.style.color = amount > 0 ? '#4ade80' : '#f87171';
    el.style.opacity = '0';
    el.textContent = `${sign}${fmtMoney(amount)} ${reason || ''}`.trim();
    overlayLayer.appendChild(el);

    floatLabels.push({ pid, el, born: now + (delayMs || 0), dur: 2800 });
  }

  function bindCameraControls(domEl) {
    domEl.addEventListener('pointerdown', e => {
      if (e.isPrimary === false) return;
      isDragging = true;
      dragMoved = 0;
      dragStart = { x: e.clientX, y: e.clientY };
    });

    winMoveHandler = e => {
      if (!renderer || !camera) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging && pinchStartDist === 0) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        dragMoved += Math.hypot(dx, dy);
        dragStart = { x: e.clientX, y: e.clientY };
        camYaw -= dx * 0.0065;
        camPitch = Math.max(0.38, Math.min(1.38, camPitch + dy * 0.0055));
      }
    };
    window.addEventListener('pointermove', winMoveHandler);

    winUpHandler = () => {
      if (isDragging && pinchStartDist === 0 && dragMoved < 6 && hoveredTile !== -1 && onTileClickCb) {
        onTileClickCb(hoveredTile);
      }
      isDragging = false;
    };
    window.addEventListener('pointerup', winUpHandler);

    domEl.addEventListener('wheel', e => {
      e.preventDefault();
      targetCamDist = clampCamDist(targetCamDist + e.deltaY * 0.015);
    }, { passive: false });

    domEl.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDist = Math.hypot(dx, dy);
        pinchStartCamDist = targetCamDist;
      }
    }, { passive: true });

    domEl.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && pinchStartDist > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = pinchStartDist / Math.max(10, dist);
        targetCamDist = clampCamDist(pinchStartCamDist * ratio);
      }
    }, { passive: false });

    domEl.addEventListener('touchend', e => {
      if (e.touches.length < 2) {
        pinchStartDist = 0;
      }
    }, { passive: true });
  }

  function updateRaycastHover() {
    if (!raycaster || !camera || tileMeshes.length === 0 || isDragging) return;
    raycaster.setFromCamera(pointerNDC, camera);
    const hits = raycaster.intersectObjects(tileMeshes, false);
    const hitIdx = hits.length > 0 ? hits[0].object.userData.tileIdx : -1;
    if (hitIdx !== hoveredTile) {
      hoveredTile = hitIdx;
      renderer.domElement.style.cursor = hitIdx !== -1 ? 'pointer' : 'grab';
      if (latestState) updateTileVisuals(latestState);
    }
  }

  function startLoop() {
    function tick(now) {
      rafId = requestAnimationFrame(tick);
      if (!renderer || !scene || !camera) return;

      if (seaMesh) {
        seaMesh.position.y = -0.35 + Math.sin(now * 0.0016) * 0.04;
      }

      camDist += (targetCamDist - camDist) * 0.16;

      diceRigs.forEach(d => {
        const t = Math.min(1, (now - d.born) / d.dur);
        const ease = 1 - Math.pow(1 - t, 3);
        d.rig.position.x = d.startPos.x + (d.targetPos.x - d.startPos.x) * ease;
        d.rig.position.z = d.startPos.z + (d.targetPos.z - d.startPos.z) * ease;

        const arc = Math.sin(t * Math.PI) * d.peakHeight;
        const bounce = t > 0.75 ? Math.abs(Math.sin(((t - 0.75) / 0.25) * Math.PI)) * 0.35 : 0;
        d.rig.position.y = d.startPos.y * (1 - ease) + d.targetPos.y * ease + arc + bounce;

        if (t < 1) {
          const spinLeft = (1 - ease) * Math.PI * 6;
          d.mesh.rotation.x = d.targetEuler.x + spinLeft;
          d.mesh.rotation.z = d.targetEuler.z + spinLeft * 0.7;
        } else {
          d.mesh.rotation.x = d.targetEuler.x;
          d.mesh.rotation.z = d.targetEuler.z;
        }
      });

      const tokenOffsets = [
        { dx: -0.26, dz: -0.26 },
        { dx: 0.26, dz: -0.26 },
        { dx: -0.26, dz: 0.26 },
        { dx: 0.26, dz: 0.26 }
      ];

      let activeWorldPos = { x: 0, z: 0 };
      if (latestState) {
        const activePlayer = latestState.players[latestState.turnIdx];
        latestState.players.forEach((p, idx) => {
          if (p.bankrupt || !pawnGroups[p.id]) return;
          const targetPos = Number.isFinite(p.pos) ? p.pos : 0;
          const cur = Number.isFinite(visualPos[p.id]) ? visualPos[p.id] : targetPos;
          let diff = targetPos - cur;
          if (diff < -20) diff += 40;
          if (diff > 20) diff -= 40;

          const delayUntil = pawnMoveDelayUntil[p.id] || 0;
          const waitingForCamera = now < delayUntil;

          let hopY = 0;
          if (waitingForCamera || Math.abs(diff) < 0.03) {
            if (!waitingForCamera) {
              visualPos[p.id] = targetPos;
            }
            hopPhase[p.id] = 0;
          } else {
            const step = Math.sign(diff) * Math.min(Math.abs(diff), 0.145);
            visualPos[p.id] = (cur + step + 40) % 40;
            hopPhase[p.id] = (hopPhase[p.id] || 0) + 0.42;
            hopY = Math.abs(Math.sin(hopPhase[p.id])) * 0.58;
          }

          const wp = getWorldPosAtFloat(visualPos[p.id]);
          const off = tokenOffsets[idx % 4];
          const grp = pawnGroups[p.id];
          grp.position.set(wp.x + off.dx, 0.16 + hopY, wp.z + off.dz);

          const isTurn = activePlayer && activePlayer.id === p.id;
          if (pawnRings[p.id]) {
            pawnRings[p.id].visible = isTurn;
            if (isTurn) {
              const s = 1 + Math.sin(now * 0.008) * 0.12;
              pawnRings[p.id].scale.set(s, s, 1);
              activeWorldPos = { x: wp.x, z: wp.z };
            }
          }
        });
      }

      const wantTarget = (cameraMode === 'follow' && now > diceFocusUntil)
        ? { x: activeWorldPos.x * 0.58, y: 0.4, z: activeWorldPos.z * 0.58 }
        : { x: 0, y: 0.4, z: 0.6 };

      const camLerp = (cameraMode === 'follow' && now > diceFocusUntil) ? 0.11 : 0.08;
      camTarget.x += (wantTarget.x - camTarget.x) * camLerp;
      camTarget.y += (wantTarget.y - camTarget.y) * camLerp;
      camTarget.z += (wantTarget.z - camTarget.z) * camLerp;

      const horizR = Math.cos(camPitch) * camDist;
      const camY = Math.sin(camPitch) * camDist;
      camera.position.set(
        camTarget.x + Math.sin(camYaw) * horizR,
        camTarget.y + camY,
        camTarget.z + Math.cos(camYaw) * horizR
      );
      camera.lookAt(camTarget.x, camTarget.y, camTarget.z);

      if (overlayLayer && latestState) {
        const w = containerEl.clientWidth;
        const h = containerEl.clientHeight;
        floatLabels = floatLabels.filter((fl, idx) => {
          const age = now - fl.born;
          if (age < 0) {
            fl.el.style.opacity = '0';
            return true;
          }
          if (age >= fl.dur) {
            fl.el.remove();
            return false;
          }
          const grp = pawnGroups[fl.pid];
          if (!grp) return true;
          const progress = age / fl.dur;
          const proj = new THREE.Vector3(grp.position.x, grp.position.y + 1.35 + progress * 1.4, grp.position.z);
          proj.project(camera);
          const sx = (proj.x * 0.5 + 0.5) * w;
          const sy = (-proj.y * 0.5 + 0.5) * h - idx * 14;
          fl.el.style.transform = `translate(-50%, -50%) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
          fl.el.style.opacity = String(Math.max(0, 1 - progress * 0.85));
          return true;
        });
      }

      updateRaycastHover();
      renderer.render(scene, camera);
    }

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function resize() {
    if (!containerEl) return;
    if (!THREE || !renderer || !camera) {
      resizeFallback2D();
      return;
    }
    const w = Math.max(300, containerEl.clientWidth);
    const h = Math.max(260, containerEl.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function setThrowPower(val) {
    throwPower = Math.max(15, Math.min(100, Number(val) || 55));
  }

  let fbCanvas = null;
  let fbCtx = null;

  function initFallback2D(container) {
    fbCanvas = document.createElement('canvas');
    fbCanvas.style.cssText = 'width:100%;height:100%;display:block;';
    container.appendChild(fbCanvas);
    fbCtx = fbCanvas.getContext('2d');
    winResizeHandler = resizeFallback2D;
    window.addEventListener('resize', winResizeHandler);
    resizeFallback2D();
  }

  function resizeFallback2D() {
    if (!containerEl || !fbCanvas) return;
    fbCanvas.width = Math.max(300, containerEl.clientWidth);
    fbCanvas.height = Math.max(260, containerEl.clientHeight);
    if (latestState) syncFallback2D(latestState);
  }

  function syncFallback2D(S) {
    if (!fbCtx || !fbCanvas) return;
    const w = fbCanvas.width;
    const h = fbCanvas.height;
    fbCtx.fillStyle = '#071526';
    fbCtx.fillRect(0, 0, w, h);
    fbCtx.fillStyle = '#facc15';
    fbCtx.font = '800 18px system-ui, sans-serif';
    fbCtx.textAlign = 'center';
    fbCtx.fillText(`KONOHAPOLY (Mode Offline 2D) · Putaran ${S.round}`, w / 2, h / 2 - 12);
    fbCtx.fillStyle = '#94a3b8';
    fbCtx.font = '500 13px system-ui, sans-serif';
    fbCtx.fillText('Hubungkan ke internet untuk memuat papan 3D Three.js.', w / 2, h / 2 + 14);
  }

  return {
    init,
    resize,
    syncState,
    setThrowPower,
    applyTheme
  };
}));
