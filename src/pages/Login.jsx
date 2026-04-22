import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignup) {
        // Inscription
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        // Crée le profil associé
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: data.user.id, username })
          if (profileError) throw profileError
        }
      } else {
        // Connexion
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">🗺️ SpotMap</h1>
        <p className="text-slate-500 mb-6">
          {isSignup ? 'Crée ton compte' : 'Connecte-toi pour voir tes spots'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Chargement...' : (isSignup ? 'Créer mon compte' : 'Se connecter')}
          </button>
        </form>

        <button
          onClick={() => { setIsSignup(!isSignup); setError(null) }}
          className="mt-4 text-sm text-blue-600 hover:underline w-full text-center"
        >
          {isSignup ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? S\'inscrire'}
        </button>
      </div>
    </div>
  )
}
