FOV (угол обзора)<template>
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
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { BrightnessContrastShader } from 'three/examples/jsm/shaders/BrightnessContrastShader.js'
import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader.js'
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
      rotationSpeed: 0.002,    // скорость вращения
      brightness: 0.1,         // яркость (-1.0 до 1.0)
      contrast: 0.3,           // контрастность (0.0 до 3.0)
      saturation: 0.9          // насыщенность (0.0 до 3.0)
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
    this.composer = null

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

    if (this.composer) {
      this.composer.dispose()
      this.composer = null
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
          60,
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

      // Инициализируем EffectComposer для пост-обработки
      this.composer = new EffectComposer(this.renderer)
      const renderPass = new RenderPass(this.scene, this.camera)
      this.composer.addPass(renderPass)

      // Добавляем эффект яркости и контрастности
      this.brightnessContrastPass = new ShaderPass(BrightnessContrastShader)
      this.brightnessContrastPass.uniforms.brightness.value = this.brightness
      this.brightnessContrastPass.uniforms.contrast.value = this.contrast
      this.composer.addPass(this.brightnessContrastPass)

      // Добавляем эффект насыщенности (цветности)
      this.colorCorrectionPass = new ShaderPass(ColorCorrectionShader)
      this.colorCorrectionPass.uniforms.powRGB.value = new THREE.Vector3(this.saturation, this.saturation, this.saturation)
      this.composer.addPass(this.colorCorrectionPass)

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

      // Обработчик колесика мыши для изменения FOV
      container.addEventListener('wheel', (event) => {
        event.preventDefault() // Предотвращаем прокрутку страницы
        
        // Получаем текущий FOV
        let currentFov = this.camera.fov
        
        // Определяем направление прокрутки
        // event.deltaY > 0 - прокрутка вниз (уменьшаем FOV)
        // event.deltaY < 0 - прокрутка вверх (увеличиваем FOV)
        const fovChange = event.deltaY > 0 ? 2 : -2
        
        // Изменяем FOV с ограничениями
        currentFov += fovChange
        currentFov = Math.max(30, Math.min(120, currentFov))
        
        // Устанавливаем новый FOV
        this.camera.fov = currentFov
        this.camera.updateProjectionMatrix()
        
        // Отправляем обновленные параметры камеры
        if (!this.applyingView) {
          const currentView = this.getCameraView()
          this.$emit('camera-move', currentView)
        }
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

      // Проверяем, что все компоненты инициализированы перед рендерингом
      if (this.composer && this.scene && this.camera && this.renderer) {
        this.composer.render()
      } else if (this.renderer && this.scene && this.camera) {
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
      
      // Обновляем размеры composer при изменении размеров окна
      // Проверяем все компоненты перед изменением размеров
      if (this.composer && this.scene && this.camera && this.renderer) {
        this.composer.setSize(container.clientWidth, container.clientHeight)
      }
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
        // Проверяем все компоненты перед рендерингом
        if (this.composer && this.scene && this.camera && this.renderer) {
          this.composer.render()
        } else if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera)
        }
        
        // Сбрасываем флаг через небольшую задержку
        setTimeout(() => {
          this.applyingView = false
        }, 100)
      } catch (error) {
        this.applyingView = false
      }
    },

    // Методы для управления эффектами
    setBrightness(value) {
      this.brightness = Math.max(-1.0, Math.min(1.0, value))
      if (this.brightnessContrastPass) {
        this.brightnessContrastPass.uniforms.brightness.value = this.brightness
      }
    },

    setContrast(value) {
      this.contrast = Math.max(0.0, Math.min(3.0, value))
      if (this.brightnessContrastPass) {
        this.brightnessContrastPass.uniforms.contrast.value = this.contrast
      }
    },

    setSaturation(value) {
      this.saturation = Math.max(0.0, Math.min(3.0, value))
      if (this.colorCorrectionPass) {
        this.colorCorrectionPass.uniforms.powRGB.value = new THREE.Vector3(this.saturation, this.saturation, this.saturation)
      }
    },

    getEffects() {
      return {
        brightness: this.brightness,
        contrast: this.contrast,
        saturation: this.saturation
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
