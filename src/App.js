import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { 
  Trophy, BookOpen, TrendingUp, User, Clock, ChevronRight,
  GraduationCap, PlusCircle, FileText, Lock, Award, Timer, 
  Settings2, CheckCircle, PenTool, ShieldAlert, Loader2, 
  ChevronLeft, Trash2, UserPlus, History, UserCheck
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

// --- 🛡️ Secure PDF Viewer (স্মার্ট সাইজ ফিক্স) ---
const SecurePDFViewer = ({ fileUrl }) => {
  const [loading, setLoading] = useState(true);
  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes('drive.google.com')) {
      return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview').split('/edit')[0];
    }
    return url;
  };
  return (
    <div className="w-full max-w-4xl h-[70vh] md:h-[80vh] bg-slate-100 rounded-2xl overflow-hidden relative border-2 border-slate-800 shadow-lg mx-auto">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
          <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opening Secure Paper...</p>
        </div>
      )}
      <iframe src={getEmbedUrl(fileUrl)} className="w-full h-full relative z-10" style={{border: 'none'}} onLoad={() => setLoading(false)} title="Exam Paper" />
    </div>
  );
};

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
    setStudentNameInput('');
  };

  if (isExamActive) return <ExamInterface exam={currentExam} onFinish={() => setIsExamActive(false)} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 select-none flex flex-col items-center">
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <User size={40} className="text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-6 tracking-tight">Identity Check</h3>
            <input autoFocus type="text" value={studentNameInput} onChange={(e) => setStudentNameInput(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-100 font-bold text-center outline-none focus:border-blue-500 mb-6" placeholder="STUDENT NAME" />
            <div className="flex gap-4">
              <button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-xs uppercase">Cancel</button>
              <button onClick={finalizeExamStart} className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-bold text-xs uppercase shadow-lg active:scale-95">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b sticky top-0 z-50 shadow-sm px-6 py-4 flex justify-between items-center w-full">
        <div>
          <h1 className="text-xl font-black text-blue-700 uppercase italic">MATH EXCELLENCE</h1>
          <p className="text-[10px] font-bold text-slate-400">ANSHU SIR'S ACADEMY</p>
        </div>
      </header>

      <nav className="bg-blue-700 text-white w-full sticky top-[68px] z-40 flex justify-center shadow-lg">
        <div className="max-w-6xl w-full flex overflow-x-auto no-scrollbar">
          {[{ id: 'home', label: 'Home', icon: <History size={16}/> }, { id: 'live', label: 'Live Mock', icon: <Clock size={16}/> }, { id: 'practice', label: 'Practice', icon: <BookOpen size={16}/> }, { id: 'growth', label: 'Growth', icon: <TrendingUp size={16}/> }, { id: 'teacher', label: 'Admin', icon: <User size={16}/> }].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-bold text-[10px] uppercase border-b-4 transition-all ${activeTab === item.id ? 'border-yellow-400 bg-blue-800' : 'border-transparent'}`}>{item.icon} {item.label}</button>
          ))}
        </div>
      </nav>

      <main className="w-full max-w-5xl p-6 mb-20 flex flex-col items-center">
        {activeTab === 'home' && (
          <div className="text-center space-y-10 w-full animate-in fade-in">
            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border-4 border-slate-50">
               <GraduationCap size={56} className="text-blue-700 mx-auto mb-4" />
               <h2 className="text-3xl font-black uppercase italic tracking-tight">Master <span className="text-blue-700">Mathematics</span></h2>
               <button onClick={() => setActiveTab('practice')} className="mt-8 bg-blue-700 text-white px-10 py-3 rounded-full font-bold text-xs uppercase shadow-xl hover:bg-blue-800 transition-all">Go to Practice</button>
            </div>
            
            <div className="bg-white p-6 rounded-3xl shadow-md text-left w-full border-2 border-slate-50">
              <h3 className="font-bold text-sm uppercase mb-6 flex items-center gap-3 text-slate-800 border-b pb-3"><History size={20} className="text-blue-600"/> Student Activity Log</h3>
              <div className="space-y-3">
                {activityLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border-l-8 border-blue-600">
                    <div><p className="text-sm font-black uppercase">{log.studentName}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{log.examTitle}</p></div>
                    <div className="text-right text-[10px] font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full">{log.timeDisplay}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-6 w-full">
            <h2 className="font-bold uppercase text-slate-700 border-b-2 pb-2 flex items-center gap-3 text-lg"><Clock className="text-red-600" size={24}/> Live Mocks</h2>
            {liveMocks.filter(m => m.isPublished).map(m => (
              <div key={m.id} className="bg-white p-6 rounded-3xl shadow flex justify-between items-center border-2 border-slate-50">
                <div><h3 className="text-xl font-black uppercase italic">{m.name}</h3><p className="text-[10px] font-bold text-red-600 uppercase italic">Time: {m.hours}h {m.minutes}m</p></div>
                <button onClick={() => handleStartExamFlow(m.name, (parseInt(m.hours)||0)*3600+(parseInt(m.minutes)||0)*60, m.fileUrl)} className="bg-red-600 text-white px-8 py-2.5 rounded-full font-bold text-xs uppercase shadow-lg">Attend</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'teacher' && (!isTeacherAuthenticated ? 
          <div className="max-w-md w-full mx-auto mt-20 p-10 bg-white rounded-3xl shadow-xl text-center">
            <Lock size={40} className="text-blue-700 mx-auto mb-6" />
            <input type="password" onChange={(e) => { if(e.target.value === teacherPin) setIsTeacherAuthenticated(true); }} className="w-full py-4 bg-slate-50 border-2 rounded-xl text-center text-3xl font-black tracking-[0.5em] shadow-inner" placeholder="••••" />
          </div> : 
          <TeacherZoneMainView 
            liveMocks={liveMocks} prevPapers={prevPapers} practiceSets={practiceSets} 
            growthPublished={growthPublished} setGrowthPublished={async (v) => await setDoc(doc(db, "settings", "adminConfig"), { growthPublished: v }, { merge: true })}
            studentResults={studentResults} students={students} teacherPin={teacherPin}
            setTeacherPin={async (v) => await setDoc(doc(db, "settings", "adminConfig"), { pin: v }, { merge: true })}
          />
        )}

        {activeTab === 'growth' && <GrowthSectionView isPublished={growthPublished} results={studentResults} />}
        
        {activeTab === 'practice' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {[...practiceSets, ...prevPapers].filter(p => p.isPublished).map(p => (
              <div key={p.id} className="bg-white p-6 rounded-3xl shadow flex justify-between items-center border border-slate-100 hover:border-blue-300 transition-all">
                <div><h3 className="font-bold uppercase text-sm italic">{p.name}</h3><p className="text-[10px] font-bold text-slate-400">{p.hours}h {p.minutes}m Exam</p></div>
                <button onClick={() => handleStartExamFlow(p.name, (parseInt(p.hours)||0)*3600+(parseInt(p.minutes)||0)*60, p.fileUrl)} className="bg-blue-700 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase shadow-md">Start</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// --- Sub-component: Teacher Zone (সংশোধিত) ---
const TeacherZoneMainView = ({ liveMocks, prevPapers, practiceSets, growthPublished, setGrowthPublished, studentResults, students, teacherPin, setTeacherPin }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newRes, setNewRes] = useState({ exam: "", date: "", obtained: "", total: "" });

  const addPaper = async (type) => { await addDoc(collection(db, { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' }[type]), { name: "New Slot", hours: 1, minutes: 0, fileUrl: "", isPublished: false }); };
  const updateField = async (id, type, field, value) => { await setDoc(doc(db, { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' }[type], id), { [field]: value }, { merge: true }); };

  // --- 🔴 অ্যাক্টিভিটি লগ মোছার ফাংশন ---
  const clearLogs = async () => {
    if(window.confirm("Delete all activity logs?")) {
      const q = query(collection(db, "logs"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      alert("Logs Cleared!");
    }
  };

  const PaperManager = ({ title, items, type, color }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-slate-100 mb-8 w-full">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h3 className={`font-bold uppercase text-xs italic ${color}`}>{title} Manager</h3>
        <button onClick={() => addPaper(type)} className="p-2 bg-slate-100 rounded-full shadow-sm"><PlusCircle size={20}/></button>
      </div>
      <div className="space-y-4">{items.map(item => (
        <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border-2 border-white space-y-3 shadow-sm">
          <div className="flex gap-2">
            <input type="text" value={item.name} onChange={(e) => updateField(item.id, type, 'name', e.target.value)} className="flex-1 p-2 rounded-lg border text-xs font-bold uppercase" />
            <button onClick={() => updateField(item.id, type, 'isPublished', !item.isPublished)} className={`px-4 py-1 rounded-lg text-[9px] font-bold ${item.isPublished ? 'bg-green-600 text-white' : 'bg-slate-300'}`}>{item.isPublished ? 'LIVE' : 'HIDE'}</button>
            <button onClick={async () => await deleteDoc(doc(db, { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' }[type], item.id))} className="p-2 text-red-400"><Trash2 size={18}/></button>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-white px-2 rounded-lg border text-[10px] font-bold shrink-0">
              <Timer size={14}/> <input type="number" value={item.hours} onChange={(e) => updateField(item.id, type, 'hours', e.target.value)} className="w-6 text-center" />H 
              <input type="number" value={item.minutes} onChange={(e) => updateField(item.id, type, 'minutes', e.target.value)} className="w-6 text-center" />M
            </div>
            <input type="text" value={item.fileUrl} onChange={(e) => updateField(item.id, type, 'fileUrl', e.target.value)} className="flex-1 p-2 rounded-lg border text-[10px]" placeholder="Drive Link" />
          </div>
        </div>
      ))}</div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-white p-4 rounded-2xl flex justify-between items-center w-full mb-8 border-2 border-slate-50">
        <div className="flex gap-2">
          <button onClick={() => setIsChangingPin(!isChangingPin)} className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase"><Settings2 size={12} className="inline mr-1"/> PIN</button>
          <button onClick={clearLogs} className="px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase"><Trash2 size={12} className="inline mr-1"/> Clear Logs</button>
        </div>
        <button onClick={() => setGrowthPublished(!growthPublished)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${growthPublished ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{growthPublished ? 'Lock Growth' : 'Publish Growth'}</button>
      </div>

      {isChangingPin && (
        <div className="max-w-sm w-full p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 mb-8 animate-in slide-in-from-top-4">
           <input type="text" onChange={(e) => setNewRes({...newRes, pin: e.target.value})} className="w-full p-3 rounded-xl bg-white border-2 font-black text-center text-xl outline-none" placeholder="NEW PIN" />
           <div className="flex gap-4 mt-4">
             <button onClick={() => setIsChangingPin(false)} className="flex-1 py-2 font-bold text-xs uppercase bg-white rounded-lg">Cancel</button>
             <button onClick={async () => { await setTeacherPin(newRes.pin); setIsChangingPin(false); alert("PIN Changed!"); }} className="flex-1 py-2 font-bold text-xs uppercase bg-blue-700 text-white rounded-lg">Save</button>
           </div>
        </div>
      )}
      
      <PaperManager title="Live Mock" items={liveMocks} type="live" color="text-red-600" />
      <PaperManager title="Practice" items={practiceSets} type="practice" color="text-blue-700" />

      <div className="bg-white p-6 rounded-3xl shadow-lg border-t-8 border-slate-900 w-full mb-20">
        <h3 className="font-bold text-xs uppercase mb-6 flex items-center gap-3"><Trophy size={28} className="text-yellow-600"/> Student Registry</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {students.map((std, i) => (
            <div key={std.id} className="relative group">
              <button onClick={() => setSelectedStudent(std.name)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-white text-[10px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all">{std.name}</button>
              {/* 🔴 স্টুডেন্ট মোছার বাটন */}
              <button onClick={async () => { if(window.confirm(`Delete ${std.name}?`)) await deleteDoc(doc(db, "students", std.id)); }} className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 rounded-full shadow border-2 border-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
            </div>
          ))}
          <button onClick={async () => { const n = prompt("Name:"); if(n) await addDoc(collection(db, "students"), {name: n}); }} className="p-3 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-bold text-slate-300 uppercase hover:text-blue-600 transition-all">+ NEW</button>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-white z-[1200] p-6 overflow-y-auto animate-in slide-in-from-right-full">
           <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-[11px] font-bold text-blue-600 uppercase mb-8 hover:underline"><ChevronLeft size={24}/> BACK</button>
           <div className="bg-white p-6 rounded-3xl border-4 border-slate-50 shadow-2xl max-w-xl mx-auto space-y-10">
              <div className="flex items-center gap-6 border-b pb-6">
                <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center text-white"><User size={28} /></div>
                <div><h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">{selectedStudent} Marksheet</h3></div>
              </div>
              <div className="p-6 bg-blue-50 rounded-2xl space-y-4 shadow-inner">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <input type="text" value={newRes.exam} onChange={(e) => setNewRes({...newRes, exam: e.target.value})} className="col-span-2 w-full p-3 rounded-xl border-2 font-bold text-xs" placeholder="Topic Description" />
                   <input type="date" value={newRes.date} onChange={(e) => setNewRes({...newRes, date: e.target.value})} className="w-full p-3 rounded-xl border-2 font-bold text-xs" />
                   <div className="flex gap-2">
                     <input type="number" value={newRes.obtained} onChange={(e) => setNewRes({...newRes, obtained: e.target.value})} className="w-full p-3 rounded-xl border-2 font-bold text-xs text-center" placeholder="Obt" />
                     <input type="number" value={newRes.total} onChange={(e) => setNewRes({...newRes, total: e.target.value})} className="w-full p-3 rounded-xl border-2 font-bold text-xs text-center" placeholder="Full" />
                   </div>
                 </div>
                 <button onClick={async () => {
                   if(newRes.exam && newRes.obtained && newRes.total) {
                     const p = Math.round((parseFloat(newRes.obtained)/parseFloat(newRes.total))*100);
                     await addDoc(collection(db, "results"), { ...newRes, name: selectedStudent, percent: p, timestamp: Date.now() });
                     setNewRes({exam: "", date: "", obtained: "", total: ""});
                   }
                 }} className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold text-[11px] uppercase shadow-md">Record Metric</button>
              </div>
              <div className="space-y-3 pt-6 border-t-2 border-slate-50">
                 {studentResults.filter(r => r.name === selectedStudent).sort((a,b)=>b.timestamp-a.timestamp).map(r => (
                   <div key={r.id} className="p-4 bg-slate-50 border-2 rounded-2xl flex justify-between items-center shadow-sm">
                     <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${r.percent >= 40 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.percent}%</div>
                       <div><p className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{r.exam}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{r.date} • {r.obtained}/{r.total}</p></div>
                     </div>
                     <button onClick={async () => await deleteDoc(doc(db, "results", r.id))} className="text-red-300 hover:text-red-600 transition-all p-2 bg-white rounded-lg active:scale-90 shadow-sm"><Trash2 size={24} /></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const GrowthSectionView = ({ isPublished, results }) => {
  const [sel, setSel] = useState(null);
  if (!isPublished) return <div className="py-40 text-center"><Award size={64} className="text-slate-100 mx-auto mb-4" /><p className="font-bold text-slate-300 uppercase text-xs italic tracking-widest leading-none">Access Restricted • Evaluations Active</p></div>;
  const students = Array.from(new Set(results.map(r => r.name))).sort();
  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in">
      {!sel ? (
        <div className="grid gap-4">
          {students.map((name, i) => (<button key={i} onClick={() => setSel(name)} className="bg-white p-4 rounded-2xl shadow-sm border-2 border-white flex justify-between items-center group active:scale-[0.98] transition-all hover:border-blue-300"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 transition-all"><User size={18} /></div><span className="font-bold text-slate-800 uppercase text-sm italic">{name}</span></div><ChevronRight size={24} className="text-slate-300 group-hover:text-blue-600" /></button>))}
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-20">
          <button onClick={() => setSel(null)} className="flex items-center gap-2 text-[11px] font-bold text-blue-600 uppercase mb-4 italic transition-all hover:underline"><ChevronLeft size={24}/> Back</button>
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-slate-50 relative">
             <div className="bg-blue-700 p-10 text-white text-center relative overflow-hidden"><Trophy className="absolute -top-20 -right-20 opacity-10 rotate-12" size={150}/><h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Growth Report</h2><p className="mt-5 inline-block bg-white/20 px-8 py-2 rounded-full border border-white/40 backdrop-blur-sm text-sm font-bold uppercase tracking-widest italic">{sel}</p></div>
             <div className="p-6 overflow-x-auto">
               <table className="w-full text-sm font-bold border-separate border-spacing-y-4">
                 <thead><tr className="text-slate-400 uppercase text-[10px] tracking-widest opacity-80"><th className="pb-4 text-left">Module</th><th className="pb-4 text-center">Score</th><th className="pb-4 text-right">Metric</th></tr></thead>
                 <tbody>{results.filter(r => r.name === sel).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r => (<tr key={r.id} className="bg-slate-50 rounded-2xl shadow-sm"><td className="p-5 uppercase text-slate-800 italic rounded-l-2xl border-l-8 border-blue-600 tracking-tighter text-md leading-none">{r.exam}</td><td className="p-5 text-center text-blue-700 text-3xl italic tracking-tighter leading-none">{r.percent}%</td><td className="p-5 text-right rounded-r-2xl"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border-2 shadow-sm ${r.percent >= 40 ? 'bg-green-100 text-green-700 border-green-200 shadow-green-100' : 'bg-red-100 text-red-700 border-red-200 shadow-red-100'}`}>{r.percent >= 90 ? 'MASTER' : r.percent >= 40 ? 'SUCCESS' : 'FAILURE'}</span></td></tr>))}</tbody>
               </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExamInterface = ({ exam, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(exam.duration);
  const [isSubmitted, setIsSubmitted] = useState(false);
  useEffect(() => { if (timeLeft <= 0 || isSubmitted) { if(timeLeft === 0 && !isSubmitted) setIsSubmitted(true); return; } const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000); return () => clearInterval(timer); }, [timeLeft, isSubmitted]);
  const formatTime = (s) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${sec < 10 ? '0' + sec : sec}`; };
  if (isSubmitted) return ( <div className="fixed inset-0 bg-white z-[2000] flex flex-col items-center justify-center p-10 text-center animate-in zoom-in duration-700"> <div className="w-40 h-40 bg-green-50 rounded-full flex items-center justify-center mb-10 shadow-[0_20px_50px_rgba(22,163,74,0.2)]"><CheckCircle size={100} className="text-green-600" /></div> <h2 className="text-5xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">TEST SUBMITTED</h2> <button onClick={onFinish} className="bg-blue-700 text-white px-16 py-5 rounded-full font-black uppercase text-[15px] shadow-lg mt-16 active:scale-95 transition-all border-b-8 border-blue-900 active:border-b-0">Finalize Session</button> </div> );
  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden">
      <div className="bg-white p-4 flex justify-between items-center border-b-[12px] border-yellow-400 shadow-2xl">
        <div className="flex items-center gap-6"><div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white animate-pulse shadow-red-200 border-4 border-red-50"><ShieldAlert size={32}/></div><div><h2 className="font-black text-slate-800 text-xl md:text-2xl uppercase italic tracking-tighter leading-none">{exam.title}</h2><p className="text-[11px] text-blue-700 font-black uppercase italic mt-2"><User size={14} className="inline"/> PROCTORING ACTIVE • {exam.studentName}</p></div></div>
        <div className="flex items-center gap-8">
          <div className={`px-8 py-2.5 rounded-3xl font-black text-4xl md:text-5xl border-[6px] shadow-inner tracking-tighter ring-8 ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse ring-red-50' : 'bg-slate-50 text-slate-800 border-slate-100 ring-slate-50'}`}>{formatTime(timeLeft)}</div>
          <button onClick={() => { if(window.confirm("EXECUTE SECURE SUBMISSION?")) setIsSubmitted(true); }} className="bg-green-600 text-white px-12 py-4 rounded-3xl font-black text-[14px] uppercase shadow-3xl hover:bg-green-700 transition-all border-b-8 border-green-800 active:border-b-0 active:translate-y-2">SUBMIT</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-900 p-6 md:p-14">
        <div className="max-w-6xl mx-auto space-y-12">
           <div className="bg-blue-900/60 border-[6px] border-blue-500/30 p-8 rounded-[3rem] flex items-center gap-8 text-blue-200 shadow-3xl backdrop-blur-3xl ring-4 ring-white/10">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-2xl ring-8 ring-blue-500/20"><PenTool size={40} /></div>
              <p className="text-[14px] md:text-[18px] font-black uppercase italic tracking-[0.1em] opacity-100">Task: Write answers on physical scripts. Cloud proctoring monitors all navigation. Submit before terminal zero.</p>
           </div>
           <SecurePDFViewer fileUrl={exam.fileUrl} />
        </div>
      </div>
      <div className="bg-red-900 text-white py-4 text-center text-[11px] font-black uppercase tracking-[1em] z-50 border-t-8 border-red-600 shadow-3xl">GLOBAL CLOUD SECURITY SHIELD ACTIVE • DO NOT EXIT TERMINAL</div>
    </div>
  );
};

export default App;
