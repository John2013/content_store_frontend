/*
 Lightweight API client that maps to the provided OpenAPI endpoints (openapi.json).
 Edit API_BASE to point to your backend.
*/
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

function jsonHeaders(token){
  const h = {'Content-Type': 'application/json'}
  if(token) h['Authorization'] = 'Bearer ' + token
  return h
}

export default {
  // Auth
  async register(email, password){
    const res = await fetch(API_BASE + '/api/users/register', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({email,password})
    })
    if(!res.ok) throw new Error('Register failed')
    return res.json()
  },
  async login(username, password){
    // Endpoint expects form-urlencoded per swagger
    const body = new URLSearchParams()
    body.append('username', username)
    body.append('password', password)
    const res = await fetch(API_BASE + '/api/users/login', {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: body.toString()
    })
    if(!res.ok) throw new Error('Login failed')
    const data = await res.json()
    if(data && data.access_token) localStorage.setItem('token', data.access_token)
    return data
  },
  logout(){
    localStorage.removeItem('token')
  },
  getCurrentUser(){
    try{
      const u = localStorage.getItem('user')
      return u ? JSON.parse(u) : null
    }catch(e){return null}
  },
  // Products / categories
  async getProducts(category_id=null, skip=0, limit=100, include_inactive=false){
    const q = new URLSearchParams()
    if(category_id) q.set('category_id', category_id)
    q.set('skip', skip)
    q.set('limit', limit)
    if(include_inactive) q.set('include_inactive', 'true')
    const res = await fetch(API_BASE + '/api/store/products?' + q.toString())
    if(!res.ok) throw new Error('Failed to fetch products')
    return res.json()
  },
  async getProduct(product_id){
    const res = await fetch(API_BASE + `/api/store/products/${product_id}`)
    if(!res.ok) throw new Error('Failed to fetch product')
    return res.json()
  },
  // Cart (supports anonymous via session_id if you want)
  async getCart(session_id=null){
    const q = session_id ? ('?session_id='+encodeURIComponent(session_id)) : ''
    const res = await fetch(API_BASE + '/api/store/cart' + q)
    if(!res.ok) throw new Error('Failed to fetch cart')
    return res.json()
  },
  async addToCart(item){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + '/api/store/cart', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({item_in: item})
    })
    if(!res.ok) throw new Error('Failed to add to cart')
    return res.json()
  },
  async clearCart(session_id=null){
    const q = session_id ? ('?session_id='+encodeURIComponent(session_id)) : ''
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + '/api/store/cart' + q, {
      method: 'DELETE',
      headers: jsonHeaders(token)
    })
    if(!res.ok) throw new Error('Failed to clear cart')
    return true
  },
  // Orders
  async createOrder(session_id=null){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + '/api/store/orders', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({session_id})
    })
    if(!res.ok) throw new Error('Failed to create order')
    return res.json()
  },
  async payOrder(order_id){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + `/api/store/orders/${order_id}/pay`, {
      method: 'POST',
      headers: jsonHeaders(token)
    })
    if(!res.ok) throw new Error('Failed to pay order')
    return res.json()
  },
  // Purchases / content
  async getPurchases(skip=0, limit=100){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + `/api/store/purchases?skip=${skip}&limit=${limit}`, {
      headers: jsonHeaders(token)
    })
    if(!res.ok) throw new Error('Failed to fetch purchases')
    return res.json()
  },
  async getPurchaseContent(order_id){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + `/api/store/purchases/${order_id}/content`, {
      headers: jsonHeaders(token)
    })
    if(!res.ok) throw new Error('Failed to fetch content')
    return res.json()
  },
  
  // Admin - Categories
  async getCategories(){
    const res = await fetch(API_BASE + '/api/store/categories')
    if(!res.ok) throw new Error('Failed to fetch categories')
    return res.json()
  },
  async getCategoriesWithCounts(){
    const res = await fetch(API_BASE + '/api/store/categories?include_counts=true')
    if(!res.ok) throw new Error('Failed to fetch categories with counts')
    return res.json()
  },
  async getCategory(category_id){
    const res = await fetch(API_BASE + `/api/store/categories/${category_id}`)
    if(!res.ok) throw new Error('Failed to fetch category')
    return res.json()
  },
  async createCategory(data){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + '/api/store/categories', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(data)
    })
    if(!res.ok) throw new Error('Failed to create category')
    return res.json()
  },
  async updateCategory(category_id, data){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + `/api/store/categories/${category_id}`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(data)
    })
    if(!res.ok) throw new Error('Failed to update category')
    return res.json()
  },
  async patchCategory(category_id, data){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + `/api/store/categories/${category_id}`, {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify(data)
    })
    if(!res.ok) throw new Error('Failed to patch category')
    return res.json()
  },
  async deleteCategory(category_id){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + `/api/store/categories/${category_id}`, {
      method: 'DELETE',
      headers: jsonHeaders(token)
    })
    if(!res.ok) throw new Error('Failed to delete category')
    return true
  },
  
  // Admin - Products
  async createProduct(data){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + '/api/store/products', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(data)
    })
    if(!res.ok) throw new Error('Failed to create product')
    return res.json()
  },
  async createProductsBulk(products){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + '/api/store/products/create-many', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({ products })
    })
    if(!res.ok) throw new Error('Failed to create products')
    return res.json()
  },
  async updateProduct(product_id, data){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + `/api/store/products/${product_id}`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(data)
    })
    if(!res.ok) throw new Error('Failed to update product')
    return res.json()
  },
  async patchProduct(product_id, data){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + `/api/store/products/${product_id}`, {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify(data)
    })
    if(!res.ok) throw new Error('Failed to patch product')
    return res.json()
  },
  async deleteProduct(product_id){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + `/api/store/products/${product_id}`, {
      method: 'DELETE',
      headers: jsonHeaders(token)
    })
    if(!res.ok) throw new Error('Failed to delete product')
    return true
  },
  
  // Admin - Reviews
  async getAllReviews(skip=0, limit=100){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + `/api/store/reviews?skip=${skip}&limit=${limit}`, {
      headers: jsonHeaders(token)
    })
    if(!res.ok) throw new Error('Failed to fetch reviews')
    return res.json()
  },
  async deleteReview(review_id){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + `/api/store/reviews/${review_id}`, {
      method: 'DELETE',
      headers: jsonHeaders(token)
    })
    if(!res.ok) throw new Error('Failed to delete review')
    return true
  },
  
  // Admin - User Profile
  async getCurrentUserProfile(){
    const token = localStorage.getItem('token')
    const res = await fetch(API_BASE + '/api/users/me', {
      headers: jsonHeaders(token)
    })
    if(!res.ok) throw new Error('Failed to fetch user profile')
    return res.json()
  }
}
