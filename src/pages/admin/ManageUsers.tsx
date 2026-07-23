import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db, secondaryAuth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { User } from '../../types';
import { Users, UserPlus, Mail, AlertTriangle, Edit2 } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [createError, setCreateError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editClass, setEditClass] = useState('');

  // Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [studentClass, setStudentClass] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: User[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as User));
      setUsers(list);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (role === 'student' && !studentClass) {
      setCreateError('學生必須填寫班級');
      return;
    }
    
    try {
      // Create user in Firebase Auth using secondary app to avoid logging out admin
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const uid = cred.user.uid;
      
      // Immediately sign out from secondary app
      await secondaryAuth.signOut();

      // Create user profile in Firestore
      const newUser: Omit<User, 'id'> = {
        email,
        name,
        role,
        class: role === 'student' ? studentClass : '',
        isActive: true,
        mustChangePassword: true,
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, 'users', uid), newUser);
      
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || '建立帳號失敗');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setRole('student');
    setStudentClass('');
  };

  const toggleStatus = async (user: User) => {
    if (user.role === 'admin' && user.email === 'wongph@twghkywc.edu.hk') return;
    try {
      await setDoc(doc(db, 'users', user.id), { isActive: !user.isActive }, { merge: true });
      fetchUsers();
    } catch (err) {
      alert('更新失敗');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditClass(user.class || '');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      await setDoc(doc(db, 'users', editingUser.id), { class: editClass }, { merge: true });
      setEditingUser(null);
      fetchUsers();
    } catch (e) {
      alert('更新失敗');
    }
  };

  const handleResetPassword = async (email: string) => {
    if (confirm(`確定要發送重設密碼信件至 ${email} 嗎？`)) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert('已發送重設密碼信件！');
      } catch (err: any) {
        alert('發送失敗：' + err.message);
      }
    }
  };

  if (loading) return <div className="p-8 text-center">載入中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <Users className="mr-2" /> 帳號管理
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
        >
          <UserPlus size={18} className="mr-2" /> 新增帳號
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">姓名</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">身份</th>
                <th className="px-6 py-3 font-semibold">班級</th>
                <th className="px-6 py-3 font-semibold">狀態</th>
                <th className="px-6 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {u.role === 'admin' ? '管理員' : u.role === 'teacher' ? '教師' : '學生'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{u.class || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? '啟用' : '停用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    <button onClick={() => toggleStatus(u)} className="text-indigo-600 hover:text-indigo-900 font-medium">
                      {u.isActive ? '停用' : '啟用'}
                    </button>
                    {u.role === 'student' && (
                      <button onClick={() => handleEditUser(u)} className="text-blue-600 hover:text-blue-900 font-medium">
                        編輯班級
                      </button>
                    )}
                    <button 
                      onClick={() => handleResetPassword(u.email)}
                      className="text-amber-600 hover:text-amber-900 font-medium"
                    >
                      發送重設密碼
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-500">尚無帳號</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800 mb-4">新增帳號</h2>
            {createError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center"><AlertTriangle size={16} className="mr-2"/>{createError}</div>}
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">身份</label>
                  <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500">
                    <option value="student">學生</option>
                    <option value="teacher">教師</option>
                    <option value="admin">管理員</option>
                  </select>
                </div>
                {role === 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">班級</label>
                    <input type="text" required value={studentClass} onChange={e => setStudentClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" placeholder="例如: 1A" />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" placeholder="陳小明" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" placeholder="student@school.edu.hk" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">初始密碼</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" placeholder="至少 6 個字元" minLength={6} />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">取消</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors">建立帳號</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800 mb-4">編輯班級</h2>
            <div className="mb-4">
              <p className="text-sm text-slate-500 mb-2">學生：{editingUser.name}</p>
              <label className="block text-sm font-medium text-slate-700 mb-1">班級</label>
              <input type="text" value={editClass} onChange={e => setEditClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" placeholder="例如: 1A" />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">取消</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
