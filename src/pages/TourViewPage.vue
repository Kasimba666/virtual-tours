<template>
  <div class="tour-view-page">
    <el-card class="tour-view-page__card">
      <h2 class="tour-view-page__title">{{ tour?.name }}</h2>

      <div class="tour-view-page__viewer">
        <panorama-viewer
            v-if="currentPanorama"
            ref="viewer"
            :src="currentPanorama"
            :hotspots="currentHotspots"
            @ready="applyStartView"
            @hotspot-click="onHotspotClick"
            class="tour-view-page__viewer-canvas"
        />

        <div v-else class="tour-view-page__placeholder">
          Панорама будет здесь
        </div>
      </div>

      <!-- Список сцен для переключения -->
      <div v-if="isAuthenticated" class="tour-view-page__scenes">
        <h3 class="tour-view-page__scenes-title">Сцены:</h3>
        <el-radio-group v-model="currentSceneId" size="small">
          <el-radio-button
              v-for="(scene, sceneId) in tour?.data?.scenes || {}"
              :key="sceneId"
              :value="sceneId"
              @change="onSceneChange"
          >
            <span class="scene-name">{{ scene.name || sceneId }}</span>
          </el-radio-button>
        </el-radio-group>
      </div>

      <el-button
          type="primary"
          size="small"
          v-if="isAuthenticated"
          @click="backToTours"
      >
        Вернуться к списку
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
    },

    currentHotspots() {
      if (!this.tour || !this.currentSceneId) return []
      const scene = this.tour.data.scenes[this.currentSceneId]
      if (!scene || !scene.hotspots) return []
      
      // Фильтруем хотспоты типа "scene" и возвращаем их
      return scene.hotspots.filter(h => h.type === 'scene')
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

    backToTours() {
      this.$router.push({
        name: 'tours'
      })
    },

    applyStartView() {
      if (this.viewApplied) return

      // Получаем параметры камеры для текущей сцены
      const scene = this.tour?.data?.scenes?.[this.currentSceneId]
      const view = scene?.startView
      
      if (!view) return

      const viewer = this.$refs.viewer
      if (!viewer) return

      console.log('TourViewPage: Применяем параметры камеры для сцены', this.currentSceneId)
      console.log('TourViewPage: Параметры камеры:', view)

      // Применяем параметры камеры с небольшой задержкой для надежности
      setTimeout(() => {
        viewer.setCameraView(view)
        this.viewApplied = true
        console.log('TourViewPage: Параметры камеры применены')
      }, 100)
    },

    onSceneChange() {
      // Сбрасываем флаг, чтобы применить новые параметры камеры
      // и даем время на переключение панорамы
      setTimeout(() => {
        this.viewApplied = false
      }, 100)
    },

    onHotspotClick(hotspotId) {
      // Ищем хотспот во всех сценах
      for (const [sceneId, scene] of Object.entries(this.tour.data.scenes)) {
        const hotspot = scene.hotspots?.find(h => h.id === hotspotId)
        if (hotspot && hotspot.type === 'scene' && hotspot.targetScene) {
          // Проверяем, что целевая сцена существует
          if (this.tour.data.scenes[hotspot.targetScene]) {
            console.log('TourViewPage: Переходим к сцене', hotspot.targetScene)
            this.currentSceneId = hotspot.targetScene
            this.viewApplied = false
            return
          }
        }
      }
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

.tour-view-page__scenes {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: hsl(0 0% 95%);
  border-radius: 4px;
}

.tour-view-page__scenes-title {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: hsl(0 0% 40%);
}

.scene-name {
  margin-right: 0.25rem;
}

.scene-tag {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}
</style>
