import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChefHat, Package, ShoppingCart, User, Trash2 } from 'lucide-react'
import api from '../services/api'

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-gray-400"><ChefHat className="w-5 h-5" /><span className="text-xs">Home</span></Link>
      <Link to="/pantry" className="flex flex-col items-center gap-1 text-gray-400"><Package className="w-5 h-5" /><span className="text-xs">Pantry</span></Link>
      <Link to="/shopping" className="flex flex-col items-center gap-1 text-primary"><ShoppingCart className="w-5 h-5" /><span className="text-xs">Shopping</span></Link>
      <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-400"><User className="w-5 h-5" /><span className="text-xs">Profile</span></Link>
    </nav>
  )
}

export default function ShoppingList() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', quantity: '', unit: '' })

  const { data, isLoading } = useQuery({ queryKey: ['shopping'], queryFn: () => api.get('/shopping').then(r => r.data) })
  const items = data?.items || []

  const addMutation = useMutation({
    mutationFn: (item) => api.post('/shopping/add', item),
    onSuccess: () => { qc.invalidateQueries(['shopping']); setForm({ name: '', quantity: '', unit: '' }) }
  })

  const checkMutation = useMutation({
    mutationFn: (itemId) => api.put(`/shopping/${itemId}/check`),
    onSuccess: () => qc.invalidateQueries(['shopping'])
  })

  const clearCheckedMutation = useMutation({
    mutationFn: () => {
      const unchecked = items.filter(i => !i.checked)
      return api.post('/shopping', { items: unchecked })
    },
    onSuccess: () => qc.invalidateQueries(['shopping'])
  })

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    addMutation.mutate(form)
  }

  const checkedCount = items.filter(i => i.checked).length

  // Group items by recipeSource
  const grouped = items.reduce((acc, item) => {
    const key = item.recipeSource || '__manual__'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const groupKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '__manual__') return 1
    if (b === '__manual__') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🛒 Shopping List</h1>
          {checkedCount > 0 && (
            <button onClick={() => clearCheckedMutation.mutate()} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" /> Clear Checked ({checkedCount})
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 flex gap-2 flex-wrap">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Item name *" required
            className="flex-1 min-w-[140px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          <input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Qty"
            className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="Unit"
            className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          <button type="submit" disabled={addMutation.isPending}
            className="flex items-center gap-1 px-4 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {isLoading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">🛍️</div>
            <p className="font-medium">Your shopping list is empty.</p>
            <p className="text-sm mt-1">Add items manually or get suggestions from a recipe!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupKeys.map(groupKey => (
              <div key={groupKey}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {groupKey === '__manual__' ? '📝 Added manually' : `🍳 ${groupKey}`}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">
                    {grouped[groupKey].filter(i => i.checked).length}/{grouped[groupKey].length}
                  </span>
                </div>

                {/* Items in this group */}
                <div className="space-y-2">
                  {grouped[groupKey].map(item => (
                    <button key={item._id} onClick={() => checkMutation.mutate(item._id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border bg-white text-left transition-all ${item.checked ? 'opacity-60 border-gray-100' : 'border-gray-200 hover:border-primary'}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${item.checked ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                        {item.checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1">
                        <span className={`font-medium text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.name}</span>
                        {(item.quantity || item.unit) && <span className="text-xs text-gray-400 ml-2">{item.quantity} {item.unit}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
