import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { 
  Trophy, BookOpen, TrendingUp, User, Clock, ChevronRight, GraduationCap, PlusCircle, 
  FileText, Lock, Award, Timer, Settings2, CheckCircle, PenTool, ShieldAlert, 
  Loader2, ChevronLeft, Trash2, UserPlus, History, UserCheck, X
} from 'lucide-react';

// --- 🟢 Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCTk1csUI0HeZhZvy6dOFwmLr-YVswPACyY",
  authDomain: "math-excellence-6d2b8.firebaseapp.com",
  projectId: "math-excellence-6d2b8",
  storageBucket: "math-excellence-6d2b8.firebasestorage.app",
  messagingSenderId: "485798196973",
  appId: "1:485798196973:web:4583be003937001685bee4",
  measurementId: "G-BVR2P0EMPN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 🛡️ Secure PDF Viewer ---
const SecurePDFViewer = ({ fileUrl }) => {
  const [loading, setLoading] = useState(true);
  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes('drive.google.com')) return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview').split('/edit')[0];
    return url;
  };
  return (
    <div className="w-full h-[70vh] bg-slate-100 rounded-3xl overflow-hidden relative border-4 border-slate-900 shadow-2xl mt-4">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
          <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Secure Paper...</p>
        </div>
      )}
      <iframe src={getEmbedUrl(fileUrl)} className="w-full h-full relative z-10" onLoad={() => setLoading(false)} title="Paper" />
    </div>
  );
};

