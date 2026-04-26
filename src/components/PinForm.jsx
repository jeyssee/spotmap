import { useState } from 'react'
import { supabase } from '../lib/supabase'

const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function PinForm({ position, groupId, userId, categories, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('food')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.from('pins').insert({
      group_id: groupId, user_id: userId,
      title, description, category,
      lat: position.lat, lng: position.lng,
    })
    if (error) { setError(error.message); setLoading(false) }
    else onCreated()
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: '12px', fontSize: '13px', color: 'var(--text-primary)',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'absolute', bottom: '16px', left: '16px', right: '16px',
      maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto',
      backgroundColor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
      borderRadius: '20px', padding: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      border: '1px solid var(--border)',
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Nouveau spot</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
          <XIcon size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text" placeholder="Nom du spot" value={title}
          onChange={(e) => setTitle(e.target.value)} required
          style={inputStyle}
        />
        <textarea
          placeholder="Ton avis... (optionnel)" value={description}
          onChange={(e) => setDescription(e.target.value)} rows={2}
          style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
        />

        {/* Catégories */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {Object.entries(categories).map(([key, { label, color }]) => (
            <button
              key={key} type="button"
              onClick={() => setCategory(key)}
              style={{
                padding: '5px 12px', borderRadius: '100px',
                fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                backgroundColor: category === key ? color : 'var(--bg-input)',
                color: category === key ? 'white' : 'var(--text-secondary)',
                border: '1px solid ' + (category === key ? color : 'var(--border)'),
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>{error}</p>}

        <button
          type="submit" disabled={loading}
          style={{
            backgroundColor: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: '12px', padding: '11px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            opacity: loading ? 0.6 : 1, marginTop: '2px',
          }}
        >
          {loading ? 'Enregistrement...' : 'Épingler ce spot'}
        </button>
      </form>
    </div>
  )
}