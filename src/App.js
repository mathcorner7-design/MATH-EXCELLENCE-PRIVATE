import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { 
  Trophy, BookOpen, TrendingUp, User, Clock, ChevronRight, GraduationCap, PlusCircle, 
  FileText, Lock, Award, Timer, Settings2, CheckCircle, PenTool, ShieldAlert, 
  Loader2, ChevronLeft, Trash2, UserPlus, History, UserCheck, X, CheckSquare, AlertCircle
} from 'lucide-react';

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

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isExamActive, setIsExamActive] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [teacherPin, setTeacherPin] = useState('1234567890');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  
  const [liveMocks, setLiveMocks] = useState([]);
  const [practiceSets, setPracticeSets] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    onSnapshot(collection(db, "liveMocks"), (s) => setLiveMocks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, "practiceSets"), (s) => setPracticeSets(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, "results"), (s) => setStudentResults(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, "students"), (s) => setStudents(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => a.name.localeCompare(b.name))));
    onSnapshot(doc(db, "settings", "adminConfig"), (d) => { if (d.exists()) setTeacherPin(d.data().pin); });
    onSnapshot(query(collection(db, "logs"), orderBy("timestamp", "desc")), (s) => setActivityLogs(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, []);

  const handleStartExamFlow = (exam) => {
    const h = parseInt(exam.hours) || 0;
    const m = parseInt(exam.minutes) || 0;
    const duration = (h * 3600) + (m * 60) || 3600;
    setPendingExam({ ...exam, duration });
    setShowNameModal(true);
  };

  const [pendingExam, setPendingExam] = useState(null);

  const finalizeExamStart = () => {
    if (!studentNameInput.trim()) return;
    setCurrentExam({ ...pendingExam, studentName: studentNameInput });
    setIsExamActive(true);
    setShowNameModal(false);
  };

  if (isExamActive) return <InteractiveExamHall exam={currentExam} onFinish={() => setIsExamActive(false)} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 select-none flex flex-col items-center overflow-x-hidden">
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-slate-50">
            <User size={40} className="text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-6 uppercase tracking-tight">Entry Verification</h3>
            <input autoFocus type="text" value={studentNameInput} onChange={(e) => setStudentNameInput(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-100 font-bold text-center outline-none focus:border-blue-500 mb-6 uppercase" placeholder="ENTER YOUR NAME" />
            <div className="flex gap-4">
              <button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-[10px] uppercase">Cancel</button>
              <button onClick={finalizeExamStart} className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-bold text-[10px] uppercase shadow-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b sticky top-0 z-50 shadow-sm px-6 py-3 flex justify-between items-center w-full max-w-6xl">
        <h1 className="text-xl font-black text-blue-700 uppercase italic tracking-tighter cursor-pointer" onClick={() => setActiveTab('home')}>MATH EXCELLENCE</h1>
        <p className="text-[9px] font-bold text-slate-400">ANSHU SIR</p>
      </header>

      <nav className="bg-blue-700 text-white w-full sticky top-[62px] z-40 flex justify-center shadow-lg">
        <div className="max-w-6xl w-full flex overflow-x-auto no-scrollbar">
          {[{ id: 'home', label: 'Home', icon: <History size={14}/> }, { id: 'live', label: 'Live Mock', icon: <Clock size={14}/> }, { id: 'practice', label: 'Practice', icon: <BookOpen size={14}/> }, { id: 'growth', label: 'Growth', icon: <TrendingUp size={14}/> }, { id: 'teacher', label: 'Admin', icon: <User size={14}/> }].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-4 font-bold text-[10px] uppercase border-b-4 transition-all ${activeTab === item.id ? 'border-yellow-400 bg-blue-800' : 'border-transparent'}`}>{item.icon} {item.label}</button>
          ))}
        </div>
      </nav>

      <main className="w-full max-w-5xl p-6 mb-20">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in w-full">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-4 border-slate-50 text-center">
               <GraduationCap size={56} className="text-blue-700 mx-auto mb-4 animate-bounce-slow" />
               <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tight leading-tight">Master Mathematics <br/> <span className="text-blue-700 underline decoration-yellow-400 decoration-4 underline-offset-8">with Anshu Sir</span></h2>
               <button onClick={() => setActiveTab('live')} className="mt-10 bg-blue-700 text-white px-10 py-3 rounded-full font-bold text-[10px] uppercase shadow-xl hover:bg-blue-800">Start Exam</button>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 text-left w-full">
              <h3 className="font-bold text-sm uppercase mb-4 border-b pb-2 flex items-center gap-3"><History size={18} className="text-blue-600"/> Live Activity Log</h3>
              <div className="space-y-3">
                {activityLogs.slice(0, 10).map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border-l-8 border-blue-600 shadow-sm transition-all hover:bg-white">
                    <div><p className="text-[11px] font-black uppercase text-slate-800">{log.studentName}</p><p className="text-[9px] font-bold text-slate-400 uppercase italic">{log.examTitle} {log.scoreDisplay ? `• Result: ${log.scoreDisplay}` : ''}</p></div>
                    <div className="text-right"><p className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">{log.timeDisplay}</p><p className="text-[8px] font-bold text-slate-300 mt-1 uppercase">{log.dateDisplay}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-4">
            <h2 className="font-bold uppercase text-slate-700 border-b-2 pb-2 text-md flex items-center gap-2"><Clock size={18} className="text-red-600"/> Ongoing Live Mocks</h2>
            {liveMocks.filter(m => m.isPublished).map(m => (
              <div key={m.id} className="bg-white p-5 rounded-2xl shadow flex justify-between items-center border border-slate-100">
                <div><h3 className="text-md font-black uppercase italic">{m.name}</h3><p className="text-[10px] font-bold text-red-600">Time: {m.hours || 0}h {m.minutes || 0}m</p></div>
                <button onClick={() => handleStartExamFlow(m)} className="bg-red-600 text-white px-8 py-2.5 rounded-full font-bold text-[10px] uppercase shadow-lg active:scale-95 transition-all">Attend</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'teacher' && (!isTeacherAuthenticated ? 
          <div className="max-w-md w-full mx-auto mt-20 p-10 bg-white rounded-3xl shadow-xl text-center border-t-8 border-blue-700">
            <Lock size={40} className="text-blue-700 mx-auto mb-6" />
            <input type="password" onChange={(e) => { if(e.target.value === teacherPin) setIsTeacherAuthenticated(true); }} className="w-full py-4 bg-slate-50 border-2 rounded-xl text-center text-4xl font-black outline-none" placeholder="••••" />
          </div> : <TeacherZoneMainView liveMocks={liveMocks} practiceSets={practiceSets} students={students} teacherPin={teacherPin} studentResults={studentResults} setTeacherPin={async (v) => await setDoc(doc(db, "settings", "adminConfig"), { pin: v }, { merge: true })} />
        )}

        {activeTab === 'growth' && <GrowthSectionView results={studentResults} students={students} />}
        
        {activeTab === 'practice' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {practiceSets.filter(p => p.isPublished).map(p => (
              <div key={p.id} className="bg-white p-5 rounded-2xl shadow flex justify-between items-center border border-slate-100 hover:border-blue-300 transition-all">
                <div><h3 className="font-bold uppercase text-sm italic">{p.name}</h3><p className="text-[10px] font-bold text-slate-400">Time: {p.hours || 0}h {p.minutes || 0}m</p></div>
                <button onClick={() => handleStartExamFlow(p)} className="bg-blue-700 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase shadow-md active:scale-95 transition-all">Start</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const TeacherZoneMainView = ({ liveMocks, practiceSets, students, teacherPin, setTeacherPin, studentResults }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinVal, setPinVal] = useState('');

  const updateField = async (id, type, field, value) => { 
    const coll = type === 'live' ? 'liveMocks' : 'practiceSets';
    await setDoc(doc(db, coll, id), { [field]: value }, { merge: true }); 
  };

  const PaperManager = ({ title, items, type, color }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-slate-100 mb-8 w-full">
      <div className="flex justify-between items-center border-b pb-4 mb-6"><h3 className={`font-bold uppercase text-xs italic ${color}`}>{title} Manager</h3><button onClick={async () => await addDoc(collection(db, type === 'live' ? 'liveMocks' : 'practiceSets'), { name: "New Assignment", hours: "1", minutes: "0", fileUrl: "", isPublished: false, answerKey: "" })} className="p-2 bg-slate-100 rounded-full shadow-sm">+</button></div>
      <div className="space-y-6">{items.map(item => (
        <div key={item.id} className="p-5 bg-slate-50 rounded-2xl border-2 border-white space-y-4 shadow-sm">
          <div className="flex gap-2">
            <input type="text" value={item.name} onChange={(e) => updateField(item.id, type, 'name', e.target.value)} className="flex-1 p-2 rounded-lg border text-xs font-bold uppercase outline-none" />
            <button onClick={() => updateField(item.id, type, 'isPublished', !item.isPublished)} className={`px-4 py-1 rounded-lg text-[9px] font-bold ${item.isPublished ? 'bg-green-600 text-white' : 'bg-slate-300'}`}>{item.isPublished ? 'LIVE' : 'HIDE'}</button>
            <button onClick={async () => { if(window.confirm("Delete?")) await deleteDoc(doc(db, type === 'live' ? 'liveMocks' : 'practiceSets', item.id)); }} className="text-red-400 active:scale-90"><Trash2 size={18}/></button>
          </div>
          <div className="flex gap-2">
            {/* 🔴 ঘণ্টা ও মিনিটের ঘরগুলো বড় করা হয়েছে (W-16 এবং টেক্সট বড়) */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border-2 border-blue-50 shrink-0">
               <Timer size={14} className="text-blue-500"/> 
               <input type="number" value={item.hours} onChange={(e) => updateField(item.id, type, 'hours', e.target.value)} className="w-16 text-center font-black text-lg bg-blue-50 rounded outline-none" /> <span className="font-bold text-xs">HRS</span>
               <input type="number" value={item.minutes} onChange={(e) => updateField(item.id, type, 'minutes', e.target.value)} className="w-16 text-center font-black text-lg bg-blue-50 rounded outline-none" /> <span className="font-bold text-xs">MINS</span>
            </div>
            <input type="text" value={item.fileUrl} onChange={(e) => updateField(item.id, type, 'fileUrl', e.target.value)} className="flex-1 p-2 rounded-lg border text-[10px] outline-none" placeholder="Google Drive Link" />
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-100"><p className="text-[9px] font-black text-blue-700 uppercase mb-2 tracking-widest flex items-center gap-2"><CheckSquare size={12}/> Answer Key (A,B,C...)</p><input type="text" value={item.answerKey || ""} onChange={(e) => updateField(item.id, type, 'answerKey', e.target.value.toUpperCase())} className="w-full p-2 rounded-lg bg-blue-50/30 border-2 border-blue-100 font-bold text-xs outline-none" placeholder="e.g. A,D,B,C" /></div>
        </div>
      ))}</div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-white p-4 rounded-2xl flex justify-between items-center w-full mb-8 border-2 shadow-sm">
        <div className="flex gap-2">
          <button onClick={() => setIsChangingPin(!isChangingPin)} className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase shadow-sm">PIN</button>
          <button onClick={async () => { if(window.confirm("Clear logs?")) { const q = query(collection(db, "logs")); const snapshot = await getDocs(q); const batch = writeBatch(db); snapshot.docs.forEach((d) => batch.delete(d.ref)); await batch.commit(); alert("Cleared!"); } }} className="px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase shadow-sm">Clear Logs</button>
        </div>
      </div>

      {isChangingPin && (
        <div className="max-w-sm w-full p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 mb-8 animate-in slide-in-from-top-4">
           <input type="text" onChange={(e) => setPinVal(e.target.value)} className="w-full p-3 rounded-xl bg-white border-2 font-black text-center text-xl outline-none shadow-inner" placeholder="NEW PIN" />
           <button onClick={async () => { if(pinVal.length >= 4) { await setTeacherPin(pinVal); setIsChangingPin(false); alert("Updated!"); } }} className="w-full py-2 bg-blue-700 text-white rounded-lg mt-4 font-bold uppercase text-[10px] shadow-lg">Save</button>
        </div>
      )}
      
      <PaperManager title="Live Mock" items={liveMocks} type="live" color="text-red-600" />
      <PaperManager title="Practice" items={practiceSets} type="practice" color="text-blue-700" />

      <div className="bg-white p-6 rounded-3xl shadow-lg border-t-8 border-slate-900 w-full mb-20 text-center">
        <h3 className="font-bold text-xs uppercase mb-6 flex items-center justify-center gap-3 text-slate-800 border-b pb-2"><Trophy size={28} className="text-yellow-600"/> Student Registry</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {students.map((std) => (
            <div key={std.id} className="relative group transition-all">
              <button onClick={() => setSelectedStudent(std)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-white text-[10px] font-bold uppercase hover:bg-blue-700 hover:text-white transition-all truncate shadow-sm italic">{std.name}</button>
              <button onClick={async (e) => { e.stopPropagation(); if(window.confirm(`Delete ${std.name}?`)) await deleteDoc(doc(db, "students", std.id)); }} className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 rounded-full shadow-lg border-2 border-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
            </div>
          ))}
          <button onClick={async () => { const n = prompt("Name:"); if(n) await addDoc(collection(db, "students"), {name: n}); }} className="p-3 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-bold text-slate-300 uppercase hover:text-blue-600 transition-all">+ REGISTER</button>
        </div>
      </div>
      {selectedStudent && <AdminMarksheetModal student={selectedStudent} results={studentResults} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
};

const AdminMarksheetModal = ({ student, results, onClose }) => {
  const [newRes, setNewRes] = useState({ exam: "", obtained: "", total: "", date: "" });
  return (
    <div className="fixed inset-0 bg-white z-[1200] p-6 overflow-y-auto animate-in slide-in-from-right-10 duration-300">
       <button onClick={onClose} className="font-bold text-blue-600 mb-8 flex items-center gap-2 border-b-2 border-blue-600 w-fit uppercase text-xs"><ChevronLeft size={16}/> BACK</button>
       <div className="bg-white p-8 rounded-3xl border-4 shadow-2xl max-w-xl mx-auto space-y-8">
          <h3 className="text-2xl font-black uppercase italic border-b pb-4">{student?.name} Stats</h3>
          <div className="p-6 bg-blue-50 rounded-3xl space-y-4 shadow-inner">
             <div className="grid grid-cols-1 gap-4">
               <input type="text" value={newRes.exam} onChange={(e) => setNewRes({...newRes, exam: e.target.value})} className="w-full p-3 rounded-xl border-2 font-bold text-xs outline-none" placeholder="Module Name" />
               {/* 🔴 তারিখ বসানোর ঘর */}
               <input type="date" value={newRes.date} onChange={(e) => setNewRes({...newRes, date: e.target.value})} className="w-full p-3 rounded-xl border-2 font-bold text-xs" />
               <div className="flex gap-2">
                 <input type="number" placeholder="Obt" onChange={(e) => setNewRes({...newRes, obtained: e.target.value})} className="w-1/2 p-3 rounded-xl border-2 text-xs text-center" />
                 <input type="number" placeholder="Full" onChange={(e) => setNewRes({...newRes, total: e.target.value})} className="w-1/2 p-3 rounded-xl border-2 text-xs text-center" />
               </div>
             </div>
             <button onClick={async () => { if(newRes.exam && newRes.obtained && newRes.total && newRes.date) { const p = Math.round((parseFloat(newRes.obtained)/parseFloat(newRes.total))*100); await addDoc(collection(db, "results"), { ...newRes, name: student.name, percent: p, timestamp: Date.now() }); setNewRes({exam: "", obtained: "", total: "", date: ""}); alert("Record Saved!"); } }} className="w-full py-4 bg-blue-700 text-white rounded-2xl font-bold uppercase text-xs shadow-xl active:scale-95 transition-all">Save Manual Record</button>
          </div>
          <div className="space-y-4 pt-6 border-t-2">
             {results.filter(r => r.name === student?.name).sort((a,b)=>b.timestamp-a.timestamp).map(r => (<div key={r.id} className="p-4 bg-slate-50 border-2 rounded-[2rem] flex justify-between items-center shadow-md transition-all hover:bg-white"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs bg-white shadow">{r.percent}%</div><div><p className="text-sm font-black uppercase italic tracking-tighter">{r.exam}</p><p className="text-[10px] font-bold text-slate-400">{r.date} • Score: {r.obtained}/{r.total}</p></div></div><button onClick={async () => { if(window.confirm("Purge?")) await deleteDoc(doc(db, "results", r.id)); }} className="text-red-200 hover:text-red-600 transition-colors active:scale-90"><Trash2 size={24} /></button></div>))}
          </div>
       </div>
    </div>
  );
};

const GrowthSectionView = ({ results, students }) => {
  const [sel, setSel] = useState(null);
  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-500">
      {!sel ? (
        <div className="grid gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-6 italic">Registry Search:</p>
          {students.map((std) => (<button key={std.id} onClick={() => setSel(std.name)} className="w-full bg-white p-5 rounded-2xl shadow border-2 flex justify-between items-center group active:scale-95 transition-all hover:border-blue-300"><div className="flex items-center gap-4"><User size={18} className="text-blue-700"/> <span className="font-bold text-slate-800 uppercase text-[15px] italic tracking-tight">{std.name}</span></div><ChevronRight size={24} className="text-slate-300 group-hover:text-blue-600" /></button>))}
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
          <button onClick={() => setSel(null)} className="flex items-center gap-2 text-[11px] font-bold text-blue-600 uppercase italic hover:underline decoration-2 underline-offset-8"><ChevronLeft size={24}/> Return</button>
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-slate-50 relative">
             <div className="bg-blue-700 p-10 text-white text-center relative overflow-hidden"><Trophy className="absolute -top-20 -right-20 opacity-10 rotate-12" size={150}/><h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Growth Report</h2><p className="mt-5 inline-block bg-white/20 px-8 py-2 rounded-full border border-white/40 text-sm font-bold uppercase italic">{sel}</p></div>
             <div className="p-6 overflow-x-auto"><table className="w-full text-sm font-bold border-separate border-spacing-y-4"><thead><tr className="text-slate-400 uppercase text-[10px] tracking-widest opacity-80"><th className="pb-4 text-left">Academic Unit</th><th className="pb-4 text-center">Score</th><th className="pb-4 text-right">Metric</th></tr></thead><tbody>{results.filter(r => r.name === sel).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r => (<tr key={r.id} className="bg-slate-50 rounded-2xl shadow-sm"><td className="p-5 uppercase text-slate-800 italic rounded-l-2xl border-l-8 border-blue-600">{r.exam}</td><td className="p-5 text-center text-blue-700 text-3xl italic tracking-tighter leading-none font-black">{r.obtained}/{r.total}</td><td className="p-5 text-right rounded-r-2xl"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border-2 shadow-sm ${r.percent >= 40 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{r.percent >= 90 ? 'MASTER' : r.percent >= 40 ? 'SUCCESS' : 'FAILURE'}</span></td></tr>))}</tbody></table></div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-component: 🔴 Interactive Exam Hall (লগ আপডেট ফিক্স) ---
const InteractiveExamHall = ({ exam, onFinish }) => {
  const h = parseInt(exam.hours) || 0;
  const m = parseInt(exam.minutes) || 0;
  const initialTime = (h * 3600) + (m * 60) || 3600;

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [scoreData, setScoreData] = useState(null);

  const answerKeyArray = exam.answerKey ? exam.answerKey.split(',').map(k => k.trim().toUpperCase()) : [];

  useEffect(() => {
    let timer;
    if (!isSubmitted && timeLeft > 0) timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    else if (timeLeft <= 0 && !isSubmitted) submitExam();
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const submitExam = async () => {
    let correctCount = 0;
    const detailResults = answerKeyArray.map((key, index) => {
      const qNum = index + 1;
      const isCorrect = (answers[qNum] || '') === key;
      if (isCorrect) correctCount++;
      return { qNum, selected: answers[qNum] || 'None', correct: key, status: isCorrect };
    });
    const percent = answerKeyArray.length > 0 ? Math.round((correctCount / answerKeyArray.length) * 100) : 0;
    setScoreData({ correct: correctCount, total: answerKeyArray.length, percent, details: detailResults });
    setIsSubmitted(true);

    const d = new Date();
    // 🔴 সরাসরি হোমে দেখানোর জন্য লগ কালেকশনে ডেটা পাঠানো হচ্ছে
    try {
      await addDoc(collection(db, "logs"), { 
        studentName: exam.studentName, 
        examTitle: exam.name, 
        timestamp: Date.now(), 
        timeDisplay: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateDisplay: d.toLocaleDateString('en-GB'),
        scoreDisplay: `${correctCount} / ${answerKeyArray.length}` 
      });

      await addDoc(collection(db, "results"), { 
        name: exam.studentName, exam: exam.name, percent, obtained: correctCount, 
        total: answerKeyArray.length, date: d.toLocaleDateString('en-GB'), timestamp: Date.now() 
      });
    } catch (e) { console.error(e); }
  };

  const formatTime = (s) => {
    if (isNaN(s) || s < 0) return "00:00";
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  if (isSubmitted) return (
    <div className="fixed inset-0 bg-white z-[2000] flex flex-col items-center overflow-y-auto p-10 text-center animate-in zoom-in duration-500">
      <CheckCircle size={80} className="text-green-600 mb-6 animate-bounce" />
      <h2 className="text-3xl font-black text-slate-800 uppercase italic mb-6">Evaluation Done</h2>
      <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 mb-8 w-full max-w-sm shadow-inner text-center">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Score</p>
         <h3 className="text-5xl font-black text-blue-700 italic tracking-tighter">{scoreData?.correct} / {scoreData?.total}</h3>
      </div>
      <div className="w-full max-w-lg space-y-3 mb-10 text-left">
         <h4 className="text-[11px] font-black text-slate-500 uppercase border-b pb-2 flex gap-2"><ListChecks size={14}/> Detailed Review:</h4>
         {scoreData?.details.map(item => (
           <div key={item.qNum} className={`p-4 rounded-2xl border-2 flex justify-between items-center transition-all hover:scale-[1.02] ${item.status ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
             <div><p className="font-black text-xs uppercase italic">Question {item.qNum}</p><p className="text-[10px] font-bold opacity-80 mt-0.5">Your Choice: {item.selected} • Answer: {item.correct}</p></div>
             {item.status ? <CheckSquare size={16}/> : <AlertCircle size={16}/>}
           </div>
         ))}
      </div>
      <button onClick={onFinish} className="bg-blue-700 text-white px-16 py-4 rounded-full font-black uppercase text-[12px] shadow-lg active:scale-95 transition-all border-b-8 border-blue-900 active:border-b-0 mb-20">Finish & Exit</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden">
      <div className="bg-white p-2.5 md:p-3 flex justify-between items-center border-b-4 border-yellow-400 shadow-xl relative z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white"><ShieldAlert size={16}/></div>
          <div><h2 className="font-black text-slate-800 text-xs md:text-sm uppercase italic tracking-tighter leading-none">{exam?.name}</h2><p className="text-[8px] md:text-[10px] text-blue-700 font-bold uppercase mt-0.5">{exam?.studentName}</p></div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-1 rounded-xl font-black text-xl md:text-2xl border-4 ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-800 text-white border-slate-600'}`}>{formatTime(timeLeft)}</div>
          <button onClick={() => { if(window.confirm("SUBMIT?")) submitExam(); }} className="bg-green-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-lg border-b-4 border-green-800 active:border-b-0">SUBMIT</button>
        </div>
      </div>
      <div className="flex-1 bg-slate-900 overflow-hidden relative">
         <iframe src={exam?.fileUrl?.replace('/view?usp=sharing', '/preview').replace('/view', '/preview')} className="w-full h-full border-none" title="PDF" />
         <div className="absolute bottom-0 left-0 right-0 z-50 bg-slate-800/95 border-t-2 border-slate-700 backdrop-blur-md p-3 md:p-5">
            <div className="max-w-4xl mx-auto">
               <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic flex items-center gap-3"><PenTool size={14}/> RESPONSE TERMINAL</span>
                  {activeQuestion && <button onClick={() => setActiveQuestion(null)} className="text-slate-400 font-black text-[10px] uppercase border-b border-slate-600">Close</button>}
               </div>
               {activeQuestion ? (
                 <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 duration-200 pb-2">
                    <p className="text-white font-black text-sm mb-3 tracking-tighter italic underline decoration-blue-500 underline-offset-4">Choice for Question {activeQuestion}:</p>
                    <div className="flex gap-4">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <button key={opt} onClick={() => { setAnswers({...answers, [activeQuestion]: opt}); setActiveQuestion(null); }} className={`w-12 h-12 rounded-xl font-black text-xl flex items-center justify-center border-b-4 transition-all active:scale-90 ${answers[activeQuestion] === opt ? 'bg-blue-600 text-white border-blue-900 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-700 text-slate-300 border-slate-950 hover:bg-slate-600'}`}>{opt}</button>
                      ))}
                    </div>
                 </div>
               ) : (
                 <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x items-center justify-start">
                    {answerKeyArray.map((_, index) => {
                      const num = index + 1;
                      return (
                        <button key={num} onClick={() => setActiveQuestion(num)} className={`min-w-[40px] h-[40px] rounded-lg font-black text-sm flex items-center justify-center transition-all snap-center border-b-4 ${answers[num] ? 'bg-green-600 text-white border-green-900' : 'bg-slate-700 text-slate-400 border-slate-900 hover:bg-slate-600'}`}>{num}</button>
                      );
                    })}
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default App;
