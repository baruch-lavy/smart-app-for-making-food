import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })(),
  token: localStorage.getItem('token'),
  login: (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    set({ user: userData, token })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },
  updateUser: (updates) => {
    set(state => {
      const updated = { ...state.user, ...updates }
      localStorage.setItem('user', JSON.stringify(updated))
      return { user: updated }
    })
  }
}))

export default useAuthStore
