export const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const variants = {
    default:  'bg-gray-100 text-gray-700',
    primary:  'bg-blue-100 text-blue-700',
    success:  'bg-green-100 text-green-700',
    danger:   'bg-red-100 text-red-700',
    warning:  'bg-orange-100 text-orange-700',
    purple:   'bg-purple-100 text-purple-700',
    HOD:      'bg-purple-100 text-purple-700',
    ADMIN:    'bg-blue-100 text-blue-700',
    FACULTY:  'bg-green-100 text-green-700',
    STUDENT:  'bg-gray-100 text-gray-700',
  }
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-sm' }
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant] || variants.default} ${sizes[size]}`}>
      {children}
    </span>
  )
}
