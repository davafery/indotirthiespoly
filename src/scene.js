/**
 * Konohapoly - 3D Scene Engine (Smooth Step Hop, Accurate Alignment & Responsive Camera)
 */
import * as THREE from 'three';
import { BOARD, GROUPS } from './engine.js';

export class GameScene {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.tilesMesh = [];
    this.pawnsMesh = [];
    this.buildingsMesh = {};
    this.diceMeshes = [];

    // State Animasi Bidak Per Pemain
    this.pawnsData = Array.from({ length: 4 }, () => ({
      currentTile: 0,
      targetTile: 0,
      animProgress: 1.0, // 1.0 = Selesai animasi
      pos: new THREE.Vector3(),
      targetPos: new THREE.Vector3()
    }));

    this.cameraMode = 'follow'; // 'follow' | 'overview'
    this.targetCameraPos = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();
    this.activePawnPos = new THREE.Vector3();

    this.isRollingDice = false;
    this.diceAnimTime = 0;

    this.init();
  }

  init() {
    // 1. Setup Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#121318');
    this.scene.fog = new THREE.FogExp2('#121318', 0.008);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#fff4e0', 1.6);
    dirLight.position.set(30, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 120;
    dirLight.shadow.camera.left = -35;
    dirLight.shadow.camera.right = 35;
    dirLight.shadow.camera.top = 35;
    dirLight.shadow.camera.bottom = -35;
    this.scene.add(dirLight);

    // 3. World & Environment
    this.createArchipelago();
    this.createBoard();
    this.createPawns();
    this.create3DDice();

    // 4. Resize Listener
    window.addEventListener('resize', () => this.onWindowResize());
    this.updateCameraViewport();

    // 5. Render Loop
    this.animate();
  }

  createArchipelago() {
    // Air Laut
    const seaGeo = new THREE.PlaneGeometry(350, 350);
    const seaMat = new THREE.MeshStandardMaterial({ color: '#003d5c', roughness: 0.1, metalness: 0.2 });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -1.2;
    this.scene.add(sea);

    // Pulau Utama
    const islandGeo = new THREE.BoxGeometry(36, 1, 36);
    const islandMat = new THREE.MeshStandardMaterial({ color: '#274e13', roughness: 0.8 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -0.5;
    island.receiveShadow = true;
    this.scene.add(island);

    // Monas Mini di Tengah Papan
    const monasGroup = new THREE.Group();
    const baseGeo = new THREE.BoxGeometry(3.2, 0.6, 3.2);
    const baseMat = new THREE.MeshStandardMaterial({ color: '#e0e0e0' });
    const base = new THREE.Mesh(baseGeo, baseMat);

    const towerGeo = new THREE.CylinderGeometry(0.25, 0.45, 5.5, 8);
    const tower = new THREE.Mesh(towerGeo, baseMat);
    tower.position.y = 3.0;

    const goldGeo = new THREE.ConeGeometry(0.35, 0.9, 8);
    const goldMat = new THREE.MeshStandardMaterial({ color: '#f2b705', metalness: 0.8, roughness: 0.2 });
    const gold = new THREE.Mesh(goldGeo, goldMat);
    gold.position.y = 6.0;

    monasGroup.add(base, tower, gold);
    monasGroup.position.set(0, 0, 0);
    this.scene.add(monasGroup);
  }

  getTilePosition(index) {
    // Papan 11 x 11 petak (0 s/d 39, Searah Jarum Jam)
    const size = 11;
    const spacing = 2.8;
    const half = (size - 1) / 2; // 5

    let x = 0, z = 0;
    if (index >= 0 && index <= 10) { // Sisi Kiri (Bottom-Left ke Top-Left)
      x = -half * spacing;
      z = (half - index) * spacing;
    } else if (index > 10 && index <= 20) { // Sisi Atas (Top-Left ke Top-Right)
      x = (-half + (index - 10)) * spacing;
      z = -half * spacing;
    } else if (index > 20 && index <= 30) { // Sisi Kanan (Top-Right ke Bottom-Right)
      x = half * spacing;
      z = (-half + (index - 20)) * spacing;
    } else { // Sisi Bawah (Bottom-Right ke Bottom-Left)
      x = (half - (index - 30)) * spacing;
      z = half * spacing;
    }
    return new THREE.Vector3(x, 0.2, z);
  }

  getPawnOffsetPosition(tileIdx, playerIdx) {
    const basePos = this.getTilePosition(tileIdx);
    // Presisi offset 2x2 grid di dalam petak
    const offsetX = (playerIdx % 2 === 0 ? -0.45 : 0.45);
    const offsetZ = (playerIdx < 2 ? -0.45 : 0.45);
    return new THREE.Vector3(basePos.x + offsetX, basePos.y, basePos.z + offsetZ);
  }

  createBoard() {
    const tileGeo = new THREE.BoxGeometry(2.6, 0.4, 2.6);

    BOARD.forEach((tile) => {
      const pos = this.getTilePosition(tile.id);

      let color = '#d8c596';
      if (tile.type === 'prop' && tile.group && GROUPS[tile.group]) {
        color = GROUPS[tile.group].color;
      } else if (tile.type === 'trans') color = '#2c2c34';
      else if (tile.type === 'start') color = '#22a55b';
      else if (tile.type === 'ciduk' || tile.type === 'jail') color = '#e63946';

      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
      const mesh = new THREE.Mesh(tileGeo, mat);
      mesh.position.set(pos.x, 0, pos.z);
      mesh.receiveShadow = true;
      mesh.castShadow = true;

      this.scene.add(mesh);
      this.tilesMesh.push({ id: tile.id, mesh, defaultColor: color });
    });
  }

  createPawns() {
    const colors = ['#e63946', '#1d8cf0', '#f2b705', '#22a55b'];

    for (let i = 0; i < 4; i++) {
      const group = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(0.28, 0.45, 1.1, 16);
      const headGeo = new THREE.SphereGeometry(0.32, 16, 16);

      const mat = new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.2, metalness: 0.1 });

      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.55;
      body.castShadow = true;

      const head = new THREE.Mesh(headGeo, mat);
      head.position.y = 1.25;
      head.castShadow = true;

      group.add(body, head);

      const startPos = this.getPawnOffsetPosition(0, i);
      group.position.copy(startPos);

      this.pawnsData[i].pos.copy(startPos);
      this.pawnsData[i].targetPos.copy(startPos);

      this.scene.add(group);
      this.pawnsMesh.push(group);
    }
  }

  create3DDice() {
    const diceGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const diceMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 });

    for (let i = 0; i < 2; i++) {
      const dice = new THREE.Mesh(diceGeo, diceMat);
      dice.castShadow = true;
      dice.position.set(i === 0 ? -1.5 : 1.5, 4, 0);
      dice.visible = false;
      this.scene.add(dice);
      this.diceMeshes.push(dice);
    }
  }

  triggerDiceRoll(d1, d2) {
    this.isRollingDice = true;
    this.diceAnimTime = 0;

    this.diceMeshes.forEach((d, idx) => {
      d.visible = true;
      d.position.set(idx === 0 ? -1.8 : 1.8, 5, 0);
    });
  }

  updateBuildings(propsState) {
    Object.keys(propsState).forEach((tileId) => {
      const pData = propsState[tileId];
      const pos = this.getTilePosition(Number(tileId));

      if (this.buildingsMesh[tileId]) {
        this.scene.remove(this.buildingsMesh[tileId]);
        delete this.buildingsMesh[tileId];
      }

      if (pData.lvl > 0 && !pData.mortgaged) {
        const bGroup = new THREE.Group();
        let bGeo, bMat;

        if (pData.lvl === 1) { // Rumah
          bGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
          bMat = new THREE.MeshStandardMaterial({ color: '#f8f9fa' });
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.y = 0.62;
          bMesh.castShadow = true;
          bGroup.add(bMesh);
        } else if (pData.lvl === 2) { // Ruko
          bGeo = new THREE.BoxGeometry(0.95, 1.7, 0.95);
          bMat = new THREE.MeshStandardMaterial({ color: '#343a40' });
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.y = 1.05;
          bMesh.castShadow = true;
          bGroup.add(bMesh);
        } else if (pData.lvl === 3) { // Landmark
          bGeo = new THREE.CylinderGeometry(0.35, 0.75, 2.6, 8);
          bMat = new THREE.MeshStandardMaterial({ color: '#f2b705', metalness: 0.7, roughness: 0.3 });
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.y = 1.5;
          bMesh.castShadow = true;
          bGroup.add(bMesh);
        }

        bGroup.position.set(pos.x, 0, pos.z);
        this.scene.add(bGroup);
        this.buildingsMesh[tileId] = bGroup;
      }

      const tileMesh = this.tilesMesh.find(t => t.id === Number(tileId));
      if (tileMesh) {
        if (pData.mortgaged) {
          tileMesh.mesh.material.color.set('#444444');
        } else {
          tileMesh.mesh.material.color.set(tileMesh.defaultColor);
        }
      }
    });
  }

  updateState(gameState) {
    if (!gameState) return;

    gameState.players.forEach((p, idx) => {
      const pawnMesh = this.pawnsMesh[idx];
      const pData = this.pawnsData[idx];

      if (!pawnMesh) return;

      if (p.isBankrupt) {
        pawnMesh.visible = false;
        return;
      }

      pawnMesh.visible = true;

      // Cek apakah posisi petak berubah
      if (pData.targetTile !== p.pos) {
        pData.currentTile = pData.targetTile;
        pData.targetTile = p.pos;
        pData.animProgress = 0.0; // Reset progress untuk animasi melompat
      }

      if (idx === gameState.turnIdx) {
        this.activePawnPos.copy(pawnMesh.position);
      }
    });

    this.updateBuildings(gameState.props);
  }

  toggleCameraMode() {
    this.cameraMode = this.cameraMode === 'follow' ? 'overview' : 'follow';
    this.updateCameraViewport();
    return this.cameraMode;
  }

  updateCameraViewport() {
    const aspect = (this.container.clientWidth || window.innerWidth) / (this.container.clientHeight || window.innerHeight);

    // Sesuaikan Jarak Kamera Full Map berdasarkan Layar HP / Desktop
    if (this.cameraMode === 'overview') {
      const distMult = aspect < 1 ? 1.6 : 1.0; // Zoom out lebih jauh jika di layar HP Portrait
      this.targetCameraPos.set(0, 48 * distMult, 42 * distMult);
      this.targetLookAt.set(0, 0, 0);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // 1. Smooth Step-by-Step Hop Movement Bidak
    this.pawnsData.forEach((pData, idx) => {
      const pawnMesh = this.pawnsMesh[idx];
      if (!pawnMesh) return;

      if (pData.animProgress < 1.0) {
        pData.animProgress += 0.04; // Kecepatan Animasi Langkah
        if (pData.animProgress > 1.0) pData.animProgress = 1.0;

        const startPos = this.getPawnOffsetPosition(pData.currentTile, idx);
        const endPos = this.getPawnOffsetPosition(pData.targetTile, idx);

        // Interpolasi Linear (X & Z) + Kurva Parabola Lompatan (Y)
        pawnMesh.position.x = THREE.MathUtils.lerp(startPos.x, endPos.x, pData.animProgress);
        pawnMesh.position.z = THREE.MathUtils.lerp(startPos.z, endPos.z, pData.animProgress);

        const hopHeight = Math.sin(pData.animProgress * Math.PI) * 1.2;
        pawnMesh.position.y = THREE.MathUtils.lerp(startPos.y, endPos.y, pData.animProgress) + hopHeight;
      } else {
        // Kunci posisi akhir di atas petak
        const finalPos = this.getPawnOffsetPosition(pData.targetTile, idx);
        pawnMesh.position.copy(finalPos);
      }
    });

    // 2. Animasi Dadu 3D
    if (this.isRollingDice) {
      this.diceAnimTime += 0.05;
      this.diceMeshes.forEach((d) => {
        d.rotation.x += 0.35;
        d.rotation.y += 0.45;
        d.position.y = 2.5 + Math.abs(Math.sin(this.diceAnimTime * 6)) * 2.5;
      });

      if (this.diceAnimTime > 1.2) {
        this.isRollingDice = false;
        this.diceMeshes.forEach((d) => {
          d.rotation.set(0, 0, 0);
          d.position.y = 1.2;
        });
        setTimeout(() => {
          this.diceMeshes.forEach(d => d.visible = false);
        }, 800);
      }
    }

    // 3. Pergerakan Kamera Smooth
    if (this.cameraMode === 'follow') {
      this.targetCameraPos.set(this.activePawnPos.x + 16, 20, this.activePawnPos.z + 22);
      this.targetLookAt.copy(this.activePawnPos);
    } else {
      this.updateCameraViewport();
    }

    this.camera.position.lerp(this.targetCameraPos, 0.06);
    this.camera.lookAt(this.targetLookAt);

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.updateCameraViewport();
  }
}
