import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="container mx-auto py-4">
        <Outlet />
      </div>
    </div>
  );
};
