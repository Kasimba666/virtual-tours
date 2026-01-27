<template>
  <div class="tour-create-page">
    <el-card class="tour-create-page__card">
      <h2 class="tour-create-page__title">Создание тура</h2>

      <el-form
          :model="form"
          label-width="90px"
          size="small"
          class="tour-create-page__form"
      >
        <el-form-item label="Название">
          <el-input v-model="form.name" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="small" @click="create">
            Создать
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import toursService from '@/services/toursService'
import { mapGetters } from 'vuex'

export default {
  name: 'TourCreatePage',
  data() {
    return {
      form: {
        name: ''
      }
    }
  },
  computed: {
    ...mapGetters('auth', ['currentUser'])
  },
  methods: {
    create() {
      if (!this.form.name.trim()) {
        return
      }

      const newTour = {
        name: this.form.name,
        owner_id: this.currentUser.id,
        data: {
          scenes: {}
        }
      }

      toursService.createTour(newTour)
          .then((result) => {
            const created = result[0]
            this.$router.push({
              name: 'tour-edit',
              params: { id: created.id }
            })
          })
          .catch((error) => {
            console.error(error)
          })
    }
  }
}
</script>

<style scoped lang="scss">
.tour-create-page {
  display: flex;
  justify-content: center;
}

.tour-create-page__card {
  width: 100%;
  max-width: 600px;
  padding: 0.5rem;
}

.tour-create-page__title {
  margin: 0 0 0.5rem 0;
}

.tour-create-page__form {
  margin-top: 0.5rem;
}
</style>
