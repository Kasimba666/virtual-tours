<template>
  <div class="auth-page">
    <el-card class="auth-page__card">
      <h2 class="auth-page__title">Вход</h2>

      <el-form
          :model="form"
          label-width="80px"
          size="small"
          class="auth-page__form"
      >
        <el-form-item label="Email">
          <el-input v-model="form.email" />
        </el-form-item>

        <el-form-item label="Пароль">
          <el-input v-model="form.password" type="password" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="small" @click="submitLogin">
            Войти
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'AuthPage',
  data() {
    return {
      form: {
        email: '',
        password: ''
      }
    }
  },
  methods: {
    ...mapActions('auth', ['login']),
    submitLogin() {
      this.login({
        email: this.form.email,
        password: this.form.password
      })
          .then(() => {
            this.$router.push({ name: 'tours' })
          })
          .catch((error) => {
            console.error(error)
          })
    }
  }
}
</script>


<style scoped lang="scss">
.auth-page {
  display: flex;
  justify-content: center;
}

.auth-page__card {
  width: 100%;
  max-width: 400px;
  padding: 0.5rem;
}

.auth-page__title {
  margin: 0 0 0.5rem 0;
}

.auth-page__form {
  margin-top: 0.5rem;
}
</style>