// --- App Root Controller ---
const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isExamActive, setIsExamActive] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingExam, setPendingExam] = useState(null);
  const [studentNameInput, setStudentNameInput] = useState('');
  
  const [teacherPin, setTeacherPin] = useState('1234567890');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [liveMocks, setLiveMocks] = useState([]);
  const [prevPapers, setPrevPapers] = useState([]);
  const [practiceSets, setPracticeSets] = useState([]);
  const [growthPublished, setGrowthPublished] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    onSnapshot(collection(db, "liveMocks"), (s) => setLiveMocks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, "prevPapers"), (s) => setPrevPapers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, "practiceSets"), (s) => setPracticeSets(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, "results"), (s) => setStudentResults(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, "students"), (s) => setStudents(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => a.name.localeCompare(b.name))));
    onSnapshot(doc(db, "settings", "adminConfig"), (d) => { if (d.exists()) { setTeacherPin(d.data().pin); setGrowthPublished(d.data().growthPublished); } });
    onSnapshot(query(collection(db, "logs"), orderBy("timestamp", "desc")), (s) => setActivityLogs(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, []);

  const handleStartExamFlow = (title, durationSec, fileUrl) => {
    setPendingExam({ title, duration: durationSec, fileUrl });
    setShowNameModal(true);
  };

  const finalizeExamStart = async () => {
    if (!studentNameInput.trim()) return;
    const d = new Date();
    await addDoc(collection(db, "logs"), { 
      studentName: studentNameInput, examTitle: pendingExam.title, timestamp: Date.now(), 
      timeDisplay: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateDisplay: d.toLocaleDateString('en-GB')
    });
    setCurrentExam({ ...pendingExam, studentName: studentNameInput });
    setIsExamActive(true);
    setShowNameModal(false);
  };

  if (isExamActive) return <ExamInterface exam={currentExam} onFinish={() => setIsExamActive(false)} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 select-none flex flex-col items-center overflow-x-hidden">
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-slate-50">
            <User size={40} className="text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-6">Enter Your Name</h3>
            <input autoFocus type="text" onChange={(e) => setStudentNameInput(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-100 font-bold text-center outline-none focus:border-blue-500 mb-6" placeholder="STUDENT NAME" />
            <div className="flex gap-4"><button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-xs uppercase">Cancel</button><button onClick={finalizeExamStart} className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-bold text-xs uppercase">Confirm</button></div>
          </div>
        </div>
      )}
      <header className="bg-white border-b-2 sticky top-0 z-50 shadow-sm px-6 py-4 flex justify-between items-center w-full max-w-6xl">
        <h1 className="text-xl font-black text-blue-700 uppercase italic tracking-tighter">MATH EXCELLENCE</h1>
      </header>
      <nav className="bg-blue-700 text-white sticky top-[62px] z-40 w-full flex justify-center shadow-lg">
        <div className="max-w-6xl w-full flex overflow-x-auto no-scrollbar">
          {[{ id: 'home', label: 'Home', icon: <History size={16}/> }, { id: 'live', label: 'Live Mock', icon: <Clock size={16}/> }, { id: 'practice', label: 'Practice', icon: <BookOpen size={16}/> }, { id: 'growth', label: 'Growth', icon: <TrendingUp size={16}/> }, { id: 'teacher', label: 'Admin', icon: <User size={16}/> }].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold text-[10px] uppercase border-b-4 transition-all ${activeTab === item.id ? 'border-yellow-400 bg-blue-800' : 'border-transparent'}`}>{item.icon} {item.label}</button>
          ))}
        </div>
      </nav>
      <main className="w-full max-w-5xl p-6 mb-20">
        {activeTab === 'home' && (
          <div className="text-center space-y-10 animate-in fade-in">
            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border-4 border-slate-50"><GraduationCap size={56} className="text-blue-700 mx-auto mb-4" /><h2 className="text-3xl font-black uppercase italic tracking-tight">Master <span className="text-blue-700">Mathematics</span></h2><button onClick={() => setActiveTab('practice')} className="mt-8 bg-blue-700 text-white px-10 py-3 rounded-full font-bold text-xs uppercase shadow-xl hover:bg-blue-800">Launch Tests</button></div>
            <div className="bg-white p-6 rounded-3xl shadow-md border-2 border-slate-50 text-left">
              <h3 className="font-bold text-sm uppercase mb-6 border-b pb-3 flex items-center gap-3"><History size={20} className="text-blue-600"/> Student Activity Log</h3>
              <div className="space-y-3">
                {activityLogs.slice(0, 5).map(log => (<div key={log.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border-l-8 border-blue-600 shadow-sm"><div><p className="text-sm font-black uppercase">{log.studentName}</p><p className="text-[9px] font-bold text-slate-400">{log.examTitle}</p></div><div className="text-right"><p className="text-[10px] font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full">{log.timeDisplay}</p><p className="text-[8px] font-bold text-slate-300 mt-1">{log.dateDisplay}</p></div></div>))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'live' && (
          <div className="space-y-6">{liveMocks.filter(m => m.isPublished).map(m => (<div key={m.id} className="bg-white p-6 rounded-3xl shadow-lg border-2 border-red-50 flex justify-between items-center"><div><h3 className="text-xl font-black uppercase italic">{m.name}</h3><p className="text-[10px] font-bold text-red-600 uppercase mt-1"><Timer size={14} className="inline mr-1"/> {m.hours}h {m.minutes}m</p></div><button onClick={() => handleStartExamFlow(m.name, (parseInt(m.hours)||0)*3600+(parseInt(m.minutes)||0)*60, m.fileUrl)} className="bg-red-600 text-white px-8 py-2.5 rounded-full font-bold text-xs uppercase">Attempt</button></div>))}</div>
        )}
        {activeTab === 'practice' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[...practiceSets, ...prevPapers].filter(p => p.isPublished).map(p => (<div key={p.id} className="bg-white p-6 rounded-3xl shadow flex justify-between items-center border border-slate-100"><div><h3 className="font-bold uppercase text-sm italic">{p.name}</h3><p className="text-[10px] font-bold text-slate-400">{p.hours}h {p.minutes}m</p></div><button onClick={() => handleStartExamFlow(p.name, (parseInt(p.hours)||0)*3600+(parseInt(p.minutes)||0)*60, p.fileUrl)} className="bg-blue-700 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase">Start</button></div>))}</div>
        )}
        {activeTab === 'growth' && <GrowthSectionView isPublished={growthPublished} results={studentResults} students={students} />}
        {activeTab === 'teacher' && (!isTeacherAuthenticated ? <div className="max-w-md w-full mx-auto mt-20 p-10 bg-white rounded-3xl shadow-xl text-center"><Lock size={40} className="text-blue-700 mx-auto mb-6"/><input type="password" onChange={(e) => { if(e.target.value === teacherPin) setIsTeacherAuthenticated(true); }} className="w-full py-4 bg-slate-50 border-2 rounded-xl text-center text-4xl font-black" placeholder="••••" /></div> : <TeacherZoneMainView liveMocks={liveMocks} prevPapers={prevPapers} practiceSets={practiceSets} growthPublished={growthPublished} setGrowthPublished={async (v) => await setDoc(doc(db, "settings", "adminConfig"), { growthPublished: v }, { merge: true })} studentResults={studentResults} students={students} teacherPin={teacherPin} setTeacherPin={async (v) => await setDoc(doc(db, "settings", "adminConfig"), { pin: v }, { merge: true })} /> )}
      </main>
    </div>
  );
};

// --- Sub-component: Teacher Zone ---
const TeacherZoneMainView = ({ liveMocks, prevPapers, practiceSets, growthPublished, setGrowthPublished, studentResults, students, teacherPin, setTeacherPin }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newRes, setNewRes] = useState({ exam: "", date: "", obtained: "", total: "" });

  const notify = (m) => { alert(m); };
  const addPaper = async (type) => { await addDoc(collection(db, { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' }[type]), { name: "New Slot", hours: 1, minutes: 0, fileUrl: "", isPublished: false }); };
  const updateField = async (id, type, field, value) => { await setDoc(doc(db, { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' }[type], id), { [field]: value }, { merge: true }); };

  const clearLogs = async () => {
    if(window.confirm("Clear all home logs?")) {
      const q = query(collection(db, "logs"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      notify("Logs Cleared!");
    }
  };

  const PaperManager = ({ title, items, type, color }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-slate-100 mb-8 w-full">
      <div className="flex justify-between items-center border-b pb-4 mb-6"><h3 className={`font-bold uppercase text-xs italic ${color}`}>{title} Manager</h3><button onClick={() => addPaper(type)} className="p-2 bg-slate-100 rounded-full"><PlusCircle size={20}/></button></div>
      <div className="space-y-4">{items.map(item => (
        <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border-2 border-white space-y-3">
          <div className="flex gap-2"><input type="text" value={item.name} onChange={(e) => updateField(item.id, type, 'name', e.target.value)} className="flex-1 p-2 rounded-lg border text-xs font-bold uppercase" /><button onClick={() => updateField(item.id, type, 'isPublished', !item.isPublished)} className={`px-4 py-1 rounded-lg text-[9px] font-bold ${item.isPublished ? 'bg-green-600 text-white' : 'bg-slate-300'}`}>{item.isPublished ? 'LIVE' : 'HIDE'}</button><button onClick={async () => await deleteDoc(doc(db, { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' }[type], item.id))} className="text-red-400 p-2"><Trash2 size={18}/></button></div>
          <div className="flex gap-2"><div className="flex items-center gap-2 bg-white px-2 rounded-lg border text-[10px] font-bold shrink-0"><Timer size={14}/> <input type="number" value={item.hours} onChange={(e) => updateField(item.id, type, 'hours', e.target.value)} className="w-8 text-center" />H <input type="number" value={item.minutes} onChange={(e) => updateField(item.id, type, 'minutes', e.target.value)} className="w-8 text-center" />M</div><input type="text" value={item.fileUrl} onChange={(e) => updateField(item.id, type, 'fileUrl', e.target.value)} className="flex-1 p-2 rounded-lg border text-[10px]" placeholder="Drive Link" /></div>
        </div>
      ))}</div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-white p-4 rounded-2xl flex justify-between items-center w-full mb-8 border-2 border-slate-50">
        <div className="flex gap-2"><button onClick={() => setIsChangingPin(!isChangingPin)} className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">PIN</button><button onClick={clearLogs} className="px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">Clear Logs</button></div>
        <button onClick={() => setGrowthPublished(!growthPublished)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${growthPublished ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{growthPublished ? 'Lock Growth' : 'Publish Growth'}</button>
      </div>

      {isChangingPin && (
        <div className="max-w-sm w-full p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 mb-8"><input type="text" onChange={(e) => setNewRes({...newRes, pin: e.target.value})} className="w-full p-3 rounded-xl bg-white border-2 text-xl font-black text-center" placeholder="NEW PIN" /><button onClick={async () => { await setTeacherPin(newRes.pin); setIsChangingPin(false); alert("PIN Changed!"); }} className="w-full py-2 bg-blue-700 text-white rounded-lg mt-4 font-bold">SAVE</button></div>
      )}
      <PaperManager title="Live Mock" items={liveMocks} type="live" color="text-red-600" />
      <PaperManager title="Practice" items={practiceSets} type="practice" color="text-blue-700" />

      <div className="bg-white p-6 rounded-3xl shadow-lg border-t-8 border-slate-900 w-full mb-20">
        <h3 className="font-bold text-xs uppercase mb-6 flex items-center gap-3"><Trophy size={28} className="text-yellow-600"/> Student Registry</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {students.map((std) => (
            <button key={std.id} onClick={() => setSelectedStudent(std.name)} className="p-3 bg-slate-50 rounded-xl border-2 border-white text-[10px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all">{std.name}</button>
          ))}
          <button onClick={async () => { const n = prompt("Name:"); if(n) await addDoc(collection(db, "students"), {name: n}); }} className="p-3 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-bold text-slate-300 uppercase">+ REGISTER</button>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-white z-[1200] p-6 overflow-y-auto animate-in slide-in-from-right-full">
           <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-[11px] font-bold text-blue-600 uppercase mb-8"><ChevronLeft size={24}/> BACK</button>
           <div className="bg-white p-6 rounded-3xl border-4 border-slate-50 shadow-2xl max-w-xl mx-auto space-y-8">
              <h3 className="text-2xl font-black uppercase italic">{selectedStudent} Marksheet</h3>
              <div className="p-6 bg-blue-50 rounded-2xl space-y-4 shadow-inner">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <input type="text" value={newRes.exam} onChange={(e) => setNewRes({...newRes, exam: e.target.value})} className="col-span-2 w-full p-3 rounded-xl border-2 font-bold text-xs" placeholder="Topic" />
                   <input type="date" value={newRes.date} onChange={(e) => setNewRes({...newRes, date: e.target.value})} className="w-full p-3 rounded-xl border-2 font-bold text-xs" />
                   <div className="flex gap-2"><input type="number" placeholder="Obt" value={newRes.obtained} onChange={(e) => setNewRes({...newRes, obtained: e.target.value})} className="w-full p-3 rounded-xl border-2 font-bold text-xs text-center" /><input type="number" placeholder="Full" value={newRes.total} onChange={(e) => setNewRes({...newRes, total: e.target.value})} className="w-full p-3 rounded-xl border-2 font-bold text-xs text-center" /></div>
                 </div>
                 <button onClick={async () => {
                   if(newRes.exam && newRes.obtained && newRes.total) {
                     const p = Math.round((parseFloat(newRes.obtained)/parseFloat(newRes.total))*100);
                     await addDoc(collection(db, "results"), { ...newRes, name: selectedStudent, percent: p, timestamp: Date.now() });
                     setNewRes({exam: "", date: "", obtained: "", total: ""});
                   }
                 }} className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold uppercase shadow-md">Record</button>
              </div>
              <div className="space-y-3">{studentResults.filter(r => r.name === selectedStudent).sort((a,b)=>b.timestamp-a.timestamp).map(r => (<div key={r.id} className="p-4 bg-slate-50 border-2 rounded-2xl flex justify-between items-center shadow-sm"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${r.percent >= 40 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.percent}%</div><div><p className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{r.exam}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{r.date}</p></div></div><button onClick={async () => await deleteDoc(doc(db, "results", r.id))} className="text-red-300"><Trash2 size={24} /></button></div>))}</div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-component: Growth Section (Delete included) ---
const GrowthSectionView = ({ isPublished, results, students }) => {
  const [sel, setSel] = useState(null);
  if (!isPublished) return <div className="py-40 text-center"><Award size={64} className="text-slate-100 mx-auto mb-4" /><h2 className="font-bold text-slate-300 uppercase text-sm tracking-widest italic">Restricted Access</h2></div>;
  
  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in">
      {!sel ? (
        <div className="grid gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4 mb-2 italic">Student Database:</p>
          {students.map((std) => (
            <div key={std.id} className="relative group">
              <button onClick={() => setSel(std.name)} className="w-full bg-white p-4 rounded-2xl shadow-sm border-2 border-white flex justify-between items-center hover:border-blue-300 transition-all">
                <div className="flex items-center gap-4"><div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-700"><User size={18} /></div><span className="font-bold text-slate-800 uppercase text-sm italic">{std.name}</span></div>
                <ChevronRight size={24} className="text-slate-300" />
              </button>
              {/* --- 🔴 গ্রোথ সেকশনে ডিলিট বাটন --- */}
              <button onClick={async (e) => { e.stopPropagation(); if(window.confirm(`Delete student: ${std.name}?`)) await deleteDoc(doc(db, "students", std.id)); }} className="absolute -top-2 -right-2 p-2 bg-red-600 text-white rounded-full shadow-lg border-2 border-white active:scale-90 transition-all">
                <X size={14}/>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-20">
          <button onClick={() => setSel(null)} className="flex items-center gap-2 text-[11px] font-bold text-blue-600 uppercase mb-4 italic transition-all hover:underline"><ChevronLeft size={24}/> Back</button>
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-slate-50 relative">
             <div className="bg-blue-700 p-10 text-white text-center relative overflow-hidden shadow-inner"><Trophy className="absolute -top-20 -right-20 opacity-10 rotate-12" size={150}/><h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Growth Report</h2><p className="mt-5 inline-block bg-white/20 px-8 py-2 rounded-full border border-white/40 text-sm font-bold uppercase italic">{sel}</p></div>
             <div className="p-6 overflow-x-auto"><table className="w-full text-sm font-bold border-separate border-spacing-y-4"><thead><tr className="text-slate-400 uppercase text-[10px] tracking-widest opacity-80"><th className="pb-4 text-left">Academic Unit</th><th className="pb-4 text-center">Score</th><th className="pb-4 text-right">Metric</th></tr></thead><tbody>{results.filter(r => r.name === sel).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r => (<tr key={r.id} className="bg-slate-50 rounded-2xl shadow-sm"><td className="p-5 uppercase text-slate-800 italic rounded-l-2xl border-l-8 border-blue-600">{r.exam}</td><td className="p-5 text-center text-blue-700 text-3xl italic tracking-tighter leading-none">{r.percent}%</td><td className="p-5 text-right rounded-r-2xl"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border-2 shadow-sm ${r.percent >= 40 ? 'bg-green-100 text-green-700 border-green-200 shadow-green-100' : 'bg-red-100 text-red-700 border-red-200 shadow-red-100'}`}>{r.percent >= 90 ? 'MASTER' : r.percent >= 40 ? 'SUCCESS' : 'FAILURE'}</span></td></tr>))}</tbody></table></div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-component: Exam Interface (স্মার্ট সাইজ) ---
