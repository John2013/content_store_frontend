<template>
  <div>
    <h1>Оформление заказа</h1>
    <div v-if="loading">Подготовка...</div>
    <div v-else>
      <p>Нажмите кнопку, чтобы создать заказ и выполнить имитацию оплаты.</p>
      <button class="btn" @click="createAndPay" :disabled="processing">{{ processing ? 'Обработка...' : 'Оплатить (симуляция)' }}</button>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
export default {
  data(){ return { loading: true, processing: false } },
  async created(){ this.loading = false },
  methods:{
    async createAndPay(){
      this.processing = true
      try{
        const order = await api.createOrder()
        await api.payOrder(order.id)
        alert('Платёж успешно симулирован. Перейдите в "Покупки" чтобы просмотреть контент.')
        this.$router.push('/purchases')
      }catch(e){
        console.error(e)
        alert('Ошибка оформления/оплаты заказа')
      }finally{ this.processing = false }
    }
  }
}
</script>

<style scoped>
.btn{ padding:.5rem .8rem; background:#0b74da; color:#fff; border:none; border-radius:6px }
</style>
