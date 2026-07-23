import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { currentUser, userData } = useAuth();
  const location = useLocation();

  if (!currentUser || !userData || location.pathname === '/login') return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 hidden md:flex items-center justify-between px-6 md:px-8 flex-shrink-0">
      <div>
        <span className="text-slate-500 text-sm font-medium">Academic Year 2023/24</span>
      </div>
      <div className="flex gap-3">
        {userData.role === 'student' && (
          <Link to="/student/add" className="bg-blue-800 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-blue-900 transition-colors">
            + New Mistake Record
          </Link>
        )}
      </div>
    </header>
  );
}