const ExamInterface = ({ exam, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(exam.duration);
  const [isSubmitted, setIsSubmitted] = useState(false);
  useEffect(() => { if (timeLeft <= 0 || isSubmitted) { if(timeLeft === 0 && !isSubmitted) setIsSubmitted(true); return; } const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000); return () => clearInterval(timer); }, [timeLeft, isSubmitted]);
  const formatTime = (s) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${sec < 10 ? '0' + sec : sec}`; };
  if (isSubmitted) return ( <div className="fixed inset-0 bg-white z-[2000] flex flex-col items-center justify-center p-10 text-center animate-in zoom-in"> <div className="w-40 h-40 bg-green-50 rounded-full flex items-center justify-center mb-10 shadow-xl"><CheckCircle size={100} className="text-green-600" /></div> <h2 className="text-5xl font-black text-slate-800 uppercase italic">SUBMITTED</h2> <button onClick={onFinish} className="bg-blue-700 text-white px-16 py-5 rounded-full font-black uppercase text-[15px] shadow-lg mt-16 active:scale-95 border-b-8 border-blue-900 active:border-b-0">Exit Session</button> </div> );
  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden">
      <div className="bg-white p-3 md:p-4 flex justify-between items-center border-b-8 border-yellow-400 shadow-2xl">
        <div className="flex items-center gap-4"><div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-red-200 border-2 border-red-50"><ShieldAlert size={24}/></div><div><h2 className="font-black text-slate-800 text-sm md:text-xl uppercase italic tracking-tighter leading-none">{exam.title}</h2><p className="text-[9px] md:text-[11px] text-blue-700 font-black uppercase mt-1">SESSION: {exam.studentName}</p></div></div>
        <div className="flex items-center gap-6">
          <div className={`px-4 py-1 rounded-xl font-black text-2xl md:text-4xl border-4 shadow-inner tracking-tighter ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-800 border-slate-100'}`}>{formatTime(timeLeft)}</div>
          <button onClick={() => { if(window.confirm("SUBMIT?")) setIsSubmitted(true); }} className="bg-green-600 text-white px-8 py-3 rounded-3xl font-black text-[12px] uppercase shadow-3xl border-b-4 border-green-800 active:border-b-0">SUBMIT</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-900 p-4 md:p-10"><div className="max-w-6xl mx-auto space-y-10"><SecurePDFViewer fileUrl={exam.fileUrl} /></div></div>
    </div>
  );
};

export default App;
