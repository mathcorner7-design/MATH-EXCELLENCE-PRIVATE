import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { 
  Trophy, BookOpen, TrendingUp, User, Clock, ChevronRight,
  GraduationCap, AlertCircle, PlusCircle, FileText,
  Lock, Award, Timer, Settings2, CheckCircle,
  PenTool, ShieldAlert, Loader2, ChevronLeft, Trash2,
  UserPlus, Search, ArrowRight, X, Key, History, UserCheck
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
    if (url.includes('drive.google.com')) {
      return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview').split('/edit')[0];
    }
    return url;
  };
  return (
    <div className="w-full h-[80vh] bg-slate-100 rounded-[3rem] overflow-hidden relative border-4 border-slate-900 shadow-2xl mt-8">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
          <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Securing Connection...</p>
        </div>
      )}
      <iframe src={getEmbedUrl(fileUrl)} className="w-full h-full relative z-10" onLoad={() => setLoading(false)} title="Question Paper" />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] rotate-[-45deg] select-none z-0">
        <h1 className="text-[10vw] font-black text-slate-900">MATH EXCELLENCE</h1>
      </div>
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
    const unsubLive = onSnapshot(collection(db, "liveMocks"), (s) => setLiveMocks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPrev = onSnapshot(collection(db, "prevPapers"), (s) => setPrevPapers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPrac = onSnapshot(collection(db, "practiceSets"), (s) => setPracticeSets(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubRes = onSnapshot(collection(db, "results"), (s) => setStudentResults(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubStds = onSnapshot(collection(db, "students"), (s) => setStudents(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => a.name.localeCompare(b.name))));
    const unsubSets = onSnapshot(doc(db, "settings", "adminConfig"), (d) => {
      if (d.exists()) { setTeacherPin(d.data().pin); setGrowthPublished(d.data().growthPublished); }
    });
    const unsubLogs = onSnapshot(query(collection(db, "logs"), orderBy("timestamp", "desc")), (s) => setActivityLogs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubLive(); unsubPrev(); unsubPrac(); unsubRes(); unsubStds(); unsubSets(); unsubLogs(); };
  }, []);

  const finalizeExamStart = async () => {
    if (!studentNameInput.trim()) return;
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-GB'); // তারিখ ফরম্যাট: DD/MM/YYYY
    await addDoc(collection(db, "logs"), { 
      studentName: studentNameInput, examTitle: pendingExam.title, timestamp: Date.now(), 
      timeDisplay: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateDisplay: dateStr 
    });
    setCurrentExam({ ...pendingExam, studentName: studentNameInput });
    setIsExamActive(true);
    setShowNameModal(false);
    setStudentNameInput('');
  };

  if (isExamActive) return <ExamInterface exam={currentExam} onFinish={() => setIsExamActive(false)} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 select-none flex flex-col items-center overflow-x-hidden">
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl border-4 border-slate-50">
            <User size={40} className="text-blue-600 mx-auto mb-4" />
            <h3 className="font-black text-slate-800 uppercase text-xs mb-6 tracking-widest">Identity Check</h3>
            <input autoFocus type="text" value={studentNameInput} onChange={(e) => setStudentNameInput(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-slate-100 font-black text-center outline-none focus:border-blue-500 mb-8" placeholder="FULL NAME" />
            <div className="flex gap-3">
              <button onClick={() => setShowNameModal(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-black text-[10px] uppercase">Cancel</button>
              <button onClick={finalizeExamStart} className="flex-1 py-4 rounded-2xl bg-blue-700 text-white font-black text-[10px] uppercase shadow-lg active:scale-95">Confirm</button>
            </div>
          </div>
        </div>
      )}
      
      <header className="bg-white border-b-2 sticky top-0 z-50 shadow-sm px-6 py-4 flex justify-between items-center w-full max-w-6xl">
        <div onClick={() => setActiveTab('home')} className="cursor-pointer">
          <h1 className="text-2xl font-black text-blue-700 uppercase italic tracking-tighter leading-none">MATH EXCELLENCE</h1>
          <p className="text-[10px] font-black text-slate-400 opacity-80 mt-1 uppercase">Anshu Sir's Coaching Portal</p>
        </div>
      </header>

      <nav className="bg-blue-700 text-white sticky top-[64px] z-40 w-full flex justify-center shadow-2xl">
        <div className="max-w-6xl w-full flex overflow-x-auto no-scrollbar">
          {[
            { id: 'live', label: 'Live Mock', icon: <Clock size={16} /> },
            { id: 'practice', label: 'Practice', icon: <BookOpen size={16} /> },
            { id: 'growth', label: 'Growth', icon: <TrendingUp size={16} /> },
            { id: 'teacher', label: 'Admin', icon: <User size={16} /> }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex items-center justify-center gap-2 px-6 py-5 font-black text-[11px] uppercase border-b-4 transition-all ${activeTab === item.id ? 'border-yellow-400 bg-blue-800' : 'border-transparent'}`}>{item.icon} {item.label}</button>
          ))}
        </div>
      </nav>

      <main className="w-full max-w-5xl p-6 mb-20">
        {activeTab === 'home' && (
          <div className="text-center space-y-12 animate-in fade-in duration-700">
            <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border-4 border-slate-50 relative overflow-hidden group">
               <GraduationCap size={64} className="text-blue-700 mx-auto mb-4 animate-bounce-slow" />
               <h2 className="text-4xl font-black uppercase italic tracking-tighter">Master <span className="text-blue-700 underline decoration-yellow-400 decoration-8 underline-offset-8">Maths</span></h2>
               <p className="text-slate-500 font-black text-xs mt-6 uppercase tracking-[0.4em] italic opacity-75 leading-relaxed">Nurturing precision for a brighter future</p>
               <button onClick={() => setActiveTab('practice')} className="mt-10 bg-blue-700 text-white px-10 py-4 rounded-full font-black text-[11px] uppercase shadow-2xl hover:bg-blue-800 transition-all">Start Practice</button>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl text-left border-2 border-slate-50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-3 h-full bg-blue-700"></div>
              <h3 className="font-black text-sm uppercase italic mb-8 flex items-center gap-3 text-slate-800 border-b pb-4"><History size={24} className="text-blue-600"/> Live Student Activity Monitor</h3>
              <div className="space-y-4">
                {activityLogs.slice(0, 6).map(log => (
                  <div key={log.id} className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center border-l-8 border-blue-600 shadow-sm ring-1 ring-slate-100">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 shadow-inner"><UserCheck size={20}/></div>
                      <div><p className="text-[14px] font-black uppercase text-slate-800 tracking-tight">{log.studentName}</p><p className="text-[10px] font-bold text-slate-400 uppercase italic mt-1 opacity-90">{log.examTitle}</p></div>
                    </div>
                    <div className="text-right">
                       <p className="text-[11px] font-black text-blue-700 italic uppercase bg-blue-50 px-4 py-1 rounded-full border border-blue-100 shadow-sm">{log.timeDisplay}</p>
                       <p className="text-[9px] font-bold text-slate-300 uppercase mt-1.5">{log.dateDisplay}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-10">
            <h2 className="font-black uppercase italic text-slate-700 border-b-4 border-red-50 pb-3 flex items-center gap-4 text-xl tracking-tighter"><Clock className="text-red-600" size={24}/> Active Live Mocks</h2>
            {liveMocks.filter(m => m.isPublished).map(m => (
              <div key={m.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-red-50 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-red-600 text-white px-6 py-1.5 text-[9px] font-black uppercase animate-pulse">LIVE MOCK</div>
                <div><h3 className="text-2xl font-black uppercase italic text-slate-800">{m.name}</h3><p className="text-[12px] font-black text-red-600 uppercase flex items-center gap-3 mt-4 italic bg-red-50 px-6 py-2 rounded-2xl w-fit"><Timer size={18}/> Duration: {m.hours}h {m.minutes}m</p></div>
                <button onClick={() => handleStartExamFlow(m.name, (parseInt(m.hours)||0)*3600+(parseInt(m.minutes)||0)*60, m.fileUrl)} className="bg-red-600 text-white px-12 py-4 rounded-[1.5rem] font-black text-[12px] uppercase shadow-2xl active:scale-95 border-b-8 border-red-900 active:border-b-0 transition-all">Attempt Exam</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="space-y-12 w-full animate-in fade-in">
            <h2 className="font-black uppercase italic text-slate-800 border-b-4 border-blue-50 pb-4 mb-8 flex items-center gap-4 text-2xl underline decoration-blue-700 decoration-8 underline-offset-8"><BookOpen className="text-blue-700" size={32}/> Special Practice Sets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...practiceSets, ...prevPapers].filter(p => p.isPublished).map(p => (
                <div key={p.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-white flex flex-col justify-between items-start hover:-translate-y-2 transition-all group ring-4 ring-slate-50">
                  <div><h3 className="font-black uppercase text-lg text-slate-800 tracking-tighter italic group-hover:text-blue-700 transition-colors">{p.name}</h3><p className="text-[12px] font-black text-slate-400 uppercase italic mt-4 flex items-center gap-3"><Timer size={18} className="text-blue-400"/> {p.hours}h {p.minutes}m Module</p></div>
                  <button onClick={() => handleStartExamFlow(p.name, (parseInt(p.hours)||0)*3600+(parseInt(p.minutes)||0)*60, p.fileUrl)} className="mt-8 bg-blue-700 text-white px-10 py-4 rounded-[1.5rem] font-black text-[11px] uppercase shadow-2xl active:scale-95 transition-all">Open Module</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teacher' && (!isTeacherAuthenticated ? 
          <div className="max-w-md w-full mx-auto mt-28 p-16 bg-white rounded-[4rem] shadow-2xl border-t-[16px] border-blue-700 text-center animate-in zoom-in duration-500">
            <Lock size={64} className="text-blue-700 mx-auto mb-10" />
            <h2 className="text-2xl font-black uppercase italic mb-10 text-slate-800 tracking-tight">Admin Gateway</h2>
            <input type="password" onChange={(e) => { if(e.target.value === teacherPin) setIsTeacherAuthenticated(true); }} className="w-full py-5 bg-slate-50 border-4 border-white rounded-[2rem] outline-none focus:border-blue-500 font-black text-center text-4xl tracking-[0.6em] shadow-xl" placeholder="••••" />
          </div> : 
          <TeacherZoneMainView 
            liveMocks={liveMocks} prevPapers={prevPapers} practiceSets={practiceSets} 
            growthPublished={growthPublished} setGrowthPublished={async (v) => await setDoc(doc(db, "settings", "adminConfig"), { growthPublished: v }, { merge: true })}
            studentResults={studentResults} students={students} teacherPin={teacherPin}
            setTeacherPin={async (v) => await setDoc(doc(db, "settings", "adminConfig"), { pin: v }, { merge: true })}
          />
        )}

        {activeTab === 'growth' && <GrowthSectionView isPublished={growthPublished} results={studentResults} />}
      </main>
    </div>
  );
};

// --- Sub-component: Teacher Zone Manager ---
const TeacherZoneMainView = ({ liveMocks, prevPapers, practiceSets, growthPublished, setGrowthPublished, studentResults, students, teacherPin, setTeacherPin }) => {
  const [msg, setMsg] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [newRes, setNewRes] = useState({ exam: "", date: "", obtained: "", total: "" });

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  
  const updateField = async (id, type, field, value) => {
    const colls = { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' };
    await setDoc(doc(db, colls[type], id), { [field]: value }, { merge: true });
  };

  const PaperSection = ({ title, items, type, icon, color }) => (
    <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border-t-[16px] border-slate-100 space-y-10 w-full mb-16 ring-8 ring-slate-50">
      <div className="flex justify-between items-center border-b-8 border-slate-50 pb-8">
        <h3 className={`font-black uppercase text-[16px] italic flex items-center gap-6 ${color}`}>{icon} {title} Admin Control</h3>
        <button onClick={async () => { const colls = { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' }; await addDoc(collection(db, colls[type]), { name: "New Assignment", hours: 1, minutes: 0, fileUrl: "", isPublished: false }); notify("Synced!"); }} className="bg-slate-100 p-4 rounded-full border-4 border-white active:scale-90"><PlusCircle size={32} /></button>
      </div>
      <div className="space-y-8">{items.map(item => (
          <div key={item.id} className="p-8 bg-slate-50 rounded-[3rem] border-8 border-white shadow-xl space-y-8 transition-all hover:bg-white group ring-4 ring-slate-100">
            <div className="flex flex-col xl:flex-row gap-6">
              <input type="text" value={item.name} onChange={(e) => updateField(item.id, type, 'name', e.target.value)} className="flex-1 bg-white border-8 border-slate-100 p-5 rounded-[2.5rem] font-black text-xl uppercase outline-none shadow-inner italic" />
              <div className="flex gap-4">
                <button onClick={() => updateField(item.id, type, 'isPublished', !item.isPublished)} className={`px-10 py-4 rounded-[2rem] text-[12px] font-black uppercase transition-all shadow-xl border-b-[12px] active:border-b-0 min-w-[180px] ${item.isPublished ? 'bg-green-600 text-white border-green-800' : 'bg-slate-300 text-slate-600 border-slate-400'}`}>{item.isPublished ? 'LIVE' : 'DRAFT'}</button>
                <button onClick={async () => { if(window.confirm("Delete?")) await deleteDoc(doc(db, { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' }[type], item.id)); }} className="text-red-400 p-5 bg-white rounded-[2rem] shadow-2xl hover:text-red-600 active:scale-90 border-4 border-red-50"><Trash2 size={32}/></button>
              </div>
            </div>
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="flex items-center gap-6 bg-white border-8 border-slate-100 px-8 py-4 rounded-[2.5rem] shadow-inner shrink-0 ring-4 ring-slate-50">
                <Timer size={32} className="text-slate-300"/>
                <input type="number" value={item.hours} onChange={(e) => updateField(item.id, type, 'hours', e.target.value)} className="w-12 text-center font-black text-[24px] bg-transparent outline-none border-b-8 border-slate-50" />
                <span className="text-[14px] font-black text-slate-400">H</span>
                <input type="number" value={item.minutes} onChange={(e) => updateField(item.id, type, 'minutes', e.target.value)} className="w-12 text-center font-black text-[24px] bg-transparent outline-none border-b-8 border-slate-50" />
                <span className="text-[14px] font-black text-slate-400">M</span>
              </div>
              <input type="text" value={item.fileUrl} onChange={(e) => updateField(item.id, type, 'fileUrl', e.target.value)} className="flex-1 bg-white border-8 border-slate-100 p-5 rounded-[2.5rem] font-bold text-[14px] outline-none shadow-xl" placeholder="GOOGLE DRIVE PDF LINK" />
            </div>
          </div>
        ))}</div>
    </div>
  );

  return (
    <div className="space-y-16 w-full flex flex-col items-center">
      {msg && <div className="fixed top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-12 py-5 rounded-full z-[1000] text-[14px] font-black uppercase border-4 border-yellow-400 shadow-2xl animate-in slide-in-from-top-10">{msg}</div>}
      
      <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-2xl ring-[16px] ring-slate-50 w-full mb-10 border-4 border-white">
        <h2 className="font-black text-[14px] uppercase italic text-slate-400 tracking-[0.4em] opacity-80 leading-none">ADMINISTRATIVE CORE</h2>
        <button onClick={() => setIsChangingPin(!isChangingPin)} className="text-[11px] font-black text-blue-600 uppercase flex items-center gap-4 hover:underline decoration-4 underline-offset-[12px] transition-all"><Settings2 size={24}/> CHANGE ADMIN PIN</button>
      </div>

      {isChangingPin && (
        <div className="max-w-lg w-full p-12 bg-blue-50 rounded-[5rem] border-[8px] border-blue-100 shadow-3xl space-y-8 animate-in slide-in-from-top-10 duration-700">
           <p className="text-[14px] font-black text-blue-800 uppercase text-center italic tracking-widest underline decoration-blue-200 underline-offset-8">Set New Authorization PIN</p>
           <input type="text" onChange={(e) => setNewPinInput(e.target.value)} className="w-full p-6 rounded-[2.5rem] bg-white border-8 border-blue-100 font-black text-center text-4xl outline-none shadow-2xl shadow-blue-200/50" placeholder="••••" />
           <div className="flex gap-6">
             <button onClick={() => setIsChangingPin(false)} className="flex-1 py-5 font-black text-[12px] uppercase bg-white text-slate-500 rounded-[2rem] shadow-xl">Cancel</button>
             <button onClick={async () => { if(newPinInput.length >= 4) { await setTeacherPin(newPinInput); setIsChangingPin(false); notify("PIN Securely Changed!"); } }} className="flex-1 py-5 font-black text-[12px] uppercase bg-blue-700 text-white rounded-[2rem] shadow-2xl active:scale-95 border-b-8 border-blue-900">Encrypt & Save</button>
           </div>
        </div>
      )}
      
      <PaperSection title="Live Examination" items={liveMocks} type="live" icon={<Clock size={28}/>} color="text-red-600" />
      <PaperSection title="Practice Set" items={practiceSets} type="practice" icon={<BookOpen size={28}/>} color="text-blue-700" />

      {/* --- Student Database Registry (With DELETE Option) --- */}
      <div className="bg-white p-16 rounded-[6rem] shadow-[0_80px_150px_-40px_rgba(0,0,0,0.25)] border-t-[20px] border-slate-900 space-y-12 w-full mb-32 ring-8 ring-slate-50">
        <div className="flex flex-col lg:flex-row justify-between items-center border-b-8 border-slate-50 pb-10 gap-8">
          <h3 className="font-black uppercase text-[18px] italic text-slate-800 flex items-center gap-7 leading-none"><Trophy size={40} className="text-yellow-600 drop-shadow-2xl"/> Student Registry & Analytics</h3>
          <button onClick={() => setGrowthPublished(!growthPublished)} className={`px-12 py-5 rounded-full text-[12px] font-black uppercase shadow-3xl transition-all active:scale-95 border-b-[10px] ${growthPublished ? 'bg-red-600 text-white border-red-900' : 'bg-green-600 text-white border-green-900'}`}>{growthPublished ? 'RESTRICT ACCESS' : 'PUBLISH REPORTS'}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {students.map((std, i) => (
            <div key={std.id} className="relative group">
              <button onClick={() => setSelectedStudent(std.name)} className="w-full p-8 bg-slate-50 rounded-[3.5rem] border-8 border-white shadow-xl flex justify-between items-center hover:bg-blue-600 hover:scale-[1.03] transition-all ring-4 ring-slate-50/50">
                <span className="font-black uppercase text-[18px] group-hover:text-white transition-colors italic tracking-tighter">{std.name}</span>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-200 group-hover:text-blue-600 shadow-2xl transition-all duration-500"><ChevronRight size={36} /></div>
              </button>
              {/* DELETE BUTTON FOR STUDENT PROFILE */}
              <button onClick={async (e) => { e.stopPropagation(); if(window.confirm(`Permanently delete ${std.name}?`)) await deleteDoc(doc(db, "students", std.id)); }} className="absolute -top-3 -right-3 p-4 bg-white rounded-full shadow-2xl text-red-400 hover:text-red-600 border-4 border-red-50 active:scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={24} />
              </button>
            </div>
          ))}
          <button onClick={async () => { const n = prompt("ENTER FULL STUDENT NAME:"); if(n) await addDoc(collection(db, "students"), {name: n, createdAt: serverTimestamp()}); }} className="p-10 border-[10px] border-dashed border-slate-100 rounded-[3.5rem] flex items-center justify-center gap-6 font-black text-[14px] uppercase text-slate-300 hover:text-blue-600 hover:border-blue-300 transition-all active:scale-95"><UserPlus size={40}/> Register New Student</button>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-white z-[1200] p-10 md:p-24 overflow-y-auto animate-in slide-in-from-right-full duration-1000">
           <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-4 text-[18px] font-black text-blue-600 uppercase mb-16 hover:underline decoration-8 underline-offset-[24px] tracking-widest italic transition-all"><ChevronLeft size={56}/> Back to Registry</button>
           <div className="bg-white p-16 md:p-32 rounded-[10rem] border-[32px] border-slate-50 shadow-[0_120px_250px_-60px_rgba(0,0,0,0.4)] space-y-20 max-w-6xl mx-auto relative overflow-hidden">
              <div className="flex items-center gap-12 border-b-[16px] border-slate-50 pb-20 relative z-10">
                <div className="w-32 h-32 bg-blue-700 rounded-[4rem] flex items-center justify-center text-white shadow-3xl rotate-12 ring-[24px] ring-blue-50"><User size={64} /></div>
                <div><h3 className="text-6xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">{selectedStudent}</h3><p className="text-[18px] font-bold text-slate-400 uppercase italic mt-7 tracking-[0.6em] opacity-80 leading-none">Official Marksheet Registry</p></div>
              </div>
              <div className="p-16 bg-blue-50 rounded-[7rem] border-[12px] border-blue-100 space-y-12 shadow-inner relative z-10">
                 <h4 className="text-[20px] font-black text-blue-700 uppercase flex items-center gap-8 italic tracking-widest leading-none"><PlusCircle size={48}/> Record Performance</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4"><p className="text-[14px] font-black text-slate-400 uppercase ml-8 tracking-[0.4em] italic leading-none">Exam Topic</p><input type="text" value={newRes.exam} onChange={(e) => setNewRes({...newRes, exam: e.target.value})} className="w-full p-8 rounded-[3rem] border-[10px] border-white font-black text-[20px] outline-none shadow-3xl focus:border-blue-300 transition-all leading-none italic" placeholder="e.g. Geometry Final" /></div>
                   <div className="space-y-4"><p className="text-[14px] font-black text-slate-400 uppercase ml-8 tracking-[0.4em] italic leading-none">Exam Date</p><input type="date" value={newRes.date} onChange={(e) => setNewRes({...newRes, date: e.target.value})} className="w-full p-8 rounded-[3rem] border-[10px] border-white font-black text-[20px] outline-none shadow-3xl focus:border-blue-300 transition-all leading-none" /></div>
                   <div className="space-y-4"><p className="text-[14px] font-black text-slate-400 uppercase ml-8 tracking-[0.4em] italic leading-none">Obtained Score</p><input type="number" value={newRes.obtained} onChange={(e) => setNewRes({...newRes, obtained: e.target.value})} className="w-full p-8 rounded-[3rem] border-[10px] border-white font-black text-[28px] outline-none shadow-3xl text-center focus:border-blue-300 transition-all leading-none" placeholder="00" /></div>
                   <div className="space-y-4"><p className="text-[14px] font-black text-slate-400 uppercase ml-8 tracking-[0.4em] italic leading-none">Full Marks</p><input type="number" value={newRes.total} onChange={(e) => setNewRes({...newRes, total: e.target.value})} className="w-full p-8 rounded-[3rem] border-[10px] border-white font-black text-[28px] outline-none shadow-3xl text-center focus:border-blue-300 transition-all leading-none" placeholder="100" /></div>
                 </div>
                 <button onClick={async () => {
                   if(newRes.exam && newRes.obtained && newRes.total) {
                     const p = Math.round((parseFloat(newRes.obtained)/parseFloat(newRes.total))*100);
                     await addDoc(collection(db, "results"), { ...newRes, name: selectedStudent, percent: p, timestamp: Date.now() });
                     setNewRes({exam: "", date: "", obtained: "", total: ""});
                     notify("Record Logged Successfully!");
                   }
                 }} className="w-full py-10 bg-blue-700 text-white rounded-[4rem] font-black text-[18px] uppercase shadow-[0_50px_100px_-20px_rgba(29,78,216,0.7)] hover:bg-blue-800 transition-all active:scale-[0.98] border-b-[18px] border-blue-900 active:border-b-0 leading-none tracking-[0.2em]">Finalize Report Card</button>
              </div>
              <div className="space-y-8 max-h-[60rem] overflow-y-auto no-scrollbar pt-16 relative z-10">
                 {studentResults.filter(r => r.name === selectedStudent).sort((a,b)=>b.timestamp-a.timestamp).map(r => (
                   <div key={r.id} className="p-12 bg-slate-50 border-[10px] border-white rounded-[5rem] flex justify-between items-center group hover:bg-white transition-all shadow-2xl ring-4 ring-slate-100">
                     <div className="flex items-center gap-14">
                       <div className={`w-28 h-28 rounded-[3rem] flex items-center justify-center font-black text-4xl shadow-3xl border-[12px] border-white ${r.percent >= 40 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.percent}%</div>
                       <div><p className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none underline decoration-slate-100 underline-offset-[12px]">{r.exam}</p><p className="text-[16px] text-slate-400 font-bold uppercase mt-7 italic tracking-[0.4em] leading-none opacity-80">{r.date} • {r.obtained}/{r.total} Marks Assessment</p></div>
                     </div>
                     <button onClick={async () => { if(window.confirm("PURGE RECORD?")) await deleteDoc(doc(db, "results", r.id)); }} className="text-red-200 hover:text-red-600 transition-all p-7 bg-white rounded-[2.5rem] shadow-2xl active:scale-90 border-8 border-red-50"><Trash2 size={48} /></button>
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
  if (!isPublished) return <div className="py-80 text-center bg-white rounded-[10rem] border-[20px] border-dashed border-slate-100 max-w-5xl mx-auto w-full animate-pulse shadow-3xl"><Award size={150} className="text-slate-100 mx-auto mb-14" /><h2 className="font-black text-slate-300 uppercase text-[24px] tracking-[0.8em] italic opacity-60 leading-none">Secure Encryption Active • Evaluations Pending</h2></div>;
  const uniqueStudents = Array.from(new Set(results.map(r => r.name))).sort();
  return (
    <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-1000">
      {!sel ? (
        <div className="grid gap-10">
          <p className="text-[16px] font-black text-slate-400 uppercase tracking-[0.6em] ml-16 mb-8 italic opacity-80 leading-none">Database Registry Search:</p>
          {uniqueStudents.map((name, i) => (<button key={i} onClick={() => setSel(name)} className="bg-white p-12 rounded-[4rem] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.2)] border-[16px] border-white flex justify-between items-center group active:scale-[0.95] transition-all hover:border-blue-700 hover:shadow-blue-100/50"><div className="flex items-center gap-10"><div className="w-24 h-20 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-700 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-700 shadow-blue-100/50"><User size={36} /></div><span className="font-black text-slate-800 uppercase text-2xl italic tracking-tighter leading-none">{name}</span></div><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all duration-700 shadow-3xl"><ChevronRight size={56} /></div></button>))}
        </div>
      ) : (
        <div className="space-y-16 animate-in slide-in-from-right-40 duration-1000">
          <button onClick={() => setSel(null)} className="flex items-center gap-6 text-[18px] font-black text-blue-600 uppercase mb-12 hover:underline decoration-[10px] underline-offset-[24px] tracking-[0.4em] italic transition-all decoration-blue-100"><ChevronLeft size={56}/> All Profiles</button>
          <div className="bg-white rounded-[10rem] shadow-[0_100px_200px_-50px_rgba(0,0,0,0.5)] overflow-hidden border-[24px] border-slate-50 relative">
             <div className="bg-blue-700 p-24 text-white text-center relative overflow-hidden shadow-3xl ring-inset ring-[24px] ring-white/10"><Trophy className="absolute -top-48 -right-48 opacity-10 rotate-12" size={500}/><h2 className="text-7xl font-black uppercase italic underline decoration-yellow-400 decoration-[14px] underline-offset-[28px] tracking-tighter leading-tight">Growth Registry</h2><div className="mt-28 inline-block bg-white/25 px-20 py-7 rounded-full border-[10px] border-white/50 backdrop-blur-3xl shadow-4xl animate-pulse"><p className="text-3xl font-black uppercase tracking-[0.6em] italic leading-none">{sel}</p></div></div>
             <div className="p-20 overflow-x-auto">
               <table className="w-full text-[20px] font-black border-separate border-spacing-y-8">
                 <thead><tr className="text-slate-400 uppercase text-[15px] tracking-[0.8em] opacity-80 leading-none"><th className="p-10 text-left">Module</th><th className="p-10 text-center">Score</th><th className="p-10 text-right">Metric</th></tr></thead>
                 <tbody>{results.filter(r => r.name === sel).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r => (<tr key={r.id} className="bg-slate-50 rounded-[4rem] shadow-xl hover:scale-[1.03] transition-all duration-700 ring-4 ring-white"><td className="p-10 uppercase text-slate-800 italic rounded-l-[3.5rem] border-l-[24px] border-blue-600 tracking-tighter text-3xl leading-none">{r.exam}</td><td className="p-10 text-center text-blue-700 text-7xl tracking-tighter leading-none shadow-blue-50 drop-shadow-xl">{r.percent}%</td><td className="p-10 text-right rounded-r-[3.5rem]"><span className={`px-16 py-5 rounded-full text-[15px] font-black shadow-[0_30px_60px_-10px_rgba(0,0,0,0.4)] tracking-[0.3em] border-[8px] ${r.percent >= 40 ? 'bg-green-100 text-green-700 border-green-200 shadow-green-100' : 'bg-red-100 text-red-700 border-red-200 shadow-red-100'}`}>{r.percent >= 90 ? 'MASTER' : r.percent >= 40 ? 'SUCCESS' : 'FAILURE'}</span></td></tr>))}</tbody>
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
  if (isSubmitted) return ( <div className="fixed inset-0 bg-white z-[2000] flex flex-col items-center justify-center p-24 text-center animate-in zoom-in duration-1000"> <div className="w-64 h-64 bg-green-50 rounded-full flex items-center justify-center mb-16 ring-[32px] ring-green-50 shadow-3xl animate-bounce-slow"><CheckCircle size={180} className="text-green-600 shadow-3xl" /></div> <h2 className="text-7xl font-black text-slate-800 uppercase italic tracking-tighter leading-none underline decoration-green-600 decoration-[24px] underline-offset-[32px]">ENCRYPTED</h2> <p className="text-slate-400 font-bold uppercase text-[20px] mt-24 tracking-[0.8em] max-w-4xl mx-auto leading-loose italic opacity-90 underline-offset-8 underline decoration-slate-100 decoration-[10px]">Academic Objective Secured, {exam.studentName}. Data packet securely hashed and transmitted for final evaluation.</p> <button onClick={onFinish} className="bg-blue-700 text-white px-32 py-10 rounded-[5rem] font-black uppercase text-[22px] shadow-[0_50px_100px_-25px_rgba(29,78,216,0.8)] mt-32 active:scale-[0.85] transition-all border-b-[24px] border-blue-900 active:border-b-0 active:translate-y-8 tracking-[0.4em]">Close Session</button> </div> );
  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden">
      <div className="bg-white p-10 flex justify-between items-center border-b-[48px] border-yellow-400 shadow-[0_100px_200px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-14"><div className="w-24 h-24 bg-red-600 rounded-[3.5rem] flex items-center justify-center text-white animate-pulse shadow-[0_0_120px_rgba(220,38,38,0.8)] border-[14px] border-red-100 ring-[16px] ring-red-500 shadow-red-200"><ShieldAlert size={64}/></div><div><h2 className="font-black text-slate-800 text-[32px] md:text-5xl uppercase italic tracking-tighter leading-none">{exam.title}</h2><p className="text-[22px] text-blue-700 font-black uppercase italic mt-6 tracking-[0.6em] opacity-100 flex items-center gap-10 leading-none"><User size={32}/> GLOBAL CLOUD SURVEILLANCE ACTIVE • {exam.studentName}</p></div></div>
        <div className="flex items-center gap-20"><div className={`px-20 py-7 rounded-[4rem] font-black text-6xl md:text-9xl border-[20px] shadow-4xl tracking-tighter ring-[32px] ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse ring-red-100 shadow-[0_0_150px_rgba(220,38,38,0.5)]' : 'bg-slate-50 text-slate-800 border-slate-100 ring-slate-50 shadow-inner'}`}>{formatTime(timeLeft)}</div><button onClick={() => { if(window.confirm("EXECUTE SECURE PACKET TRANSMISSION?")) setIsSubmitted(true); }} className="bg-green-600 text-white px-28 py-12 rounded-[3.5rem] font-black text-[26px] uppercase shadow-[0_80px_160px_-30px_rgba(22,163,74,0.8)] hover:bg-green-700 transition-all border-b-[24px] border-green-800 active:border-b-0 active:translate-y-6 tracking-tighter">SUBMIT PACKET</button></div>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-900 p-12 md:p-32"><div className="max-w-screen-2xl mx-auto space-y-20"><div className="bg-blue-900/60 border-[16px] border-blue-500/40 p-16 rounded-[7rem] flex items-center gap-16 text-blue-200 shadow-[0_100px_200px_rgba(0,0,0,0.7)] backdrop-blur-3xl ring-8 ring-white/10"><div className="w-36 h-36 bg-blue-600 rounded-[4rem] flex items-center justify-center text-white shrink-0 shadow-4xl ring-[24px] ring-blue-500/20 shadow-blue-200"><PenTool size={80} /></div><p className="text-[20px] md:text-[32px] font-black uppercase italic tracking-[0.1em] leading-relaxed opacity-100 underline decoration-blue-500/60 underline-offset-[24px] decoration-[12px]">Strategy Instruction: Cloud proctoring monitors all tab navigation. Do not refresh. Complete transmission before zero.</p></div><SecurePDFViewer fileUrl={exam.fileUrl} /></div></div>
      <div className="bg-red-900 text-white py-10 text-center text-[24px] font-black uppercase tracking-[2em] z-50 border-t-[16px] border-red-600 shadow-[0_-80px_160px_rgba(0,0,0,0.8)]">GLOBAL CLOUD SECURITY SHIELD ACTIVE • DO NOT REFRESH • DO NOT EXIT TERMINAL</div>
    </div>
  );
};

export default App;
