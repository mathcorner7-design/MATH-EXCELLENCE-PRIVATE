import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { 
  Trophy, BookOpen, TrendingUp, User, Clock, ChevronRight, GraduationCap, PlusCircle, 
  FileText, Lock, Award, Timer, Settings2, CheckCircle, PenTool, ShieldAlert, 
  Loader2, ChevronLeft, Trash2, UserPlus, History, UserCheck, X, CheckSquare, AlertCircle, ListChecks, Eye, Camera
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

// --- 🔵 Modal for Image Preview ---
const ImagePreviewModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 bg-black/90 z-[3000] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <button onClick={onClose} className="absolute top-10 right-10 text-white p-3 bg-red-600 rounded-full shadow-2xl"><X size={32}/></button>
      <img src={src} alt="Student Solution" className="max-w-full max-h-[80vh] rounded-xl shadow-2xl border-4 border-white animate-in zoom-in" />
    </div>
  );
};

// --- 🔵 Review Display Component ---
const ReviewResultModal = ({ result, onClose }) => {
  if (!result) return null;
  return (
    <div className="fixed inset-0 bg-white z-[2500] flex flex-col items-center overflow-y-auto p-10 text-center animate-in zoom-in duration-300">
      <div className="w-full max-w-lg flex justify-between items-center mb-10 border-b-4 border-slate-50 pb-5">
         <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Review: {result.exam}</h2>
         <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={28}/></button>
      </div>
      <div className="w-full max-w-lg space-y-3 mb-14 text-left">
         {result.details && result.details.map((item, idx) => (
           <div key={idx} className={`p-4 rounded-2xl border-4 flex justify-between items-center transition-all ${item.status ? 'bg-green-50 border-green-100 text-green-700 shadow-sm shadow-green-100' : 'bg-red-50 border-red-100 text-red-700 shadow-sm shadow-red-100'}`}>
             <div>
               <p className="font-black text-xs uppercase italic tracking-tighter">Unit Q{item.qNum} <span className="text-[9px] opacity-60 ml-1">({item.mark} pts)</span></p>
               <p className="text-[10px] font-bold opacity-80 mt-1 uppercase italic">Choice: {Array.isArray(item.selected) ? `IMAGE (${item.selected.length} Pgs)` : (item.selected?.startsWith('data:image') ? 'IMAGE' : item.selected)} • Key: {item.correct}</p>
             </div>
             {item.status ? <CheckSquare size={18} className="drop-shadow-md"/> : <AlertCircle size={18} className="drop-shadow-md"/>}
           </div>
         ))}
      </div>
      <button onClick={onClose} className="bg-blue-700 text-white px-16 py-4 rounded-full font-black uppercase text-[12px] shadow-2xl active:scale-95 transition-all border-b-8 border-blue-900 active:border-b-0 mb-20 tracking-tighter italic">Return to Growth</button>
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isExamActive, setIsExamActive] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [teacherPin, setTeacherPin] = useState('1234567890');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  
  const [liveMocks, setLiveMocks] = useState([]);
  const [practiceSets, setPracticeSets] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [pendingExam, setPendingExam] = useState(null);

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
    setPendingExam({ ...exam, duration: (h * 3600) + (m * 60) || 3600 });
    setShowNameModal(true);
  };

  const finalizeExamStart = () => {
    if (!studentNameInput.trim()) return;
    setCurrentExam({ ...pendingExam, studentName: studentNameInput.trim(), studentCode: studentCodeInput.trim() });
    setIsExamActive(true);
    setShowNameModal(false);
  };

  if (isExamActive) return <InteractiveExamHall exam={currentExam} onFinish={() => setIsExamActive(false)} studentsList={students} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 select-none flex flex-col items-center overflow-x-hidden">
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-slate-50">
            <UserCheck size={40} className="text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-6 uppercase tracking-tight italic">Student Login</h3>
            <div className="space-y-4">
              <input autoFocus type="text" value={studentNameInput} onChange={(e) => setStudentNameInput(e.target.value)} className="w-full p-3 rounded-xl border-2 font-bold text-center outline-none focus:border-blue-500 uppercase" placeholder="NAME" />
              <input type="text" value={studentCodeInput} onChange={(e) => setStudentCodeInput(e.target.value)} className="w-full p-3 rounded-xl border-2 font-bold text-center outline-none focus:border-blue-500" placeholder="CODE (OPTIONAL)" />
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-[10px] uppercase">Cancel</button>
              <button onClick={finalizeExamStart} className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-bold text-[10px] uppercase shadow-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b sticky top-0 z-50 shadow-sm px-6 py-2 flex justify-between items-center w-full max-w-6xl">
        <h1 className="text-lg font-black text-blue-700 uppercase italic tracking-tighter cursor-pointer" onClick={() => setActiveTab('home')}>MATH EXCELLENCE</h1>
        <p className="text-[9px] font-bold text-slate-400 italic">ANSHU SIR</p>
      </header>

      <nav className="bg-blue-700 text-white w-full sticky top-[45px] z-40 flex justify-center shadow-lg">
        <div className="max-w-6xl w-full flex overflow-x-auto no-scrollbar">
          {[{ id: 'home', label: 'Home', icon: <History size={14}/> }, { id: 'live', label: 'Live Mock', icon: <Clock size={14}/> }, { id: 'practice', label: 'Practice', icon: <BookOpen size={14}/> }, { id: 'growth', label: 'Growth', icon: <TrendingUp size={14}/> }, { id: 'teacher', label: 'Admin', icon: <User size={14}/> }].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3.5 font-bold text-[9px] uppercase border-b-4 transition-all ${activeTab === item.id ? 'border-yellow-400 bg-blue-800' : 'border-transparent'}`}>{item.icon} {item.label}</button>
          ))}
        </div>
      </nav>

      <main className="w-full max-w-5xl p-4 mb-20 flex flex-col items-center">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in w-full text-center">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-slate-50">
               <GraduationCap size={48} className="text-blue-700 mx-auto mb-3 animate-bounce-slow" />
               <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tight leading-tight">Elevate Your Mathematics <br/> <span className="text-blue-700 underline decoration-yellow-400 decoration-2 underline-offset-8">with Anshu Sir</span></h2>
               <button onClick={() => setActiveTab('live')} className="mt-8 bg-blue-700 text-white px-8 py-2.5 rounded-full font-bold text-[9px] uppercase shadow-xl hover:bg-blue-800 transition-all">Start Session</button>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-md border border-slate-100 text-left w-full">
              <h3 className="font-bold text-xs uppercase mb-3 border-b pb-2 flex items-center gap-2 italic"><History size={16} className="text-blue-600"/> Activity Stream</h3>
              <div className="space-y-3">
                {activityLogs.slice(0, 10).map(log => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center border-l-4 border-blue-600 shadow-sm transition-all hover:bg-white">
                    <div><p className="text-[10px] font-black uppercase text-slate-800">{log.studentName}</p><p className="text-[8px] font-bold text-slate-400 uppercase italic">{log.examTitle} {log.scoreDisplay ? `• Score: ${log.scoreDisplay}` : ''}</p></div>
                    <div className="text-right text-[7px] font-bold text-slate-300 uppercase leading-tight">{log.timeDisplay} <br/> {log.dateDisplay}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-4 w-full text-left">
            <h2 className="font-bold uppercase text-slate-700 border-b-2 pb-2 text-[10px] flex items-center gap-2"><Clock size={14} className="text-red-600"/> Ongoing Live Mocks</h2>
            {liveMocks.filter(m => m.isPublished).map(m => (
              <div key={m.id} className="bg-white p-4 rounded-2xl shadow flex justify-between items-center border border-slate-100">
                <div className="flex-1 pr-4"><h3 className="text-sm font-black uppercase italic tracking-tighter break-words">{m.name}</h3><p className="text-[9px] font-bold text-red-600 uppercase italic mt-1">Duration: {m.hours || 0}h {m.minutes || 0}m</p></div>
                <button onClick={() => handleStartExamFlow(m)} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-[9px] uppercase shadow-lg h-fit">Attend</button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
            {practiceSets.filter(p => p.isPublished).map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl shadow flex justify-between items-center border border-slate-100 hover:border-blue-300">
                <div className="flex-1 pr-4"><h3 className="font-bold uppercase text-xs italic break-words">{p.name}</h3><p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1">Time: {p.hours || 0}h {p.minutes || 0}m</p></div>
                <button onClick={() => handleStartExamFlow(p)} className="bg-blue-700 text-white px-6 py-2 rounded-full font-bold text-[9px] uppercase shadow-md h-fit">Start</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// --- Teacher Zone Main View ---
const TeacherZoneMainView = ({ liveMocks, practiceSets, students, teacherPin, setTeacherPin, studentResults }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinVal, setPinVal] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const updateField = async (id, type, field, value) => { 
    const coll = type === 'live' ? 'liveMocks' : 'practiceSets';
    await setDoc(doc(db, coll, id), { [field]: value }, { merge: true }); 
  };

  const PaperManager = ({ title, items, type, color }) => (
    <div className="bg-white rounded-[2rem] shadow-sm border-t-8 border-slate-100 mb-8 w-full overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b">
        <h3 className={`font-black uppercase text-xs italic ${color}`}>{title} Manager ({items.length})</h3>
        <button onClick={async () => await addDoc(collection(db, type === 'live' ? 'liveMocks' : 'practiceSets'), { name: "NEW SLOT", hours: "1", minutes: "0", fileUrl: "", isPublished: false, answerKey: "", questionMarks: "" })} className="p-2 bg-slate-100 rounded-full active:scale-90 border-2 border-white shadow-sm hover:bg-slate-200 transition-all"><PlusCircle size={24}/></button>
      </div>
      <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 bg-slate-50/50 no-scrollbar">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border-2 border-white shadow-sm overflow-hidden transition-all">
            <div onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 group">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isPublished ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <span className="text-xs font-black uppercase italic text-slate-700 break-words">{item.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={(e) => { e.stopPropagation(); updateField(item.id, type, 'isPublished', !item.isPublished); }} className={`px-4 py-1.5 rounded-full text-[8px] font-black shadow-sm ${item.isPublished ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{item.isPublished ? 'LIVE' : 'HIDDEN'}</button>
                 <button onClick={async (e) => { e.stopPropagation(); if(window.confirm("Permanent delete?")) await deleteDoc(doc(db, type === 'live' ? 'liveMocks' : 'practiceSets', item.id)); }} className="p-2 text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                 <ChevronRight size={18} className={`transition-transform text-slate-300 ${expandedId === item.id ? 'rotate-90 text-blue-600' : ''}`} />
              </div>
            </div>
            {expandedId === item.id && (
              <div className="p-5 border-t bg-slate-50/20 space-y-4 animate-in slide-in-from-top-2">
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Exam Name</p>
                   <input type="text" defaultValue={item.name} onBlur={(e) => updateField(item.id, type, 'name', e.target.value.toUpperCase())} className="w-full p-2.5 rounded-xl border-2 text-xs font-black outline-none bg-white focus:border-blue-400" placeholder="Exam Name" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white p-2.5 rounded-xl border-2 border-blue-50 shadow-sm">
                    <p className="text-[8px] font-black text-blue-700 uppercase mb-1 ml-1">Time Limit</p>
                    <div className="flex items-center gap-1">
                      <input type="number" defaultValue={item.hours} onBlur={(e) => updateField(item.id, type, 'hours', e.target.value)} className="w-10 text-center font-black bg-blue-50 rounded-lg outline-none" /> <span className="font-bold text-[9px]">H</span> 
                      <input type="number" defaultValue={item.minutes} onBlur={(e) => updateField(item.id, type, 'minutes', e.target.value)} className="w-10 text-center font-black bg-blue-50 rounded-lg outline-none" /> <span className="font-bold text-[9px]">M</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-2.5 rounded-xl border-2 border-slate-50 shadow-sm">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Google Drive Link</p>
                    <input type="text" defaultValue={item.fileUrl} onBlur={(e) => updateField(item.id, type, 'fileUrl', e.target.value)} className="w-full p-2 rounded-lg border text-[10px] outline-none font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border-2 border-blue-50 shadow-sm">
                    <p className="text-[9px] font-black text-blue-700 uppercase mb-2 italic">Correct Key</p>
                    <input type="text" defaultValue={item.answerKey || ""} onBlur={(e) => updateField(item.id, type, 'answerKey', e.target.value.toUpperCase())} className="w-full p-2 rounded-xl bg-blue-50/20 border font-black text-xs outline-none" placeholder="e.g. A,B,W,D" />
                  </div>
                  <div className="bg-white p-3 rounded-xl border-2 border-yellow-50 shadow-sm">
                    <p className="text-[9px] font-black text-yellow-700 uppercase mb-2 italic">Marks/Q</p>
                    <input type="text" defaultValue={item.questionMarks || ""} onBlur={(e) => updateField(item.id, type, 'questionMarks', e.target.value)} className="w-full p-2 rounded-xl bg-yellow-50/20 border font-black text-xs outline-none" placeholder="e.g. 1,1,5,1" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-white p-4 rounded-2xl flex justify-between items-center w-full mb-8 border-2 shadow-sm">
        <div className="flex gap-2">
          <button onClick={() => setIsChangingPin(!isChangingPin)} className="px-5 py-2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">PIN</button>
          <button onClick={async () => { if(window.confirm("Clear Logs?")) { const q = query(collection(db, "logs")); const snapshot = await getDocs(q); const batch = writeBatch(db); snapshot.docs.forEach((d) => batch.delete(d.ref)); await batch.commit(); } }} className="px-5 py-2 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase">Clear Activity</button>
        </div>
      </div>
      {isChangingPin && (
        <div className="max-w-sm w-full p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 mb-8 animate-in slide-in-from-top-4">
           <input type="text" onChange={(e) => setPinVal(e.target.value)} className="w-full p-3 rounded-xl bg-white border-2 text-xl font-black text-center" placeholder="NEW PIN" />
           <button onClick={async () => { if(pinVal.length >= 4) { await setTeacherPin(pinVal); setIsChangingPin(false); alert("Updated!"); }}} className="w-full py-3 bg-blue-700 text-white rounded-lg mt-4 font-bold text-xs uppercase">Save</button>
        </div>
      )}
      <PaperManager title="Live Mock Exam" items={liveMocks} type="live" color="text-red-600" />
      <PaperManager title="Practice Sets" items={practiceSets} type="practice" color="text-blue-700" />
      <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border-t-8 border-slate-900 w-full mb-20 text-center">
        <h3 className="font-black text-xs uppercase mb-8 flex items-center justify-center gap-3 italic text-slate-800"><Trophy size={28} className="text-yellow-600"/> Student Registry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {students.map((std) => (
            <div key={std.id} className="relative group p-5 bg-slate-50 border-2 border-white rounded-[2rem] flex flex-col items-center shadow-sm hover:shadow-md transition-all">
              <p className="text-md font-black uppercase italic tracking-tighter text-slate-800">{std.name}</p>
              <div className="mt-2 flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                 <Lock size={10} className="text-blue-600"/><p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">CODE: {std.studentCode || 'N/A'}</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setSelectedStudent(std)} className="px-5 py-1.5 bg-white border-2 rounded-full text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all shadow-sm italic">Reports</button>
                <button onClick={async () => { if(window.confirm(`Delete ${std.name}?`)) await deleteDoc(doc(db, "students", std.id)); }} className="p-2 bg-red-50 text-red-500 rounded-full border border-red-100 active:scale-90"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          <button onClick={async () => { const n = prompt("Student Name:"); const c = prompt("Unique Code (Phone last 4):"); if(n) await addDoc(collection(db, "students"), {name: n.toUpperCase(), studentCode: c || ""}); }} className="p-8 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-[12px] font-black text-slate-300 uppercase hover:text-blue-600 transition-all">+ REGISTER</button>
        </div>
      </div>
      {selectedStudent && <AdminMarksheetModal student={selectedStudent} results={studentResults} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
};

// --- 🟡 ADMIN MARKSHEET MODAL (FIXED FOR MULTIPLE IMAGES) ---
const AdminMarksheetModal = ({ student, results, onClose }) => {
  const [newRes, setNewRes] = useState({ exam: "", obtained: "", total: "", date: "" });
  const [previewImg, setPreviewImg] = useState(null);

  return (
    <div className="fixed inset-0 bg-white z-[1200] p-6 overflow-y-auto animate-in slide-in-from-right-full duration-500">
       {previewImg && <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />}
       <button onClick={onClose} className="font-black text-blue-600 mb-10 flex items-center gap-3 border-b-4 border-blue-600 w-fit uppercase text-[11px] italic tracking-tighter hover:text-blue-800 transition-all"><ChevronLeft size={24}/> Return to Registry</button>
       <div className="bg-white p-10 rounded-[3rem] border-4 border-slate-50 shadow-3xl max-w-xl mx-auto space-y-10">
          <div className="flex items-center gap-5 border-b-4 border-slate-50 pb-6">
            <div className="w-16 h-16 bg-blue-700 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl italic font-black text-2xl">{student?.name?.charAt(0)}</div>
            <div><h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{student?.name}</h3><p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mt-1 italic">Performance Logs</p></div>
          </div>

          <div className="p-8 bg-blue-50 rounded-[2.5rem] space-y-5 shadow-inner border-2 border-blue-100">
             <div className="grid grid-cols-1 gap-5 text-left">
               <input type="text" value={newRes.exam} onChange={(e) => setNewRes({...newRes, exam: e.target.value.toUpperCase()})} className="w-full p-4 rounded-xl border-2 font-black text-xs outline-none shadow-sm focus:border-blue-500" placeholder="Module Name" />
               <input type="date" value={newRes.date} onChange={(e) => setNewRes({...newRes, date: e.target.value})} className="w-full p-4 rounded-xl border-2 font-black text-xs outline-none shadow-sm" />
               <div className="flex gap-3"><input type="number" placeholder="Obt" value={newRes.obtained} onChange={(e) => setNewRes({...newRes, obtained: e.target.value})} className="w-1/2 p-4 rounded-xl border-2 font-black text-lg text-center outline-none shadow-sm focus:border-blue-500" /><input type="number" placeholder="Full" value={newRes.total} onChange={(e) => setNewRes({...newRes, total: e.target.value})} className="w-1/2 p-4 rounded-xl border-2 font-black text-lg text-center outline-none shadow-sm focus:border-blue-500" /></div>
             </div>
             <button onClick={async () => { if(newRes.exam && newRes.obtained && newRes.total && newRes.date) { const p = Math.round((parseFloat(newRes.obtained)/parseFloat(newRes.total))*100); await addDoc(collection(db, "results"), { ...newRes, name: student.name, percent: p, timestamp: Date.now() }); setNewRes({exam: "", obtained: "", total: "", date: ""}); alert("Saved!"); } }} className="w-full py-5 bg-blue-700 text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Manual Entry</button>
          </div>

          <div className="space-y-8 pt-8 border-t-4 border-slate-50">
            {results.filter(r => r.name === student?.name).sort((a,b)=>b.timestamp-a.timestamp).map(r => (
              <div key={r.id} className="p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] flex flex-col gap-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg bg-blue-50 text-blue-700 border-2 border-white shadow-sm">{r.percent}%</div>
                    <div className="flex-1 min-w-0 pr-2">
                       <p className="text-sm font-black uppercase italic tracking-tighter leading-none break-words whitespace-normal">{r.exam}</p>
                       <p className="text-[10px] font-bold text-slate-400 mt-1 italic">{r.date} • Score: {r.obtained}/{r.total}</p>
                    </div>
                  </div>
                  <button onClick={async () => { if(window.confirm("Purge record?")) await deleteDoc(doc(db, "results", r.id)); }} className="text-red-200 hover:text-red-500 active:scale-90 transition-all flex-shrink-0"><Trash2 size={24} /></button>
                </div>

                {/* 🟠 HORIZONTAL SLIDER FOR PENDING PAPERS (NEW MULTI-PAGE FIX) */}
                {r.details && r.details.some(d => d.pending) && (
                  <div className="bg-orange-50 border-2 border-orange-100 rounded-[2rem] p-4 flex flex-col gap-3 shadow-inner">
                    <p className="text-[10px] font-black text-orange-600 uppercase italic text-center animate-pulse tracking-widest">Action Required: Written Solutions</p>
                    <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x snap-mandatory">
                      {r.details.filter(d => d.pending).map((pendingQ, pIdx) => {
                         // এখানে দেখা হচ্ছে selected ফিল্ডটি কি Array (Multi-page) নাকি Single String
                         const photoList = Array.isArray(pendingQ.selected) ? pendingQ.selected : [pendingQ.selected];
                         
                         return photoList.map((photoUrl, imgIdx) => (
                           <div key={`${pIdx}-${imgIdx}`} className="min-w-[200px] bg-white border-2 border-white shadow-md rounded-2xl p-4 flex flex-col items-center gap-3 snap-center">
                             <p className="text-[9px] font-black text-slate-400 uppercase italic">Q{pendingQ.qNum} - Page {imgIdx + 1}</p>
                             <button onClick={() => setPreviewImg(photoUrl)} className="w-full py-2 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase shadow-sm">View Page</button>
                             
                             {/* মার্ক ইনপুট শুধু প্রতিটি প্রশ্নের শেষ পাতার নিচে আসবে */}
                             {imgIdx === photoList.length - 1 && (
                               <div className="flex gap-2 w-full mt-2">
                                 <input id={`mark-input-${r.id}-${pendingQ.qNum}`} type="number" placeholder="Marks" className="w-1/2 p-2 border-2 rounded-xl text-center font-black text-[10px] outline-none focus:border-orange-500 bg-white" />
                                 <button onClick={async () => {
                                     const markVal = document.getElementById(`mark-input-${r.id}-${pendingQ.qNum}`).value;
                                     if (!markVal) return alert("Enter marks!");
                                     const updatedDetails = r.details.map(d => (d.pending && d.qNum === pendingQ.qNum) ? { ...d, status: true, mark: parseFloat(markVal), pending: false, selected: "PHOTO_DELETED" } : d);
                                     const newObt = updatedDetails.reduce((sum, d) => sum + (d.status ? d.mark : 0), 0);
                                     await setDoc(doc(db, "results", r.id), { details: updatedDetails, obtained: newObt, percent: Math.round((newObt / r.total) * 100) }, { merge: true });
                                     alert(`Q${pendingQ.qNum} Marks Updated!`);
                                   }} className="w-1/2 py-2 bg-orange-600 text-white rounded-xl font-black text-[9px] uppercase shadow-sm">Save</button>
                               </div>
                             )}
                           </div>
                         ));
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
       </div>
    </div>
  );
};
    
const InteractiveExamHall = ({ exam, onFinish, studentsList }) => {
  const [timeLeft, setTimeLeft] = useState(parseInt(exam?.duration) || 3600);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [scoreData, setScoreData] = useState(null);

  // 🟢 Updated: Multi-page handle for 'W' questions
  const handleImageUpload = (qNum, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
        
        setAnswers(prev => {
          // আগের ফটোগুলো সংগ্রহ করা হচ্ছে
          const existingPhotos = Array.isArray(prev[qNum]) ? prev[qNum] : [];
          return { ...prev, [qNum]: [...existingPhotos, compressedBase64] };
        });
      };
    };
  };

  const answerKeyArray = exam?.answerKey ? exam.answerKey.split(',').map(k => k.trim().toUpperCase()) : [];
  const marksArray = exam?.questionMarks ? exam.questionMarks.split(',').map(m => parseFloat(m.trim()) || 1) : [];

  useEffect(() => {
    let t;
    if (!isSubmitted && timeLeft > 0) t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    else if (timeLeft <= 0 && !isSubmitted) submitExam();
    return () => clearInterval(t);
  }, [timeLeft, isSubmitted]);

  const submitExam = async () => {
    try {
      let totalObtainedMarks = 0;
      let totalPossibleMarks = 0;
      const detailResults = answerKeyArray.map((key, index) => {
        const qNum = index + 1;
        const qMark = marksArray[index] !== undefined ? marksArray[index] : 1;
        const isWritten = key === 'W';
        const isCorrect = isWritten ? false : (answers[qNum] || '') === key;
        totalPossibleMarks += qMark;
        if (!isWritten && isCorrect) totalObtainedMarks += qMark;
        return { qNum, selected: answers[qNum] || 'None', correct: key, status: isCorrect, mark: qMark, type: isWritten ? 'written' : 'mcq', pending: isWritten };
      });
      const percent = totalPossibleMarks > 0 ? Math.round((totalObtainedMarks / totalPossibleMarks) * 100) : 0;
      const d = new Date();
      let finalStudentName = exam.studentName.toUpperCase();
      const matchedStudent = studentsList.find(s => s.studentCode?.toString().trim() === exam.studentCode?.toString().trim());
      if (matchedStudent) finalStudentName = matchedStudent.name;

      await addDoc(collection(db, "logs"), { studentName: finalStudentName, examTitle: exam.name, timestamp: Date.now(), scoreDisplay: `${totalObtainedMarks} / ${totalPossibleMarks}` });
      await addDoc(collection(db, "results"), { name: finalStudentName, exam: exam.name, percent, obtained: totalObtainedMarks, total: totalPossibleMarks, date: d.toLocaleDateString('en-GB'), timestamp: Date.now(), details: detailResults });
      setScoreData({ correct: totalObtainedMarks, total: totalPossibleMarks, percent, details: detailResults });
      setIsSubmitted(true);
    } catch (e) { setIsSubmitted(true); }
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${s%60 < 10 ? '0'+(s%60) : s%60}`;

  if (isSubmitted) return (
    <div className="fixed inset-0 bg-white z-[2000] flex flex-col items-center overflow-y-auto p-10 text-center animate-in zoom-in duration-500">
      <CheckCircle size={80} className="text-green-600 mb-6 animate-bounce shadow-2xl rounded-full" />
      <h2 className="text-3xl font-black text-slate-800 uppercase italic mb-8 tracking-tighter leading-none">Session Completed</h2>
      <div className="bg-slate-50 p-10 rounded-[3rem] border-4 border-white mb-10 w-full max-w-sm shadow-2xl text-center">
         <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-60">Result Transcript</p>
         <h3 className="text-5xl font-black text-blue-700 italic tracking-tighter leading-none">{scoreData?.correct} / {scoreData?.total}</h3>
      </div>
      <button onClick={onFinish} className="bg-blue-700 text-white px-16 py-4 rounded-full font-black uppercase text-[12px] shadow-2xl">Close Arena</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden animate-in fade-in duration-500">
      <div className="bg-white p-2 md:p-3 flex justify-between items-center border-b-8 border-yellow-400 shadow-2xl relative z-50">
        <div className="flex-1 min-w-0 pr-2"><h2 className="font-black text-slate-800 text-[10px] uppercase italic tracking-tighter leading-none truncate max-w-[150px]">{exam?.name}</h2><p className="text-[8px] md:text-[9px] text-blue-700 font-black uppercase mt-1 tracking-widest italic leading-none">{exam?.studentName}</p></div>
        <div className="flex items-center gap-6">
          <div className={`px-5 py-1.5 rounded-xl font-black text-2xl border-4 text-slate-800 border-slate-100`}>{formatTime(timeLeft)}</div>
          <button onClick={() => { if(window.confirm("SUBMIT EXAM?")) submitExam(); }} className="bg-green-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-lg">SUBMIT</button>
        </div>
      </div>
      <div className="flex-1 bg-slate-900 overflow-hidden relative">
         <iframe src={exam?.fileUrl?.replace('/view?usp=sharing', '/preview').replace('/view', '/preview')} className="w-full h-full border-none opacity-95" title="Paper" />
         <div className="absolute bottom-0 left-0 right-0 z-50 bg-slate-800/98 border-t-4 border-slate-700 backdrop-blur-xl p-3 md:p-4 shadow-[0_-15px_40px_rgba(0,0,0,0.6)]">
            <div className="max-w-4xl mx-auto">
               <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-[9px] font-black text-blue-400 uppercase italic flex items-center gap-3"><PenTool size={16}/> RESPONSE INTERFACE</span>
                  {activeQuestion && <button onClick={() => setActiveQuestion(null)} className="text-slate-500 font-black text-[10px] uppercase border-b-2 border-slate-700">Close</button>}
               </div>
               {activeQuestion ? (
                  <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 pb-2">
                    <p className="text-white font-black text-xs mb-4 italic uppercase opacity-60">
                       {answerKeyArray[activeQuestion-1] === 'W' ? `Upload Pages for Q${activeQuestion}:` : `Choice for Q${activeQuestion}:`}
                    </p>
                    {answerKeyArray[activeQuestion-1] === 'W' ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-2 flex-wrap justify-center">
                           {Array.isArray(answers[activeQuestion]) && answers[activeQuestion].map((_, i) => (
                             <div key={i} className="bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase">Page {i+1} ✓</div>
                           ))}
                        </div>
                        <div className="flex gap-4">
                           <label className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase cursor-pointer shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                              <Camera size={16}/> {Array.isArray(answers[activeQuestion]) && answers[activeQuestion].length > 0 ? 'ADD ANOTHER PAGE' : 'CAPTURE PAGE'}
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(activeQuestion, e.target.files[0])} />
                           </label>
                           {Array.isArray(answers[activeQuestion]) && answers[activeQuestion].length > 0 && (
                             <button onClick={() => setActiveQuestion(null)} className="bg-green-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all">DONE</button>
                           )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-5">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <button key={opt} onClick={() => { setAnswers({...answers, [activeQuestion]: opt}); setActiveQuestion(null); }} className={`w-12 h-12 rounded-xl font-black text-xl flex items-center justify-center border-b-8 transition-all active:scale-90 ${answers[activeQuestion] === opt ? 'bg-blue-600 text-white border-blue-900 shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'bg-slate-700 text-slate-300 border-slate-950 hover:bg-slate-600'}`}>{opt}</button>
                        ))}
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x items-center justify-start">
                    {answerKeyArray.map((_, index) => {
                      const num = index + 1;
                      return (
                        <button key={num} onClick={() => setActiveQuestion(num)} className={`min-w-[42px] h-[42px] rounded-xl font-black text-xs flex items-center justify-center transition-all snap-center border-b-4 shadow-lg ${answers[num] ? 'bg-green-600 text-white border-green-900' : 'bg-slate-700 text-slate-400 border-slate-900 hover:bg-slate-600 hover:text-white'}`}>{num}</button>
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

// --- 📈 Growth Section ---
const GrowthSectionView = ({ results, students }) => {
  const [sel, setSel] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-500 text-left px-2">
      {selectedReview && <ReviewResultModal result={selectedReview} onClose={() => setSelectedReview(null)} />}
      
      {!sel ? (
        <div className="grid gap-4">
          {students.map((std) => (<button key={std.id} onClick={() => setSel(std.name)} className="w-full bg-white p-5 rounded-[2rem] shadow-lg border-2 border-white flex justify-between items-center group active:scale-95 transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 shadow-inner group-hover:bg-blue-700 group-hover:text-white transition-all"><User size={18}/></div> <span className="font-black text-slate-800 uppercase text-[14px] italic tracking-tight break-words">{std.name}</span></div><ChevronRight size={24} className="text-slate-200 group-hover:text-blue-600" /></button>))}
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-20 duration-700">
          <button onClick={() => setSel(null)} className="flex items-center gap-2 text-[12px] font-black text-blue-600 uppercase italic hover:underline ml-2"><ChevronLeft size={24}/> Return</button>
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-slate-100 flex flex-col max-h-[80vh]">
             <div className="bg-blue-700 p-8 text-white text-center relative overflow-hidden flex-shrink-0"><Trophy className="absolute -top-10 -right-10 opacity-10 rotate-12" size={150}/><h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2 leading-none break-words px-4 text-white">Performance Transcript</h2><div className="inline-block bg-white/20 px-6 py-1.5 rounded-full border border-white/30 max-w-[90%] overflow-hidden"><p className="text-sm font-black uppercase italic break-words text-white">{sel}</p></div></div>
             <div className="overflow-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
               {results.filter(r => r.name === sel).sort((a,b)=> (b.timestamp || 0) - (a.timestamp || 0)).map(r => (
                 <div key={r.id} className="min-w-[450px] md:min-w-0 bg-white rounded-[2rem] border-2 border-white shadow-sm flex items-center p-5 gap-6 hover:shadow-md transition-all group">
                   <div className="flex-1 min-w-0 border-l-8 border-blue-600 pl-5"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Exam Unit</p><p className="text-sm md:text-lg font-black uppercase italic text-slate-800 leading-tight whitespace-normal break-words">{r.exam}</p></div>
                   <div className="text-center px-4 border-l border-slate-100 min-w-[100px]"><p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Score</p><p className="text-2xl md:text-3xl font-black italic text-blue-700 leading-none">{r.obtained}/{r.total}</p></div>
                   <div className="flex-shrink-0"><button onClick={() => setSelectedReview(r)} className="bg-slate-50 text-blue-700 p-3 rounded-2xl border-2 border-white shadow-sm hover:bg-blue-700 hover:text-white transition-all"><Eye size={20}/></button></div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
