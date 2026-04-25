import { useState } from 'react'
import { supabase } from '../lib/supabase'

function validate(email, password, isSignup, username) {
  const errors = {}
  if (isSignup && !username.trim()) errors.username = "Nom d'utilisateur requis"
  if (!email.includes('@') || !email.includes('.')) errors.email = 'Email invalide'
  if (password.length < 6) errors.password = 'Minimum 6 caractères'
  return errors
}

export default function Login({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false)
  const [isForgot, setIsForgot] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [globalError, setGlobalError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }))
    const errs = validate(email, password, isSignup, username)
    setErrors(errs)
  }

  const handleChange = (field, value) => {
    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)
    if (field === 'username') setUsername(value)
    if (touched[field]) {
      const errs = validate(
        field === 'email' ? value : email,
        field === 'password' ? value : password,
        isSignup,
        field === 'username' ? value : username
      )
      setErrors(errs)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGlobalError(null)

    // Valide tout avant submit
    const allTouched = { email: true, password: true, username: true }
    setTouched(allTouched)
    const errs = validate(email, password, isSignup, username)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').insert({ id: data.user.id, username })
        }
        setSuccess('Un email de confirmation a été envoyé ! Vérifie ta boîte mail.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setGlobalError(null)
    if (!email.includes('@')) { setErrors({ email: 'Email invalide' }); setTouched({ email: true }); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setGlobalError(error.message)
    } else {
      setSuccess('Email de réinitialisation envoyé ! Vérifie ta boîte mail.')
    }
    setLoading(false)
  }

  const reset = () => {
    setIsForgot(false)
    setIsSignup(false)
    setGlobalError(null)
    setSuccess(null)
    setErrors({})
    setTouched({})
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-1 text-slate-900">🗺️ SpotMap</h1>
        <p className="text-slate-500 mb-6 text-sm">
          {isForgot ? 'Réinitialise ton mot de passe'
            : isSignup ? 'Crée ton compte'
            : 'Connecte-toi pour voir tes spots'}
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
            {success}
            <button onClick={reset} className="block mt-2 text-green-600 hover:underline text-xs">
              ← Retour à la connexion
            </button>
          </div>
        ) : isForgot ? (
          // Formulaire mot de passe oublié
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Ton email"
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${touched.email && errors.email ? 'border-red-400' : 'border-slate-300'}`}
              />
              {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            {globalError && <p className="text-red-500 text-sm">{globalError}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
            <button type="button" onClick={reset} className="w-full text-sm text-slate-500 hover:text-slate-700">
              ← Retour
            </button>
          </form>
        ) : (
          // Formulaire connexion / inscription
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  onBlur={() => handleBlur('username')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${touched.username && errors.username ? 'border-red-400' : 'border-slate-300'}`}
                />
                {touched.username && errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>
            )}

            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${touched.email && errors.email ? 'border-red-400' : 'border-slate-300'}`}
              />
              {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${touched.password && errors.password ? 'border-red-400' : 'border-slate-300'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
              {touched.password && errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {globalError && <p className="text-red-500 text-sm">{globalError}</p>}

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? 'Chargement...' : isSignup ? 'Créer mon compte' : 'Se connecter'}
            </button>

            {!isSignup && (
              <button type="button" onClick={() => { setIsForgot(true); setGlobalError(null) }} className="w-full text-xs text-slate-400 hover:text-slate-600">
                Mot de passe oublié ?
              </button>
            )}
          </form>
        )}

        {!success && !isForgot && (
          <button
            onClick={() => { setIsSignup(!isSignup); setGlobalError(null); setErrors({}); setTouched({}) }}
            className="mt-4 text-sm text-blue-600 hover:underline w-full text-center"
          >
            {isSignup ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
          </button>
        )}
      </div>
    </div>
  )
}