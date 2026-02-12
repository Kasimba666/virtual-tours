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
                  <el-form-item label="Yaw" class="yaw-input-item">
                    <el-input-number
                      v-model="form.startView.yaw"
                      :min="-Math.PI"
                      :max="Math.PI"
                      :step="0.1"
                      :precision="2"
                      :disabled="!form.panorama"
                      @input="onCameraParamChange"
                    />
                    <el-button
                      class="clear-yaw-btn"
                      size="small"
                      circle
                      :disabled="!form.panorama"
                      @click="resetYawToZero"
                    >
                      ×
                    </el-button>
                  </el-form-item>

                  <el-form-item label="Pitch">
                    <el-input-number
                      v-model="form.startView.pitch"
                      :min="-Math.PI/2"
                      :max="Math.PI/2"
                      :step="0.1"
                      :precision="2"
                      :disabled="!form.panorama"
                      @input="onCameraParamChange"
                    />
                  </el-form-item>

                  <el-form-item label="FOV">
                    <el-input-number
                      v-model="form.startView.fov"
                      :min="30"
                      :max="120"
                      :step="1"
                      :disabled="!form.panorama"
                      @input="onCameraParamChange"
                    />
                  </el-form-item>
                </div>

                <el-button size="small" @click="resetViewToZero" style="margin-top: 10px">
                  Сбросить вид к нулю
                </el-button>
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
                      @input="onEffectChange"
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
                      @input="onEffectChange"
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
                      @input="onEffectChange"
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
              :hotspots="[]"
              :show-crosshair="true"
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
                :hotspots="form.hotspots"
                :selected-hotspot-id="selectedHotspotId"
                @ready="onHotspotsViewerReady"
                @camera-move="onCameraMove"
                @hotspot-click="onHotspotClick"
                @hotspot-dblclick="onHotspotDblClick"
                @hotspot-drag="onHotspotDrag"
                class="hotspots-viewer__viewer"
              />
            </div>

            <hotspots-editor
              :panorama-loaded="form.panorama && hotspotsViewerInitialized"
              :hotspots="form.hotspots"
              :available-scenes="availableScenes"
              :selected-hotspot-id="selectedHotspotId"
              :current-scene-id="sceneId"
              @add-hotspot="addHotspot"
              @remove-hotspot="removeHotspot"
              @update-hotspot="updateHotspot"
              @clear-hotspots="clearHotspots"
              @select-hotspot="selectHotspot"
              class="scene-editor-page__hotspots-editor"
            />
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
import HotspotsEditor from '@/components/HotspotsEditor.vue'
import { Loading } from '@element-plus/icons-vue'

