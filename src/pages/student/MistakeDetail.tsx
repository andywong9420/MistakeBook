import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Mistake } from '../../types';
import { ArrowLeft, Check, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MistakeDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isReviewing = searchParams.get('review') === 'true';
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const [mistake, setMistake] = useState<Mistake | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchMistake = async () => {
      try {
        const snap = await getDoc(doc(db, 'mistakes', id!));
        if (snap.exists()) {
          setMistake({ id: snap.id, ...snap.data() } as Mistake);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `mistakes/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchMistake();
  }, [id]);

  const handleReviewAction = async (action: 'mastered' | 'next_stage') => {
    if (!mistake) return;
    setUpdating(true);
    try {
      const ref = doc(db, 'mistakes', mistake.id!);
      
      if (action === 'mastered') {
        await updateDoc(ref, { reviewStatus: 'mastered' });
      } else {
        const nextStage = mistake.reviewStage + 1;
        let daysToAdd = 3;
        if (nextStage === 1) daysToAdd = 3;
        else if (nextStage === 2) daysToAdd = 7;
        else if (nextStage >= 3) daysToAdd = 14;
        
        await updateDoc(ref, { 
          reviewStage: nextStage,
          nextReviewDate: Date.now() + daysToAdd * 86400000 
        });
      }
      navigate(userData?.role === 'student' ? '/student/review' : -1 as any);
    } catch (err) {
      alert('更新失敗');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 text-center">載入中...</div>;
  if (!mistake) return <div className="p-8 text-center text-slate-500">找不到此錯題</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm">
        <ArrowLeft size={16} className="mr-1" /> 返回
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">{mistake.subject}</span>
                <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">{mistake.errorType}</span>
                {mistake.reviewStatus === 'mastered' && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center">
                    <Check size={12} className="mr-1"/> 已掌握
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-800">{mistake.topic}</h1>
              <p className="text-slate-500 mt-1">{mistake.assessmentName} - Q{mistake.questionNumber} ({mistake.date})</p>
            </div>
            {userData?.role !== 'student' && (
              <div className="text-right">
                <div className="text-sm font-medium text-slate-800">{mistake.studentName}</div>
                <div className="text-xs text-slate-500">{mistake.studentClass}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 flex items-center"><ImageIcon size={18} className="mr-2"/> 錯誤作答</h3>
              <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                {mistake.wrongPhotoUrl ? (
                  <a href={mistake.wrongPhotoUrl} target="_blank" rel="noreferrer">
                    <img src={mistake.wrongPhotoUrl} alt="錯誤作答" className="w-full object-contain hover:opacity-90 transition-opacity" />
                  </a>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">無圖片</div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 flex items-center"><Check size={18} className="mr-2 text-emerald-600"/> 正確答案/訂正</h3>
              {(!isReviewing || showAnswer) ? (
                <div className="bg-emerald-50 rounded-xl overflow-hidden border border-emerald-100">
                  {mistake.correctPhotoUrl ? (
                    <a href={mistake.correctPhotoUrl} target="_blank" rel="noreferrer">
                      <img src={mistake.correctPhotoUrl} alt="正確答案" className="w-full object-contain hover:opacity-90 transition-opacity" />
                    </a>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-emerald-600 font-medium">無圖片</div>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => setShowAnswer(true)}
                  className="h-full min-h-[12rem] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <RotateCcw size={32} className="text-indigo-500 mb-2" />
                  <span className="text-indigo-700 font-medium">點擊查看答案</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 mb-8">
            <h3 className="font-semibold text-amber-800 mb-2">反思筆記</h3>
            <p className="text-amber-900 whitespace-pre-wrap">{mistake.reflection || '無'}</p>
          </div>

          {isReviewing && showAnswer && mistake.reviewStatus !== 'mastered' && userData?.role === 'student' && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-center font-semibold text-slate-800 mb-4">複習結果：您現在掌握這題了嗎？</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  disabled={updating}
                  onClick={() => handleReviewAction('next_stage')}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  還要再練 (進入下一階段)
                </button>
                <button 
                  disabled={updating}
                  onClick={() => handleReviewAction('mastered')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Check size={20} className="mr-2"/> 完全掌握了
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
