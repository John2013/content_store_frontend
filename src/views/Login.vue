<template>
  <div>
    <h1>Вход / Регистрация</h1>
    <div class="form">
      <input v-model="email" placeholder="Email" />
      <input v-model="password" placeholder="Пароль" type="password" />
      <div class="actions">
        <button @click="doLogin" class="btn">Войти</button>
        <button @click="doRegister" class="btn-ghost">Зарегистрироваться</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
import * as auth from '../services/auth'

export default {
  data(){ return { email:'', password:'' } },
  methods:{
    async doLogin(){
      try{
        const data = await api.login(this.email, this.password)
        if(data && data.access_token) {
          // Save token
          auth.setToken(data.access_token)
          
          // Fetch and save user profile
          try {
            const userProfile = await api.getCurrentUserProfile()
            auth.setCurrentUser(userProfile)
            
            alert('Успешный вход')
            
            // Redirect staff users to admin panel, others to home
            if (userProfile.is_staff) {
              this.$router.push('/admin')
            } else {
              this.$router.push('/')
            }
          } catch (profileError) {
            console.error('Failed to fetch user profile:', profileError)
            alert('Вход успешен, но не удалось загрузить профиль')
            this.$router.push('/')
          }
        } else {
          alert('Вход успешен (нет токена в ответе).')
          this.$router.push('/')
        }
      }catch(e){ console.error(e); alert('Ошибка входа') }
    },
    async doRegister(){
      try{
        await api.register(this.email, this.password)
        alert('Регистрация успешна — теперь войдите.')
      }catch(e){ console.error(e); alert('Ошибка регистрации') }
    }
  }
}
</script>

<style scoped>
.form{ max-width:360px }
input{ display:block; width:100%; padding:.6rem; margin-bottom:.6rem; border-radius:6px; border:1px solid #ddd }
.actions{ display:flex; gap:.5rem }
.btn{ padding:.5rem .8rem; background:#0b74da; color:#fff; border:none; border-radius:6px }
.btn-ghost{ padding:.5rem .8rem; background:transparent; border:1px solid #0b74da; color:#0b74da; border-radius:6px }
</style>
