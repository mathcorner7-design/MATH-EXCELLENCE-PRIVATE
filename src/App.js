import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Sub-component: PDF Renderer ---
const PDFToImageDisplay = ({ fileUrl }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const initRendering = async () => {
      try {
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
          document.head.appendChild(script);
          script.onload = () => processPDF();
        } else {
          processPDF();
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };

    const processPDF = async () => {
      try {
        const pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const pageImages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          pageImages.push(canvas.toDataURL('image/png'));
        }
        if (isMounted) {
          setPages(pageImages);
          setLoading(false);
        }
      } catch (e) {
        if (isMounted) setLoading(false);
      }
    };
    initRendering();
    return () => { isMounted = false; };
  }, [fileUrl]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-10 space-y-3">
      <Loader2 className="animate-spin text-blue-600" size={28} />
      <p className="font-bold text-slate-400 uppercase text-[8px]">Loading content...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 w-full items-center pb-20">
      {pages.map((img, idx) => (
        <div key={idx} className="w-full shadow-md border rounded overflow-hidden relative bg-white mb-2">
          <div className="absolute top-1 left-1 bg-blue-600/80 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full z-10 uppercase">Page {idx + 1}</div>
          <img src={img} alt="Paper" className="w-full h-auto select-none pointer-events-none" />
        </div>
      ))}
    </div>
  );
};

