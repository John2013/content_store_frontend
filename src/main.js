import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.scss'
import './styles/admin.scss'

const app = createApp(App)
app.use(router)
app.mount('#app')
