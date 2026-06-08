import { Fragment } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

const Breadcrumbs = ({
  items,
}: {
  items: { label: string; href?: string }[]
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm overflow-x-auto">
        <Link
          href="/"
          className="flex items-center gap-1 text-gray-500 hover:text-violet-600 transition-colors shrink-0"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        {items.map((item, index) => (
          <Fragment key={index}>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-violet-600 transition-colors shrink-0"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-violet-700 font-medium truncate">{item.label}</span>
            )}
          </Fragment>
        ))}
      </nav>

   
    </div>
  )
}

export default Breadcrumbs
