import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Groups({ session }) {
  const [groups, setGroups] = useState([])
  const [newGroupName, setNewGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setLoading(true)

    // Récupère uniquement les groupes dont l'utilisateur est membre
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', session.user.id)
      .order('joined_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      // Extrait les groupes depuis la jointure
      setGroups(data.map((item) => item.groups))
    }
    setLoading(false)
  }

  const createGroup = async (e) => {
    e.preventDefault()
    setError(null)

    const { data, error } = await supabase
      .from('groups')
      .insert({ name: newGroupName, created_by: session.user.id })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return
    }

    // Ajoute le créateur comme membre
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: data.id, user_id: session.user.id })

    if (memberError) {
      setError(memberError.message)
      return
    }

    setNewGroupName('')
    fetchGroups()
  }

  const joinGroup = async (e) => {
    e.preventDefault()
    setError(null)

    // Trouve le groupe par code d'invitation
    const { data: group, error: findError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', joinCode.trim().toLowerCase())
      .maybeSingle()

    if (findError || !group) {
      setError('Code invalide ou groupe introuvable')
      return
    }

    // Vérifie si déjà membre
    const { data: existing } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group.id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (existing) {
      setError('Tu es déjà membre de ce groupe !')
      return
    }

    // Ajoute comme membre
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: session.user.id })

    if (joinError) {
      setError(joinError.message)
      return
    }

    setJoinCode('')
    fetchGroups()
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-full p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">🗺️ Mes groupes</h1>
        <button
          onClick={signOut}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Déconnexion
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <form onSubmit={createGroup} className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4 text-slate-800">Créer un groupe</h2>
          <input
            type="text"
            placeholder="Nom du groupe (ex: Les potes Paris)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-3"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            Créer
          </button>
        </form>

        <form onSubmit={joinGroup} className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4 text-slate-800">Rejoindre un groupe</h2>
          <input
            type="text"
            placeholder="Code d'invitation"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-3"
          />
          <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition">
            Rejoindre
          </button>
        </form>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : groups.length === 0 ? (
        <p className="text-slate-500 text-center py-8">
          Aucun groupe pour l'instant. Crée ou rejoins-en un !
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition cursor-pointer"
              onClick={() => navigate(`/group/${group.id}`)}
            >
              <h3 className="font-semibold text-lg text-slate-900 mb-2">{group.name}</h3>
              <p className="text-xs text-slate-500">
                Code : <span className="font-mono bg-slate-100 px-2 py-1 rounded">{group.invite_code}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}