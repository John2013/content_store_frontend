<template>
  <div>
    <h1>Корзина</h1>
    <div v-if="loading">Загрузка...</div>
    <div v-else>
      <div v-if="items.length===0">Корзина пуста</div>
      <div v-else>
        <ul>
          <li v-for="it in items" :key="it.id">
            {{ it.product.title }} — {{ it.quantity }} × {{ formatPrice(it.product.price) }}
          </li>
        </ul>
        <router-link to="/checkout" class="btn">Оформить заказ</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
export default {
  data(){ return { items: [], loading: true } },
  async created(){
    await this.fetch()
  },
  methods:{
    async fetch(){
      try{
        this.items = await api.getCart()
      }catch(e){ console.error(e); alert('Не удалось загрузить корзину') }
      finally{ this.loading = false }
    },
    formatPrice(v){ return v ? v + ' ₽' : 'Бесплатно' }
  }
}
</script>

<style scoped>
.btn{ padding:.5rem .8rem; background:#0b74da; color:#fff; border:none; border-radius:6px; text-decoration:none }
</style>
