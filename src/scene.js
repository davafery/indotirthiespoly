/**
 * Konohapoly - 3D Scene Engine using Three.js
 */
import * as THREE from 'three';
import { BOARD, GROUPS } from './engine.js';

export class GameScene {
  constructor(containerEl) {
    this.container = containerEl;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.tileMeshes = [];
    this.playerTokens = [];
    this.buildingMeshes = {};
    
    // Camera follow state
    this.followTarget = null;
    this.isFollowing = true;
    this.userInteractedTimer = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 500;

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Gradasi langit
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

    // 2. Camera Setup (Perspective FOV 24, Isometric Look)
    this.camera = new THREE.PerspectiveCamera(24, width / height, 0.1, 1000);
    this.camera.position.set(35, 45, 55);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
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

    // 5. Environment & Papan Game
    this.createEnvironment();
    this.createBoard();

    // 6. Resize Handler
    window.addEventListener('resize', () => this.onWindowResize());

    // 7. Render Loop
    this.animate();
  }

  createEnvironment() {
    // Air Laut
    const oceanGeo = new THREE.PlaneGeometry(300, 300);
    const oceanMat = new THREE.MeshLambertMaterial({ color: 0x1d70a2 });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -1.2;
    this.scene.add(ocean);

    // Pulau Tengah Nusantara
    const islandGeo = new THREE.CylinderGeometry(18, 22, 1.5, 32);
    const islandMat = new THREE.MeshLambertMaterial({ color: 0x3a8c3f });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -0.75;
    island.receiveShadow = true;
    this.scene.add(island);

    // Monas Mini di Pusat Pulau
    const monasBase = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.8, 2),
      new THREE.MeshLambertMaterial({ color: 0xeeeeee })
    );
    monasBase.position.set(0, 0.4, 0);
    monasBase.castShadow = true;
    this.scene.add(monasBase);

    const monasTower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.5, 5, 8),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    monasTower.position.set(0, 3, 0);
    monasTower.castShadow = true;
    this.scene.add(monasTower);

    const monasGold = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.8, 8),
      new THREE.MeshLambertMaterial({ color: 0xf2b705 })
    );
    monasGold.position.set(0, 5.8, 0);
    this.scene.add(monasGold);
  }

  getTilePosition(index) {
    // Menghitung koordinat XZ untuk 40 petak melingkar persegi (10 petak per sisi)
    const sideSize = 10;
    const spacing = 2.4;
    const offset = (sideSize * spacing) / 2;

    let x = 0;
    let z = 0;

    if (index >= 0 && index <= 10) {
      // Sisi Bawah (0..10): dari kiri ke kanan
      x = -offset + index * spacing;
      z = offset;
    } else if (index > 10 && index <= 20) {
      // Sisi Kanan (10..20): dari bawah ke atas
      x = offset;
      z = offset - (index - 10) * spacing;
    } else if (index > 20 && index <= 30) {
      // Sisi Atas (20..30): dari kanan ke kiri
      x = offset - (index - 20) * spacing;
      z = -offset;
    } else {
      // Sisi Kiri (30..39): dari atas ke bawah
      x = -offset;
      z = -offset + (index - 30) * spacing;
    }

    return { x, y: 0, z };
  }

  createBoard() {
    BOARD.forEach((tile) => {
      const pos = this.getTilePosition(tile.id);

      // Warna Cap Petak
      let capColor = 0xe0d6c3; // Krem default
      if (tile.group && GROUPS[tile.group]) {
        capColor = parseInt(GROUPS[tile.group].color.replace('#', '0x'));
      }

      // Base Petak
      const baseGeo = new THREE.BoxGeometry(2.2, 0.6, 2.2);
      const baseMat = new THREE.MeshLambertMaterial({ color: 0x2b2b36 });
      const tileMesh = new THREE.Mesh(baseGeo, baseMat);
      tileMesh.position.set(pos.x, pos.y, pos.z);
      tileMesh.receiveShadow = true;
      tileMesh.castShadow = true;

      // Cap Warna Atas
      const capGeo = new THREE.BoxGeometry(2.1, 0.1, 2.1);
      const capMat = new THREE.MeshLambertMaterial({ color: capColor });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(0, 0.31, 0);
      tileMesh.add(capMesh);

      // Simpan referensi mesh petak
      tileMesh.userData = { id: tile.id, data: tile };
      this.scene.add(tileMesh);
      this.tileMeshes.push(tileMesh);
    });
  }

  syncGameState(S) {
    if (!S) return;

    // 1. Sync Bidak Pemain
    S.players.forEach((player, idx) => {
      if (player.isBankrupt) {
        if (this.playerTokens[idx]) this.playerTokens[idx].visible = false;
        return;
      }

      if (!this.playerTokens[idx]) {
        // Buat Bidak Baru
        const pColor = parseInt(player.color.replace('#', '0x'));
        const tokenGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.2, 16);
        const tokenMat = new THREE.MeshPhongMaterial({ color: pColor, shininess: 80 });
        const tokenMesh = new THREE.Mesh(tokenGeo, tokenMat);

        const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const headMesh = new THREE.Mesh(headGeo, tokenMat);
        headMesh.position.y = 0.8;
        tokenMesh.add(headMesh);

        tokenMesh.castShadow = true;
        this.scene.add(tokenMesh);
        this.playerTokens[idx] = tokenMesh;
      }

      const token = this.playerTokens[idx];
      token.visible = true;

      // Offset posisi bidak agar tidak menumpuk di petak yang sama
      const tilePos = this.getTilePosition(player.pos);
      const offsetX = (idx % 2 === 0 ? 0.35 : -0.35);
      const offsetZ = (idx < 2 ? 0.35 : -0.35);

      const targetX = tilePos.x + offsetX;
      const targetZ = tilePos.z + offsetZ;
      const targetY = 0.9;

      // Animasi pergerakan halus (lerp)
      token.position.x += (targetX - token.position.x) * 0.2;
      token.position.z += (targetZ - token.position.z) * 0.2;
      token.position.y = targetY;

      // Atur Kamera Follow ke Bidak Aktif
      if (idx === S.turnIdx && this.isFollowing) {
        this.followTarget = { x: targetX, z: targetZ };
      }
    });

    // 2. Sync Bangunan Properti
    Object.keys(S.props).forEach((tileId) => {
      const pData = S.props[tileId];
      const meshKey = `b_${tileId}`;

      if (pData.lvl > 0 && pData.owner !== null) {
        if (!this.buildingMeshes[meshKey] || this.buildingMeshes[meshKey].userData.lvl !== pData.lvl) {
          // Hapus bangunan lama jika level berubah
          if (this.buildingMeshes[meshKey]) {
            this.scene.remove(this.buildingMeshes[meshKey]);
          }

          // Buat Bangunan Baru
          const pos = this.getTilePosition(Number(tileId));
          let bGeo;
          let bColor = 0xffffff;

          if (pData.lvl === 1) { // Rumah
            bGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
            bColor = 0xeeeeee;
          } else if (pData.lvl === 2) { // Ruko
            bGeo = new THREE.BoxGeometry(0.9, 1.2, 0.9);
            bColor = 0x3366cc;
          } else { // Landmark
            bGeo = new THREE.BoxGeometry(1.1, 2.0, 1.1);
            bColor = 0xf2b705;
          }

          const bMesh = new THREE.Mesh(bGeo, new THREE.MeshLambertMaterial({ color: bColor }));
          bMesh.position.set(pos.x, 0.6 + (pData.lvl * 0.3), pos.z);
          bMesh.castShadow = true;
          bMesh.userData = { lvl: pData.lvl };

          this.scene.add(bMesh);
          this.buildingMeshes[meshKey] = bMesh;
        }
      } else if (this.buildingMeshes[meshKey]) {
        this.scene.remove(this.buildingMeshes[meshKey]);
        delete this.buildingMeshes[meshKey];
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Camera Smooth Following
    if (this.isFollowing && this.followTarget) {
      const camTargetX = this.followTarget.x + 30;
      const camTargetZ = this.followTarget.z + 40;

      this.camera.position.x += (camTargetX - this.camera.position.x) * 0.05;
      this.camera.position.z += (camTargetZ - this.camera.position.z) * 0.05;
      this.camera.lookAt(this.followTarget.x, 0, this.followTarget.z);
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 500;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
