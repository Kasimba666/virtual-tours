<template>
  <div class="panorama-viewer-wrapper">
    <div class="panorama-viewer" ref="container"></div>
    <div v-if="loading" class="panorama-viewer__loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>Загрузка панорамы...</span>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BrightnessContrastShader } from 'three/examples/jsm/shaders/BrightnessContrastShader.js';
import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader.js';
import { Loading } from '@element-plus/icons-vue';
import { markRaw } from 'vue';

export default {
  name: 'PanoramaViewer',
  components: { Loading },
  props: {
    src: { type: String, required: true },
    hotspots: { type: Array, default: () => [] },
    selectedHotspotId: { type: String, default: null }
  },
  emits: ['ready', 'camera-move', 'hotspot-click', 'hotspot-dblclick', 'hotspot-drag'],
  data() {
    return {
      loading: false, frameId: null, readyEmitted: false, initialized: false,
      applyingView: false, isDragging: false, previousMousePosition: { x: 0, y: 0 },
      rotationSpeed: 0.002, brightness: 0.1, contrast: 0.3, saturation: 0.9,
      hoveredHotspot: null, draggingHotspot: null, lastClickTime: 0, hotspotSize: 30,
      hotspotSpritesMap: new Map()
    };
  },
  watch: {
    src() { this.readyEmitted = false; this.loadTexture(); },
    hotspots: { handler() { this.updateHotspots(); }, deep: true },
    selectedHotspotId() { this.updateHotspotSelection(); }
  },
  mounted() {
    this.renderer = null; this.scene = null; this.camera = null; this.sphere = null; this.composer = null;
    this.animate = this.animate.bind(this);
    this.$nextTick(() => { this.init(); this.loadTexture(); window.addEventListener('resize', this.onResize); this.addMouseControls(); });
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize);
    this.clearHotspots();
    if (this.frameId) { cancelAnimationFrame(this.frameId); this.frameId = null; }
    if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement = null; this.renderer = null; }
    if (this.composer) { this.composer.dispose(); this.composer = null; }
    this.scene = null; this.camera = null; this.sphere = null;
  },
  methods: {
    init() {
      const container = this.$refs.container;
      if (!container) return;
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.domElement.style.cursor = 'grab';
      container.appendChild(this.renderer.domElement);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
      this.camera.position.set(0, 0, 0.01);
      const geometry = new THREE.SphereGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ map: null, color: 0xffffff });
      this.sphere = new THREE.Mesh(geometry, material);
      this.scene.add(this.sphere);
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);
      this.brightnessContrastPass = new ShaderPass(BrightnessContrastShader);
      this.brightnessContrastPass.uniforms.brightness.value = this.brightness;
      this.brightnessContrastPass.uniforms.contrast.value = this.contrast;
      this.composer.addPass(this.brightnessContrastPass);
      this.colorCorrectionPass = new ShaderPass(ColorCorrectionShader);
      this.colorCorrectionPass.uniforms.powRGB.value = new THREE.Vector3(this.saturation, this.saturation, this.saturation);
      this.composer.addPass(this.colorCorrectionPass);
      console.log('[PanoramaViewer] Эффекты инициализированы');
      this.initialized = true;
      // Render hotspots if they were passed before scene was ready
      if (this.hotspots && this.hotspots.length > 0) {
        this.updateHotspots();
      }
      this.animate();
    },
    loadTexture() {
      if (!this.src) return;
      this.loading = true;
      const loader = new THREE.TextureLoader();
      loader.load(this.src, (texture) => {
        if (this.sphere) { this.sphere.material.map = texture; this.sphere.material.needsUpdate = true; }
        this.loading = false;
        if (!this.readyEmitted) { this.readyEmitted = true; setTimeout(() => { this.$emit('ready'); }, 200); }
      }, undefined, (error) => { console.error('Error loading panorama:', error); this.loading = false; });
    },
    createAimIconTexture(isSelected, hotspotColor = '#0066ff') {
      const size = 30;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      const color = isSelected ? '#ff0000' : hotspotColor;
      
      // Draw Element Plus Aim icon as SVG path on canvas
      // The Aim icon consists of crosshairs with a circle
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Outer circle
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      
      // Center dot
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Vertical line (top)
      ctx.beginPath();
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(size / 2, size / 2 - size * 0.35);
      ctx.stroke();
      
      // Vertical line (bottom)
      ctx.beginPath();
      ctx.moveTo(size / 2, size / 2 + size * 0.35);
      ctx.lineTo(size / 2, size);
      ctx.stroke();
      
      // Horizontal line (left)
      ctx.beginPath();
      ctx.moveTo(0, size / 2);
      ctx.lineTo(size / 2 - size * 0.35, size / 2);
      ctx.stroke();
      
      // Horizontal line (right)
      ctx.beginPath();
      ctx.moveTo(size / 2 + size * 0.35, size / 2);
      ctx.lineTo(size, size / 2);
      ctx.stroke();
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    },
    createHotspotSprite(hotspot) {
      const isSelected = hotspot.id === this.selectedHotspotId;
      const color = hotspot.color || '#0066ff';
      const texture = this.createAimIconTexture(isSelected, color);
      const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, transparent: true, opacity: 1 });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(this.hotspotSize, this.hotspotSize, 1);
      sprite.renderOrder = 9999;
      const pos = this.yawPitchToVector3(hotspot.position.yaw, hotspot.position.pitch);
      sprite.position.copy(pos);
      sprite.userData = { hotspotId: hotspot.id, hotspotColor: color };
      return sprite;
    },
    yawPitchToVector3(yaw, pitch) {
      const r = 499;
      const yawDeg = -yaw * (180 / Math.PI);
      const pitchDeg = pitch * (180 / Math.PI);
      const phi = (90 - pitchDeg) * (Math.PI / 180);
      const theta = (yawDeg + 180) * (Math.PI / 180);
      return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    },
    vector3ToYawPitch(vector) {
      const normalized = vector.clone().normalize();
      const pitch = Math.asin(normalized.y);
      const yaw = Math.atan2(normalized.z, -normalized.x);
      return { yaw, pitch };
    },
    screenToRaycast(clientX, clientY) {
      const container = this.$refs.container;
      if (!container || !this.camera) return null;
      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
      const intersects = raycaster.intersectObject(this.sphere);
      return intersects.length > 0 ? intersects[0].point : null;
    },
    getHotspotAtPosition(clientX, clientY) {
      const container = this.$refs.container;
      if (!container || !this.camera) return null;
      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
      raycaster.params.Points.threshold = 20;
      const sprites = Array.from(this.hotspotSpritesMap.values());
      const intersects = raycaster.intersectObjects(sprites);
      return intersects.length > 0 ? intersects[0].object.userData.hotspotId : null;
    },
    updateHotspots() {
      if (!this.scene) return;
      console.log('[PanoramaViewer] updateHotspots вызван, count:', this.hotspots.length);
      const existingIds = new Set(this.hotspots.map(h => h.id));
      for (const [id, sprite] of this.hotspotSpritesMap) {
        if (!existingIds.has(id)) {
          this.scene.remove(sprite); sprite.material.map.dispose(); sprite.material.dispose();
          this.hotspotSpritesMap.delete(id);
        }
      }
      let needsRender = false;
      for (const hotspot of this.hotspots) {
        let sprite = this.hotspotSpritesMap.get(hotspot.id);
        const isSelected = hotspot.id === this.selectedHotspotId;
        const hotspotColor = hotspot.color || '#0066ff';
        if (!sprite) {
          sprite = this.createHotspotSprite(hotspot);
          this.scene.add(sprite);
          this.hotspotSpritesMap.set(hotspot.id, markRaw(sprite));
          needsRender = true;
        } else {
          const pos = this.yawPitchToVector3(hotspot.position.yaw, hotspot.position.pitch);
          if (sprite.position.distanceToSquared(pos) > 0.0001) {
            sprite.position.copy(pos);
            needsRender = true;
          }
          sprite.material.map.dispose();
          sprite.material.map = this.createAimIconTexture(isSelected, hotspotColor);
        }
        sprite.scale.set(this.hotspotSize, this.hotspotSize, 1);
      }
      if (needsRender && this.composer && this.scene && this.camera && this.renderer) {
        this.composer.render();
      }
    },
    updateHotspotSelection() {
      for (const [id, sprite] of this.hotspotSpritesMap) {
        const isSelected = id === this.selectedHotspotId;
        const hotspotColor = sprite.userData.hotspotColor || '#0066ff';
        sprite.material.map.dispose();
        sprite.material.map = this.createAimIconTexture(isSelected, hotspotColor);
      }
      if (this.composer && this.scene && this.camera && this.renderer) {
        this.composer.render();
      }
    },
    clearHotspots() {
      for (const sprite of this.hotspotSpritesMap.values()) {
        this.scene.remove(sprite); sprite.material.map.dispose(); sprite.material.dispose();
      }
      this.hotspotSpritesMap.clear();
    },
    addMouseControls() {
      const container = this.$refs.container;
      if (!container) return;
      container.addEventListener('mousedown', (event) => {
        const hotspotId = this.getHotspotAtPosition(event.clientX, event.clientY);
        if (hotspotId) {
          this.isDragging = true; this.draggingHotspot = hotspotId;
          this.$emit('hotspot-click', hotspotId); container.style.cursor = 'grabbing';
        } else {
          this.isDragging = true; this.previousMousePosition = { x: event.clientX, y: event.clientY };
          container.style.cursor = 'grabbing';
        }
      });
      container.addEventListener('mousemove', (event) => {
        if (this.draggingHotspot && this.selectedHotspotId) {
          const point = this.screenToRaycast(event.clientX, event.clientY);
          if (point) {
            const yawPitch = this.vector3ToYawPitch(point);
            this.$emit('hotspot-drag', { id: this.selectedHotspotId, yaw: yawPitch.yaw, pitch: yawPitch.pitch });
          }
          return;
        }
        const hotspotId = this.getHotspotAtPosition(event.clientX, event.clientY);
        if (hotspotId !== this.hoveredHotspot) {
          this.hoveredHotspot = hotspotId;
          container.style.cursor = hotspotId ? 'pointer' : 'grab';
        }
        if (!this.isDragging) return;
        const deltaX = event.clientX - this.previousMousePosition.x;
        const deltaY = event.clientY - this.previousMousePosition.y;
        this.camera.rotation.y -= deltaX * this.rotationSpeed;
        this.camera.rotation.x -= deltaY * this.rotationSpeed;
        const maxPitch = Math.PI / 2 - 0.1;
        const minPitch = -Math.PI / 2 + 0.1;
        this.camera.rotation.x = Math.max(minPitch, Math.min(maxPitch, this.camera.rotation.x));
        this.previousMousePosition = { x: event.clientX, y: event.clientY };
      });
      container.addEventListener('mouseup', () => {
        this.isDragging = false; this.draggingHotspot = null;
        container.style.cursor = this.hoveredHotspot ? 'pointer' : 'grab';
      });
      container.addEventListener('mouseleave', () => {
        this.isDragging = false; this.draggingHotspot = null;
        container.style.cursor = 'grab';
      });
      container.addEventListener('wheel', (event) => {
        event.preventDefault();
        let fov = this.camera.fov;
        fov += event.deltaY > 0 ? 2 : -2;
        fov = Math.max(30, Math.min(120, fov));
        this.camera.fov = fov; this.camera.updateProjectionMatrix();
      }, { passive: false });
      container.addEventListener('dblclick', (event) => {
        const now = Date.now();
        if (now - this.lastClickTime < 300) { this.lastClickTime = now; return; }
        this.lastClickTime = now;
        const hotspotId = this.getHotspotAtPosition(event.clientX, event.clientY);
        if (!hotspotId) {
          const point = this.screenToRaycast(event.clientX, event.clientY);
          if (point) {
            const yawPitch = this.vector3ToYawPitch(point);
            this.$emit('hotspot-dblclick', { yaw: yawPitch.yaw, pitch: yawPitch.pitch });
          }
        }
      });
      container.addEventListener('click', (event) => {
        const hotspotId = this.getHotspotAtPosition(event.clientX, event.clientY);
        if (hotspotId) { this.$emit('hotspot-click', hotspotId); }
      });
    },
    animate() {
      this.frameId = requestAnimationFrame(this.animate);
      if (this.composer && this.scene && this.camera && this.renderer) {
        this.composer.render();
      } else if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      if (this.camera && !this.applyingView) { this.$emit('camera-move', this.getCameraView()); }
    },
    onResize() {
      const container = this.$refs.container;
      if (!container || !this.camera || !this.renderer) return;
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      if (this.composer && this.scene && this.camera && this.renderer) {
        this.composer.setSize(container.clientWidth, container.clientHeight);
      }
    },
    getCameraView() { return { yaw: this.camera.rotation.y, pitch: this.camera.rotation.x, fov: this.camera.fov }; },
    setCameraView({ yaw, pitch, fov }) {
      if (!this.camera || !this.renderer || !this.scene) return;
      this.applyingView = true;
      try {
        this.camera.fov = fov; this.camera.updateProjectionMatrix();
        this.camera.rotation.set(pitch, yaw, 0, 'YXZ');
        this.camera.updateMatrix(); this.camera.updateMatrixWorld(true);
        console.log('[PanoramaViewer] Параметры камеры применены: yaw=', yaw.toFixed(4), ', pitch=', pitch.toFixed(4), ', fov=', fov);
        if (this.composer && this.scene && this.camera && this.renderer) {
          this.composer.render();
        } else if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      } finally { setTimeout(() => { this.applyingView = false; }, 100); }
    },
    setBrightness(value) {
      this.brightness = Math.max(-1.0, Math.min(1.0, value));
      if (this.brightnessContrastPass) {
        this.brightnessContrastPass.uniforms.brightness.value = this.brightness;
        console.log('[PanoramaViewer] Яркость применена:', this.brightness);
      }
    },
    setContrast(value) {
      this.contrast = Math.max(0.0, Math.min(3.0, value));
      if (this.brightnessContrastPass) {
        this.brightnessContrastPass.uniforms.contrast.value = this.contrast;
        console.log('[PanoramaViewer] Контрастность применена:', this.contrast);
      }
    },
    setSaturation(value) {
      this.saturation = Math.max(0.0, Math.min(3.0, value));
      if (this.colorCorrectionPass) {
        this.colorCorrectionPass.uniforms.powRGB.value = new THREE.Vector3(this.saturation, this.saturation, this.saturation);
        console.log('[PanoramaViewer] Насыщенность применена:', this.saturation);
      }
    },
    forceRender() {
      if (this.composer && this.scene && this.camera && this.renderer) {
        this.composer.render();
        console.log('[PanoramaViewer] Принудительный рендер выполнен');
      }
    }
  }
}
</script>

<style scoped lang="scss">
.panorama-viewer-wrapper { position: relative; width: 100%; height: 100%; }
.panorama-viewer { width: 100%; height: 100%; background-color: hsl(0 0% 90%); overflow: hidden; }
.panorama-viewer__loading {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(3px);
  font-size: 14px; color: #333;
}
</style>
