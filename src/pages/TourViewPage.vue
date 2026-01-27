<template>
  <div class="tour-view-page">
    <el-card class="tour-view-page__card">
      <h2 class="tour-view-page__title">{{ tour?.name }}</h2>

      <div class="tour-view-page__viewer">
        <!-- Здесь позже будет компонент с Three.js -->
        <div class="tour-view-page__placeholder">
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

export default {
  name: 'TourViewPage',
  data() {
    return {
      tour: null,
      loading: false
    }
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated'])
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
          })
          .catch((error) => {
            console.error(error)
          })
          .finally(() => {
            this.loading = false
          })
    },
    editTour() {
      this.$router.push({
        name: 'tour-edit',
        params: { id: this.$route.params.id }
      })
    }
  },
  mounted() {
    const startScene = this.tour.data.startScene
    const view = this.tour.data.startView

    this.loadScene(startScene)

    this.$nextTick(() => {
      this.$refs.viewer.setCameraView(view)
    })
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

.tour-view-page__placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: hsl(0 0% 40%);
}
</style>