export default {
  name: 'SceneEditorPage',
  components: { PanoramaViewer, HotspotsEditor, Loading },

  data() {
    return {
      uploading: false,
      sceneSaved: false,
      tour: null,
      sceneId: this.$route.params.sceneId,
      loadingFromDatabase: false,
      applyingStartView: false,
      activeCollapse: [],
      activeTab: 'viewer',
      viewerInitialized: false,
      hotspotsViewerInitialized: false,
      viewerCameraView: null,
      hotspotsCameraView: null,
      selectedHotspotId: null,
      form: {
        name: '',
        panorama: '',
        hotspots: [],
        startView: { yaw: 0, pitch: 0, fov: 60 },
        effects: { brightness: 0.1, contrast: 0.3, saturation: 0.9 }
      }
    }
  },

  computed: {
    availableScenes() {
      if (!this.tour?.data?.scenes) return []
      return Object.keys(this.tour.data.scenes).map(id => ({
        id,
        name: this.tour.data.scenes[id].name || id
      }))
    }
  },

  created() {
    this.loadTour()
  },

  methods: {
    loadTour() {
      this.loadingFromDatabase = true
      toursService.getTourById(this.$route.params.id)
        .then((tour) => {
          this.tour = tour
          const scene = tour.data.scenes?.[this.sceneId]
          if (scene) {
            this.form = {
              name: scene.name,
              panorama: scene.panorama,
              hotspots: scene.hotspots || [],
              startView: scene.startView || { yaw: 0, pitch: 0, fov: 60 },
              effects: scene.effects || { brightness: 0.1, contrast: 0.3, saturation: 0.9 }
            }
          }
        })
        .catch(error => console.error(error))
        .finally(() => { setTimeout(() => { this.loadingFromDatabase = false }, 1000) })
    },

    onCameraMove(view) {
      if (this.loadingFromDatabase || this.applyingStartView) return
      const isViewerTab = this.activeTab === 'viewer'
      const viewData = { yaw: view.yaw, pitch: view.pitch, fov: view.fov }
      
      if (isViewerTab) {
        this.viewerCameraView = viewData
        Object.assign(this.form.startView, viewData)
      } else {
        this.hotspotsCameraView = viewData
      }
    },

    onHotspotClick(hotspotId) {
      this.selectedHotspotId = hotspotId
    },

    selectHotspot(hotspotId) {
      this.selectedHotspotId = hotspotId
    },

    onHotspotDblClick(position) {
      this.$confirm('Создать новый хотспот в этой позиции?', 'Подтверждение', {
        confirmButtonText: 'Да',
        cancelButtonText: 'Нет',
        type: 'info'
      }).then(() => {
        const availableScenes = this.availableScenes.filter(s => s.id !== this.sceneId)
        const newHotspot = {
          id: 'hotspot-' + Date.now(),
          type: 'scene',
          name: 'Новый хотспот',
          position: { yaw: position.yaw, pitch: position.pitch },
          targetScene: availableScenes[0]?.id || '',
          text: 'Описание хотспота'
        }
        this.form.hotspots.push(newHotspot)
        this.selectedHotspotId = newHotspot.id
        this.$message.success('Хотспот создан')
      }).catch(() => {})
    },

    onHotspotDrag(data) {
      const hotspot = this.form.hotspots.find(h => h.id === data.id)
      if (hotspot) {
        hotspot.position.yaw = data.yaw
        hotspot.position.pitch = data.pitch
      }
    },

    addHotspot() {
      const currentView = this.hotspotsCameraView || this.viewerCameraView
      if (!currentView) {
        this.$message.warning('Сначала установите камеру в нужное положение')
        return
      }
      const availableScenes = this.availableScenes.filter(s => s.id !== this.sceneId)
      const newHotspot = {
        id: 'hotspot-' + Date.now(),
        type: 'scene',
        name: 'Новый хотспот',
        position: { yaw: currentView.yaw, pitch: currentView.pitch },
        targetScene: availableScenes[0]?.id || '',
        text: 'Описание хотспота'
      }
      this.form.hotspots.push(newHotspot)
      this.selectedHotspotId = newHotspot.id
      this.$message.success('Хотспот добавлен')
    },

    removeHotspot(index) {
      const hotspot = this.form.hotspots[index]
      if (hotspot?.id === this.selectedHotspotId) {
        this.selectedHotspotId = null
      }
      this.form.hotspots.splice(index, 1)
      this.$message.success('Хотспот удален')
    },

    updateHotspot(index) {
      this.$message.success('Хотспот обновлен')
    },

    clearHotspots() {
      this.selectedHotspotId = null
      this.form.hotspots = []
      this.$message.success('Все хотспоты удалены')
    },

    beforeUpload(file) {
      this.uploading = true
      storageService.uploadPanorama(file, this.sceneId)
        .then((url) => { this.form.panorama = url })
        .catch(error => console.error(error))
        .finally(() => { this.uploading = false })
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
          this.$router.push({ name: 'tour-edit', params: { id: this.tour.id } })
        })
        .catch(error => console.error(error))
    },

    onViewerReady() {
      this.applyStartView()
    },

    applyStartView() {
      const viewer = this.$refs.viewer
      if (!viewer || !this.form.panorama) return
      this.applyingStartView = true
      setTimeout(() => {
        try {
          const scene = this.tour?.data?.scenes?.[this.sceneId]
          const startView = scene?.startView || { yaw: 0, pitch: 0, fov: 60 }
          viewer.setCameraView(startView)
          viewer.setBrightness(this.form.effects.brightness)
          viewer.setContrast(this.form.effects.contrast)
          viewer.setSaturation(this.form.effects.saturation)
        } finally {
          setTimeout(() => { this.applyingStartView = false }, 300)
        }
      }, 100)
    },

    backToTour() {
      this.$router.push({ name: 'tour-edit', params: { id: this.tour.id } })
    },

    onCameraParamChange() {
      const viewer = this.$refs.viewer
      if (viewer && this.form.panorama) {
        viewer.setCameraView(this.form.startView)
      }
    },

    resetViewToZero() {
      this.form.startView = { yaw: 0, pitch: 0, fov: 60 };
      const viewer = this.$refs.viewer;
      if (viewer && this.form.panorama) {
        viewer.setCameraView(this.form.startView);
      }
    },

    resetYawToZero() {
      this.form.startView.yaw = 0;
      const viewer = this.$refs.viewer;
      if (viewer && this.form.panorama) {
        viewer.setCameraView(this.form.startView);
      }
    },

    onEffectChange() {
      const viewer = this.$refs.viewer
      const hotspotsViewer = this.$refs.hotspotsViewer
      if (viewer && this.form.panorama) {
        viewer.setBrightness(this.form.effects.brightness)
        viewer.setContrast(this.form.effects.contrast)
        viewer.setSaturation(this.form.effects.saturation)
      }
      if (hotspotsViewer && this.form.panorama) {
        hotspotsViewer.setBrightness(this.form.effects.brightness)
        hotspotsViewer.setContrast(this.form.effects.contrast)
        hotspotsViewer.setSaturation(this.form.effects.saturation)
      }
    },

    onTabClick(tab) {
      if (tab.props.name === 'viewer' && this.form.panorama && !this.viewerInitialized) {
        this.viewerInitialized = true
        this.$nextTick(() => {
          const viewer = this.$refs.viewer
          if (viewer && this.form.panorama) {
            const scene = this.tour?.data?.scenes?.[this.sceneId]
            const startView = scene?.startView || { yaw: 0, pitch: 0, fov: 60 }
            viewer.setCameraView(startView)
            viewer.setBrightness(this.form.effects.brightness)
            viewer.setContrast(this.form.effects.contrast)
            viewer.setSaturation(this.form.effects.saturation)
          }
        })
      }
      if (tab.props.name === 'hotspots' && this.form.panorama && !this.hotspotsViewerInitialized) {
        this.hotspotsViewerInitialized = true
        this.$nextTick(() => {
          const viewer = this.$refs.hotspotsViewer
          if (viewer && this.form.panorama) {
            const scene = this.tour?.data?.scenes?.[this.sceneId]
            const startView = scene?.startView || { yaw: 0, pitch: 0, fov: 60 }
            setTimeout(() => {
              viewer.setCameraView(startView)
              viewer.setBrightness(this.form.effects.brightness)
              viewer.setContrast(this.form.effects.contrast)
              viewer.setSaturation(this.form.effects.saturation)
              viewer.forceRender()
              this.hotspotsCameraView = startView
            }, 100)
          }
        })
      }
    },

    onHotspotsViewerReady() {
      setTimeout(() => {
        const viewer = this.$refs.hotspotsViewer
        if (viewer && this.form.panorama) {
          viewer.setBrightness(this.form.effects.brightness)
          viewer.setContrast(this.form.effects.contrast)
          viewer.setSaturation(this.form.effects.saturation)
          if (!this.hotspotsCameraView) {
            const scene = this.tour?.data?.scenes?.[this.sceneId]
            const startView = scene?.startView || { yaw: 0, pitch: 0, fov: 60 }
            viewer.setCameraView(startView)
            this.hotspotsCameraView = startView
          } else {
            viewer.setCameraView(this.hotspotsCameraView)
          }
          // Ensure hotspots are rendered
          if (this.form.hotspots && this.form.hotspots.length > 0) {
            viewer.updateHotspots()
          }
          viewer.forceRender()
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

.scene-editor-page__viewer {
  height: 400px;
  background-color: hsl(0 0% 90%);
}

.scene-editor-page__panorama-url {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: hsl(0 0% 40%);
}

.scene-editor-page__camera-controls,
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
  }
}

.yaw-input-item {
  position: relative;
  display: flex;
  align-items: center;
}

.clear-yaw-btn {
  margin-left: 8px;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  font-size: 16px;
  line-height: 1;
}

.hotspots-viewer {
  height: 400px;
  background-color: hsl(0 0% 90%);
}

.hotspots-viewer__viewer {
  width: 100%;
  height: 100%;
}

.scene-editor-page__hotspots-editor {
  margin-top: 1rem;
}
</style>
