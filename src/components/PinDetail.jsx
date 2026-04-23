import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const REACTIONS = ['🔥', '❤️', '👍']

export default function PinDetail({ pin, session, categories, onClose, onDeleted, onReactionUpdate }) {
  const [comments, setComments] = useState([])
  const [reactions, setReactions] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = pin.user_id === session.user.id

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
    const { data } = await supabase
      .from('reactions')
      .select('*')
      .eq('pin_id', pin.id)
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
    const { error } = await supabase.from('comments').insert({
      pin_id: pin.id,
      user_id: session.user.id,
      content: newComment,
    })
    if (!error) { setNewComment(''); fetchComments() }
    setLoading(false)
  }

  const deletePin = async () => {
    if (!confirm('Supprimer ce spot ?')) return
    setDeleting(true)
    const { error } = await supabase.from('pins').delete().eq('id', pin.id)
    if (!error) onDeleted()
    setDeleting(false)
  }

  // Compte les réactions par type
  const reactionCounts = REACTIONS.reduce((acc, type) => {
    acc[type] = reactions.filter(r => r.type === type).length
    return acc
  }, {})

  const myReactions = reactions.filter(r => r.user_id === session.user.id).map(r => r.type)

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-xl p-6 z-[1000] max-h-[75vh] overflow-y-auto">
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
            <button onClick={deletePin} disabled={deleting} className="text-red-400 hover:text-red-600 text-lg disabled:opacity-50" title="Supprimer">
              🗑️
            </button>
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
              myReactions.includes(type)
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            {type}
            {reactionCounts[type] > 0 && (
              <span className="text-xs font-medium">{reactionCounts[type]}</span>
            )}
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
  )
}