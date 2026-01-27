<!-- src/layout/MainLayout.vue -->
<template>
  <el-container class="main-layout">
    <el-header class="main-layout__header">
      <app-header />
    </el-header>
    <el-main class="main-layout__content">
      <router-view />
    </el-main>
  </el-container>
</template>

<script>
import AppHeader from '@/components/Layout/AppHeader.vue'

export default {
  name: 'MainLayout',
  components: { AppHeader }
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
}

.main-layout__header {
  padding: 0.25rem 0.75rem;
}

.main-layout__content {
  padding: 0.5rem;
}
</style>