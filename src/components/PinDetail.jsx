import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const REACTIONS = ['🔥', '❤️', '👍']

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

  useEffect(() => {
    fetchComments()
    fetchReactions()
  }, [pin.id])

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username)')
      .eq('pin_id', pin.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  const fetchReactions = async () => {
    const { data } = await supabase.from('reactions').select('*').eq('pin_id', pin.id)
    setReactions(data || [])
  }

  const toggleReaction = async (type) => {
    const existing = reactions.find(r => r.user_id === session.user.id && r.type === type)
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('reactions').insert({ pin_id: pin.id, user_id: session.user.id, type })
    }
    fetchReactions()
    onReactionUpdate()
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setLoading(true)
    await supabase.from('comments').insert({ pin_id: pin.id, user_id: session.user.id, content: newComment })
    setNewComment('')
    fetchComments()
    setLoading(false)
  }

  const deletePin = async () => {
    if (!confirm('Supprimer ce spot ?')) return
    setDeleting(true)
    const { error } = await supabase.from('pins').delete().eq('id', pin.id)
    if (!error) onDeleted()
    setDeleting(false)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('pins')
      .update({ title: editTitle, description: editDescription, category: editCategory })
      .eq('id', pin.id)
    if (!error) {
      setEditing(false)
      onEdited()
    }
    setSaving(false)
  }

  const reactionCounts = REACTIONS.reduce((acc, type) => {
    acc[type] = reactions.filter(r => r.type === type).length
    return acc
  }, {})
  const myReactions = reactions.filter(r => r.user_id === session?.user?.id).map(r => r.type)

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-xl z-[1000] max-h-[75vh] overflow-y-auto">

      {/* Mode édition */}
      {editing ? (
        <form onSubmit={saveEdit} className="p-6 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-900">Modifier le spot</h3>
            <button type="button" onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            placeholder="Nom du spot"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description (optionnel)"
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(categories).map(([key, { label, color }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setEditCategory(key)}
                className={`px-2 py-1.5 text-xs rounded-lg border transition ${editCategory === key ? 'text-white' : 'border-slate-200'}`}
                style={editCategory === key ? { backgroundColor: color, borderColor: color } : {}}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 pr-2">
              <span
                className="text-xs px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: categories[pin.category]?.color || '#64748b' }}
              >
                {categories[pin.category]?.label || '📍 Autre'}
              </span>
              <h3 className="font-bold text-lg text-slate-900 mt-2">{pin.title}</h3>
              <p className="text-xs text-slate-500">par {pin.profiles?.username || 'Anonyme'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isOwner && (
                <>
                  <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-blue-500 text-lg" title="Modifier">✏️</button>
                  <button onClick={deletePin} disabled={deleting} className="text-slate-400 hover:text-red-500 text-lg disabled:opacity-50" title="Supprimer">🗑️</button>
                </>
              )}
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
          </div>

          {pin.description && (
            <p className="text-sm text-slate-700 mb-4 bg-slate-50 p-3 rounded-lg">{pin.description}</p>
          )}

          {/* Réactions */}
          <div className="flex gap-2 mb-4">
            {REACTIONS.map((type) => (
              <button
                key={type}
                onClick={() => toggleReaction(type)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition ${
                  myReactions.includes(type) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                {type}
                {reactionCounts[type] > 0 && <span className="text-xs font-medium">{reactionCounts[type]}</span>}
              </button>
            ))}
          </div>

          {/* Commentaires */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-3 text-slate-800">Commentaires ({comments.length})</h4>
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400">Aucun commentaire pour l'instant</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-slate-50 p-2 rounded text-sm">
                    <p className="font-semibold text-xs text-slate-600">{c.profiles?.username || 'Anonyme'}</p>
                    <p className="text-slate-700">{c.content}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={addComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Ajouter un avis..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}