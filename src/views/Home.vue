<template>
  <div>
    <h1>Каталог</h1>
    <div v-if="loading">Загрузка...</div>
    <div class="grid" v-else>
      <div class="card" v-for="p in products" :key="p.id">
        <h3>{{ p.title }}</h3>
        <p class="muted">{{ p.description }}</p>
        <div class="meta">
          <strong>{{ formatPrice(p.price) }}</strong>
          <router-link :to="'/product/' + p.id" class="btn">Подробнее</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
export default {
  data(){ return { products: [], loading: true } },
  async created(){
    try{
      this.products = await api.getProducts()
    }catch(e){
      console.error(e); alert('Ошибка загрузки каталога')
    }finally{ this.loading = false }
  },
  methods:{
    formatPrice(v){ return v ? v + ' ₽' : 'Бесплатно' }
  }
}
</script>

<style scoped>
.grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem }
.card{ padding:1rem; border:1px solid #eee; border-radius:8px; background:#fff }
.meta{ display:flex; justify-content:space-between; align-items:center; margin-top:1rem }
.muted{ color:#666; font-size:.95rem }
.btn{ padding:.4rem .6rem; background:#0b74da; color:#fff; text-decoration:none; border-radius:6px }
</style>
