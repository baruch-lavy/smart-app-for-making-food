import React from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'

export default function ModeSelect() {
  const navigate = useNavigate()
  const setChildrenMode = useAppStore(s => s.setChildrenMode)

  const choose = (withKids) => {
    setChildrenMode(!!withKids)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Who are you cooking with?</h1>
        <p className="text-gray-500 mb-6">Choose a mode to get recipes and steps tailored for you.</p>

        <div className="grid gap-4">
          <button onClick={() => choose(false)}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition">
            Cook alone
          </button>

          <button onClick={() => choose(true)}
            className="w-full bg-yellow-50 text-yellow-800 py-3 rounded-xl font-semibold border border-yellow-200 hover:shadow-md transition">
            Cook with children
          </button>
        </div>
      </div>
    </div>
  )
}
