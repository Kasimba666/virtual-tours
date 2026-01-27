<template>
  <div class="tour-view-page">
    <el-card class="tour-view-page__card">
      <h2 class="tour-view-page__title">{{ tour?.name }}</h2>

      <div class="tour-view-page__viewer">
        <panorama-viewer
            v-if="currentPanorama"
            ref="viewer"
            :src="currentPanorama"
            @ready="applyStartView"
            class="tour-view-page__viewer-canvas"
        />

        <div v-else class="tour-view-page__placeholder">
          Панорама будет здесь
        </div>
      </div>

      <el-button
          type="primary"
          size="small"
          v-if="isAuthenticated"
          @click="editTour"
      >
        Редактировать
      </el-button>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import toursService from '@/services/toursService'
import PanoramaViewer from '@/components/PanoramaViewer.vue'

export default {
  name: 'TourViewPage',
  components: { PanoramaViewer },

  data() {
    return {
      tour: null,
      loading: false,
      currentSceneId: null,
      viewApplied: false   // ← предотвращает повторный вызов applyStartView
    }
  },

  computed: {
    ...mapGetters('auth', ['isAuthenticated']),

    currentPanorama() {
      if (!this.tour || !this.currentSceneId) return null
      return this.tour.data.scenes[this.currentSceneId]?.panorama || null
    }
  },

  created() {
    this.loadTour()
  },

  methods: {
    loadTour() {
      this.loading = true

      toursService.getTourById(this.$route.params.id)
          .then((tour) => {
            this.tour = tour

            // гарантируем структуру
            const data = tour.data || {}
            this.tour.data = {
              startScene: data.startScene || Object.keys(data.scenes || {})[0] || null,
              startView: data.startView || { yaw: 0, pitch: 0, fov: 75 },
              scenes: data.scenes || {}
            }

            // выбираем стартовую сцену
            this.currentSceneId = this.tour.data.startScene

            // сбрасываем флаг — панорама будет пересоздана
            this.viewApplied = false
          })
          .catch((error) => console.error(error))
          .finally(() => {
            this.loading = false
          })
    },

    editTour() {
      this.$router.push({
        name: 'tour-edit',
        params: { id: this.$route.params.id }
      })
    },

    applyStartView() {
      if (this.viewApplied) return

      const view = this.tour?.data?.startView
      if (!view) return

      const viewer = this.$refs.viewer
      if (!viewer) return

      requestAnimationFrame(() => {
        viewer.setCameraView(view)
        this.viewApplied = true
      })
    }

  }
}
</script>

<style scoped lang="scss">
.tour-view-page {
  display: flex;
  justify-content: center;
}

.tour-view-page__card {
  width: 100%;
  max-width: 900px;
  padding: 0.5rem;
}

.tour-view-page__title {
  margin: 0 0 0.5rem 0;
}

.tour-view-page__viewer {
  height: 400px;
  background-color: hsl(0 0% 90%);
  margin-bottom: 0.5rem;
}

.tour-view-page__viewer-canvas {
  height: 100%;
}

.tour-view-page__placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: hsl(0 0% 40%);
}
</style>
