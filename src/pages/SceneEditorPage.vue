<template>
  <div class="scene-editor-page">
    <el-card class="scene-editor-page__card">
      <h2 class="scene-editor-page__title">
        Редактирование сцены: {{ sceneId }}
      </h2>

      <el-form
          :model="form"
          label-width="120px"
          size="small"
          class="scene-editor-page__form"
      >
        <el-form-item label="Название сцены">
          <el-input v-model="form.name" />
        </el-form-item>

        <el-tabs v-model="activeTab" type="border-card" @tab-click="onTabClick">
          <el-tab-pane label="Настройки вида" name="viewer">
            <el-form-item label="Панорама">
              <el-upload
                  class="scene-editor-page__upload"
                  :show-file-list="false"
                  :before-upload="beforeUpload"
              >
                <el-button size="small" type="primary">Загрузить панораму</el-button>
              </el-upload>

              <div v-if="uploading" class="scene-editor-page__uploading">
                <el-icon class="is-loading"><loading /></el-icon>
                <span>Загрузка файла...</span>
              </div>

              <div v-if="form.panorama" class="scene-editor-page__panorama-url">
                Текущий файл: {{ form.panorama }}
              </div>
            </el-form-item>

            <el-divider />

            <el-collapse v-model="activeCollapse">
              <el-collapse-item title="Параметры камеры" name="camera">
                <div class="scene-editor-page__camera-controls">
                  <el-form-item label="Yaw (горизонталь)">
                    <el-input-number
                        v-model="form.startView.yaw"
                        :min="-Math.PI"
                        :max="Math.PI"
                        :step="0.1"
                        :precision="2"
                        :disabled="!form.panorama"
                        @change="onCameraParamChange"
                    />
                  </el-form-item>

                  <el-form-item label="Pitch (вертикаль)">
                    <el-input-number
                        v-model="form.startView.pitch"
                        :min="-Math.PI/2"
                        :max="Math.PI/2"
                        :step="0.1"
                        :precision="2"
                        :disabled="!form.panorama"
                        @change="onCameraParamChange"
                    />
                  </el-form-item>

                  <el-form-item label="FOV (угол обзора)">
                    <el-input-number
                        v-model="form.startView.fov"
                        :min="30"
                        :max="120"
                        :step="1"
                        :disabled="!form.panorama"
                        @change="onCameraParamChange"
                    />
                  </el-form-item>
                </div>
              </el-collapse-item>

              <el-collapse-item title="Параметры эффектов" name="effects">
                <div class="scene-editor-page__effects-controls">
                  <el-form-item label="Яркость">
                    <el-input-number
                        v-model="form.effects.brightness"
                        :min="-1"
                        :max="1"
                        :step="0.1"
                        :precision="1"
                        :disabled="!form.panorama"
                        @change="onEffectChange"
                    />
                  </el-form-item>

                  <el-form-item label="Контрастность">
                    <el-input-number
                        v-model="form.effects.contrast"
                        :min="0"
                        :max="3"
                        :step="0.1"
                        :precision="1"
                        :disabled="!form.panorama"
                        @change="onEffectChange"
                    />
                  </el-form-item>

                  <el-form-item label="Насыщенность">
                    <el-input-number
                        v-model="form.effects.saturation"
                        :min="0"
                        :max="3"
                        :step="0.1"
                        :precision="1"
                        :disabled="!form.panorama"
                        @change="onEffectChange"
                    />
                  </el-form-item>
                </div>
              </el-collapse-item>
            </el-collapse>

            <el-divider />

            <panorama-viewer
                v-if="form.panorama"
                ref="viewer"
                :src="form.panorama"
                @ready="onViewerReady"
                @camera-move="onCameraMove"
                class="scene-editor-page__viewer"
            />
          </el-tab-pane>

          <el-tab-pane label="Хотспоты" name="hotspots">
            <div class="hotspots-viewer">
              <panorama-viewer
                  v-if="form.panorama && hotspotsViewerInitialized"
                  ref="hotspotsViewer"
                  :src="form.panorama"
                  @ready="onHotspotsViewerReady"
                  @camera-move="onCameraMove"
                  class="hotspots-viewer__viewer"
              />
            </div>
          </el-tab-pane>
        </el-tabs>

        <el-divider />

        <el-form-item>
          <el-button type="primary" size="small" @click="save">
            Сохранить сцену
          </el-button>

          <el-button size="small" @click="backToTour">
            Выйти без сохранения
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import toursService from '@/services/toursService'
import storageService from '@/services/storageService'
import PanoramaViewer from '@/components/PanoramaViewer.vue'
import { Loading, Check } from '@element-plus/icons-vue'

