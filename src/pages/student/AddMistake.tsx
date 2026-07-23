import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Mistake, Settings } from '../../types';
import { Upload, X, Save, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function AddMistake() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({ subjects: [], topics: [], errorTypes: [], classes: [] });
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // Form State
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [errorType, setErrorType] = useState('');
  const [assessmentName, setAssessmentName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [questionNumber, setQuestionNumber] = useState('');
  const [reflection, setReflection] = useState('');
  const [wrongFile, setWrongFile] = useState<File | null>(null);
  const [correctFile, setCorrectFile] = useState<File | null>(null);
  
  // UI State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          const s = snap.data() as Settings;
          setSettings(s);
          if (s.subjects.length > 0) setSubject(s.subjects[0]);
          if (s.topics.length > 0) setTopic(s.topics[0]);
          if (s.errorTypes.length > 0) setErrorType(s.errorTypes[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const uploadImage = async (file: File, path: string): Promise<string> => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      const storageRef = ref(storage, `${path}/${Date.now()}_${compressedFile.name}`);
      const snapshot = await uploadBytesResumable(storageRef, compressedFile);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.log('Compression failed, uploading original', error);
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytesResumable(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    if (!wrongFile) {
      setError('請上傳錯誤作答圖片');
      return;
    }
    
    setSaving(true);
    setError('');

    try {
      // 1. Upload Images
      const wrongPhotoUrl = await uploadImage(wrongFile, `mistakes/${userData.id}`);
      let correctPhotoUrl = '';
      if (correctFile) {
        correctPhotoUrl = await uploadImage(correctFile, `mistakes/${userData.id}`);
      }

      // 2. Save Document
      const newMistake: Omit<Mistake, 'id'> = {
        studentId: userData.id,
        studentName: userData.name,
        studentClass: userData.class || '',
        subject,
        topic,
        errorType,
        assessmentName,
        date,
        questionNumber,
        reflection,
        wrongPhotoUrl,
        correctPhotoUrl,
        reviewStatus: 'needs_review',
        nextReviewDate: Date.now() + 86400000, // +1 day
        reviewStage: 0,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'mistakes'), newMistake);
      navigate('/student');
    } catch (err: any) {
      console.error(err);
      setError('儲存失敗，請重試。');
    } finally {
      setSaving(false);
    }
  };

  const ImageUploader = ({ label, file, setFile }: { label: string, file: File | null, setFile: (f: File | null) => void }) => (
    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center relative hover:bg-slate-50 transition-colors">
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      {file ? (
        <div className="relative inline-block">
          <img src={URL.createObjectURL(file)} alt="Preview" className="h-32 object-contain rounded-lg" />
          <button type="button" onClick={() => setFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center cursor-pointer">
          <ImageIcon size={32} className="text-slate-400 mb-2" />
          <span className="text-sm text-indigo-600 font-medium">點擊上傳圖片</span>
          <span className="text-xs text-slate-400 mt-1">支援 JPG, PNG</span>
          <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
            if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
          }} />
        </div>
      )}
    </div>
  );

  if (loadingSettings) return <div className="p-8 text-center">載入中...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">新增錯題</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {error && <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploader label="錯誤作答圖片 (必填)" file={wrongFile} setFile={setWrongFile} />
            <ImageUploader label="正確答案圖片 (選填)" file={correctFile} setFile={setCorrectFile} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">科目</label>
              <select required value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500">
                <option value="">請選擇</option>
                {settings.subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">主題/單元</label>
              <select required value={topic} onChange={e => setTopic(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500">
                <option value="">請選擇</option>
                {settings.topics.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">錯誤類型</label>
              <select required value={errorType} onChange={e => setErrorType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500">
                <option value="">請選擇</option>
                {settings.errorTypes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">測驗/功課名稱</label>
              <input type="text" value={assessmentName} onChange={e => setAssessmentName(e.target.value)} placeholder="例如: 第一次段考" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">題號</label>
              <input type="text" value={questionNumber} onChange={e => setQuestionNumber(e.target.value)} placeholder="例如: 第3題(a)" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">反思/提醒自己</label>
            <textarea rows={3} value={reflection} onChange={e => setReflection(e.target.value)} placeholder="為什麼會寫錯？下次要注意什麼？" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 resize-none"></textarea>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center">
              {saving ? <span className="animate-pulse">上傳中...</span> : <><Save size={20} className="mr-2" /> 儲存錯題</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
