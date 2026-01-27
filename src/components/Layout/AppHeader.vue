<template>
  <el-menu
      mode="horizontal"
      class="app-header"
      :default-active="activeRouteName"
      @select="handleSelect"
  >
    <el-menu-item index="tours">Туры</el-menu-item>

    <el-menu-item
        index="manage"
        v-if="isAuthenticated"
    >
      Управление турами
    </el-menu-item>

    <el-menu-item index="auth" class="app-header__auth">
      <span v-if="!isAuthenticated">Войти</span>
      <span v-else>Выйти</span>
    </el-menu-item>
  </el-menu>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'AppHeader',
  setup() {
    const route = useRoute()
    const router = useRouter()
    return { route, router }
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated']),
    activeRouteName() {
      return this.route.name
    }
  },
  methods: {
    ...mapActions('auth', ['logout']),
    handleSelect(index) {
      if (index === 'tours') {
        this.router.push({ name: 'tours' })
      }

      if (index === 'manage') {
        this.router.push({ name: 'tour-manage' })
      }

      if (index === 'auth') {
        if (this.isAuthenticated) {
          this.logout()
              .then(() => {})
              .catch((error) => console.error(error))
        } else {
          this.router.push({ name: 'auth' })
        }
      }
    }
  }
}
</script>

<style scoped lang="scss">
.app-header {
  border-bottom: 1px solid hsl(0 0% 80%);
}

.app-header__auth {
  margin-left: auto;
}
</style>
