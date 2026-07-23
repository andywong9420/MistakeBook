import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Mistake } from '../../types';
import { CheckSquare, ArrowRight } from 'lucide-react';

export default function Review() {
  const { userData } = useAuth();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!userData) return;
      try {
        const q = query(
          collection(db, 'mistakes'),
          where('studentId', '==', userData.id),
          where('reviewStatus', '==', 'needs_review')
        );
        const snap = await getDocs(q);
        const list: Mistake[] = [];
        const now = Date.now();
        snap.forEach(doc => {
          const data = doc.data() as Mistake;
          if (data.nextReviewDate <= now) {
            list.push({ id: doc.id, ...data });
          }
        });
        setMistakes(list);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'mistakes');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [userData]);

  if (loading) return <div className="p-8 text-center">載入中...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
          <CheckSquare size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">今日複習</h1>
          <p className="text-slate-500">有 {mistakes.length} 題需要根據記憶曲線進行複習</p>
        </div>
      </div>

      {mistakes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckSquare size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">太棒了！</h2>
          <p className="text-slate-500 mb-6">今日沒有需要複習的錯題，繼續保持！</p>
          <Link to="/student" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-block">
            回主頁
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map((m, i) => (
            <div key={m.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-32 h-32 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                <div className="absolute top-2 left-2 bg-slate-900/60 text-white text-[10px] px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
                  第 {m.reviewStage + 1} 次複習
                </div>
                {m.wrongPhotoUrl && <img src={m.wrongPhotoUrl} alt="錯題" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-800">{m.topic}</h3>
                  <span className="bg-amber-50 text-amber-600 text-xs font-medium px-2 py-1 rounded-lg">
                    {m.subject}
                  </span>
                </div>
                <p className="text-slate-500 mb-2">{m.assessmentName} - Q{m.questionNumber}</p>
                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 mb-4 border border-slate-100">
                  <span className="font-semibold mr-2 text-slate-500">反思：</span>
                  {m.reflection || '無反思'}
                </div>
                <div className="flex justify-end">
                  <Link to={`/mistake/${m.id}?review=true`} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
                    開始複習 <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
