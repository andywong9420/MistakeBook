import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Mistake } from '../../types';
import { CheckSquare, PlusCircle, BarChart, BookOpen, Clock } from 'lucide-react';

export default function Dashboard() {
  const { userData } = useAuth();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
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
    fetchStats();
  }, [userData]);

  if (loading) return <div className="p-8 text-center">載入中...</div>;

  const dueReviews = mistakes.filter(m => m.reviewStatus === 'needs_review' && m.nextReviewDate <= Date.now());
  const needsReview = mistakes.filter(m => m.reviewStatus === 'needs_review');
  const mastered = mistakes.filter(m => m.reviewStatus === 'mastered');
  const masteryRate = mistakes.length > 0 ? Math.round((mastered.length / mistakes.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-3xl font-bold text-blue-800 mb-1">{mistakes.length}</div>
          <div className="text-sm text-slate-500 uppercase tracking-wide">Total Mistakes</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-3xl font-bold text-amber-600 mb-1">{dueReviews.length}</div>
          <div className="text-sm text-slate-500 uppercase tracking-wide">Due for Review Today</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-3xl font-bold text-emerald-600 mb-1">{masteryRate}%</div>
          <div className="text-sm text-slate-500 uppercase tracking-wide">Mastery Rate</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1 min-h-0">
        <div className="flex-[2] flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Mistakes</h2>
            <Link to="/student/mistakes" className="text-sm text-blue-500 hover:text-blue-600 font-medium">View all</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mistakes.slice(0, 4).map(m => (
              <Link key={m.id} to={`/mistake/${m.id}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-400 text-xs border-b border-slate-200 relative">
                  {m.wrongPhotoUrl ? (
                    <img src={m.wrongPhotoUrl} alt="Mistake" className="w-full h-full object-cover" />
                  ) : (
                    '[ Photo of Wrong Work ]'
                  )}
                </div>
                <div className="p-3">
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 truncate max-w-full">
                      {m.topic}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-slate-800 mb-1 truncate">{m.assessmentName} - Q{m.questionNumber}</div>
                  <div className="text-xs text-slate-500">Error: {m.errorType} • {m.date}</div>
                </div>
              </Link>
            ))}
            {mistakes.length === 0 && <div className="col-span-2 text-center text-slate-500 py-8 border-2 border-dashed border-slate-200 rounded-xl">您還沒有上傳任何錯題</div>}
          </div>
        </div>

        <div className="flex-1 md:border-l md:border-slate-200 md:pl-6 lg:pl-8 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Revision Queue</h2>
          
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col flex-1">
            <div className="text-sm text-slate-500 mb-4 font-medium">Spaced Repetition Schedule</div>
            
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
              {dueReviews.length === 0 && needsReview.filter(m => m.nextReviewDate > Date.now()).length === 0 && (
                <div className="text-slate-500 text-sm italic">目前沒有需要複習的錯題。</div>
              )}
              
              {dueReviews.map(m => (
                <div key={`rev-${m.id}`} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800 truncate">{m.topic}</div>
                    <div className="text-xs text-slate-500 truncate">Overdue / Due today</div>
                  </div>
                </div>
              ))}

              {needsReview.filter(m => m.nextReviewDate > Date.now()).map(m => (
                <div key={`rev-up-${m.id}`} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-400 truncate">{m.topic}</div>
                    <div className="text-xs text-slate-400 truncate">Due in {Math.ceil((m.nextReviewDate - Date.now()) / (1000 * 60 * 60 * 24))} days</div>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/student/review" className="block w-full text-center mt-5 bg-blue-50 text-blue-800 border border-blue-500 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-100 transition-colors">
              Start Revision Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
