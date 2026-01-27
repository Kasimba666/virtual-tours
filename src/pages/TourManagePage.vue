<template>
  <div class="tour-manage-page">
    <el-card class="tour-manage-page__card">
      <h2 class="tour-manage-page__title">Управление турами</h2>

      <el-button
          type="success"
          size="small"
          class="tour-manage-page__create-btn"
          @click="createTour"
      >
        Создать тур
      </el-button>

      <el-table
          :data="tours"
          size="small"
          class="tour-manage-page__table"
          v-loading="loading"
      >
        <el-table-column prop="name" label="Название" />

        <el-table-column label="Действия" width="220">
          <template #default="scope">
            <el-button
                size="small"
                type="primary"
                @click="editTour(scope.row.id)"
            >
              Редактировать
            </el-button>

            <el-button
                size="small"
                type="danger"
                @click="deleteTour(scope.row.id)"
            >
              Удалить
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import toursService from '@/services/toursService'

export default {
  name: 'TourManagePage',
  computed: {
    ...mapGetters('tours', ['tours']),
    loading() {
      return this.$store.state.tours.loading
    }
  },
  created() {
    this.fetchTours()
  },
  methods: {
    ...mapActions('tours', ['fetchTours']),

    createTour() {
      this.$router.push({ name: 'tour-create' })
    },

    editTour(id) {
      this.$router.push({ name: 'tour-edit', params: { id } })
    },

    deleteTour(id) {
      toursService.deleteTour(id)
          .then(() => {
            this.fetchTours()
          })
          .catch((error) => console.error(error))
    }
  }
}
</script>

<style scoped lang="scss">
.tour-manage-page {
  display: flex;
  justify-content: center;
}

.tour-manage-page__card {
  width: 100%;
  max-width: 800px;
  padding: 0.5rem;
}

.tour-manage-page__title {
  margin: 0 0 0.5rem 0;
}

.tour-manage-page__create-btn {
  margin-bottom: 0.5rem;
}

.tour-manage-page__table {
  margin-top: 0.5rem;
}
</style>
