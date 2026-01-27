<template>
  <div class="tours-page">
    <el-card class="tours-page__card">
      <h2 class="tours-page__title">Список туров</h2>

      <el-table
          :data="tours"
          size="small"
          class="tours-page__table"
          v-loading="loading"
      >
        <el-table-column prop="name" label="Название" />
        <el-table-column label="Действия" width="120">
          <template #default="scope">
            <el-button
                size="small"
                type="primary"
                @click="openTour(scope.row.id)"
            >
              Открыть
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'ToursPage',
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
    openTour(id) {
      this.$router.push({ name: 'tour-view', params: { id } })
    }
  }
}
</script>

<style scoped lang="scss">
.tours-page {
  display: flex;
  justify-content: center;
}

.tours-page__card {
  width: 100%;
  max-width: 700px;
  padding: 0.5rem;
}

.tours-page__title {
  margin: 0 0 0.5rem 0;
}

.tours-page__table {
  margin-top: 0.5rem;
}
</style>
