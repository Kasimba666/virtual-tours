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

        <h3 class="scene-editor-page__subtitle">Параметры камеры</h3>

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

        <el-divider />

        <h3 class="scene-editor-page__subtitle">Параметры эффектов</h3>

        <div class="scene-editor-page__effects-controls">
          <el-form-item label="Яркость">
            <el-slider
                v-model="form.effects.brightness"
                :min="-1"
                :max="1"
                :step="0.1"
                :disabled="!form.panorama"
                @change="onEffectChange"
            />
          </el-form-item>

          <el-form-item label="Контрастность">
            <el-slider
                v-model="form.effects.contrast"
                :min="0"
                :max="3"
                :step="0.1"
                :disabled="!form.panorama"
                @change="onEffectChange"
            />
          </el-form-item>

          <el-form-item label="Насыщенность">
            <el-slider
                v-model="form.effects.saturation"
                :min="0"
                :max="3"
                :step="0.1"
                :disabled="!form.panorama"
                @change="onEffectChange"
            />
          </el-form-item>
        </div>

        <el-divider />

        <h3 class="scene-editor-page__subtitle">Просмотр панорамы</h3>

        <panorama-viewer
            v-if="form.panorama"
            ref="viewer"
            :src="form.panorama"
            @ready="onViewerReady"
            @camera-move="onCameraMove"
            class="scene-editor-page__viewer"
        />

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
              this.form = {
                name: scene.name,
                panorama: scene.panorama,
                hotspots: scene.hotspots || [],
                startView: scene.startView || {
                  yaw: 0,
                  pitch: 0,
                  fov: 60
                },
                effects: scene.effects || {
                  brightness: 0.1,
                  contrast: 0.3,
                  saturation: 0.9
                }
              }
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
        this.form.startView = {
          yaw: view.yaw,
          pitch: view.pitch,
          fov: view.fov
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
      // PanoramaViewer сообщает о готовности, но controls могут быть еще не готовы
      // Используем рекурсивную проверку готовности
      this.waitForControlsReady()
    },

    waitForControlsReady(attempt = 1) {
      const viewer = this.$refs.viewer
      
      // Максимум 40 попыток (2 секунды)
      if (attempt > 40) {
        return
      }
      
      if (!viewer) {
        setTimeout(() => {
          this.waitForControlsReady(attempt + 1)
        }, 50)
        return
      }

      try {
        // Пытаемся применить параметры камеры
        this.applyStartView()
      } catch (error) {
        // Если ошибка, ждем и пробуем снова
        setTimeout(() => {
          this.waitForControlsReady(attempt + 1)
        }, 50)
      }
    },

    waitForViewerReady(attempt = 1) {
      const viewer = this.$refs.viewer
      
      // Максимум 20 попыток (1 секунда)
      if (attempt > 20) {
        return
      }
      
      if (!viewer) {
        // PanoramaViewer еще не создан, ждем и пробуем снова
        setTimeout(() => {
          this.waitForViewerReady(attempt + 1)
        }, 50)
        return
      }

      // Проверяем, готов ли viewer к работе
      if (viewer.setCameraView && typeof viewer.setCameraView === 'function') {
        // Viewer готов, применяем параметры
        this.applyStartView()
      } else {
        // Viewer еще не инициализирован, ждем и пробуем снова
        setTimeout(() => {
          this.waitForViewerReady(attempt + 1)
        }, 50)
      }
    },

    applyStartView() {
      const viewer = this.$refs.viewer
      if (!viewer || !this.form.panorama) {
        return
      }

      // Устанавливаем флаг применения параметров
      this.applyingStartView = true

      viewer.setCameraView(this.form.startView)

      // Применяем эффекты
      if (this.form.panorama) {
        viewer.setBrightness(this.form.effects.brightness)
        viewer.setContrast(this.form.effects.contrast)
        viewer.setSaturation(this.form.effects.saturation)
      }

      // Сбрасываем флаг через небольшую задержку
      setTimeout(() => {
        this.applyingStartView = false
      }, 300)
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
        viewer.setCameraView(this.form.startView)
      }
    },

    onEffectChange() {
      console.log('onEffectChange вызван')
      console.log('Новые параметры эффектов:', this.form.effects)
      
      // Применяем изменения эффектов к панораме
      const viewer = this.$refs.viewer
      if (viewer && this.form.panorama) {
        console.log('Применяем изменения эффектов к панораме...')
        viewer.setBrightness(this.form.effects.brightness)
        viewer.setContrast(this.form.effects.contrast)
        viewer.setSaturation(this.form.effects.saturation)
      }
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
  flex-direction: column;
  gap: 1rem;
  
  .el-form-item {
    margin-bottom: 0;
    
    .el-form-item__label {
      font-size: 12px;
      color: hsl(0 0% 40%);
    }
    
    .el-slider {
      width: 100%;
    }
  }
}
</style>
