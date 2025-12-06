<template>
  <div>
    <h1>Покупки и доступный контент</h1>
    <div v-if="loading">Загрузка...</div>
    <div v-else>
      <div v-if="contents.length===0">Нет приобретённого контента.</div>
      <div v-else>
        <div v-for="c in contents" :key="c.product_id" class="card">
          <h3>{{ c.product_title }}</h3>
          <p class="muted">Куплено: {{ new Date(c.purchased_at).toLocaleString() }}</p>
          <pre class="content">{{ c.content_text }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
export default {
  data(){ return { contents: [], loading: true } },
  async created(){
    try{
      const purchases = await api.getPurchases()
      const contentPromises = (purchases || []).map(async p => {
        try{
          const cont = await api.getPurchaseContent(p.order_id || p.id)
          return cont || []
        }catch(e){
          return []
        }
      })
      const nested = await Promise.all(contentPromises)
      this.contents = nested.flat()
    }catch(e){ console.error(e); alert('Не удалось получить покупки/контент') }
    finally{ this.loading = false }
  }
}
</script>

<style scoped>
.card{ padding:1rem; border:1px solid #eee; border-radius:8px; margin-bottom:1rem }
.muted{ color:#666; font-size:.95rem }
.content{ white-space:pre-wrap; background:#fafafa; padding:1rem; border-radius:6px; border:1px dashed #eee }
</style>
