import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Mistake } from '../../types';
import { Search, Filter, BookOpen } from 'lucide-react';

export default function MyMistakes() {
  const { userData } = useAuth();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchMistakes = async () => {
      if (!userData) return;
      try {
        const q = query(
          collection(db, 'mistakes'),
          where('studentId', '==', userData.id),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const list: Mistake[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Mistake));
        setMistakes(list);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'mistakes');
      } finally {
        setLoading(false);
      }
    };
    fetchMistakes();
  }, [userData]);

  if (loading) return <div className="p-8 text-center">載入中...</div>;

  const topics = Array.from(new Set(mistakes.map(m => m.topic)));

  const filtered = mistakes.filter(m => {
    if (filterTopic && m.topic !== filterTopic) return false;
    if (filterStatus && m.reviewStatus !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return m.assessmentName.toLowerCase().includes(term) || 
             m.reflection.toLowerCase().includes(term) ||
             m.errorType.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">我的錯題</h1>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="搜尋測驗名稱、錯誤類型、反思..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <select 
            value={filterTopic} 
            onChange={e => setFilterTopic(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
          >
            <option value="">所有主題</option>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
          >
            <option value="">所有狀態</option>
            <option value="needs_review">待複習</option>
            <option value="mastered">已掌握</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(m => (
          <Link key={m.id} to={`/mistake/${m.id}`} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-indigo-300 transition-colors group flex">
            <div className="w-32 h-32 bg-slate-100 flex-shrink-0 relative">
              {m.wrongPhotoUrl ? (
                <img src={m.wrongPhotoUrl} alt="錯題" className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="absolute inset-0 m-auto text-slate-300" size={32} />
              )}
              {m.reviewStatus === 'mastered' && (
                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  已掌握
                </div>
              )}
            </div>
            <div className="p-4 flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-800 truncate pr-2">{m.topic}</h3>
                  <span className="text-xs text-slate-400 flex-shrink-0">{m.date}</span>
                </div>
                <p className="text-sm text-slate-500 truncate mb-2">{m.assessmentName} {m.questionNumber ? `- Q${m.questionNumber}` : ''}</p>
                <span className="inline-block bg-red-50 text-red-600 text-[10px] font-medium px-2 py-1 rounded">
                  {m.errorType}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-2 group-hover:text-indigo-500 transition-colors">
                查看詳情 &rarr;
              </p>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
          找不到符合的錯題。
        </div>
      )}
    </div>
  );
}
