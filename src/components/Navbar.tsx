import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, BookOpen, PlusCircle, CheckSquare, BarChart, Settings, Users } from 'lucide-react';

export default function Navbar() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser || !userData || location.pathname === '/login') return null;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const SidebarItem = ({ to, icon: Icon, label, active, extra }: { to: string, icon: any, label: string, active: boolean, extra?: React.ReactNode }) => (
    <Link to={to} className={`flex items-center px-4 py-3 rounded-lg mb-1 font-medium transition-colors ${active ? 'bg-blue-50 text-blue-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
      <Icon size={20} className="mr-3" />
      <span>{label}</span>
      {extra}
    </Link>
  );

  const MobileNavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
    <Link to={to} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${active ? 'text-blue-800 bg-blue-50' : 'text-slate-500 hover:bg-slate-100'}`}>
      <Icon size={24} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </Link>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-200 flex-col p-6 h-full flex-shrink-0">
        <div className="text-xl font-extrabold text-blue-800 mb-8 flex items-center">
          <BookOpen className="mr-2" /> MathCorrect HK
        </div>
        
        <nav className="flex-1 space-y-1">
          {userData.role === 'student' && (
            <>
              <SidebarItem to="/student" icon={BarChart} label="儀表板" active={location.pathname === '/student'} />
              <SidebarItem to="/student/mistakes" icon={BookOpen} label="我的錯題" active={location.pathname === '/student/mistakes'} />
              <SidebarItem to="/student/review" icon={CheckSquare} label="複習" active={location.pathname === '/student/review'} />
              <SidebarItem to="/student/add" icon={PlusCircle} label="新增錯題" active={location.pathname === '/student/add'} />
            </>
          )}
          {(userData.role === 'teacher' || userData.role === 'admin') && (
            <SidebarItem to="/teacher" icon={BarChart} label="教學儀表板" active={location.pathname === '/teacher'} />
          )}
          {userData.role === 'admin' && (
            <>
              <SidebarItem to="/admin/users" icon={Users} label="管理帳號" active={location.pathname === '/admin/users'} />
              <SidebarItem to="/admin/settings" icon={Settings} label="系統設定" active={location.pathname === '/admin/settings'} />
            </>
          )}
        </nav>

        <div className="mt-auto pt-5 border-t border-slate-200">
          <div className="text-sm font-semibold text-slate-800">{userData.name}</div>
          <div className="text-xs text-slate-500 mt-1">{userData.role === 'student' ? `班級: ${userData.class}` : userData.role === 'teacher' ? '教師' : '管理員'}</div>
          <button onClick={handleLogout} className="flex items-center text-xs text-red-500 mt-3 hover:text-red-600 font-medium transition-colors">
            <LogOut size={14} className="mr-1" /> 登出
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 pb-safe z-50">
        {userData.role === 'student' && (
          <>
            <MobileNavItem to="/student" icon={BarChart} label="主頁" active={location.pathname === '/student'} />
            <MobileNavItem to="/student/mistakes" icon={BookOpen} label="錯題" active={location.pathname === '/student/mistakes'} />
            <MobileNavItem to="/student/review" icon={CheckSquare} label="複習" active={location.pathname === '/student/review'} />
            <MobileNavItem to="/student/add" icon={PlusCircle} label="新增" active={location.pathname === '/student/add'} />
          </>
        )}
        {(userData.role === 'teacher' || userData.role === 'admin') && (
          <MobileNavItem to="/teacher" icon={BarChart} label="儀表板" active={location.pathname === '/teacher'} />
        )}
        {userData.role === 'admin' && (
          <>
            <MobileNavItem to="/admin/users" icon={Users} label="帳號" active={location.pathname === '/admin/users'} />
            <MobileNavItem to="/admin/settings" icon={Settings} label="設定" active={location.pathname === '/admin/settings'} />
          </>
        )}
        <button onClick={handleLogout} className="flex flex-col items-center p-2 text-slate-500 hover:text-red-500">
          <LogOut size={24} />
          <span className="text-[10px] mt-1 font-medium">登出</span>
        </button>
      </nav>
    </>
  );
}
