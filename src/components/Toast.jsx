import { useEffect, useState } from 'react'

export default function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9999] transition-all duration-300"
      style={{
        transform: `translateX(-50%) translateY(${visible ? '0' : '20px'})`,
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="bg-slate-900 text-white px-5 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
        {message}
      </div>
    </div>
  )
}
