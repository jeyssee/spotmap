import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

export default function SidePanel({ pins, categories, activeCategory, onCategoryChange, onPinClick, filteredPins, session, groupId }) {
  const [activeTab, setActiveTab] = useState('spots')
  const [members, setMembers] = useState([])

  const userId = session?.user?.id

  useEffect(() => {
    if (activeTab === 'members') fetchMembers()
  }, [activeTab])

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('group_members')
      .select('*, profiles(username)')
      .eq('group_id', groupId)
    setMembers(data || [])
  }

  return (
    <div style={{ width: '288px', flexShrink: 0 }} className="bg-white border-l border-slate-200 flex flex-col overflow-hidden">

      {/* Onglets */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('spots')}
          className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'spots' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          📍 Spots
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'members' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          👥 Membres
        </button>
      </div>

      {activeTab === 'spots' && (
        <>
          {/* Filtres */}
          <div className="p-3 border-b border-slate-100">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onCategoryChange(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${activeCategory === null ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Tous ({pins.length})
              </button>
              {Object.entries(categories).map(([key, { label, color }]) => {
                const count = pins.filter(p => p.category === key).length
                if (count === 0) return null
                return (
                  <button
                    key={key}
                    onClick={() => onCategoryChange(activeCategory === key ? null : key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${activeCategory === key ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    style={activeCategory === key ? { backgroundColor: color } : {}}
                  >
                    {label} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Liste spots */}
          <div className="flex-1 overflow-y-auto">
            {filteredPins.length === 0 ? (
              <p className="text-center text-slate-400 text-sm p-6">Aucun spot dans cette catégorie</p>
            ) : (
              filteredPins.map((pin) => {
                const commentCount = pin.comments?.length || 0
                const reactionCount = pin.reactions?.length || 0
                const isOwner = userId && pin.user_id === userId
                return (
                  <div
                    key={pin.id}
                    onClick={() => onPinClick(pin)}
                    className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: categories[pin.category]?.color || '#64748b' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{pin.title}</p>
                        <p className="text-xs text-slate-500">par {pin.profiles?.username || 'Anonyme'}</p>
                        {pin.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{pin.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {commentCount > 0 && <span className="text-xs text-slate-400">💬 {commentCount}</span>}
                          {reactionCount > 0 && <span className="text-xs text-slate-400">⚡ {reactionCount}</span>}
                          <span className="text-xs text-slate-300">{timeAgo(pin.created_at)}</span>
                        </div>
                      </div>
                      {isOwner && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex-shrink-0">moi</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {activeTab === 'members' && (
        <div className="flex-1 overflow-y-auto">
          {members.length === 0 ? (
            <p className="text-center text-slate-400 text-sm p-6">Chargement...</p>
          ) : (
            members.map((m) => (
              <div key={m.user_id} className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                  {m.profiles?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.profiles?.username || 'Anonyme'}</p>
                  {m.user_id === userId && (
                    <p className="text-xs text-blue-500">Vous</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}