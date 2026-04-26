import { useState } from 'react'
import { supabase } from '../lib/supabase'

function validate(email, password, isSignup, username) {
  const errors = {}
  if (isSignup && !username.trim()) errors.username = "Nom d'utilisateur requis"
  if (!email.includes('@') || !email.includes('.')) errors.email = 'Email invalide'
  if (password.length < 6) errors.password = 'Minimum 6 caractères'
  return errors
}

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const MapPinIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--accent)" stroke="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
)

export default function Login() {
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
    setErrors(validate(email, password, isSignup, username))
  }

  const handleChange = (field, value) => {
    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)
    if (field === 'username') setUsername(value)
    if (touched[field]) {
      setErrors(validate(
        field === 'email' ? value : email,
        field === 'password' ? value : password,
        isSignup,
        field === 'username' ? value : username
      ))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGlobalError(null)
    setTouched({ email: true, password: true, username: true })
    const errs = validate(email, password, isSignup, username)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) await supabase.from('profiles').insert({ id: data.user.id, username })
        setSuccess('Un email de confirmation a été envoyé !')
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
    if (error) setGlobalError(error.message)
    else setSuccess('Email de réinitialisation envoyé !')
    setLoading(false)
  }

  const reset = () => {
    setIsForgot(false); setIsSignup(false)
    setGlobalError(null); setSuccess(null)
    setErrors({}); setTouched({})
  }

  const inputClass = (field) =>
    `w-full px-4 py-2.5 bg-[var(--bg-input)] border rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:border-transparent transition ${
      touched[field] && errors[field] ? 'border-red-400 focus:ring-red-400' : 'border-[var(--border)] focus:ring-[var(--accent)]'
    }`

  return (
    <>
      <style>{`
        :root {
          --accent: #FF8045;
          --accent-light: #FFF0E8;
          --accent-border: #FFD4BB;
          --bg-page: #FFFFFF;
          --bg-card: #FFFFFF;
          --bg-input: #F8F8F8;
          --text-primary: #111111;
          --text-secondary: #666666;
          --text-tertiary: #999999;
          --border: #EEEEEE;
        }

        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap');

        .logo-text {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
        }

        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 40px) scale(0.95); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, 30px) scale(1.05); }
          66% { transform: translate(40px, -40px) scale(1.1); }
        }
        @keyframes orb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 50px) scale(0.9); }
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }} className="flex items-center justify-center p-4 overflow-hidden relative">

        {/* Orbes animées */}
        <div className="absolute rounded-full pointer-events-none orb-1" style={{
  width: '500px', height: '500px',
  background: 'radial-gradient(circle, rgba(255,128,69,0.22) 0%, rgba(255,128,69,0) 70%)',
  top: '-100px', left: '-150px',
}} />
<div className="absolute rounded-full pointer-events-none orb-2" style={{
  width: '400px', height: '400px',
  background: 'radial-gradient(circle, rgba(255,128,69,0.18) 0%, rgba(255,128,69,0) 70%)',
  bottom: '-80px', right: '-100px',
}} />
<div className="absolute rounded-full pointer-events-none orb-3" style={{
  width: '300px', height: '300px',
  background: 'radial-gradient(circle, rgba(255,128,69,0.12) 0%, rgba(255,128,69,0) 70%)',
  top: '40%', right: '10%',
}} />

        {/* Card */}
        <div className="relative z-10 w-full max-w-sm p-8 rounded-2xl shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>

          {/* Logo */}
         <div className="flex items-center gap-2 mb-8 justify-center">
            <MapPinIcon />
            <span className="logo-text text-xl" style={{ color: 'var(--text-primary)' }}>SpotMap</span>
          </div>

          {/* Titre */}
          <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
            {isForgot ? 'Mot de passe oublié' : isSignup ? 'Inscription' : 'Connexion'}
          </h1>

          {/* Message succès */}
          {success ? (
            <div className="px-4 py-3 rounded-xl text-sm mb-4" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
              {success}
              <button onClick={reset} className="block mt-2 underline text-xs" style={{ color: 'var(--accent)' }}>
                ← Retour à la connexion
              </button>
            </div>
          ) : isForgot ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Ton email"
                  value={email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={inputClass('email')}
                />
                {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              {globalError && <p className="text-red-500 text-sm">{globalError}</p>}
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50" style={{ backgroundColor: 'var(--accent)' }}>
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
              <button type="button" onClick={reset} className="w-full text-sm" style={{ color: 'var(--text-tertiary)' }}>
                ← Retour
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignup && (
                <div>
                  <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    value={username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    onBlur={() => handleBlur('username')}
                    className={inputClass('username')}
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
                  className={inputClass('email')}
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
                  className={inputClass('password') + ' pr-12'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                {touched.password && errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              {globalError && <p className="text-red-500 text-sm">{globalError}</p>}

              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 mt-1" style={{ backgroundColor: 'var(--accent)' }}>
                {loading ? 'Chargement...' : isSignup ? 'Créer mon compte' : 'Se connecter'}
              </button>

              {!isSignup && (
                <button type="button" onClick={() => { setIsForgot(true); setGlobalError(null) }} className="w-full text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                  Mot de passe oublié ?
                </button>
              )}
            </form>
          )}

          {!success && !isForgot && (
            <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {isSignup ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
              </span>
              <button
                onClick={() => { setIsSignup(!isSignup); setGlobalError(null); setErrors({}); setTouched({}) }}
                className="text-sm font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                {isSignup ? 'Se connecter' : "S'inscrire"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}