// --- Sub-component: Activity Log ---
const ActivityLogDisplay = ({ logs }) => (
  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xl mt-8 ring-1 ring-slate-100 w-full max-w-xl mx-auto">
    <div className="flex items-center gap-2 border-b pb-3 mb-4">
      <History className="text-blue-600" size={18} />
      <h3 className="font-black text-xs text-slate-800 uppercase italic tracking-widest">Live Activity Log</h3>
    </div>
    <div className="space-y-3 max-h-56 overflow-y-auto pr-2 no-scrollbar">
      {logs.length === 0 ? (
        <p className="text-center py-8 text-[9px] text-slate-300 font-bold uppercase tracking-widest">No recent activity</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 border-l-4 border-l-blue-600 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 shadow-inner">
                <UserCheck size={14} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{log.studentName}</p>
                <p className="text-[7px] text-slate-400 font-bold uppercase mt-1 italic">{log.examTitle}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[7px] font-black text-blue-600 uppercase italic leading-none">{log.timeDisplay}</p>
              <p className="text-[6px] font-bold text-slate-400 uppercase mt-0.5">{log.dateDisplay}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// --- App Root Controller ---
const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isExamActive, setIsExamActive] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingExam, setPendingExam] = useState(null);
  
  const [teacherPin, setTeacherPin] = useState('1234567890');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [liveMocks, setLiveMocks] = useState([]);
  const [prevPapers, setPrevPapers] = useState([]);
  const [practiceSets, setPracticeSets] = useState([]);
  const [growthPublished, setGrowthPublished] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // --- 🔵 Real-time Data Sync with Firebase ---
  useEffect(() => {
    // 1. Listen for Live Mocks
    const unsubMocks = onSnapshot(collection(db, "liveMocks"), (snapshot) => {
      setLiveMocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Listen for Previous Papers
    const unsubPrev = onSnapshot(collection(db, "prevPapers"), (snapshot) => {
      setPrevPapers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Listen for Practice Sets
    const unsubPractice = onSnapshot(collection(db, "practiceSets"), (snapshot) => {
      setPracticeSets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Listen for PIN & Settings
    const unsubSettings = onSnapshot(doc(db, "settings", "adminConfig"), (docSnap) => {
      if (docSnap.exists()) {
        setTeacherPin(docSnap.data().pin);
        setGrowthPublished(docSnap.data().growthPublished);
      }
    });

    // 5. Listen for Student Results
    const unsubResults = onSnapshot(collection(db, "results"), (snapshot) => {
      setStudentResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 6. Listen for Students
    const unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      setStudents(snapshot.docs.map(doc => doc.data().name).sort());
    });

    return () => {
      unsubMocks(); unsubPrev(); unsubPractice(); unsubSettings(); unsubResults(); unsubStudents();
    };
  }, []);

  const handleStartExamFlow = (title, durationSec, fileUrl, fileType) => {
    setPendingExam({ title, duration: durationSec, fileUrl, fileType });
    setShowNameModal(true);
  };

  const finalizeExamStart = (name) => {
    const d = new Date();
    const newLog = { 
      id: Date.now(), 
      studentName: name, 
      examTitle: pendingExam.title, 
      timestamp: Date.now(), 
      timeDisplay: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateDisplay: d.toLocaleDateString()
    };
    setActivityLogs([newLog, ...activityLogs]);
    setCurrentExam({ ...pendingExam, studentName: name });
    setIsExamActive(true);
    setShowNameModal(false);
  };

  if (isExamActive) return <ExamInterface exam={currentExam} onFinish={() => setIsExamActive(false)} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'live': return <LiveMockListingView liveMocks={liveMocks} onStart={handleStartExamFlow} />;
      case 'practice': return <StudentPracticeListView prevPapers={prevPapers} practiceSets={practiceSets} onStart={handleStartExamFlow} />;
      case 'growth': return <GrowthSectionView isPublished={growthPublished} results={studentResults} />;
      case 'teacher': 
        if (!isTeacherAuthenticated) return <TeacherPinPortal correctPin={teacherPin} onAuthSuccess={() => setIsTeacherAuthenticated(true)} />;
        return (
          <TeacherZoneMainView 
            liveMocks={liveMocks} prevPapers={prevPapers} practiceSets={practiceSets} 
            growthPublished={growthPublished} setGrowthPublished={async (val) => await setDoc(doc(db, "settings", "adminConfig"), { growthPublished: val }, { merge: true })}
            studentResults={studentResults} students={students} teacherPin={teacherPin} 
            setTeacherPin={async (val) => await setDoc(doc(db, "settings", "adminConfig"), { pin: val }, { merge: true })}
          />
        );
      default: return <HomeLandingView onStart={() => setActiveTab('practice')} logs={activityLogs} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 select-none text-sm overflow-x-hidden flex flex-col items-center">
      <StudentNameVerification isOpen={showNameModal} onClose={() => setShowNameModal(false)} onConfirm={finalizeExamStart} />
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm px-4 py-2.5 flex justify-between items-center w-full max-w-6xl">
        <div className="cursor-pointer group" onClick={() => setActiveTab('home')}>
          <h1 className="text-xl md:text-2xl font-black text-blue-700 uppercase tracking-tighter italic leading-none group-hover:scale-[0.98] transition-transform">MATH EXCELLENCE</h1>
          <p className="text-[8px] md:text-[9px] font-bold text-slate-400 opacity-80 mt-1 tracking-widest leading-none">"Your future our priority"</p>
        </div>
      </header>
      <nav className="bg-blue-700 text-white shadow-2xl sticky top-[46px] md:top-[56px] z-40 overflow-hidden w-full flex justify-center">
        <div className="max-w-6xl w-full px-1 flex justify-between items-center overflow-x-auto no-scrollbar">
          {[
            { id: 'live', label: 'Live Mock', icon: <Clock size={12} /> },
            { id: 'practice', label: 'Practice Mock', icon: <BookOpen size={12} /> },
            { id: 'growth', label: 'Your Growth', icon: <TrendingUp size={12} /> },
            { id: 'teacher', label: 'Teacher Zone', icon: <User size={12} /> }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-1.5 px-4 md:px-8 py-4 transition-all border-b-4 font-black text-[10px] md:text-xs uppercase tracking-widest ${activeTab === item.id ? 'border-yellow-400 bg-blue-800 text-white' : 'border-transparent hover:bg-blue-600'}`}>{item.icon} {item.label}</button>
          ))}
        </div>
      </nav>
      <main className="w-full max-w-6xl p-4 md:p-8 mb-20 flex flex-col items-center">{renderContent()}</main>
    </div>
  );
};

// --- Sub-components (Simplified with Firebase Actions) ---

const TeacherZoneMainView = ({ liveMocks, prevPapers, practiceSets, growthPublished, setGrowthPublished, studentResults, students, teacherPin, setTeacherPin }) => {
  const [msg, setMsg] = useState("");
  const [selectedTeacherStudent, setSelectedTeacherStudent] = useState(null);
  const [newPinInput, setNewPinInput] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [addStudentModal, setAddStudentModal] = useState({ isOpen: false, name: '' });
  const [newRes, setNewRes] = useState({ exam: "", date: "", obtained: "", total: "" });

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const addSlot = async (category) => {
    const colName = category === 'live' ? "liveMocks" : category === 'prev' ? "prevPapers" : "practiceSets";
    await addDoc(collection(db, colName), { name: "Untitled Paper Slot", hours: 1, minutes: 0, fileUrl: null, fileType: null, isPublished: false });
    notify("Slot added to Database");
  };

  const updatePaper = async (id, category, field, value) => {
    const colName = category === 'live' ? "liveMocks" : category === 'prev' ? "prevPapers" : "practiceSets";
    await setDoc(doc(db, colName, id), { [field]: value }, { merge: true });
  };

  const deletePaper = async (id, category) => {
    const colName = category === 'live' ? "liveMocks" : category === 'prev' ? "prevPapers" : "practiceSets";
    await deleteDoc(doc(db, colName, id));
    notify("Deleted");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full">
      {msg && <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full z-[300] text-[10px] font-black">{msg}</div>}
      <div className="text-center">
        <h2 className="text-xl font-black uppercase italic underline decoration-blue-600 underline-offset-4">Teacher Console</h2>
        <button onClick={() => setIsChangingPin(!isChangingPin)} className="text-[10px] font-bold text-slate-400 mt-2">Change PIN</button>
      </div>

      {isChangingPin && (
        <div className="max-w-xs mx-auto p-4 bg-yellow-50 border rounded-xl space-y-2">
          <input type="text" value={newPinInput} onChange={(e) => setNewPinInput(e.target.value)} className="w-full p-2 border font-black text-center" placeholder="New PIN" />
          <button onClick={() => { setTeacherPin(newPinInput); setIsChangingPin(false); notify("PIN Updated"); }} className="w-full bg-yellow-600 text-white py-2 font-black">Save PIN</button>
        </div>
      )}

      {/* --- Mapping Live Mocks --- */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
           <h3 className="font-black text-red-600 text-[10px] uppercase">Live Mock Management</h3>
           <button onClick={() => addSlot('live')} className="text-red-600"><PlusCircle /></button>
        </div>
        <div className="space-y-4">
          {liveMocks.map(m => (
            <div key={m.id} className="p-3 bg-slate-50 rounded-xl border flex flex-col gap-2">
              <div className="flex gap-2">
                <input type="text" value={m.name} onChange={(e) => updatePaper(m.id, 'live', 'name', e.target.value)} className="flex-1 p-2 border font-black text-[10px] uppercase" />
                <button onClick={() => updatePaper(m.id, 'live', 'isPublished', !m.isPublished)} className={`px-3 py-1 rounded text-[8px] font-black ${m.isPublished ? 'bg-green-600 text-white' : 'bg-slate-300'}`}>{m.isPublished ? 'LIVE' : 'OFF'}</button>
                <button onClick={() => deletePaper(m.id, 'live')} className="text-red-400"><Trash2 size={16}/></button>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[8px] font-black">Link:</span>
                <input type="text" value={m.fileUrl || ''} onChange={(e) => updatePaper(m.id, 'live', 'fileUrl', e.target.value)} className="flex-1 p-2 border text-[9px]" placeholder="Drive PDF Link" />
                <select onChange={(e) => updatePaper(m.id, 'live', 'fileType', e.target.value)} className="text-[8px] p-2 border">
                  <option value="application/pdf">PDF</option>
                  <option value="image/png">Image</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Student Management --- */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
           <h3 className="font-black text-blue-600 text-[10px] uppercase">Students Marksheet</h3>
           <button onClick={() => setAddStudentModal({ isOpen: true, name: '' })} className="text-blue-600"><UserPlus /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
           {students.map((s, i) => (
             <button key={i} onClick={() => setSelectedTeacherStudent(s)} className="p-3 bg-slate-50 border rounded-lg font-black text-[10px] text-left uppercase">{s}</button>
           ))}
        </div>
      </div>

      {selectedTeacherStudent && (
        <div className="fixed inset-0 bg-white z-[200] p-6 overflow-y-auto">
          <button onClick={() => setSelectedTeacherStudent(null)} className="font-black text-blue-600 mb-4">← BACK</button>
          <h2 className="text-xl font-black uppercase mb-6">Marksheet: {selectedTeacherStudent}</h2>
          <div className="grid grid-cols-2 gap-2 mb-6">
             <input type="text" value={newRes.exam} onChange={(e) => setNewRes({...newRes, exam: e.target.value})} className="p-2 border" placeholder="Exam Topic" />
             <input type="date" value={newRes.date} onChange={(e) => setNewRes({...newRes, date: e.target.value})} className="p-2 border" />
             <input type="number" value={newRes.obtained} onChange={(e) => setNewRes({...newRes, obtained: e.target.value})} className="p-2 border" placeholder="Obtained" />
             <input type="number" value={newRes.total} onChange={(e) => setNewRes({...newRes, total: e.target.value})} className="p-2 border" placeholder="Total" />
             <button onClick={async () => {
               const p = Math.round((newRes.obtained/newRes.total)*100);
               await addDoc(collection(db, "results"), { ...newRes, name: selectedTeacherStudent, percent: p });
               notify("Score Saved");
             }} className="col-span-2 bg-blue-700 text-white py-3 font-black">SAVE SCORE</button>
          </div>
        </div>
      )}

      {addStudentModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[400] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-xs">
            <input type="text" value={addStudentModal.name} onChange={(e) => setAddStudentModal({...addStudentModal, name: e.target.value})} className="w-full p-2 border mb-4" placeholder="Student Name" />
            <button onClick={async () => { await addDoc(collection(db, "students"), { name: addStudentModal.name }); setAddStudentModal({ isOpen: false }); }} className="w-full bg-blue-600 text-white py-2">Create Profile</button>
          </div>
        </div>
      )}
    </div>
  );
};

// (Note: Other components like ExamInterface, HomeLandingView, etc. remain mostly the same but now take data from the synced state)
const HomeLandingView = ({ onStart, logs }) => (
  <div className="flex flex-col items-center w-full space-y-6">
    <div className="bg-white rounded-3xl p-10 shadow-xl border text-center w-full max-w-xl">
      <GraduationCap size={48} className="text-blue-700 mx-auto mb-4" />
      <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase italic">MATH EXCELLENCE</h2>
      <p className="text-[10px] text-slate-400 mb-8 uppercase tracking-widest italic">Anshu Sir's Coaching Portal</p>
      <button onClick={onStart} className="bg-blue-700 text-white px-10 py-4 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-200">Get Started</button>
    </div>
  </div>
);

const LiveMockListingView = ({ liveMocks, onStart }) => (
  <div className="w-full max-w-2xl mx-auto space-y-4">
    <h2 className="font-black text-red-600 uppercase border-b-2 pb-2">Ongoing Live Mocks</h2>
    {liveMocks.filter(m => m.isPublished).map(m => (
      <div key={m.id} className="bg-white p-5 rounded-2xl border-2 border-red-50 flex justify-between items-center shadow-md">
        <div><h3 className="font-black uppercase">{m.name}</h3><p className="text-[10px] text-slate-400">{m.hours}h {m.minutes}m</p></div>
        <button onClick={() => onStart(m.name, (m.hours*3600)+(m.minutes*60), m.fileUrl, m.fileType)} className="bg-red-600 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase">Attempt</button>
      </div>
    ))}
  </div>
);

const StudentPracticeListView = ({ prevPapers, practiceSets, onStart }) => (
  <div className="w-full max-w-2xl mx-auto space-y-10">
    <div className="space-y-4">
      <h2 className="font-black text-blue-700 uppercase border-b-2 pb-2">Practice Papers</h2>
      {prevPapers.filter(p => p.isPublished).map(p => (
        <div key={p.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
          <span className="font-black uppercase text-xs">{p.name}</span>
          <button onClick={() => onStart(p.name, (p.hours*3600)+(p.minutes*60), p.fileUrl, p.fileType)} className="bg-blue-700 text-white px-4 py-1.5 rounded font-black text-[10px] uppercase">Start</button>
        </div>
      ))}
    </div>
  </div>
);

const GrowthSectionView = ({ isPublished, results }) => {
  const [sel, setSel] = useState(null);
  if (!isPublished) return <div className="py-20 text-center font-black text-slate-300 uppercase italic">Results Locked</div>;
  const stds = Array.from(new Set(results.map(r => r.name)));
  return (
    <div className="w-full max-w-2xl mx-auto">
      {!sel ? (
        <div className="grid grid-cols-1 gap-2">
          {stds.map(s => <button key={s} onClick={() => setSel(s)} className="p-4 bg-white border rounded-xl font-black text-left uppercase">{s}</button>)}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border shadow-lg">
          <button onClick={() => setSel(null)} className="text-blue-600 font-black mb-4 uppercase">← Back</button>
          <h2 className="text-xl font-black uppercase mb-4 underline decoration-blue-600">Report Card: {sel}</h2>
          {results.filter(r => r.name === sel).map(r => (
            <div key={r.id} className="py-3 border-b flex justify-between">
              <div><p className="font-black text-xs uppercase">{r.exam}</p><p className="text-[10px] text-slate-400">{r.date}</p></div>
              <p className="font-black text-blue-700">{r.percent}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StudentNameVerification = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl w-full max-w-xs text-center">
        <h3 className="font-black uppercase mb-4">Enter Your Name</h3>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border-2 rounded-xl mb-4 font-black uppercase text-center" />
        <button onClick={() => onConfirm(name)} className="w-full bg-blue-700 text-white py-3 rounded-xl font-black">START EXAM</button>
      </div>
    </div>
  );
};

const TeacherPinPortal = ({ correctPin, onAuthSuccess }) => {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="max-w-xs mx-auto mt-20 p-8 bg-white rounded-3xl border shadow-xl text-center">
      <h2 className="font-black uppercase mb-6">Teacher Access</h2>
      <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full p-3 border rounded-xl mb-4 text-center tracking-widest" placeholder="PIN" />
      {err && <p className="text-red-500 text-[10px] font-black uppercase mb-2">{err}</p>}
      <button onClick={() => { if(pin === correctPin) onAuthSuccess(); else setErr("Wrong PIN"); }} className="w-full bg-blue-700 text-white py-3 rounded-xl font-black">UNLOCK</button>
    </div>
  );
};

const ExamInterface = ({ exam, onFinish }) => {
  const [tl, setTl] = useState(exam.duration);
  const [sub, setSub] = useState(false);
  useEffect(() => {
    if (tl <= 0) { setSub(true); return; }
    const t = setInterval(() => setTl(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [tl]);
  const fmt = (s) => `${Math.floor(s/60)}:${s%60 < 10 ? '0'+(s%60) : s%60}`;

  if (sub) return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 text-center z-[1000]">
      <CheckCircle size={60} className="text-green-600 mb-4" />
      <h2 className="text-2xl font-black uppercase">Submitted Successfully!</h2>
      <button onClick={onFinish} className="mt-6 bg-blue-700 text-white px-10 py-3 rounded-xl font-black">EXIT</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-[1000]">
      <div className="bg-white p-3 flex justify-between items-center border-b-4 border-yellow-400">
        <h2 className="font-black text-xs uppercase truncate max-w-[150px]">{exam.title}</h2>
        <div className="flex items-center gap-3">
          <span className="font-black text-red-600 text-xl">{fmt(tl)}</span>
          <button onClick={() => setSub(true)} className="bg-green-600 text-white px-4 py-1 rounded font-black text-xs">FINISH</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        <div className="bg-white w-full max-w-3xl min-h-screen rounded-xl shadow-2xl p-4">
          {exam.fileUrl ? (
            exam.fileType === 'application/pdf' ? <PDFToImageDisplay fileUrl={exam.fileUrl} /> : <img src={exam.fileUrl} className="w-full h-auto" />
          ) : <p className="text-center py-20 font-black text-slate-300">Question not uploaded</p>}
        </div>
      </div>
    </div>
  );
};

export default App;
