/**
 * Konohapoly - 3D Scene Engine (Three.js)
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
    this.buildingsMesh = {}; // tileId -> mesh
    this.diceMeshes = [];
    
    this.cameraMode = 'follow'; // 'follow' | 'overview'
    this.targetCameraPos = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();
    this.activePawnPos = new THREE.Vector3();
    
    this.isRollingDice = false;
    this.diceAnimTime = 0;
    this.targetD1 = 1;
    this.targetD2 = 1;

    this.init();
  }

  init() {
    // 1. Setup Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1a1c23');
    this.scene.fog = new THREE.FogExp2('#1a1c23', 0.012);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(24, width / height, 0.1, 1000);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#fff0dd', 1.5);
    dirLight.position.set(30, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 120;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    this.scene.add(dirLight);

    // 3. World & Environment
    this.createArchipelago();
    this.createBoard();
    this.createPawns();
    this.create3DDice();

    // 4. Resize Listener
    window.addEventListener('resize', () => this.onWindowResize());

    // 5. Render Loop
    this.animate();
  }

  createArchipelago() {
    // Air Laut
    const seaGeo = new THREE.PlaneGeometry(300, 300);
    const seaMat = new THREE.MeshStandardMaterial({ color: '#004f77', roughness: 0.1, metalness: 0.1 });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -1.2;
    this.scene.add(sea);

    // Pulau Utama Tengah
    const islandGeo = new THREE.BoxGeometry(34, 1, 34);
    const islandMat = new THREE.MeshStandardMaterial({ color: '#2b580c', roughness: 0.8 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -0.5;
    island.receiveShadow = true;
    this.scene.add(island);

    // Monas Mini di Tengah Papan
    const monasGroup = new THREE.Group();
    const baseGeo = new THREE.BoxGeometry(3, 0.6, 3);
    const baseMat = new THREE.MeshStandardMaterial({ color: '#e0e0e0' });
    const base = new THREE.Mesh(baseGeo, baseMat);

    const towerGeo = new THREE.CylinderGeometry(0.2, 0.4, 5, 8);
    const tower = new THREE.Mesh(towerGeo, baseMat);
    tower.position.y = 2.8;

    const goldGeo = new THREE.ConeGeometry(0.3, 0.8, 8);
    const goldMat = new THREE.MeshStandardMaterial({ color: '#f2b705', metalness: 0.8, roughness: 0.2 });
    const gold = new THREE.Mesh(goldGeo, goldMat);
    gold.position.y = 5.5;

    monasGroup.add(base, tower, gold);
    monasGroup.position.set(0, 0, 0);
    this.scene.add(monasGroup);
  }

  getTilePosition(index) {
    // Papan 11 x 11 petak (0 s/d 39 searah jarum jam, START di kiri-bawah (-13, 13))
    const size = 11;
    const spacing = 2.6;
    const half = (size - 1) / 2; // 5
    
    let x = 0, z = 0;
    if (index >= 0 && index <= 10) {
      x = -half * spacing;
      z = (half - index) * spacing;
    } else if (index > 10 && index <= 20) {
      x = (-half + (index - 10)) * spacing;
      z = -half * spacing;
    } else if (index > 20 && index <= 30) {
      x = half * spacing;
      z = (-half + (index - 20)) * spacing;
    } else {
      x = (half - (index - 30)) * spacing;
      z = half * spacing;
    }
    return { x, y: 0, z };
  }

  createBoard() {
    const tileGeo = new THREE.BoxGeometry(2.4, 0.4, 2.4);

    BOARD.forEach((tile) => {
      const pos = this.getTilePosition(tile.id);
      
      let color = '#d3c399'; // Krem dasar
      if (tile.type === 'prop' && tile.group && GROUPS[tile.group]) {
        color = GROUPS[tile.group].color;
      } else if (tile.type === 'trans') color = '#333333';
      else if (tile.type === 'start') color = '#22a55b';
      else if (tile.type === 'ciduk' || tile.type === 'jail') color = '#e63946';

      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
      const mesh = new THREE.Mesh(tileGeo, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
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
      const bodyGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.2, 16);
      const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
      
      const mat = new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.2 });
      
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.6;
      body.castShadow = true;

      const head = new THREE.Mesh(headGeo, mat);
      head.position.y = 1.3;
      head.castShadow = true;

      group.add(body, head);
      
      const startPos = this.getTilePosition(0);
      group.position.set(startPos.x + (i % 2) * 0.6 - 0.3, 0.2, startPos.z + Math.floor(i / 2) * 0.6 - 0.3);
      
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
      dice.position.set(i === 0 ? -1.2 : 1.2, 3, 0);
      dice.visible = false;
      this.scene.add(dice);
      this.diceMeshes.push(dice);
    }
  }

  triggerDiceRoll(d1, d2) {
    this.targetD1 = d1;
    this.targetD2 = d2;
    this.isRollingDice = true;
    this.diceAnimTime = 0;

    this.diceMeshes.forEach((d, idx) => {
      d.visible = true;
      d.position.set(idx === 0 ? -1.5 : 1.5, 4, 0);
    });
  }

  updateBuildings(propsState) {
    Object.keys(propsState).forEach((tileId) => {
      const pData = propsState[tileId];
      const pos = this.getTilePosition(Number(tileId));

      // Hapus bangunan lama jika ada
      if (this.buildingsMesh[tileId]) {
        this.scene.remove(this.buildingsMesh[tileId]);
        delete this.buildingsMesh[tileId];
      }

      if (pData.lvl > 0 && !pData.mortgaged) {
        const bGroup = new THREE.Group();
        let bGeo, bMat;

        if (pData.lvl === 1) { // Rumah
          bGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
          bMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.y = 0.6;
          bMesh.castShadow = true;
          bGroup.add(bMesh);
        } else if (pData.lvl === 2) { // Ruko
          bGeo = new THREE.BoxGeometry(0.9, 1.6, 0.9);
          bMat = new THREE.MeshStandardMaterial({ color: '#415a77' });
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.y = 1.0;
          bMesh.castShadow = true;
          bGroup.add(bMesh);
        } else if (pData.lvl === 3) { // Landmark
          bGeo = new THREE.CylinderGeometry(0.3, 0.7, 2.4, 8);
          bMat = new THREE.MeshStandardMaterial({ color: '#f2b705', metalness: 0.6 });
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.y = 1.4;
          bMesh.castShadow = true;
          bGroup.add(bMesh);
        }

        bGroup.position.set(pos.x, 0, pos.z);
        this.scene.add(bGroup);
        this.buildingsMesh[tileId] = bGroup;
      }

      // Visual Gadai (Abu-abu)
      const tileMesh = this.tilesMesh.find(t => t.id === Number(tileId));
      if (tileMesh) {
        if (pData.mortgaged) {
          tileMesh.mesh.material.color.set('#555555');
        } else {
          tileMesh.mesh.material.color.set(tileMesh.defaultColor);
        }
      }
    });
  }

  updateState(gameState) {
    if (!gameState) return;

    // Update Posisi Bidak
    gameState.players.forEach((p, idx) => {
      const pawnMesh = this.pawnsMesh[idx];
      if (!pawnMesh) return;

      if (p.isBankrupt) {
        pawnMesh.visible = false;
        return;
      }

      pawnMesh.visible = true;
      const pos = this.getTilePosition(p.pos);
      
      // Offset kecil antar bidak di petak yang sama
      const offsetX = (idx % 2) * 0.6 - 0.3;
      const offsetZ = Math.floor(idx / 2) * 0.6 - 0.3;
      
      // Interpolasi Pergerakan Bidak
      pawnMesh.position.x += (pos.x + offsetX - pawnMesh.position.x) * 0.2;
      pawnMesh.position.z += (pos.z + offsetZ - pawnMesh.position.z) * 0.2;

      // Bidak Aktif untuk Fokus Kamera
      if (idx === gameState.turnIdx) {
        this.activePawnPos.set(pos.x, pos.y, pos.z);
      }
    });

    // Update Bangunan
    this.updateBuildings(gameState.props);
  }

  toggleCameraMode() {
    this.cameraMode = this.cameraMode === 'follow' ? 'overview' : 'follow';
    return this.cameraMode;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // 1. Animasi Dadu 3D
    if (this.isRollingDice) {
      this.diceAnimTime += 0.05;
      this.diceMeshes.forEach((d) => {
        d.rotation.x += 0.3;
        d.rotation.y += 0.4;
        d.position.y = 2 + Math.abs(Math.sin(this.diceAnimTime * 5)) * 2;
      });

      if (this.diceAnimTime > 1.5) {
        this.isRollingDice = false;
        this.diceMeshes.forEach((d) => {
          d.rotation.set(0, 0, 0);
          d.position.y = 1.2;
        });
        setTimeout(() => {
          this.diceMeshes.forEach(d => d.visible = false);
        }, 1000);
      }
    }

    // 2. Pergerakan Kamera
    if (this.cameraMode === 'follow') {
      this.targetCameraPos.set(this.activePawnPos.x + 18, 22, this.activePawnPos.z + 24);
      this.targetLookAt.copy(this.activePawnPos);
    } else {
      this.targetCameraPos.set(0, 42, 38);
      this.targetLookAt.set(0, 0, 0);
    }

    this.camera.position.lerp(this.targetCameraPos, 0.05);
    this.camera.lookAt(this.targetLookAt);

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
