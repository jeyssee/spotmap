import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const REACTIONS = ['🔥', '❤️', '👍']

const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const EditIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const SendIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

export default function PinDetail({ pin, session, categories, onClose, onDeleted, onReactionUpdate, onEdited }) {
  const [comments, setComments] = useState([])
  const [reactions, setReactions] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(pin.title)
  const [editDescription, setEditDescription] = useState(pin.description || '')
  const [editCategory, setEditCategory] = useState(pin.category)
  const [saving, setSaving] = useState(false)

  const isOwner = pin.user_id === session?.user?.id
  const catColor = categories[pin.category]?.color || '#64748b'

  useEffect(() => { fetchComments(); fetchReactions() }, [pin.id])

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*, profiles(username)').eq('pin_id', pin.id).order('created_at', { ascending: true })
    setComments(data || [])
  }
  const fetchReactions = async () => {
    const { data } = await supabase.from('reactions').select('*').eq('pin_id', pin.id)
    setReactions(data || [])
  }
  const toggleReaction = async (type) => {
    const existing = reactions.find(r => r.user_id === session.user.id && r.type === type)
    if (existing) await supabase.from('reactions').delete().eq('id', existing.id)
    else await supabase.from('reactions').insert({ pin_id: pin.id, user_id: session.user.id, type })
    fetchReactions(); onReactionUpdate()
  }
  const addComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setLoading(true)
    await supabase.from('comments').insert({ pin_id: pin.id, user_id: session.user.id, content: newComment })
    setNewComment(''); fetchComments(); setLoading(false)
  }
  const deletePin = async () => {
    if (!confirm('Supprimer ce spot ?')) return
    setDeleting(true)
    const { error } = await supabase.from('pins').delete().eq('id', pin.id)
    if (!error) onDeleted()
    setDeleting(false)
  }
  const saveEdit = async (e) => {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('pins').update({ title: editTitle, description: editDescription, category: editCategory }).eq('id', pin.id)
    if (!error) { setEditing(false); onEdited() }
    setSaving(false)
  }

  const reactionCounts = REACTIONS.reduce((acc, type) => { acc[type] = reactions.filter(r => r.type === type).length; return acc }, {})
  const myReactions = reactions.filter(r => r.user_id === session?.user?.id).map(r => r.type)

  const inputStyle = {
    width: '100%', padding: '9px 13px',
    backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: '10px', fontSize: '13px', color: 'var(--text-primary)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{
      position: 'absolute', bottom: '16px', right: '16px',
      width: '320px',
      backgroundColor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      border: '1px solid var(--border)',
      zIndex: 1000, maxHeight: '70vh', overflowY: 'auto',
    }}>

      {editing ? (
        <form onSubmit={saveEdit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Modifier</h3>
            <button type="button" onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}><XIcon size={18} /></button>
          </div>
          <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required placeholder="Nom du spot" style={inputStyle} />
          <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" rows={2} style={{ ...inputStyle, resize: 'none' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(categories).map(([key, { label, color }]) => (
              <button key={key} type="button" onClick={() => setEditCategory(key)} style={{
                padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '500', cursor: 'pointer',
                backgroundColor: editCategory === key ? color : 'var(--bg-input)',
                color: editCategory === key ? 'white' : 'var(--text-secondary)',
                border: '1px solid ' + (editCategory === key ? color : 'var(--border)'),
              }}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, padding: '9px', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', background: 'none', color: 'var(--text-secondary)' }}>Annuler</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '9px', backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ padding: '20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ flex: 1, paddingRight: '8px' }}>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', backgroundColor: catColor + '18', color: catColor, marginBottom: '6px' }}>
                {categories[pin.category]?.label || 'Autre'}
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{pin.title}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '3px 0 0' }}>par {pin.profiles?.username || 'Anonyme'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {isOwner && (
                <>
                  <button onClick={() => setEditing(true)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}><EditIcon size={14} /></button>
                  <button onClick={deletePin} disabled={deleting} style={{ background: 'none', border: '1px solid #FECACA', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', color: '#EF4444', opacity: deleting ? 0.5 : 1 }}><TrashIcon size={14} /></button>
                </>
              )}
              <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}><XIcon size={14} /></button>
            </div>
          </div>

          {pin.description && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-input)', padding: '10px 12px', borderRadius: '10px', margin: '0 0 12px' }}>
              {pin.description}
            </p>
          )}

          {/* Réactions */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {REACTIONS.map((type) => (
              <button
                key={type}
                onClick={() => toggleReaction(type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '6px 12px', borderRadius: '100px', fontSize: '13px',
                  border: '1px solid ' + (myReactions.includes(type) ? catColor : 'var(--border)'),
                  backgroundColor: myReactions.includes(type) ? catColor + '15' : 'var(--bg-input)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {type}
                {reactionCounts[type] > 0 && <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>{reactionCounts[type]}</span>}
              </button>
            ))}
          </div>

          {/* Commentaires */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Commentaires {comments.length > 0 && `(${comments.length})`}
            </p>
            <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {comments.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>Aucun commentaire</p>
              ) : comments.map((c) => (
                <div key={c.id} style={{ backgroundColor: 'var(--bg-input)', padding: '8px 10px', borderRadius: '10px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', margin: '0 0 2px' }}>{c.profiles?.username}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0 }}>{c.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={addComment} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text" placeholder="Ajouter un avis..." value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="submit" disabled={loading || !newComment.trim()}
                style={{
                  padding: '9px 12px', backgroundColor: 'var(--accent)', color: 'white',
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                  opacity: (loading || !newComment.trim()) ? 0.5 : 1, display: 'flex', alignItems: 'center',
                }}
              >
                <SendIcon size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}