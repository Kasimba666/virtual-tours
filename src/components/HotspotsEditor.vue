<template>
  <div class="hotspots-editor">
    <div class="hotspots-editor__controls">
      <el-button
        size="small"
        type="primary"
        @click="addHotspot"
        :disabled="!panoramaLoaded"
      >
        Добавить хотспот
      </el-button>

      <el-button
        size="small"
        type="danger"
        @click="clearHotspots"
        :disabled="!panoramaLoaded"
      >
        Очистить все
      </el-button>
    </div>

    <div class="hotspots-editor__list">
      <div
        v-for="(hotspot, index) in hotspots"
        :key="index"
        class="hotspots-editor__item"
      >
        <div class="hotspots-editor__item-header">
          <span class="hotspots-editor__item-title">
            Хотспот {{ index + 1 }}
          </span>
          <el-button
            size="small"
            type="danger"
            @click="removeHotspot(index)"
          >
            Удалить
          </el-button>
        </div>

        <div class="hotspots-editor__item-content">
          <el-form size="small" label-width="80px">
            <el-form-item label="Тип">
              <el-select v-model="hotspot.type" @change="updateHotspot(index)">
                <el-option label="Сцена" value="scene" />
                <el-option label="Текст" value="text" />
              </el-select>
            </el-form-item>

            <el-form-item label="Название">
              <el-input v-model="hotspot.name" @input="updateHotspot(index)" />
            </el-form-item>

            <el-form-item label="Цвет">
              <el-color-picker v-model="hotspot.color" @change="updateHotspot(index)" />
            </el-form-item>

            <el-form-item label="Позиция">
              <div class="hotspots-editor__position">
                <el-input-number
                  v-model="hotspot.position.yaw"
                  :min="-Math.PI"
                  :max="Math.PI"
                  :step="0.01"
                  :precision="2"
                  @change="updateHotspot(index)"
                />
                <el-input-number
                  v-model="hotspot.position.pitch"
                  :min="-Math.PI/2"
                  :max="Math.PI/2"
                  :step="0.01"
                  :precision="2"
                  @change="updateHotspot(index)"
                />
              </div>
            </el-form-item>

            <el-form-item label="Размер">
              <el-input-number
                v-model="hotspot.size"
                :min="10"
                :max="100"
                :step="1"
                @change="updateHotspot(index)"
              />
            </el-form-item>

            <el-form-item label="Цель" v-if="hotspot.type === 'scene'">
              <el-select v-model="hotspot.targetScene" @change="updateHotspot(index)">
                <el-option
                  v-for="scene in availableScenes"
                  :key="scene.id"
                  :label="scene.name"
                  :value="scene.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Текст" v-if="hotspot.type === 'text'">
              <el-input
                type="textarea"
                v-model="hotspot.text"
                :rows="3"
                @input="updateHotspot(index)"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HotspotsEditor',
  props: {
    panoramaLoaded: {
      type: Boolean,
      default: false
    },
    hotspots: {
      type: Array,
      default: () => []
    },
    availableScenes: {
      type: Array,
      default: () => []
    }
  },
  emits: ['add-hotspot', 'remove-hotspot', 'update-hotspot', 'clear-hotspots'],
  methods: {
    addHotspot() {
      this.$emit('add-hotspot')
    },

    removeHotspot(index) {
      this.$emit('remove-hotspot', index)
    },

    updateHotspot(index) {
      this.$emit('update-hotspot', index)
    },

    clearHotspots() {
      this.$emit('clear-hotspots')
    }
  }
}
</script>

<style scoped lang="scss">
.hotspots-editor {
  padding: 1rem;
  background-color: hsl(0 0% 95%);
  border-radius: 4px;
  margin-top: 1rem;
}

.hotspots-editor__controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.hotspots-editor__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hotspots-editor__item {
  background: white;
  border-radius: 4px;
  padding: 1rem;
  border: 1px solid hsl(0 0% 90%);
}

.hotspots-editor__item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid hsl(0 0% 90%);
  padding-bottom: 0.5rem;
}

.hotspots-editor__item-title {
  font-weight: 600;
  color: hsl(0 0% 20%);
}

.hotspots-editor__item-content {
  .el-form-item {
    margin-bottom: 0.5rem;
  }
}

.hotspots-editor__position {
  display: flex;
  gap: 1rem;
}
</style>