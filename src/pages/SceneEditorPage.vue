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

        <h3 class="scene-editor-page__subtitle">Просмотр панорамы</h3>

        <panorama-viewer
            v-if="form.panorama"
            ref="viewer"
            :src="form.panorama"
            class="scene-editor-page__viewer"
        />

        <el-button
            size="small"
            @click="setAsStartView"
            :disabled="!form.panorama"
        >
          Сделать начальным видом
        </el-button>


        <el-divider />

        <el-form-item>
          <el-button type="primary" size="small" @click="save">
            Сохранить сцену
          </el-button>

          <el-button size="small" @click="backToTour">
            Назад к туру
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
import { Loading } from '@element-plus/icons-vue'

export default {
  name: 'SceneEditorPage',
  components: { PanoramaViewer, Loading },
  data() {
    return {
      uploading: false,
      sceneSaved: false,
      tour: null,
      sceneId: this.$route.params.sceneId,
      form: {
        name: '',
        panorama: '',
        hotspots: []
      }
    }
  },
  created() {
    this.loadTour()
  },
  methods: {
    loadTour() {
      toursService.getTourById(this.$route.params.id)
          .then((tour) => {
            this.tour = tour
            const scene = tour.data.scenes[this.sceneId]

            if (scene) {
              this.form = {
                name: scene.name,
                panorama: scene.panorama,
                hotspots: scene.hotspots || []
              }
            }
          })
          .catch((error) => console.error(error))
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
      this.sceneSaved = true,
      this.tour.data.scenes[this.sceneId] = {
        name: this.form.name,
        panorama: this.form.panorama,
        hotspots: this.form.hotspots
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
        console.warn('PanoramaViewer ещё не готов')
        return
      }

      const view = viewer.getCameraView()
      this.tour.data.startScene = this.sceneId
      this.tour.data.startView = view
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
</style>
