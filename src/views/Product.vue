<template>
  <div>
    <div v-if="loading">Загрузка...</div>
    <div v-else>
      <h2>{{ product.title }}</h2>
      <p class="muted">{{ product.description }}</p>
      <p><strong>Цена: </strong>{{ formatPrice(product.price) }}</p>

      <div class="actions">
        <button @click="addToCart" class="btn">Добавить в корзину</button>
        <router-link to="/cart" class="btn-ghost">Перейти в корзину</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
export default {
  props: ['id'],
  data(){ return { product: null, loading: true } },
  async created(){
    try{
      const pid = this.$route.params.id || this.id
      this.product = await api.getProduct(pid)
    }catch(e){ console.error(e); alert('Ошибка загрузки продукта') }
    finally{ this.loading = false }
  },
  methods:{
    async addToCart(){
      try{
        await api.addToCart({ product_id: this.product.id, quantity: 1 })
        alert('Товар добавлен в корзину')
        this.$emit('update-cart')
      }catch(e){ console.error(e); alert('Не удалось добавить в корзину') }
    },
    formatPrice(v){ return v ? v + ' ₽' : 'Бесплатно' }
  }
}
</script>

<style scoped>
.actions{ margin-top:1rem }
.btn{ padding:.5rem .8rem; background:#0b74da; color:#fff; border:none; border-radius:6px }
.btn-ghost{ padding:.4rem .6rem; background:transparent; border:1px solid #0b74da; color:#0b74da; border-radius:6px; text-decoration:none }
</style>
