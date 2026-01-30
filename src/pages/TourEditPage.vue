<template>
  <div class="tour-edit-page">
    <el-card class="tour-edit-page__card">
      <h2 class="tour-edit-page__title">Редактирование тура</h2>

      <el-form
          :model="form"
          label-width="90px"
          size="small"
          class="tour-edit-page__form"
      >
        <el-form-item label="Название">
          <el-input v-model="form.name" />
        </el-form-item>

        <el-divider />

        <h3 class="tour-edit-page__subtitle">Сцены</h3>

        <el-form-item label="Начальная сцена">
          <el-select v-model="form.data.startScene" placeholder="Выберите сцену">
            <el-option
                v-for="(scene, id) in form.data.scenes"
                :key="id"
                :label="scene.name"
                :value="id"
            />
          </el-select>
        </el-form-item>


        <el-divider />

        <el-table
            :data="sceneList"
            size="small"
            class="tour-edit-page__table"
        >
          <el-table-column prop="id" label="ID" width="120" />
          <el-table-column prop="name" label="Название" />

          <el-table-column label="Действия" width="210">
            <template #default="scope">
              <el-button
                  size="small"
                  type="primary"
                  @click="openScene(scope.row.id)"
              >
                Редактировать
              </el-button>
              <el-button
                  size="small"
                  type="danger"
                  @click="removeScene(scope.row.id)"
              >
                Удалить
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-button
            type="success"
            size="small"
            class="tour-edit-page__add-btn"
            @click="addScene"
        >
          Добавить сцену
        </el-button>

        <el-divider />

        <el-form-item>
          <el-button type="primary" size="small" @click="save">
            Сохранить тур
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import toursService from '@/services/toursService'

export default {
  name: 'TourEditPage',
  data() {
    return {
      form: {
        id: null,
        name: '',
        data: {
          startScene: null,
          scenes: {}
        }
      }
    }
  },
  computed: {
    sceneList() {
      return Object.keys(this.form.data.scenes).map((id) => {
        return {
          id,
          name: this.form.data.scenes[id].name || '(без названия)'
        }
      })
    }
  },
  created() {
    this.loadTour()
  },
  methods: {
    loadTour() {
      toursService.getTourById(this.$route.params.id)
          .then((tour) => {
            const data = tour.data || {}

            this.form = {
              id: tour.id,
              name: tour.name,
              data: {
                startScene: data.startScene || null,
                scenes: data.scenes || {}
              }
            }

            // сохраняем оригинал
            this.original = JSON.stringify(this.form)
          })
    },

    save() {
      const current = JSON.stringify(this.form)

      if (current === this.original) {
        // ничего не изменилось
        this.$router.push({ name: 'tour-manage' })
        return
      }

      toursService.saveTour(this.form)
          .then(() => {
            this.$message.success('Тур сохранён')
            this.$router.push({ name: 'tour-manage' })
          })
    },

    addScene() {
      const id = 'scene-' + Date.now()

      this.form.data.scenes = {
        ...this.form.data.scenes,
        [id]: {
          name: 'Новая сцена',
          panorama: '',
          hotspots: []
        }
      }

    },

    removeScene(id) {
      const copy = { ...this.form.data.scenes }
      delete copy[id]
      this.form.data.scenes = copy
    },

    openScene(id) {
      this.$router.push({
        name: 'scene-edit',
        params: {
          id: this.form.id,
          sceneId: id
        }
      })
    }

  }
}
</script>

<style scoped lang="scss">
.tour-edit-page {
  display: flex;
  justify-content: center;
}

.tour-edit-page__card {
  width: 100%;
  max-width: 900px;
  padding: 0.5rem;
}

.tour-edit-page__title {
  margin: 0 0 0.5rem 0;
}

.tour-edit-page__subtitle {
  margin: 0 0 0.5rem 0;
}

.tour-edit-page__table {
  margin-bottom: 0.5rem;
}

.tour-edit-page__add-btn {
  margin-bottom: 0.5rem;
}
</style>
