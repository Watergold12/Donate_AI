import { Link } from 'react-router-dom'
import { Button } from '../../components/atoms/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
      <p className="text-8xl font-bold text-gray-200 dark:text-gray-800">404</p>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page not found</h1>
      <p className="text-gray-500">The page you're looking for doesn't exist.</p>
      <Link to="/"><Button variant="primary">Go home</Button></Link>
    </div>
  )
}
