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
      readyEmitted: false,
      initialized: false,      // флаг инициализации
      applyingView: false,     // флаг применения параметров извне
      isDragging: false,       // флаг перетаскивания мышью
      previousMousePosition: { x: 0, y: 0 }, // предыдущая позиция мыши
      rotationSpeed: 0.002     // скорость вращения
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
    this.sphere = null
  },
  methods: {
    init() {
      const container = this.$refs.container
      if (!container) {
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

      // Добавляем обработчики мыши для вращения панорамы
      this.addMouseControls()

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

    addMouseControls() {
      const container = this.$refs.container
      
      // Обработчик начала перетаскивания
      container.addEventListener('mousedown', (event) => {
        this.isDragging = true
        this.previousMousePosition = {
          x: event.clientX,
          y: event.clientY
        }
      })

      // Обработчик движения мыши
      container.addEventListener('mousemove', (event) => {
        if (!this.isDragging) return

        const deltaMove = {
          x: event.clientX - this.previousMousePosition.x,
          y: event.clientY - this.previousMousePosition.y
        }

        // Вращаем камеру
        this.camera.rotation.y -= deltaMove.x * this.rotationSpeed
        this.camera.rotation.x -= deltaMove.y * this.rotationSpeed

        // Ограничиваем вращение по вертикали (pitch)
        const maxPitch = Math.PI / 2 - 0.1
        const minPitch = -Math.PI / 2 + 0.1
        this.camera.rotation.x = Math.max(minPitch, Math.min(maxPitch, this.camera.rotation.x))

        this.previousMousePosition = {
          x: event.clientX,
          y: event.clientY
        }

        // Отправляем текущие параметры камеры при движении
        if (!this.applyingView) {
          const currentView = this.getCameraView()
          this.$emit('camera-move', currentView)
        }
      })

      // Обработчик окончания перетаскивания
      container.addEventListener('mouseup', () => {
        this.isDragging = false
      })

      // Обработчик выхода мыши за пределы контейнера
      container.addEventListener('mouseleave', () => {
        this.isDragging = false
      })
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
              // Даем больше времени на инициализацию controls
              setTimeout(() => {
                this.$emit('ready')
              }, 200)
            }
          },
          undefined,
          (error) => {
            this.loading = false
          }
      )
    },

    // Метод для принудительного обновления текстуры
    updateTexture(src) {
      if (src === this.src) return
      
      this.src = src
      this.readyEmitted = false
      this.loadTexture()
    },

    animate() {
      this.frameId = requestAnimationFrame(this.animate)

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }

      // Отправляем текущие параметры камеры при движении
      // Но не отправляем, если мы применяем параметры извне
      if (this.camera && !this.applyingView) {
        const currentView = this.getCameraView()
        this.$emit('camera-move', currentView)
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
        yaw: this.camera.rotation.y,
        pitch: this.camera.rotation.x,
        fov: this.camera.fov
      }
    },
    setCameraView({ yaw, pitch, fov }) {
      // Проверяем, что все компоненты инициализированы
      if (!this.camera || !this.renderer || !this.scene) {
        return
      }

      try {
        // Устанавливаем флаг применения параметров извне
        this.applyingView = true

        // 1. Применяем FOV (как в примере)
        this.camera.fov = fov
        this.camera.updateProjectionMatrix()

        // 2. Применяем углы (Yaw/Pitch) с правильным порядком вращения
        // Используем порядок 'YXZ' как в оригинальном примере из интернета
        this.camera.rotation.set(pitch, yaw, 0, 'YXZ')
        
        // Обновляем матрицу камеры
        this.camera.updateMatrix()
        this.camera.updateMatrixWorld(true)
        
        // Принудительно рендерим один кадр для применения изменений
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera)
        }
        
        // Сбрасываем флаг через небольшую задержку
        setTimeout(() => {
          this.applyingView = false
        }, 100)
      } catch (error) {
        this.applyingView = false
      }
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
