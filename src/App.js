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
    setCurrentExam({ ...exam, duration: (h * 3600) + (m * 60) || 3600 });
    setShowNameModal(true);
  };

  if (isExamActive) return <InteractiveExamHall exam={currentExam} onFinish={() => setIsExamActive(false)} db={db} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 select-none flex flex-col items-center overflow-x-hidden">
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-slate-50">
            <User size={40} className="text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-6 uppercase">Student Identification</h3>
            <input autoFocus type="text" value={studentNameInput} onChange={(e) => setStudentNameInput(e.target.value)} className="w-full p-3 rounded-xl border-2 mb-6 text-center outline-none focus:border-blue-500" placeholder="YOUR NAME" />
            <div className="flex gap-4">
              <button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-[10px] uppercase">Cancel</button>
              <button onClick={() => { if(studentNameInput.trim()) { setIsExamActive(true); setShowNameModal(false); }}} className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-bold text-[10px] uppercase">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b sticky top-0 z-50 shadow-sm px-6 py-3 flex justify-between items-center w-full max-w-6xl">
        <h1 className="text-xl font-black text-blue-700 uppercase italic tracking-tighter cursor-pointer" onClick={() => setActiveTab('home')}>MATH EXCELLENCE</h1>
      </header>

      <nav className="bg-blue-700 text-white w-full sticky top-[52px] z-40 flex justify-center shadow-lg">
        <div className="max-w-6xl w-full flex overflow-x-auto no-scrollbar">
          {[{ id: 'home', label: 'Home', icon: <History size={14}/> }, { id: 'live', label: 'Live Mock', icon: <Clock size={14}/> }, { id: 'practice', label: 'Practice', icon: <BookOpen size={14}/> }, { id: 'growth', label: 'Growth', icon: <TrendingUp size={14}/> }, { id: 'teacher', label: 'Admin', icon: <User size={14}/> }].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3.5 font-bold text-[10px] uppercase border-b-4 transition-all ${activeTab === item.id ? 'border-yellow-400 bg-blue-800' : 'border-transparent'}`}>{item.icon} {item.label}</button>
          ))}
        </div>
      </nav>

      <main className="w-full max-w-5xl p-6 mb-20">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-4 border-slate-50 text-center">
               <GraduationCap size={56} className="text-blue-700 mx-auto mb-4" />
               <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tight">Master Mathematics <br/> <span className="text-blue-700 underline decoration-yellow-400 decoration-4 underline-offset-8">with Anshu Sir</span></h2>
               <button onClick={() => setActiveTab('live')} className="mt-8 bg-blue-700 text-white px-10 py-3 rounded-full font-bold text-[10px] uppercase shadow-xl hover:bg-blue-800 transition-all">Start Mock</button>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 text-left">
              <h3 className="font-bold text-sm uppercase mb-4 border-b pb-2 flex items-center gap-3"><History size={18} className="text-blue-600"/> Live Activity Log</h3>
              <div className="space-y-3">
                {activityLogs.slice(0, 10).map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border-l-8 border-blue-600 shadow-sm">
                    <div><p className="text-[11px] font-black uppercase text-slate-800">{log.studentName}</p><p className="text-[9px] font-bold text-slate-400 uppercase italic">{log.examTitle} {log.scoreDisplay ? `• Score: ${log.scoreDisplay}` : ''}</p></div>
                    <div className="text-right text-[8px] font-bold text-slate-300 uppercase leading-tight">{log.timeDisplay} <br/> {log.dateDisplay}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-4">
            <h2 className="font-bold uppercase text-slate-700 border-b-2 pb-2 text-md flex items-center gap-2"><Clock size={18} className="text-red-600"/> Active Live Mocks</h2>
            {liveMocks.filter(m => m.isPublished).map(m => (
              <div key={m.id} className="bg-white p-5 rounded-2xl shadow flex justify-between items-center border border-slate-100">
                <div><h3 className="text-md font-black uppercase italic tracking-tighter">{m.name}</h3><p className="text-[10px] font-bold text-red-600">Duration: {m.hours || 0}h {m.minutes || 0}m</p></div>
                <button onClick={() => handleStartExamFlow(m)} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase shadow-lg">Attend</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'teacher' && (!isTeacherAuthenticated ? 
          <div className="max-w-md w-full mx-auto mt-20 p-10 bg-white rounded-3xl shadow-xl text-center">
            <Lock size={40} className="text-blue-700 mx-auto mb-6" />
            <input type="password" onChange={(e) => { if(e.target.value === teacherPin) setIsTeacherAuthenticated(true); }} className="w-full py-4 bg-slate-50 border-2 rounded-xl text-center text-4xl font-black outline-none" placeholder="••••" />
          </div> : <TeacherZoneMainView liveMocks={liveMocks} practiceSets={practiceSets} students={students} teacherPin={teacherPin} studentResults={studentResults} setTeacherPin={async (v) => await setDoc(doc(db, "settings", "adminConfig"), { pin: v }, { merge: true })} />
        )}

        {activeTab === 'growth' && <GrowthSectionView results={studentResults} students={students} />}
        
        {activeTab === 'practice' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {practiceSets.filter(p => p.isPublished).map(p => (
              <div key={p.id} className="bg-white p-5 rounded-2xl shadow flex justify-between items-center border border-slate-100">
                <div><h3 className="font-bold uppercase text-sm italic">{p.name}</h3><p className="text-[10px] font-bold text-slate-400">Time: {p.hours || 0}h {p.minutes || 0}m</p></div>
                <button onClick={() => handleStartExamFlow(p)} className="bg-blue-700 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase shadow-md">Start</button>
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
    await setDoc(doc(db, type === 'live' ? 'liveMocks' : 'practiceSets', id), { [field]: value }, { merge: true }); 
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-white p-4 rounded-2xl flex justify-between items-center w-full mb-8 border shadow-sm">
        <div className="flex gap-2">
          <button onClick={() => setIsChangingPin(!isChangingPin)} className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase shadow-sm">PIN</button>
          <button onClick={async () => { if(window.confirm("Clear all logs?")) { const q = query(collection(db, "logs")); const snapshot = await getDocs(q); const batch = writeBatch(db); snapshot.docs.forEach((d) => batch.delete(d.ref)); await batch.commit(); alert("Cleared!"); } }} className="px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase shadow-sm">Clear Logs</button>
        </div>
      </div>

      {isChangingPin && (
        <div className="max-w-sm w-full p-6 bg-blue-50 rounded-3xl border-2 mb-8">
           <input type="text" onChange={(e) => setPinVal(e.target.value)} className="w-full p-3 rounded-xl bg-white border-2 text-xl font-black text-center" placeholder="NEW PIN" />
           <button onClick={async () => { if(pinVal.length >= 4) { await setTeacherPin(pinVal); setIsChangingPin(false); alert("Updated!"); } }} className="w-full py-2 bg-blue-700 text-white rounded-lg mt-4 font-bold text-xs uppercase">Save</button>
        </div>
      )}
      
      <div className="space-y-8 w-full">
        <AdminPaperManager title="Live Mock Exams" items={liveMocks} coll="live" updateField={updateField} />
        <AdminPaperManager title="Practice Sets" items={practiceSets} coll="practice" updateField={updateField} />

        <div className="bg-white p-6 rounded-3xl shadow-lg border-t-8 border-slate-900 w-full mb-20 text-center">
          <h3 className="font-bold text-xs uppercase mb-6 flex items-center justify-center gap-3"><Trophy size={24} className="text-yellow-600"/> Registry</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {students.map((std) => (
              <div key={std.id} className="relative group">
                <button onClick={() => setSelectedStudent(std)} className="w-full p-3 bg-slate-50 rounded-xl border-2 text-[10px] font-bold uppercase hover:bg-blue-700 hover:text-white truncate transition-all">{std.name}</button>
                <button onClick={async (e) => { e.stopPropagation(); if(window.confirm(`Delete ${std.name}?`)) await deleteDoc(doc(db, "students", std.id)); }} className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 rounded-full shadow border-2">X</button>
              </div>
            ))}
            <button onClick={async () => { const n = prompt("Name:"); if(n) await addDoc(collection(db, "students"), {name: n}); }} className="p-3 border-2 border-dashed rounded-xl text-[10px] font-bold text-slate-300">+ NEW</button>
          </div>
        </div>
      </div>

      {selectedStudent && <AdminMarksheetModal student={selectedStudent} results={studentResults} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
};

const AdminPaperManager = ({ title, items, coll, updateField }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-slate-100 w-full">
    <div className="flex justify-between items-center border-b pb-4 mb-4"><h3 className="font-bold uppercase text-xs italic">{title}</h3><button onClick={async () => await addDoc(collection(db, coll === 'live' ? 'liveMocks' : 'practiceSets'), { name: "New Slot", hours: "1", minutes: "0", fileUrl: "", isPublished: false, answerKey: "" })} className="p-2 bg-slate-100 rounded-full">+</button></div>
    <div className="space-y-4">{items.map(item => (
      <div key={item.id} className="p-4 bg-slate-50 rounded-xl border-2 space-y-3">
        <div className="flex gap-2"><input type="text" value={item.name} onChange={(e) => updateField(item.id, coll, 'name', e.target.value)} className="flex-1 p-2 rounded-lg border text-xs font-bold" /><button onClick={() => updateField(item.id, coll, 'isPublished', !item.isPublished)} className={`px-4 py-1 rounded-lg text-[9px] font-bold ${item.isPublished ? 'bg-green-600 text-white' : 'bg-slate-300'}`}>{item.isPublished ? 'LIVE' : 'HIDE'}</button><button onClick={async () => await deleteDoc(doc(db, coll === 'live' ? 'liveMocks' : 'practiceSets', item.id))} className="text-red-400">X</button></div>
        <div className="flex gap-2">
            <input type="number" value={item.hours} onChange={(e) => updateField(item.id, coll, 'hours', e.target.value)} className="w-10 p-2 border rounded-lg text-xs" />H 
            <input type="number" value={item.minutes} onChange={(e) => updateField(item.id, coll, 'minutes', e.target.value)} className="w-10 p-2 border rounded-lg text-xs" />M 
            <input type="text" value={item.fileUrl} onChange={(e) => updateField(item.id, coll, 'fileUrl', e.target.value)} className="flex-1 p-2 border rounded-lg text-xs" placeholder="Link" />
        </div>
        <input type="text" value={item.answerKey || ""} onChange={(e) => updateField(item.id, coll, 'answerKey', e.target.value.toUpperCase())} className="w-full p-2 border rounded-lg text-[10px]" placeholder="Answer Keys (A,B,D,C)" />
      </div>
    ))}</div>
  </div>
);

const AdminMarksheetModal = ({ student, results, onClose }) => {
  const [newRes, setNewRes] = useState({ exam: "", obtained: "", total: "", date: "" });
  return (
    <div className="fixed inset-0 bg-white z-[1200] p-6 overflow-y-auto animate-in slide-in-from-right-10 duration-300">
       <button onClick={onClose} className="font-bold text-blue-600 mb-8 border-b-2 border-blue-600 uppercase text-xs flex gap-2"><ChevronLeft size={16}/> BACK TO HUB</button>
       <div className="bg-white p-8 rounded-3xl border shadow-2xl max-w-xl mx-auto space-y-8">
          <h3 className="text-2xl font-black uppercase italic border-b pb-4">{student?.name} Stats</h3>
          <div className="p-6 bg-blue-50 rounded-3xl space-y-4">
             <div className="grid grid-cols-1 gap-4">
               <input type="text" value={newRes.exam} onChange={(e) => setNewRes({...newRes, exam: e.target.value})} className="w-full p-3 rounded-xl border-2 font-bold text-xs" placeholder="Module Name" />
               {/* 🔴 পরীক্ষার তারিখ বসানোর বক্স */}
               <input type="date" value={newRes.date} onChange={(e) => setNewRes({...newRes, date: e.target.value})} className="w-full p-3 rounded-xl border-2 font-bold text-xs" />
               <div className="flex gap-2"><input type="number" placeholder="Obt" onChange={(e) => setNewRes({...newRes, obtained: e.target.value})} className="w-1/2 p-3 rounded-xl border-2 text-xs text-center" /><input type="number" placeholder="Full" onChange={(e) => setNewRes({...newRes, total: e.target.value})} className="w-1/2 p-3 rounded-xl border-2 text-xs text-center" /></div>
             </div>
             <button onClick={async () => { if(newRes.exam && newRes.obtained && newRes.total && newRes.date) { const p = Math.round((parseFloat(newRes.obtained)/parseFloat(newRes.total))*100); await addDoc(collection(db, "results"), { ...newRes, name: student.name, percent: p, timestamp: Date.now() }); setNewRes({exam: "", obtained: "", total: "", date: ""}); alert("Saved!"); } else { alert("Please fill all fields!"); } }} className="w-full py-4 bg-blue-700 text-white rounded-2xl font-bold uppercase text-xs shadow-lg active:scale-95">Record Entry</button>
          </div>
          <div className="space-y-3">
             {results.filter(r => r.name === student?.name).map(r => (<div key={r.id} className="p-4 bg-slate-50 border-2 rounded-2xl flex justify-between items-center shadow-sm"><div><p className="text-sm font-black uppercase">{r.exam}</p><p className="text-[10px] font-bold text-slate-400">{r.date} • Score: {r.obtained}/{r.total}</p></div><button onClick={async () => await deleteDoc(doc(db, "results", r.id))} className="text-red-300">X</button></div>))}
          </div>
       </div>
    </div>
  );
};

const GrowthSectionView = ({ results, students }) => {
  const [sel, setSel] = useState(null);
  return (
    <div className="max-w-2xl mx-auto w-full">
      {!sel ? (
        <div className="grid gap-4">{students.map(std => (<button key={std.id} onClick={() => setSel(std.name)} className="bg-white p-5 rounded-2xl shadow border-2 flex justify-between items-center hover:border-blue-300"><span className="font-bold uppercase text-xs">{std.name}</span><ChevronRight size={18} className="text-slate-300"/></button>))}</div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-10"><button onClick={() => setSel(null)} className="text-blue-600 font-bold text-xs border-b border-blue-600">BACK</button><div className="bg-blue-700 p-8 rounded-3xl text-white text-center shadow-xl"><h2 className="text-3xl font-black italic">{sel}</h2></div><div className="bg-white p-4 rounded-2xl shadow-xl overflow-x-auto"><table className="w-full text-xs font-bold"><thead><tr className="text-slate-400 border-b uppercase text-[9px]"><th className="pb-3 text-left">Exam</th><th className="pb-3">Score</th><th className="pb-3 text-right">Status</th></tr></thead><tbody>{results.filter(r=>r.name===sel).map(r=>(<tr key={r.id} className="border-b"><td className="py-4 uppercase">{r.exam}</td><td className="text-center font-black">{r.obtained}/{r.total}</td><td className={`text-right ${r.percent>=40?'text-green-600':'text-red-600'}`}>{r.percent>=40?'PASS':'FAIL'}</td></tr>))}</tbody></table></div></div>
      )}
    </div>
  );
};

const InteractiveExamHall = ({ exam, onFinish, db }) => {
  const [timeLeft, setTimeLeft] = useState(parseInt(exam?.duration) || 3600);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const keys = exam?.answerKey ? exam.answerKey.split(',').map(k => k.trim().toUpperCase()) : [];

  useEffect(() => {
    let t;
    if (!isSubmitted && timeLeft > 0) t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    else if (timeLeft <= 0 && !isSubmitted) submit();
    return () => clearInterval(t);
  }, [timeLeft, isSubmitted]);

  const submit = async () => {
    let correct = 0;
    const details = keys.map((k, i) => { const ok = (answers[i+1]||'') === k; if(ok) correct++; return { q: i+1, sel: answers[i+1] || 'None', key: k, ok }; });
    const percent = keys.length > 0 ? Math.round((correct / keys.length) * 100) : 0;
    setScoreData({ correct, total: keys.length, details });
    setIsSubmitted(true);
    
    const d = new Date();
    // 🔴 সরাসরি লগ কালেকশনে পাঠানো হচ্ছে যাতে হোমপেজে দেখা যায়
    await addDoc(collection(db, "logs"), { 
      studentName: exam.studentName, 
      examTitle: exam.name, 
      timestamp: Date.now(), 
      timeDisplay: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateDisplay: d.toLocaleDateString('en-GB'), 
      scoreDisplay: `${correct}/${keys.length}` 
    });
    
    await addDoc(collection(db, "results"), { 
      name: exam.studentName, 
      exam: exam.name, 
      percent, 
      obtained: correct, 
      total: keys.length, 
      date: d.toLocaleDateString('en-GB'), 
      timestamp: Date.now() 
    });
  };

  if (isSubmitted) return ( <div className="fixed inset-0 bg-white z-[2000] flex flex-col items-center p-8 overflow-y-auto text-center"><CheckCircle size={60} className="text-green-600 mb-4"/><h2 className="text-2xl font-black mb-6 uppercase">Evaluated: {scoreData?.correct} / {scoreData?.total}</h2><div className="w-full max-w-sm space-y-2">{scoreData?.details.map(d=>(<div key={d.q} className={`p-3 rounded-xl border-2 flex justify-between items-center ${d.ok?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}><span className="font-bold">Q{d.q}</span><span className="text-[10px] font-bold">You: {d.sel} | Key: {d.key}</span></div>))}</div><button onClick={onFinish} className="mt-10 bg-blue-700 text-white px-12 py-3 rounded-full font-bold shadow-xl active:scale-95">CLOSE</button></div> );

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col overflow-hidden">
      <div className="bg-white px-4 py-2 flex justify-between items-center border-b-4 border-yellow-400 z-50">
        <div className="font-black text-xs uppercase truncate max-w-[100px]">{exam?.name}</div>
        <div className="font-black text-xl">{Math.floor(timeLeft/60)}:{timeLeft%60<10?'0'+timeLeft%60:timeLeft%60}</div>
        <button onClick={() => {if(window.confirm("SUBMIT?")) submit()}} className="bg-green-600 text-white px-5 py-2 rounded-full font-bold text-[10px] shadow-lg">SUBMIT</button>
      </div>
      <div className="flex-1 relative z-10">
        <iframe src={exam?.fileUrl?.replace('/view?usp=sharing', '/preview').replace('/view', '/preview')} className="w-full h-full border-none" title="PDF" />
      </div>
      <div className="bg-slate-800/95 border-t-2 border-slate-700 p-2 z-50">
        <div className="max-w-2xl mx-auto">
          {activeQuestion ? (
            <div className="flex justify-center items-center gap-3 animate-in slide-in-from-bottom-2">
              <span className="text-white font-black">Q{activeQuestion}:</span>
              {['A','B','C','D'].map(o => (<button key={o} onClick={()=>{setAnswers({...answers,[activeQuestion]:o});setActiveQuestion(null)}} className={`w-10 h-10 rounded-lg font-black shadow-lg ${answers[activeQuestion]===o?'bg-blue-600 text-white':'bg-slate-700 text-slate-300'}`}>{o}</button>))}
              <button onClick={() => setActiveQuestion(null)} className="text-slate-400 text-xs ml-2">X</button>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-2 p-1 no-scrollbar justify-start items-center">
               <PenTool size={14} className="text-blue-400 shrink-0"/>
              {keys.map((_, i) => (<button key={i+1} onClick={() => setActiveQuestion(i+1)} className={`min-w-[36px] h-[36px] rounded-lg font-black text-xs border-b-4 ${answers[i+1] ? 'bg-green-600 text-white border-green-900' : 'bg-slate-700 text-slate-400 border-slate-900'}`}>{i+1}</button>))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