export default {
  name: 'SceneEditorPage',
  components: { PanoramaViewer, Loading, Check },
  data() {
    return {
      uploading: false,
      sceneSaved: false,
      tour: null,
      sceneId: this.$route.params.sceneId,
      loadingFromDatabase: false, // флаг загрузки из базы данных
      applyingStartView: false,   // флаг применения параметров камеры
      activeCollapse: [],         // активные сворачиваемые панели (по умолчанию свернуты)
      activeTab: 'viewer',        // активная вкладка (по умолчанию "Настройки вида")
      viewerInitialized: false,   // флаг инициализации панорамы во вкладке Настройки вида
      hotspotsViewerInitialized: false, // флаг инициализации панорамы во вкладке Хотспоты
      viewerCameraView: null,     // текущие параметры камеры во вкладке Настройки вида
      hotspotsCameraView: null,   // текущие параметры камеры во вкладке Хотспоты
      form: {
        name: '',
        panorama: '',
        hotspots: [],
        startView: {
          yaw: 0,
          pitch: 0,
          fov: 60
        },
        effects: {
          brightness: 0.1,
          contrast: 0.3,
          saturation: 0.9
        }
      }
    }
  },
  created() {
    this.loadTour()
  },
  methods: {
    loadTour() {
      this.loadingFromDatabase = true // устанавливаем флаг загрузки
      
      toursService.getTourById(this.$route.params.id)
          .then((tour) => {
            this.tour = tour
            const scene = tour.data.scenes[this.sceneId]

            if (scene) {
              // Сохраняем оригинальные значения из базы данных
              const originalStartView = scene.startView || {
                yaw: 0,
                pitch: 0,
                fov: 60
              }
              
              const originalEffects = scene.effects || {
                brightness: 0.1,
                contrast: 0.3,
                saturation: 0.9
              }

              this.form = {
                name: scene.name,
                panorama: scene.panorama,
                hotspots: scene.hotspots || [],
                startView: originalStartView,
                effects: originalEffects
              }

              console.log('Загруженные из базы данных параметры:')
              console.log('startView:', originalStartView)
              console.log('effects:', originalEffects)
            }
          })
          .catch((error) => console.error(error))
          .finally(() => {
            // Сбрасываем флаг через небольшую задержку, чтобы параметры успели примениться
            setTimeout(() => {
              this.loadingFromDatabase = false
            }, 1000)
          })
    },

    onCameraMove(view) {
      // Обновляем параметры камеры в реальном времени при движении
      // Но не меняем их, если мы только что загрузили сцену или применяем параметры
      if (!this.loadingFromDatabase && !this.applyingStartView) {
        // Определяем, из какой вкладки пришло событие
        const isViewerTab = this.activeTab === 'viewer'
        
        if (isViewerTab) {
          // Обновляем параметры для вкладки Настройки вида
          this.viewerCameraView = {
            yaw: view.yaw,
            pitch: view.pitch,
            fov: view.fov
          }
          
          // Обновляем значения инпутов в форме
          this.form.startView.yaw = view.yaw
          this.form.startView.pitch = view.pitch
          this.form.startView.fov = view.fov
        } else {
          // Обновляем параметры для вкладки Хотспоты
          this.hotspotsCameraView = {
            yaw: view.yaw,
            pitch: view.pitch,
            fov: view.fov
          }
        }
      }
    },

    beforeUpload(file) {
      this.uploading = true

      storageService.uploadPanorama(file, this.sceneId)
          .then((url) => {
            this.form.panorama = url
          })
          .catch((error) => console.error(error))
          .finally(() => {
            this.uploading = false
          })

      return false
    },

    save() {
      this.sceneSaved = true
      this.tour.data.scenes[this.sceneId] = {
        name: this.form.name,
        panorama: this.form.panorama,
        hotspots: this.form.hotspots,
        startView: this.form.startView,
        effects: this.form.effects
      }

      toursService.saveTour(this.tour)
          .then(() => {
            this.$router.push({
              name: 'tour-edit',
              params: { id: this.tour.id }
            })
          })
          .catch((error) => console.error(error))
    },

    onViewerReady() {
      console.log('Панорама в вкладке Настройки вида готова')
      
      // Применяем начальные параметры камеры к панораме
      this.applyStartView()
    },

    applyStartView() {
      const viewer = this.$refs.viewer
      if (!viewer || !this.form.panorama) {
        return
      }

      // Устанавливаем флаг применения параметров
      this.applyingStartView = true

      // Применяем параметры камеры с небольшой задержкой для асинхронной инициализации
      setTimeout(() => {
        try {
          // Получаем оригинальные параметры из базы данных напрямую
          const tour = this.tour
          const scene = tour.data.scenes[this.sceneId]
          const originalStartView = scene.startView || {
            yaw: 0,
            pitch: 0,
            fov: 60
          }
          
          console.log('Применяем оригинальные параметры камеры из базы данных:', originalStartView)
          
          // Создаем новый объект, чтобы избежать проблем с реактивностью
          const cameraView = {
            yaw: originalStartView.yaw,
            pitch: originalStartView.pitch,
            fov: originalStartView.fov
          }
          
          viewer.setCameraView(cameraView)
          
          // Применяем эффекты
          viewer.setBrightness(this.form.effects.brightness)
          viewer.setContrast(this.form.effects.contrast)
          viewer.setSaturation(this.form.effects.saturation)
          
          console.log('Параметры камеры успешно применены')
        } catch (error) {
          console.error('Ошибка при применении параметров камеры:', error)
        } finally {
          // Сбрасываем флаг через небольшую задержку
          setTimeout(() => {
            this.applyingStartView = false
          }, 300)
        }
      }, 100) // Небольшая задержка для асинхронной инициализации
    },

    backToTour() {
      this.$router.push({
        name: 'tour-edit',
        params: { id: this.tour.id }
      })
    },
    beforeUnmount() {
      if (!this.sceneSaved && this.form.panorama) {
        storageService.deleteFileByUrl(this.form.panorama)
      }
    },
    setAsStartView() {
      const viewer = this.$refs.viewer
      if (!viewer) {
        return
      }

      this.savingView = true

      const view = viewer.getCameraView()
      
      // Сохраняем параметры камеры для текущей сцены
      if (!this.tour.data.scenes[this.sceneId]) {
        this.tour.data.scenes[this.sceneId] = {}
      }
      
      this.tour.data.scenes[this.sceneId].startView = view
      
      // Также устанавливаем эту сцену как стартовую для всего тура
      this.tour.data.startScene = this.sceneId
      
      // Показываем индикатор сохранения на короткое время
      // Показываем индикатор сохранения на короткое время
      setTimeout(() => {
        this.savingView = false
      }, 1000)
    },

    onCameraParamChange() {
      console.log('onCameraParamChange вызван')
      console.log('Новые параметры камеры:', this.form.startView)
      
      // Применяем изменения параметров камеры к панораме
      const viewer = this.$refs.viewer
      if (viewer && this.form.panorama) {
        console.log('Применяем изменения параметров камеры к панораме...')
        // Создаем новый объект, чтобы избежать проблем с реактивностью
        const newView = {
          yaw: this.form.startView.yaw,
          pitch: this.form.startView.pitch,
          fov: this.form.startView.fov
        }
        viewer.setCameraView(newView)
      }
    },

    onEffectChange() {
      console.log('onEffectChange вызван')
      console.log('Новые параметры эффектов:', this.form.effects)
      
      // Применяем изменения эффектов к панораме в основной вкладке
      const viewer = this.$refs.viewer
      if (viewer && this.form.panorama && this.viewerInitialized) {
        console.log('Применяем изменения эффектов к панораме...')
        viewer.setBrightness(this.form.effects.brightness)
        viewer.setContrast(this.form.effects.contrast)
        viewer.setSaturation(this.form.effects.saturation)
      }
      
      // Применяем изменения эффектов к панораме в вкладке Хотспоты
      const hotspotsViewer = this.$refs.hotspotsViewer
      if (hotspotsViewer && this.form.panorama) {
        console.log('Применяем изменения эффектов к панораме в вкладке Хотспоты...')
        hotspotsViewer.setBrightness(this.form.effects.brightness)
        hotspotsViewer.setContrast(this.form.effects.contrast)
        hotspotsViewer.setSaturation(this.form.effects.saturation)
      }
    },

    // Метод для обработки переключения вкладок
    onTabClick(tab) {
      // Если перешли во вкладку "Настройки вида" и панорама еще не инициализирована
      if (tab.props.name === 'viewer' && this.form.panorama && !this.viewerInitialized) {
        console.log('Инициализация панорамы во вкладке Настройки вида')
        this.viewerInitialized = true
        
        // Применяем начальные параметры к панораме во вкладке Настройки вида
        this.$nextTick(() => {
          const viewer = this.$refs.viewer
          if (viewer && this.form.panorama) {
            console.log('Применяем начальные параметры к панораме во вкладке Настройки вида...')
            
            // Получаем оригинальные параметры из базы данных напрямую
            const tour = this.tour
            const scene = tour.data.scenes[this.sceneId]
            const originalStartView = scene.startView || {
              yaw: 0,
              pitch: 0,
              fov: 60
            }
            
            console.log('Оригинальные параметры камеры из базы данных:', originalStartView)
            
            // Создаем новый объект, чтобы избежать проблем с реактивности
            const cameraView = {
              yaw: originalStartView.yaw,
              pitch: originalStartView.pitch,
              fov: originalStartView.fov
            }
            
            viewer.setCameraView(cameraView)
            viewer.setBrightness(this.form.effects.brightness)
            viewer.setContrast(this.form.effects.contrast)
            viewer.setSaturation(this.form.effects.saturation)
          }
        })
      }
      
      // Если перешли во вкладку "Хотспоты" и панорама еще не инициализирована
      if (tab.props.name === 'hotspots' && this.form.panorama && !this.hotspotsViewerInitialized) {
        console.log('Инициализация панорамы во вкладке Хотспоты')
        this.hotspotsViewerInitialized = true
        
        // Применяем начальные параметры к панораме во вкладке Хотспоты
        this.$nextTick(() => {
          const viewer = this.$refs.hotspotsViewer
          if (viewer && this.form.panorama) {
            console.log('Применяем начальные параметры к панораме во вкладке Хотспоты...')
            
            // Получаем оригинальные параметры из базы данных напрямую
            const tour = this.tour
            const scene = tour.data.scenes[this.sceneId]
            const originalStartView = scene.startView || {
              yaw: 0,
              pitch: 0,
              fov: 60
            }
            
            console.log('Оригинальные параметры камеры из базы данных:', originalStartView)
            
            // Создаем новый объект, чтобы избежать проблем с реактивности
            const cameraView = {
              yaw: originalStartView.yaw,
              pitch: originalStartView.pitch,
              fov: originalStartView.fov
            }
            
            // Применяем параметры с небольшой задержкой для надежности
            setTimeout(() => {
              viewer.setCameraView(cameraView)
              viewer.setBrightness(this.form.effects.brightness)
              viewer.setContrast(this.form.effects.contrast)
              viewer.setSaturation(this.form.effects.saturation)
              
              // Сохраняем эти параметры как начальные для вкладки Хотспоты
              this.hotspotsCameraView = cameraView
            }, 100)
          }
        })
      }
    },

    // Метод для обработки готовности панорамы в вкладке Хотспоты
    onHotspotsViewerReady() {
      console.log('Панорама в вкладке Хотспоты готова')
      
      // Добавляем небольшую задержку перед применением эффектов, чтобы избежать ошибок WebGL
      setTimeout(() => {
        const viewer = this.$refs.hotspotsViewer
        if (viewer && this.form.panorama) {
          console.log('Применяем эффекты к панораме в вкладке Хотспоты...')
          viewer.setBrightness(this.form.effects.brightness)
          viewer.setContrast(this.form.effects.contrast)
          viewer.setSaturation(this.form.effects.saturation)
          
          // Применяем начальные параметры камеры из базы данных при первом открытии
          if (!this.hotspotsCameraView) {
            console.log('Применяем начальные параметры камеры из базы данных к панораме в вкладке Хотспоты...')
            
            // Получаем оригинальные параметры из базы данных напрямую
            const tour = this.tour
            const scene = tour.data.scenes[this.sceneId]
            const originalStartView = scene.startView || {
              yaw: 0,
              pitch: 0,
              fov: 60
            }
            
            console.log('Оригинальные параметры камеры из базы данных:', originalStartView)
            
            // Создаем новый объект, чтобы избежать проблем с реактивностью
            const cameraView = {
              yaw: originalStartView.yaw,
              pitch: originalStartView.pitch,
              fov: originalStartView.fov
            }
            
            viewer.setCameraView(cameraView)
            
            // Сохраняем эти параметры как начальные для вкладки Хотспоты
            this.hotspotsCameraView = cameraView
          } else {
            console.log('Применяем текущие параметры камеры для вкладки Хотспоты...')
            viewer.setCameraView(this.hotspotsCameraView)
          }
          
          // Повторно применяем эффекты через еще одну небольшую задержку
          setTimeout(() => {
            if (viewer && this.form.panorama) {
              console.log('Повторно применяем эффекты к панораме в вкладке Хотспоты...')
              viewer.setBrightness(this.form.effects.brightness)
              viewer.setContrast(this.form.effects.contrast)
              viewer.setSaturation(this.form.effects.saturation)
            }
          }, 50)
        }
      }, 200)
    }

  }
}
</script>

