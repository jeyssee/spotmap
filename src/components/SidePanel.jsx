export default function SidePanel({ pins, categories, activeCategory, onCategoryChange, onPinClick, filteredPins, session }) {
  return (
  <div style={{ width: '288px', flexShrink: 0 }} className="bg-white border-l border-slate-200 flex flex-col overflow-hidden">

      {/* Filtres catégories */}
      <div className="p-3 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filtrer</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              activeCategory === null
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous ({pins.length})
          </button>
          {Object.entries(categories).map(([key, { label }]) => {
            const count = pins.filter(p => p.category === key).length
            if (count === 0) return null
            return (
              <button
                key={key}
                onClick={() => onCategoryChange(activeCategory === key ? null : key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  activeCategory === key
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Liste des spots */}
      <div className="flex-1 overflow-y-auto">
        {filteredPins.length === 0 ? (
          <p className="text-center text-slate-400 text-sm p-6">
            Aucun spot dans cette catégorie
          </p>
        ) : (
          filteredPins.map((pin) => (
            <div
              key={pin.id}
              onClick={() => onPinClick(pin)}
              className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">
                  {categories[pin.category]?.label.split(' ')[0] || '📍'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{pin.title}</p>
                  <p className="text-xs text-slate-500">
                    par {pin.profiles?.username || 'Anonyme'}
                  </p>
                  {pin.description && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{pin.description}</p>
                  )}
                </div>
                {pin.user_id === session.user.id && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex-shrink-0">moi</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}