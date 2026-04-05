import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc } from "firebase/firestore";
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

// --- 🛡️ Secure PDF Viewer (স্মার্ট সাইজ) ---
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
    <div className="w-full h-[75vh] bg-slate-100 rounded-3xl overflow-hidden relative border-4 border-slate-900 shadow-xl mt-6">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connecting to Server...</p>
        </div>
      )}
      <iframe src={getEmbedUrl(fileUrl)} className="w-full h-full relative z-10" onLoad={() => setLoading(false)} title="Question Paper" />
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
    onSnapshot(collection(db, "students"), (s) => setStudents(s.docs.map(d => d.data().name).sort()));
    onSnapshot(doc(db, "settings", "adminConfig"), (d) => {
      if (d.exists()) { setTeacherPin(d.data().pin); setGrowthPublished(d.data().growthPublished); }
    });
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
      dateDisplay: d.toLocaleDateString()
    });
    setCurrentExam({ ...pendingExam, studentName: studentNameInput });
    setIsExamActive(true);
    setShowNameModal(false);
  };

  if (isExamActive) return <ExamInterface exam={currentExam} onFinish={() => setIsExamActive(false)} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 select-none flex flex-col items-center">
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-slate-50">
            <User size={48} className="text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg uppercase tracking-widest mb-6">Enter Your Name</h3>
            <input autoFocus type="text" value={studentNameInput} onChange={(e) => setStudentNameInput(e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-100 font-bold text-xl uppercase outline-none focus:border-blue-500 mb-6 text-center" placeholder="NAME" />
            <div className="flex gap-4">
              <button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold uppercase text-xs">Cancel</button>
              <button onClick={finalizeExamStart} className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-bold uppercase text-xs">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b-2 border-slate-100 sticky top-0 z-50 shadow-sm px-6 py-4 flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-black text-blue-700 tracking-tighter uppercase italic">MATH EXCELLENCE</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">Academic Command • Anshu Sir</p>
        </div>
        <div className="hidden md:block bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
          <span className="text-blue-700 font-bold text-[10px] uppercase tracking-widest">Build Your Future</span>
        </div>
      </header>

      <nav className="bg-blue-700 text-white w-full sticky top-[68px] z-40 flex justify-center shadow-lg">
        <div className="max-w-6xl w-full flex overflow-x-auto no-scrollbar">
          {[
            { id: 'home', label: 'Home', icon: <History size={18} /> },
            { id: 'live', label: 'Live Mock', icon: <Clock size={18} /> },
            { id: 'practice', label: 'Practice', icon: <BookOpen size={18} /> },
            { id: 'growth', label: 'Growth', icon: <TrendingUp size={18} /> },
            { id: 'teacher', label: 'Admin', icon: <User size={18} /> }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold text-[11px] uppercase tracking-widest border-b-4 transition-all ${activeTab === item.id ? 'border-yellow-400 bg-blue-800' : 'border-transparent hover:bg-blue-600'}`}>{item.icon} {item.label}</button>
          ))}
        </div>
      </nav>

      <main className="w-full max-w-5xl p-6 mb-20">
        {activeTab === 'home' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="bg-white p-12 rounded-[3rem] shadow-xl border-8 border-slate-50 text-center relative overflow-hidden group">
               <GraduationCap size={64} className="text-blue-700 mx-auto mb-6" />
               <h2 className="text-4xl font-black uppercase italic tracking-tighter">Master <span className="text-blue-700">Mathematics</span></h2>
               <p className="text-slate-500 font-bold text-sm mt-4 uppercase tracking-widest italic opacity-75">Nurturing precision and logic for academic success</p>
               <button onClick={() => setActiveTab('practice')} className="mt-8 bg-blue-700 text-white px-10 py-3 rounded-full font-bold text-xs uppercase shadow-lg hover:bg-blue-800 transition-all">Launch Arena</button>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-md border-2 border-slate-50">
              <h3 className="font-black text-lg uppercase italic mb-6 flex items-center gap-3 text-slate-800"><History size={24} className="text-blue-600"/> Live Activity Log</h3>
              <div className="space-y-4">
                {activityLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border-l-8 border-blue-600 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700"><UserCheck size={20}/></div>
                      <div><p className="text-sm font-black uppercase text-slate-800 tracking-tighter">{log.studentName}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.examTitle}</p></div>
                    </div>
                    <div className="text-right text-[10px] font-black text-blue-700 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{log.timeDisplay}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-10">
            <h2 className="font-black uppercase italic text-slate-700 border-b-4 border-red-50 pb-2 flex items-center gap-3 text-xl tracking-tighter"><Clock className="text-red-600" size={24}/> Active Live Mocks</h2>
            {liveMocks.filter(m => m.isPublished).map(m => (
              <div key={m.id} className="bg-white p-6 rounded-3xl shadow-lg border-2 border-red-50 flex justify-between items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 text-[8px] font-black uppercase tracking-widest">LIVE</div>
                <div><h3 className="text-xl font-black uppercase italic text-slate-800 tracking-tighter">{m.name}</h3><p className="text-[10px] font-black text-red-600 uppercase flex items-center gap-2 mt-2 bg-red-50 px-3 py-1 rounded-full w-fit"><Timer size={14}/> {m.hours}h {m.minutes}m</p></div>
                <button onClick={() => handleStartExamFlow(m.name, (parseInt(m.hours)||0)*3600+(parseInt(m.minutes)||0)*60, m.fileUrl)} className="bg-red-600 text-white px-8 py-3 rounded-full font-black text-xs uppercase shadow-lg active:scale-95 transition-all">Launch</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="space-y-12 animate-in fade-in">
            <section>
              <h2 className="font-black uppercase italic text-slate-800 border-b-4 border-blue-50 pb-2 mb-6 flex items-center gap-3 text-xl tracking-tighter"><BookOpen className="text-blue-700" size={24}/> Practice Mock Sets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {practiceSets.filter(p => p.isPublished).map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-3xl shadow-md border-2 border-white hover:border-blue-200 transition-all group">
                    <h3 className="font-black uppercase text-md text-slate-800 tracking-tighter italic group-hover:text-blue-700">{p.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic mt-2 flex items-center gap-2 tracking-widest"><Timer size={14}/> {p.hours}h {p.minutes}m Module</p>
                    <button onClick={() => handleStartExamFlow(p.name, (parseInt(p.hours)||0)*3600+(parseInt(p.minutes)||0)*60, p.fileUrl)} className="mt-4 bg-blue-700 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase shadow-md active:scale-95 transition-all">Open</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'teacher' && (!isTeacherAuthenticated ? 
          <div className="max-w-md w-full mx-auto mt-20 p-10 bg-white rounded-3xl shadow-xl border-t-8 border-blue-700 text-center animate-in zoom-in">
            <Lock size={40} className="text-blue-700 mx-auto mb-6" />
            <h2 className="text-xl font-black uppercase italic mb-6">Authorization</h2>
            <input type="password" onChange={(e) => { if(e.target.value === teacherPin) setIsTeacherAuthenticated(true); }} className="w-full py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-black text-center text-3xl tracking-[0.5em] shadow-inner" placeholder="••••" />
          </div> : 
          <TeacherZoneMainView 
            liveMocks={liveMocks} prevPapers={prevPapers} practiceSets={practiceSets} 
            growthPublished={growthPublished} setGrowthPublished={async (v) => await setDoc(doc(db, "settings", "adminConfig"), { growthPublished: v }, { merge: true })}
            studentResults={studentResults} students={students} teacherPin={teacherPin}
          />
        )}

        {activeTab === 'growth' && <GrowthSectionView isPublished={growthPublished} results={studentResults} />}
      </main>
      <footer className="w-full text-center py-8 text-slate-400 font-bold text-[10px] uppercase tracking-[0.5em] border-t border-slate-100 bg-white mt-auto">Math Excellence • Anshu Sir</footer>
    </div>
  );
};

// --- Sub-component: Teacher Zone (Refined Sizes) ---
const TeacherZoneMainView = ({ liveMocks, prevPapers, practiceSets, growthPublished, setGrowthPublished, studentResults, students }) => {
  const [msg, setMsg] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newRes, setNewRes] = useState({ exam: "", date: "", obtained: "", total: "" });

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  
  const addPaper = async (type) => {
    const colls = { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' };
    await addDoc(collection(db, colls[type]), { 
      name: `New Topic`, hours: 1, minutes: 0, fileUrl: "", isPublished: false 
    });
    notify("Synced!");
  };

  const updateField = async (id, type, field, value) => {
    const colls = { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' };
    await setDoc(doc(db, colls[type], id), { [field]: value }, { merge: true });
  };

  const PaperSection = ({ title, items, type, icon, color }) => (
    <div className="bg-white p-6 rounded-3xl shadow-md border-t-8 border-slate-100 space-y-6 w-full mb-8">
      <div className="flex justify-between items-center border-b-2 border-slate-50 pb-4">
        <h3 className={`font-bold uppercase text-sm italic flex items-center gap-3 tracking-widest ${color}`}>{icon} {title} Admin</h3>
        <button onClick={() => addPaper(type)} className="bg-slate-100 p-3 rounded-full text-slate-800 active:scale-90 shadow-sm border-4 border-white"><PlusCircle size={24} /></button>
      </div>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border-2 border-white shadow-sm space-y-4 transition-all">
            <div className="flex flex-col md:flex-row gap-3">
              <input type="text" value={item.name} onChange={(e) => updateField(item.id, type, 'name', e.target.value)} className="flex-1 bg-white border-2 border-slate-100 p-2 rounded-xl font-bold text-sm uppercase outline-none focus:border-blue-500" placeholder="Topic Label" />
              <div className="flex gap-2">
                <button onClick={() => updateField(item.id, type, 'isPublished', !item.isPublished)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all shadow-sm ${item.isPublished ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-600'}`}>{item.isPublished ? 'PUBLISHED' : 'DRAFT'}</button>
                <button onClick={async () => { if(window.confirm("Delete?")) await deleteDoc(doc(db, { live: 'liveMocks', practice: 'practiceSets', prev: 'prevPapers' }[type], item.id)); }} className="text-red-400 p-2 bg-white rounded-xl shadow-sm border border-red-50"><Trash2 size={20}/></button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex items-center gap-4 bg-white border-2 border-slate-100 px-4 py-2 rounded-xl shrink-0">
                <Timer size={20} className="text-slate-300"/>
                <div className="flex items-center gap-2"><input type="number" value={item.hours} onChange={(e) => updateField(item.id, type, 'hours', e.target.value)} className="w-10 text-center font-bold text-lg bg-transparent outline-none" /><span className="text-[10px] font-bold text-slate-400 italic">H</span></div>
                <div className="flex items-center gap-2"><input type="number" value={item.minutes} onChange={(e) => updateField(item.id, type, 'minutes', e.target.value)} className="w-10 text-center font-bold text-lg bg-transparent outline-none" /><span className="text-[10px] font-bold text-slate-400 italic">M</span></div>
              </div>
              <input type="text" value={item.fileUrl} onChange={(e) => updateField(item.id, type, 'fileUrl', e.target.value)} className="flex-1 bg-white border-2 border-slate-100 p-2 rounded-xl font-medium text-xs outline-none" placeholder="Cloud PDF Drive Link" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      {msg && <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-3 rounded-full z-[1000] text-xs font-bold uppercase shadow-xl animate-in slide-in-from-top-10">{msg}</div>}
      
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm w-full mb-6 border-2 border-slate-50">
        <h2 className="font-bold text-[10px] uppercase tracking-[0.4em] text-slate-400 italic">Global Control Center</h2>
        <div className="flex gap-4">
          <button onClick={() => setGrowthPublished(!growthPublished)} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase shadow-sm transition-all ${growthPublished ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{growthPublished ? 'Restrict Growth' : 'Publish Growth'}</button>
        </div>
      </div>
      
      <PaperSection title="Live Mock" items={liveMocks} type="live" icon={<Clock size={24}/>} color="text-red-600" />
      <PaperSection title="Practice Set" items={practiceSets} type="practice" icon={<BookOpen size={24}/>} color="text-blue-700" />

      <div className="bg-white p-6 rounded-3xl shadow-lg border-t-8 border-slate-900 space-y-6 w-full mb-20">
        <h3 className="font-bold uppercase text-sm italic text-slate-800 flex items-center gap-3 tracking-widest"><Trophy size={32} className="text-yellow-600"/> Student Registry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {students.map((name, i) => (
            <button key={i} onClick={() => setSelectedStudent(name)} className="p-4 bg-slate-50 rounded-2xl border-2 border-white shadow-sm flex justify-between items-center group hover:bg-blue-600 transition-all">
              <span className="font-bold uppercase text-sm group-hover:text-white italic">{name}</span>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-white" />
            </button>
          ))}
          <button onClick={async () => { const n = prompt("Student Name:"); if(n) await addDoc(collection(db, "students"), {name: n}); }} className="p-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs uppercase text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><UserPlus size={20}/> New Student</button>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-white z-[1200] p-6 overflow-y-auto animate-in slide-in-from-right-full">
           <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase mb-8 italic"><ChevronLeft size={32}/> Back</button>
           <div className="bg-white p-6 rounded-3xl border-4 border-slate-50 shadow-2xl max-w-2xl mx-auto space-y-8">
              <div className="flex items-center gap-6 border-b-2 border-slate-50 pb-6">
                <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center text-white"><User size={32} /></div>
                <div><h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">{selectedStudent}</h3><p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest">Performance Registry</p></div>
              </div>
              <div className="p-6 bg-blue-50 rounded-2xl space-y-4 shadow-inner">
                 <h4 className="text-xs font-black text-blue-700 uppercase flex items-center gap-2 italic"><PlusCircle size={20}/> Log Result</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <input type="text" value={newRes.exam} onChange={(e) => setNewRes({...newRes, exam: e.target.value})} className="col-span-2 w-full p-3 rounded-xl border-2 border-white font-bold text-sm outline-none" placeholder="Topic Title" />
                   <input type="date" value={newRes.date} onChange={(e) => setNewRes({...newRes, date: e.target.value})} className="w-full p-3 rounded-xl border-2 border-white font-bold text-sm outline-none" />
                   <div className="flex gap-2">
                     <input type="number" value={newRes.obtained} onChange={(e) => setNewRes({...newRes, obtained: e.target.value})} className="w-full p-3 rounded-xl border-2 border-white font-bold text-sm text-center" placeholder="Obt" />
                     <input type="number" value={newRes.total} onChange={(e) => setNewRes({...newRes, total: e.target.value})} className="w-full p-3 rounded-xl border-2 border-white font-bold text-sm text-center" placeholder="Total" />
                   </div>
                 </div>
                 <button onClick={async () => {
                   if(newRes.exam && newRes.obtained && newRes.total) {
                     const p = Math.round((parseFloat(newRes.obtained)/parseFloat(newRes.total))*100);
                     await addDoc(collection(db, "results"), { ...newRes, name: selectedStudent, percent: p, timestamp: Date.now() });
                     setNewRes({exam: "", date: "", obtained: "", total: ""});
                     notify("Saved!");
                   }
                 }} className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold text-xs uppercase shadow-md active:scale-95">Save Result</button>
              </div>
              <div className="space-y-3">
                 {studentResults.filter(r => r.name === selectedStudent).sort((a,b)=>b.timestamp-a.timestamp).map(r => (
                   <div key={r.id} className="p-4 bg-slate-50 border-2 border-white rounded-2xl flex justify-between items-center shadow-sm">
                     <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-sm ${r.percent >= 40 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.percent}%</div>
                       <div><p className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{r.exam}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{r.date} • {r.obtained}/{r.total}</p></div>
                     </div>
                     <button onClick={async () => { if(window.confirm("Purge?")) await deleteDoc(doc(db, "results", r.id)); }} className="text-red-300 hover:text-red-600 transition-all p-2 bg-white rounded-lg active:scale-90"><Trash2 size={24} /></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-component: Growth Section (Clean View) ---
const GrowthSectionView = ({ isPublished, results }) => {
  const [sel, setSel] = useState(null);
  if (!isPublished) return <div className="py-40 text-center bg-white rounded-3xl border-4 border-dashed border-slate-100 shadow-inner max-w-2xl mx-auto w-full animate-pulse"><Award size={64} className="text-slate-100 mx-auto mb-4" /><h2 className="font-bold text-slate-300 uppercase text-sm tracking-widest italic">Security Active • Restricted</h2></div>;
  const students = Array.from(new Set(results.map(r => r.name))).sort();
  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in">
      {!sel ? (
        <div className="grid gap-4">
          {students.map((name, i) => (<button key={i} onClick={() => setSel(name)} className="bg-white p-4 rounded-2xl shadow-sm border-2 border-white flex justify-between items-center group active:scale-95 transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-all"><User size={18} /></div><span className="font-bold text-slate-800 uppercase text-sm italic">{name}</span></div><ChevronRight size={24} className="text-slate-300 group-hover:text-blue-600" /></button>))}
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-20">
          <button onClick={() => setSel(null)} className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase mb-4 italic transition-all"><ChevronLeft size={32}/> Back</button>
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-slate-50">
             <div className="bg-blue-700 p-10 text-white text-center relative overflow-hidden"><Trophy className="absolute -top-20 -right-20 opacity-10 rotate-12" size={150}/><h2 className="text-4xl font-black uppercase italic tracking-tighter">Growth Registry</h2><p className="mt-4 inline-block bg-white/20 px-6 py-2 rounded-full border border-white/50 backdrop-blur-sm text-sm font-bold uppercase tracking-widest italic">{sel}</p></div>
             <div className="p-6">
               <table className="w-full text-sm font-bold border-separate border-spacing-y-3">
                 <thead><tr className="text-slate-400 uppercase text-[10px] tracking-widest"><th className="pb-4 text-left">Unit</th><th className="pb-4 text-center">Score</th><th className="pb-4 text-right">Metric</th></tr></thead>
                 <tbody>{results.filter(r => r.name === sel).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r => (<tr key={r.id} className="bg-slate-50 rounded-xl shadow-sm"><td className="p-4 uppercase text-slate-800 italic rounded-l-xl border-l-4 border-blue-600">{r.exam}</td><td className="p-4 text-center text-blue-700 text-3xl italic tracking-tighter leading-none">{r.percent}%</td><td className="p-4 text-right rounded-r-xl"><span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${r.percent >= 40 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{r.percent >= 90 ? 'MASTER' : r.percent >= 40 ? 'SUCCESS' : 'FAILURE'}</span></td></tr>))}</tbody>
               </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-component: Exam Interface (Clean UI) ---
const ExamInterface = ({ exam, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(exam.duration);
  const [isSubmitted, setIsSubmitted] = useState(false);
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) { if(timeLeft === 0 && !isSubmitted) setIsSubmitted(true); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);
  const formatTime = (s) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${sec < 10 ? '0' + sec : sec}`;
  };
  if (isSubmitted) return (
    <div className="fixed inset-0 bg-white z-[2000] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
      <div className="w-40 h-40 bg-green-50 rounded-full flex items-center justify-center mb-10 shadow-lg"><CheckCircle size={100} className="text-green-600" /></div>
      <h2 className="text-5xl font-black text-slate-800 uppercase italic tracking-tighter">SUBMITTED</h2>
      <p className="text-slate-400 font-bold uppercase text-xs mt-6 tracking-widest max-w-sm italic">Assessment Secured. Your data has been transmitted for Anshu Sir's evaluation.</p>
      <button onClick={onFinish} className="bg-blue-700 text-white px-12 py-4 rounded-full font-black uppercase text-sm shadow-xl mt-12 active:scale-90 transition-all border-b-8 border-blue-900 active:border-b-0">Exit Terminal</button>
    </div>
  );
  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden">
      <div className="bg-white p-4 flex justify-between items-center border-b-8 border-yellow-400 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white animate-pulse shadow-red-200"><ShieldAlert size={32}/></div>
          <div><h2 className="font-black text-slate-800 text-xl uppercase italic tracking-tighter">{exam.title}</h2><p className="text-[10px] text-blue-700 font-bold uppercase italic tracking-widest">Global Proctoring Active • {exam.studentName}</p></div>
        </div>
        <div className="flex items-center gap-6">
          <div className={`px-6 py-2 rounded-2xl font-black text-4xl border-4 ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-800 border-slate-100'}`}>{formatTime(timeLeft)}</div>
          <button onClick={() => { if(window.confirm("Submit?")) setIsSubmitted(true); }} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-green-700 transition-all border-b-8 border-green-800 active:border-b-0">SUBMIT</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-900 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
           <div className="bg-blue-900/60 border-4 border-blue-500/40 p-6 rounded-3xl flex items-center gap-6 text-blue-200 backdrop-blur-3xl">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0"><PenTool size={32} /></div>
              <p className="text-sm font-black uppercase italic tracking-widest leading-relaxed">Objective: Sync answer scripts before countdown zero. Cloud surveillance active.</p>
           </div>
           <SecurePDFViewer fileUrl={exam.fileUrl} />
        </div>
      </div>
    </div>
  );
};

export default App;
