import { Outlet } from 'react-router-dom'

export const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto">
        <Outlet />
      </div>
    </div>
  )
} 