<style scoped lang="scss">
.scene-editor-page {
  display: flex;
  justify-content: center;
}

.scene-editor-page__card {
  width: 100%;
  max-width: 900px;
  padding: 0.5rem;
}

.scene-editor-page__title {
  margin: 0 0 0.5rem 0;
}

.scene-editor-page__subtitle {
  margin: 0.5rem 0;
}

.scene-editor-page__viewer {
  height: 400px;
  background-color: hsl(0 0% 90%);
}

.scene-editor-page__panorama-url {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: hsl(0 0% 40%);
}

.scene-editor-page__camera-controls {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  
  .el-form-item {
    margin-bottom: 0;
    
    .el-form-item__label {
      font-size: 12px;
      color: hsl(0 0% 40%);
    }
    
    .el-input-number {
      width: 100%;
    }
  }
}

.scene-editor-page__effects-controls {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  
  .el-form-item {
    margin-bottom: 0;
    
    .el-form-item__label {
      font-size: 12px;
      color: hsl(0 0% 40%);
    }
    
    .el-input-number {
      width: 100%;
    }
  }
}

// Стили для вкладки Хотспоты
.hotspots-viewer {
  height: 400px;
  background-color: hsl(0 0% 90%);
}

.hotspots-viewer__viewer {
  width: 100%;
  height: 100%;
}
</style>
