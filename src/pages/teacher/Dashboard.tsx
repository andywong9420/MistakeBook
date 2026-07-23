import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Mistake } from '../../types';
import { BarChart3, Users, AlertCircle, BookOpen } from 'lucide-react';

export default function TeacherDashboard() {
  const { userData } = useAuth();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterClass, setFilterClass] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterTopic, setFilterTopic] = useState('');

  useEffect(() => {
    const fetchMistakes = async () => {
      try {
        const q = query(collection(db, 'mistakes'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const list: Mistake[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Mistake));
        setMistakes(list);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'mistakes');
      } finally {
        setLoading(false);
      }
    };
    fetchMistakes();
  }, []);

  if (loading) return <div className="p-8 text-center">載入中...</div>;

  const classes = Array.from(new Set(mistakes.map(m => m.studentClass))).filter(Boolean);
  const students = Array.from(new Set(mistakes.map(m => m.studentName))).filter(Boolean);
  const topics = Array.from(new Set(mistakes.map(m => m.topic))).filter(Boolean);

  const filtered = mistakes.filter(m => {
    if (filterClass && m.studentClass !== filterClass) return false;
    if (filterStudent && m.studentName !== filterStudent) return false;
    if (filterTopic && m.topic !== filterTopic) return false;
    return true;
  });

  // Stats for filtered data
  const totalMistakes = filtered.length;
  const masteredMistakes = filtered.filter(m => m.reviewStatus === 'mastered').length;
  
  // Top Error Types
  const errorTypeCount = filtered.reduce((acc, m) => {
    acc[m.errorType] = (acc[m.errorType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topErrorTypes = Object.entries(errorTypeCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top Topics
  const topicCount = filtered.reduce((acc, m) => {
    acc[m.topic] = (acc[m.topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topTopics = Object.entries(topicCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">教學儀表板</h1>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4">
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500">
          <option value="">所有班級</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500">
          <option value="">所有學生</option>
          {students.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500">
          <option value="">所有單元</option>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center text-slate-500 mb-2">
            <BookOpen size={18} className="mr-2" />
            <span className="text-sm font-medium">總錯題數</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{totalMistakes}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center text-slate-500 mb-2">
            <AlertCircle size={18} className="mr-2" />
            <span className="text-sm font-medium">待複習</span>
          </div>
          <div className="text-3xl font-bold text-amber-600">{totalMistakes - masteredMistakes}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center text-slate-500 mb-2">
            <BarChart3 size={18} className="mr-2" />
            <span className="text-sm font-medium">已掌握</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{masteredMistakes}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center text-slate-500 mb-2">
            <Users size={18} className="mr-2" />
            <span className="text-sm font-medium">參與學生</span>
          </div>
          <div className="text-3xl font-bold text-indigo-600">{new Set(filtered.map(m=>m.studentId)).size}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Error Types */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">最常見錯誤類型</h2>
          <div className="space-y-4">
            {topErrorTypes.map(([type, count]) => (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{type}</span>
                  <span className="text-slate-500">{count} 題</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-red-400 h-2 rounded-full" style={{ width: `${(count / totalMistakes) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {topErrorTypes.length === 0 && <div className="text-sm text-slate-500">無資料</div>}
          </div>
        </div>

        {/* Top Topics */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">最常出錯單元</h2>
          <div className="space-y-4">
            {topTopics.map(([topic, count]) => (
              <div key={topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{topic}</span>
                  <span className="text-slate-500">{count} 題</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-400 h-2 rounded-full" style={{ width: `${(count / totalMistakes) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {topTopics.length === 0 && <div className="text-sm text-slate-500">無資料</div>}
          </div>
        </div>
      </div>

      {/* Recent Mistakes List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">錯題明細 (最近新增)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-6 py-3 font-semibold">學生</th>
                <th className="px-6 py-3 font-semibold">班級</th>
                <th className="px-6 py-3 font-semibold">單元</th>
                <th className="px-6 py-3 font-semibold">錯誤類型</th>
                <th className="px-6 py-3 font-semibold">狀態</th>
                <th className="px-6 py-3 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.slice(0, 10).map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{m.studentName}</td>
                  <td className="px-6 py-4">{m.studentClass}</td>
                  <td className="px-6 py-4">{m.topic}</td>
                  <td className="px-6 py-4">
                    <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded">{m.errorType}</span>
                  </td>
                  <td className="px-6 py-4">
                    {m.reviewStatus === 'mastered' ? (
                      <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">已掌握</span>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded-full">待複習</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/mistake/${m.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">無符合的錯題資料</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
