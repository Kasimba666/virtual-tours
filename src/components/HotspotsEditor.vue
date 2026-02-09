<template>
  <div class="hotspots-editor">
    <div class="hotspots-editor__controls">
      <el-button
        size="small"
        type="primary"
        @click="$emit('add-hotspot')"
        :disabled="!panoramaLoaded"
      >
        Добавить хотспот
      </el-button>

      <el-button
        size="small"
        type="danger"
        @click="$emit('clear-hotspots')"
        :disabled="!panoramaLoaded || hotspots.length === 0"
      >
        Очистить все
      </el-button>
    </div>

    <div class="hotspots-editor__list" v-if="hotspots.length > 0">
      <div
        v-for="(hotspot, index) in hotspots"
        :key="hotspot.id"
        class="hotspots-editor__item"
        :class="{ 'hotspots-editor__item--selected': hotspot.id === selectedHotspotId }"
        @click="$emit('select-hotspot', hotspot.id)"
      >
        <div class="hotspots-editor__item-header">
          <div class="hotspots-editor__item-info">
            <span class="hotspots-editor__item-title">
              <el-icon><Location /></el-icon>
              {{ hotspot.name || `Хотспот ${index + 1}` }}
            </span>
            <span class="hotspots-editor__item-color" :style="{ backgroundColor: hotspot.color }"></span>
          </div>
          <el-button
            size="small"
            type="danger"
            @click.stop="$emit('remove-hotspot', index)"
          >
            Удалить
          </el-button>
        </div>

        <div class="hotspots-editor__item-content">
          <el-form size="small" label-width="70px">
            <el-form-item label="Тип">
              <el-select v-model="hotspot.type" @change="$emit('update-hotspot', index)">
                <el-option label="Сцена" value="scene" />
                <el-option label="Текст" value="text" />
              </el-select>
            </el-form-item>

            <el-form-item label="Название">
              <el-input v-model="hotspot.name" @input="$emit('update-hotspot', index)" />
            </el-form-item>

            <el-form-item label="Цвет">
              <el-color-picker v-model="hotspot.color" @change="$emit('update-hotspot', index)" />
            </el-form-item>

            <el-form-item label="Позиция">
              <div class="hotspots-editor__position">
                <el-input-number
                  v-model="hotspot.position.yaw"
                  :min="-Math.PI"
                  :max="Math.PI"
                  :step="0.01"
                  :precision="2"
                  size="small"
                  @change="$emit('update-hotspot', index)"
                />
                <el-input-number
                  v-model="hotspot.position.pitch"
                  :min="-Math.PI/2"
                  :max="Math.PI/2"
                  :step="0.01"
                  :precision="2"
                  size="small"
                  @change="$emit('update-hotspot', index)"
                />
              </div>
            </el-form-item>

            <el-form-item label="Размер">
              <el-input-number
                v-model="hotspot.size"
                :min="10"
                :max="100"
                :step="1"
                size="small"
                @change="$emit('update-hotspot', index)"
              />
            </el-form-item>

            <el-form-item label="Цель" v-if="hotspot.type === 'scene'">
              <el-select v-model="hotspot.targetScene" @change="$emit('update-hotspot', index)">
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
                :rows="2"
                @input="$emit('update-hotspot', index)"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <el-empty v-else description="Нет хотспотов" :image-size="60" />
  </div>
</template>

<script>
import { Location } from '@element-plus/icons-vue'

export default {
  name: 'HotspotsEditor',
  components: { Location },
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
    },
    selectedHotspotId: {
      type: String,
      default: null
    }
  },
  emits: ['add-hotspot', 'remove-hotspot', 'update-hotspot', 'clear-hotspots', 'select-hotspot']
}
</script>

<style scoped lang="scss">
.hotspots-editor {
  padding: 0.5rem;
  background-color: hsl(0 0% 95%);
  border-radius: 4px;
}

.hotspots-editor__controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.hotspots-editor__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.hotspots-editor__item {
  background: white;
  border-radius: 4px;
  padding: 0.5rem;
  border: 2px solid hsl(0 0% 90%);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: hsl(0 0% 80%);
  }

  &--selected {
    border-color: hsl(0 80% 50%);
    background-color: hsl(0 100% 98%);
  }
}

.hotspots-editor__item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid hsl(0 0% 95%);
}

.hotspots-editor__item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hotspots-editor__item-title {
  font-weight: 600;
  font-size: 13px;
  color: hsl(0 0% 20%);
  display: flex;
  align-items: center;
  gap: 4px;
}

.hotspots-editor__item-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid hsl(0 0% 80%);
}

.hotspots-editor__item-content {
  .el-form-item {
    margin-bottom: 0.25rem;
    
    .el-form-item__label {
      font-size: 11px;
      padding-bottom: 2px;
    }
  }

  .el-select,
  .el-input,
  .el-textarea {
    width: 100%;
  }
}

.hotspots-editor__position {
  display: flex;
  gap: 0.5rem;
}
</style>
