import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Settings as SettingsType } from '../../types';
import { Settings, Plus, X, Save } from 'lucide-react';

const ListEditor = ({ 
  title, 
  field, 
  value, 
  setter, 
  items,
  onAdd,
  onRemove
}: { 
  title: string, 
  field: keyof SettingsType, 
  value: string, 
  setter: (v: string) => void,
  items: string[],
  onAdd: (field: keyof SettingsType, value: string, setter: (v: string) => void) => void,
  onRemove: (field: keyof SettingsType, index: number) => void
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
    <div className="flex space-x-2 mb-4">
      <input 
        type="text" 
        value={value} 
        onChange={e => setter(e.target.value)}
        placeholder={`新增${title}...`}
        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onAdd(field, value, setter);
          }
        }}
      />
      <button onClick={() => onAdd(field, value, setter)} className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-100 transition-colors">
        <Plus size={20} />
      </button>
    </div>
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
          {item}
          <button onClick={() => onRemove(field, i)} className="ml-2 text-slate-400 hover:text-red-500">
            <X size={14} />
          </button>
        </span>
      ))}
      {items.length === 0 && <span className="text-sm text-slate-400">尚無項目</span>}
    </div>
  </div>
);

export default function ManageSettings() {
  const [settings, setSettings] = useState<SettingsType>({ subjects: [], topics: [], errorTypes: [], classes: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New item inputs
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newErrorType, setNewErrorType] = useState('');
  const [newClass, setNewClass] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'global');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSettings(snap.data() as SettingsType);
      } else {
        // Initialize if not exists
        await setDoc(docRef, settings);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'settings/global');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedSettings: SettingsType) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), updatedSettings);
      setSettings(updatedSettings);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/global');
      alert('儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const addItem = (field: keyof SettingsType, value: string, setter: (v: string) => void) => {
    if (!value.trim() || settings[field].includes(value.trim())) return;
    const updated = { ...settings, [field]: [...settings[field], value.trim()] };
    setter('');
    handleSave(updated);
  };

  const removeItem = (field: keyof SettingsType, index: number) => {
    const updatedList = [...settings[field]];
    updatedList.splice(index, 1);
    handleSave({ ...settings, [field]: updatedList });
  };



  if (loading) return <div className="p-8 text-center">載入中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <Settings className="mr-2" /> 系統設定
        </h1>
        {saving && <span className="text-sm text-slate-500 flex items-center"><Save className="animate-pulse mr-1" size={16}/> 儲存中...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ListEditor title="科目" field="subjects" value={newSubject} setter={setNewSubject} items={settings.subjects} onAdd={addItem} onRemove={removeItem} />
        <ListEditor title="班級" field="classes" value={newClass} setter={setNewClass} items={settings.classes} onAdd={addItem} onRemove={removeItem} />
        <ListEditor title="主題/單元" field="topics" value={newTopic} setter={setNewTopic} items={settings.topics} onAdd={addItem} onRemove={removeItem} />
        <ListEditor title="錯誤類型" field="errorTypes" value={newErrorType} setter={setNewErrorType} items={settings.errorTypes} onAdd={addItem} onRemove={removeItem} />
      </div>
    </div>
  );
}
