import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Groups from './pages/Groups'
import GroupMap from './pages/GroupMap'
import Toast from './components/Toast'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [welcomeToast, setWelcomeToast] = useState(null)

  useEffect(() => {
  supabase.auth.getSession().then(({ data, error }) => {
    setSession(data?.session || null)
    setLoading(false)
  }).catch(() => {
    setLoading(false)
  })

  // Timeout de secours si getSession ne répond jamais
  const timeout = setTimeout(() => setLoading(false), 3000)

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    setSession(session)
    setLoading(false)
    if (event === 'SIGNED_IN' && session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single()
      if (profile?.username) {
        setWelcomeToast(`👋 Bienvenue ${profile.username} !`)
      }
    }
  })

  return () => {
    clearTimeout(timeout)
    subscription.unsubscribe()
  }
}, [])

  
  if (loading) {
  return (
    <div style={{ height: '100vh' }} className="flex items-center justify-center">
      <p className="text-slate-500">Chargement...</p>
    </div>
  )
}

  return (
    <>
      {welcomeToast && <Toast message={welcomeToast} onDone={() => setWelcomeToast(null)} />}
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={session ? <Groups session={session} /> : <Navigate to="/login" />} />
        <Route path="/group/:groupId" element={session ? <GroupMap session={session} /> : <Navigate to="/login" />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  )
}