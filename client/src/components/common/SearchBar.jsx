import { useState, useEffect } from 'react'

export const SearchBar = ({ placeholder = 'Search...', onSearch, debounce = 300, className = '' }) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), debounce)
    return () => clearTimeout(timer)
  }, [value, onSearch, debounce])

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
    </div>
  )
}
