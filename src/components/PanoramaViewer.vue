<template>
  <div class="panorama-viewer-wrapper">
    <div class="panorama-viewer" ref="container"></div>

    <div v-if="loading" class="panorama-viewer__loading">
      <el-icon class="is-loading"><loading /></el-icon>
      <span>Загрузка панорамы...</span>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Loading } from '@element-plus/icons-vue'

export default {
  name: 'PanoramaViewer',
  components: { Loading },
  props: {
    src: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,          // загрузка текстуры
      frameId: null,
      readyEmitted: false
    }
  },
  watch: {
    src() {
      this.readyEmitted = false // ← сбрасываем флаг
      this.loadTexture()
    }
  },
  mounted() {
    this.renderer = null
    this.scene = null
    this.camera = null
    this.controls = null
    this.sphere = null

    this.animate = this.animate.bind(this)

    this.$nextTick(() => {
      this.init()
      this.loadTexture()
      window.addEventListener('resize', this.onResize)
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize)

    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }

    if (this.renderer) {
      this.renderer.dispose()
      this.renderer.forceContextLoss()
      this.renderer.domElement = null
      this.renderer = null
    }

    this.scene = null
    this.camera = null
    this.controls = null
    this.sphere = null
  },
  methods: {
    init() {
      const container = this.$refs.container
      if (!container) {
        console.error('PanoramaViewer: container not found')
        return
      }

      this.renderer = new THREE.WebGLRenderer({ antialias: true })
      this.renderer.setSize(container.clientWidth, container.clientHeight)
      container.appendChild(this.renderer.domElement)

      this.scene = new THREE.Scene()

      this.camera = new THREE.PerspectiveCamera(
          75,
          container.clientWidth / container.clientHeight,
          0.1,
          1000
      )
      this.camera.position.set(0, 0, 0.1)

      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableZoom = false
      this.controls.enablePan = false
      this.controls.rotateSpeed = 0.3

      const geometry = new THREE.SphereGeometry(500, 60, 40)
      geometry.scale(-1, 1, 1)

      const material = new THREE.MeshBasicMaterial({
        map: null,
        color: 0xffffff
      })

      this.sphere = new THREE.Mesh(geometry, material)
      this.scene.add(this.sphere)

      this.animate()

    },

    loadTexture() {
      if (!this.src) return

      this.loading = true

      const loader = new THREE.TextureLoader()
      loader.load(
          this.src,
          (texture) => {
            this.sphere.material.map = texture
            this.sphere.material.needsUpdate = true
            this.loading = false

            // ВАЖНО: ready только после загрузки текстуры
            if (!this.readyEmitted) {
              this.readyEmitted = true
              this.$emit('ready')
            }
          },
          undefined,
          (error) => {
            console.error('Ошибка загрузки панорамы:', error)
            this.loading = false
          }
      )
    },

    animate() {
      this.frameId = requestAnimationFrame(this.animate)

      if (this.controls) this.controls.update()
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }

    },

    onResize() {
      const container = this.$refs.container
      if (!container || !this.camera || !this.renderer) return

      this.camera.aspect = container.clientWidth / container.clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(container.clientWidth, container.clientHeight)
    },

    getCameraView() {
      return {
        yaw: this.controls.getAzimuthalAngle(),
        pitch: this.controls.getPolarAngle(),
        fov: this.camera.fov
      }
    },
    setCameraView({ yaw, pitch, fov }) {
      if (!this.controls || !this.camera) {
        console.warn('setCameraView called too early')
        return
      }

      if (typeof this.controls.setAzimuthalAngle !== 'function') {
        console.warn('controls not ready yet')
        return
      }

      this.controls.setAzimuthalAngle(yaw)
      this.controls.setPolarAngle(pitch)
      this.camera.fov = fov
      this.camera.updateProjectionMatrix()
    }



  }
}
</script>

<style scoped lang="scss">
.panorama-viewer-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.panorama-viewer {
  width: 100%;
  height: 100%;
  background-color: hsl(0 0% 90%);
  overflow: hidden;
}

.panorama-viewer__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(3px);
  font-size: 14px;
  color: #333;
}
</style>
