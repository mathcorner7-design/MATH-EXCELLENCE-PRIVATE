import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDocs, writeBatch, getDoc } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { Trophy, BookOpen, TrendingUp, User, Clock, ChevronRight, GraduationCap, PlusCircle, FileText, Lock, Award, Timer, Settings2, CheckCircle, PenTool, ShieldAlert, Loader2, ChevronLeft, Trash2, UserPlus, History, UserCheck, X, CheckSquare, AlertCircle, ListChecks, Eye, Camera, Send, Link, Zap, Download, Unlock, Phone, SignalHigh, LogOut, UserX, Home, Radio } from 'lucide-react';

// --- 🖼️ CONFIGURATION ---
const APP_BACKGROUND_URL = "https://i.gifer.com/4RNk.gif";

// --- 🟢 Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCTk1csUI0HeZhZvy6dOFwmLr-YVsWPAcY",
  authDomain: "math-excellence-6d2b8.firebaseapp.com",
  projectId: "math-excellence-6d2b8",
  storageBucket: "math-excellence-6d2b8.firebasestorage.app",
  messagingSenderId: "485798196973",
  appId: "1:485798196973:web:4583be003937001685bee4",
  measurementId: "G-BVR2P0EMPN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// --- Helper Functions ---
const getRemainingDays = (expiryDate) => {
  if (!expiryDate) return 0;
  const diff = new Date(expiryDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// --- 🔵 Countdown Component ---
const LiveCountdown = ({ timestamp, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = (timestamp + 6 * 3600000) - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft("00h 00m 00s");
        onExpire && onExpire();
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}h ${m < 10 ? '0' + m : m}m ${s < 10 ? '0' + s : s}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timestamp, onExpire]);
  return <p className="text-[9px] font-black text-yellow-400 uppercase italic mt-1 animate-pulse">Ends in: {timeLeft}</p>;
};

const ImagePreviewModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 bg-black/95 z-[3000] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in print:hidden">
      <button onClick={onClose} className="absolute top-10 right-10 text-white p-3 bg-red-600 rounded-full shadow-2xl"><X size={32} /></button>
      <img src={src} alt="Student Solution" className="max-w-full max-h-[80vh] rounded-xl shadow-2xl border-4 border-white animate-in zoom-in" />
    </div>
  );
};

const ReviewResultModal = ({ result, onClose }) => {
  if (!result) return null;
  return (
    <div className="fixed inset-0 bg-slate-950 z-[2500] flex flex-col items-center overflow-y-auto p-10 text-center animate-in zoom-in duration-300 print:hidden text-white">
      <div className="w-full max-w-lg flex justify-between items-center mb-10 border-b-4 border-slate-800 pb-5">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-blue-400">Review: {result.exam}</h2>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-red-900 transition-all text-white"><X size={28} /></button>
      </div>
      <div className="w-full max-w-lg space-y-3 mb-14 text-left">
        {result.details && result.details.map((item, idx) => {
          const isCorrect = item.type === 'written' ? item.mark > 0 : item.status;
          return (
            <div key={idx} className={`p-4 rounded-2xl border-2 flex justify-between items-center transition-all ${item.pending ? 'bg-orange-900/40 border-orange-700 text-orange-200' : (isCorrect ? 'bg-green-900/40 border-green-700 text-green-200 shadow-sm' : 'bg-red-900/40 border-red-700 text-red-200 shadow-sm')}`}>
              <div>
                <p className="font-black text-xs uppercase italic tracking-tighter">Question Q{item.qNum} <span className="text-[9px] opacity-60 ml-1">({item.mark} Marks)</span></p>
                <p className="text-[10px] font-bold opacity-80 mt-1 uppercase italic"> Choice: {Array.isArray(item.selected) ? `IMAGE (${item.selected.length} Pgs)` : (item.selected?.startsWith('data:image') ? 'IMAGE' : item.selected)} • Correct: {item.correct} {item.pending && <span className="ml-2 bg-orange-600 px-2 py-0.5 rounded text-[8px] text-white">U GET: PENDING</span>} </p>
              </div>
              {item.pending ? <Clock size={18} className="animate-pulse" /> : (isCorrect ? <CheckSquare size={18} /> : <AlertCircle size={18} />)}
            </div>
          );
        })}
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
  const [teacherPin, setTeacherPin] = useState('');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [liveMocks, setLiveMocks] = useState([]);
  const [qaStatus, setQaStatus] = useState('public');
  const [qaChapter, setQaChapter] = useState('');
  const [practiceSets, setPracticeSets] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [examStartTime, setExamStartTime] = useState(null);
  const [openClass, setOpenClass] = useState(null);
  const [ads, setAds] = useState([]);
  useEffect(() => {
    const fetchPin = async () => {
      try {
        const docRef = doc(db, 'settings', 'adminConfig');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTeacherPin(docSnap.data().pin);
        }
      } catch (error) {
        console.error("Error fetching pin:", error);
      }
    };
    fetchPin();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    onSnapshot(collection(db, "liveMocks"), (s) => {
      const data = s.docs.map(d => ({ id: d.id, source: 'live', ...d.data() }));
      setLiveMocks(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    });
    onSnapshot(collection(db, "practiceSets"), (s) => {
      const data = s.docs.map(d => ({ id: d.id, source: 'practice', ...d.data() }));
      setPracticeSets(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    });
    onSnapshot(collection(db, "results"), (s) => setStudentResults(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, "students"), (s) => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name))));
    onSnapshot(doc(db, "settings", "adminConfig"), (d) => {
      if (d.exists()) setTeacherPin(d.data().pin);
    });
    onSnapshot(query(collection(db, "logs"), orderBy("timestamp", "desc")), (s) => setActivityLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, "advertisements"), (s) => {
  setAds(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
    return () => unsubscribeAuth();
  }, []);

  const handleStartExamFlow = (exam) => {
    const h = parseInt(exam.hours) || 0;
    const m = parseInt(exam.minutes) || 0;
    setCurrentExam({ ...exam, duration: (h * 3600) + (m * 60) || 3600 });
    setShowNameModal(true);
    setStudentNameInput('');
    setStudentCodeInput('');
  };

  const finalizeExamStart = () => {
    if (!studentNameInput.trim()) return alert("PLEASE ENTER YOUR NAME");
    const isGuestSessionEnabled = currentExam?.isGuestEnabled;
    const enteredCode = studentCodeInput.trim();
    const matchedStudent = students.find(s => s.studentCode?.toString().trim() === enteredCode);
    if (!isGuestSessionEnabled) {
      if (!enteredCode) return alert("THIS EXAM IS PROTECTED! UNIQUE CODE IS MANDATORY.");
      if (!matchedStudent) {
        alert("INVALID STUDENT CODE! PLEASE CONTACT ANSHU SIR.");
        return;
      }
      const daysLeft = getRemainingDays(matchedStudent.subscriptionEnd);
      if (matchedStudent.isAccessEnabled === false || daysLeft <= 0) {
        alert("ACCESS EXPIRED! PLEASE RENEW YOUR SUBSCRIPTION.");
        return;
      }
      setCurrentExam(prev => ({ ...prev, studentName: matchedStudent.name, studentCode: enteredCode, isGuest: false }));
    } else {
      if (enteredCode && matchedStudent) {
        setCurrentExam(prev => ({ ...prev, studentName: matchedStudent.name, studentCode: enteredCode, isGuest: false }));
      } else {
        setCurrentExam(prev => ({ ...prev, studentName: studentNameInput.trim().toUpperCase(), studentCode: enteredCode || 'GUEST', isGuest: true }));
      }
    }
    setExamStartTime(Date.now())
    setIsExamActive(true);
    setShowNameModal(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Login Failed: " + error.message);
    }
  };

  const ongoingLive = liveMocks.filter(m => m.isPublished && (Date.now() - (m.timestamp || 0) < 6 * 3600000));
  const shiftedLive = liveMocks.filter(m => m.isPublished && (Date.now() - (m.timestamp || 0) >= 6 * 3600000));

  if (isExamActive) return <InteractiveExamHall exam={currentExam} onFinish={() => setIsExamActive(false)} studentsList={students} />;

  const LevelBadge = ({ level }) => {
    if (!level) return null;
    const colors = { 'Easy': 'bg-green-900/40 text-green-400 border-green-800', 'Moderate': 'bg-yellow-900/40 text-yellow-400 border-yellow-800', 'Hard': 'bg-red-900/40 text-red-400 border-red-800' };
    return <span className={`text-[7px] px-1.5 py-0.5 rounded border font-black uppercase italic ml-2 ${colors[level] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>{level}</span>;
  };

  return (
    <div className="min-h-screen font-sans text-white select-none flex flex-col items-center overflow-x-hidden transition-all duration-700 bg-black" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(${APP_BACKGROUND_URL})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }} >
      <style>{`
        @media print {
          body { background: white !important; overflow: visible !important; }
          header, nav, .print-hide, button, .lucide { display: none !important; }
          .min-h-screen { min-height: auto !important; background: none !important; }
          main { padding: 0 !important; width: 100% !important; max-width: 100% !important; color: black !important; }
          .print-full-report { display: block !important; position: static !important; width: 100% !important; height: auto !important; overflow: visible !important; }
          .print-card { border: 2px solid #ddd !important; break-inside: avoid; page-break-inside: avoid; margin-bottom: 15px !important; color: black !important; background: white !important; }
          .text-white { color: black !important; }
        }
        main { overflow-anchor: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {showNameModal && (
        <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-6 backdrop-blur-md print:hidden">
          <div className="bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-2 border-slate-800">
            {currentExam?.isGuestEnabled ? <Unlock size={40} className="text-green-500 mx-auto mb-4" /> : <Lock size={40} className="text-blue-500 mx-auto mb-4" />}
            <h3 className="font-bold text-lg mb-2 uppercase tracking-tight italic text-white">{currentExam?.isGuestEnabled ? 'Public Entrance' : 'Student Login'}</h3>
            {currentExam?.isGuestEnabled && (
              <p className="text-[10px] font-black text-red-500 mb-6 uppercase italic leading-tight animate-pulse">
                * REGISTERED STUDENTS MUST ENTER THEIR UNIQUE CODE TO GENERATE A PERFORMANCE TRANSCRIPT IN THE GROWTH SECTION.
              </p>
            )}
            {!currentExam?.isGuestEnabled && <p className="text-[9px] text-slate-500 mb-6 uppercase">Private Exam: Code Required</p>}
            <div className="space-y-4">
              <input autoFocus type="text" value={studentNameInput} onChange={(e) => setStudentNameInput(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-700 bg-black text-white font-bold text-center outline-none focus:border-blue-500 uppercase" placeholder="NAME" />
              <input type="text" value={studentCodeInput} onChange={(e) => setStudentCodeInput(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-700 bg-black text-white font-bold text-center outline-none focus:border-blue-500" placeholder={currentExam?.isGuestEnabled ? "UNIQUE CODE (OPTIONAL)" : "ENTER UNIQUE CODE"} />
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold text-[10px] uppercase">Cancel</button>
              <button onClick={finalizeExamStart} className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-bold text-[10px] uppercase shadow-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}
      <header className="fixed top-0 left-0 w-full z-50 h-[55px] bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-center overflow-hidden">
        <div className="relative">
          <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-[length:200%_auto] animate-pulse"> Math Excellence </h1>
          <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
        </div>
      </header>
      <nav className="fixed top-[50px] left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-[600px] px-1 py-1 print:hidden">
        <div className="bg-black/70 backdrop-blur-2xl border border-white/20 rounded-[1.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex justify-between items-center p-1.5 gap-1">
          {[
            { id: 'home', label: 'Home', icon: <Home size={20} /> },
            { id: 'live', label: 'Live', icon: <Radio size={20} /> },
            { id: 'practice', label: 'Practice', icon: <BookOpen size={20} /> },
            { id: 'growth', label: 'Growth', icon: <TrendingUp size={20} /> },
            { id: 'teacher', label: 'Admin', icon: <User size={20} /> }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 relative group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)] scale-105' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} >
              <span className={`transition-all duration-500 ease-in-out ${activeTab === item.id ? 'scale-110 animate-bounce' : 'group-hover:rotate-[360deg] group-hover:scale-110'}`}> {item.icon} </span>
              <span className={`text-[9px] font-black uppercase italic tracking-tighter transition-all duration-300 ${activeTab === item.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}> {item.label} </span>
              {activeTab === item.id && (
                <span className="absolute bottom-0.5 w-4 h-0.5 bg-white rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
        </div>
      </nav>
      <main className="w-full max-w-5xl pt-36 mb-20 flex flex-col items-center">
          <div className="w-full mb-6">
    <div className="bg-gradient-to-r from-blue-900/40 to-black p-1 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="bg-black/40 backdrop-blur-xl p-6 rounded-[1.8rem] min-h-[120px] flex flex-col items-center justify-center text-center">
            {ads.length > 0 ? (
                ads.map(ad => (
                    <div key={ad.id} className="animate-in fade-in zoom-in duration-700 w-full">
                        {ad.imageUrl && <img src={ad.imageUrl} alt="Ad" className="max-h-48 mx-auto rounded-xl mb-3 shadow-lg border border-white/5" />}
                        {ad.text && <p className="text-sm font-black italic uppercase tracking-tighter text-blue-300">{ad.text}</p>}
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center opacity-40">
                    <Radio size={32} className="text-slate-500 mb-2 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest italic text-slate-500">Advertisements Coming Soon</p>
                </div>
            )}
        </div>
    </div>
</div>
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in w-full text-center print:hidden">
            <div className="bg-black/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border-2 border-white/10">
              <GraduationCap size={48} className="text-blue-400 mx-auto mb-3 animate-bounce-slow" />
              <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tight leading-tight text-white">Elevate Your Mathematics <br /> <span className="text-blue-400 underline decoration-yellow-400 decoration-2 underline-offset-8">with Anshu Sir</span></h2>
              <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/10 shadow-inner">
                <p className="text-slate-400 font-bold uppercase italic text-[11px] mb-4 tracking-widest">To become a Registered Student, please contact Anshu Sir</p>
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  <a href="tel:9002892918" className="text-3xl font-black text-yellow-400 italic tracking-tighter flex items-center gap-3 drop-shadow-xl hover:scale-105 transition-transform"> <Phone size={28} className="text-blue-500 animate-pulse" /> 9002892918 </a>
                  <a href="https://wa.me/919002892918" target="_blank" rel="noreferrer" className="text-3xl font-black text-green-400 italic tracking-tighter flex items-center gap-3 drop-shadow-xl hover:scale-105 transition-transform"> <Send size={28} className="text-green-500" /> WhatsApp </a>
                </div>
              </div>
              <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <table className="w-full text-left text-[11px] md:text-xs">
                  <thead>
                    <tr className="bg-blue-700/50 text-white uppercase italic font-black">
                      <th className="p-4 border-b border-white/10">Features</th>
                      <th className="p-4 border-b border-white/10 text-center text-slate-300">Guest Student</th>
                      <th className="p-4 border-b border-white/10 text-center text-yellow-400">Registered Student</th>
                    </tr>
                  </thead>
                  <tbody className="bg-black/40 font-bold text-slate-300">
                    <tr className="border-b border-white/5">
                      <td className="p-4 uppercase italic">Exam Access</td>
                      <td className="p-4 text-center">Limited Mock</td>
                      <td className="p-4 text-center text-green-400">Unlimited Mocks & Features</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="p-4 uppercase italic">Test Format</td>
                      <td className="p-4 text-center">Only MCQ</td>
                      <td className="p-4 text-center text-green-400">MCQ + Written Test With Review</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="p-4 uppercase italic">Performance Reports</td>
                      <td className="p-4 text-center">Only Marks And quick Review </td>
                      <td className="p-4 text-center text-green-400">Mraks With Detailed Review of All Questions And Previous Exams</td>
                    </tr>
                    <tr>
                      <td className="p-4 uppercase italic">Live Arena</td>
                      <td className="p-4 text-center text-red-500/70">No Live Mock</td>
                      <td className="p-4 text-center text-green-400">Access to Live Mocks</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-black/60 backdrop-blur-xl p-5 rounded-3xl shadow-md border border-white/10 text-left w-full">
              <h3 className="font-bold text-xs uppercase mb-3 border-b border-white/10 pb-2 flex items-center gap-2 italic text-blue-300"><History size={16} className="text-blue-400" /> Activity Stream</h3>
              <div className="space-y-3">
                {activityLogs.slice(0, 10).map(log => (
                  <div key={log.id} className="p-2.5 bg-white/5 rounded-xl flex justify-between items-center border-l-4 border-blue-600 shadow-sm transition-all hover:bg-white/10">
                    <div><p className="text-[10px] font-black uppercase text-white">{log.studentName}</p><p className="text-[8px] font-bold text-slate-400 uppercase italic">{log.examTitle} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString('en-GB')}</p></div>
                    <div className="text-right text-[7px] font-bold text-slate-500 uppercase leading-tight">RECENT <br /> ACTIVITY</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'live' && (
          <div className="space-y-4 w-full text-left print:hidden">
            <h2 className="font-bold uppercase text-blue-300 border-b border-white/10 pb-2 text-[10px] flex items-center gap-2 bg-black/40 p-2 rounded-lg backdrop-blur-md"><Clock size={14} className="text-red-500" /> Ongoing Live Mocks</h2>
            {ongoingLive.length > 0 ? ongoingLive.map((m, i) => (
  <div 
    key={m.id} 
    onClick={() => {
      const s = m.status || (m.isGuestEnabled ? 'public' : 'premium');
      if (s === 'locked') return; 
      handleStartExamFlow(m);
    }}
    className={`w-full p-6 rounded-[2rem] shadow-xl flex justify-between items-center border transition-all cursor-pointer relative overflow-hidden group 
      ${(m.status || (m.isGuestEnabled ? 'public' : 'premium')) === 'locked' ? 'bg-white/5 border-white/5 opacity-60 cursor-not-allowed' : 'bg-black/60 backdrop-blur-xl border-white/10 active:scale-95 hover:border-blue-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'}`}
  >
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">{i + 1}. {m.name}</h3>
        <LevelBadge level={m.level} />
      </div>
      <LiveCountdown timestamp={m.timestamp} />
      <p className={`text-[8px] font-black uppercase italic mt-2 tracking-widest ${
        (m.status || (m.isGuestEnabled ? 'public' : 'premium')) === 'public' ? 'text-green-500' : 
        (m.status || (m.isGuestEnabled ? 'public' : 'premium')) === 'premium' ? 'text-yellow-500' : 'text-red-500'
      }`}>
        {(m.status || (m.isGuestEnabled ? 'public' : 'premium')) === 'public' && "🌍 Public Exam"}
        {(m.status || (m.isGuestEnabled ? 'public' : 'premium')) === 'premium' && "💎 Premium Access"}
        {(m.status || (m.isGuestEnabled ? 'public' : 'premium')) === 'locked' && "🔒 Locked: Will open after specific time"}
      </p>
    </div>
    <ChevronRight size={24} className="text-white/20 group-hover:text-blue-500 transition-colors" />
  </div>
)) : <p className="text-[10px] text-slate-500 italic p-4 text-center">No active sessions at the moment.</p>}
          </div>
        )}
        {activeTab === 'teacher' && (
          !currentUser ? (
            <div className="max-w-md w-full mx-auto mt-20 p-10 bg-slate-950 backdrop-blur-xl rounded-3xl shadow-2xl text-center border-t-8 border-blue-700 border-x border-b border-white/10 print:hidden">
              <ShieldAlert size={40} className="text-blue-500 mx-auto mb-6" />
              <h3 className="font-black text-white uppercase italic mb-6">Admin Verification</h3>
              <button onClick={handleGoogleLogin} className="w-full bg-blue-700 text-white py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-3">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" /> Sign in as Admin
              </button>
            </div>
          ) : currentUser.email !== 'mathcorner7@gmail.com' ? (
            <div className="max-w-md w-full mx-auto mt-20 p-10 bg-slate-950 rounded-3xl shadow-2xl text-center border-t-8 border-red-700 border-white/10 text-white">
              <ShieldAlert size={40} className="text-red-500 mx-auto mb-6" />
              <h3 className="font-black uppercase italic mb-4">Access Denied</h3>
              <p className="text-[10px] text-slate-400 mb-6">ONLY AUTHORIZED ADMIN EMAIL CAN MANAGE DATA.</p>
              <button onClick={() => signOut(auth)} className="bg-red-700 px-6 py-2 rounded-full font-black text-[10px] uppercase">Logout</button>
            </div>
          ) : !isTeacherAuthenticated ? (
            <div className="max-w-md w-full mx-auto mt-20 p-10 bg-slate-950 backdrop-blur-xl rounded-3xl shadow-2xl text-center border-t-8 border-blue-700 border-x border-b border-white/10 print:hidden">
              <div className="flex justify-between items-center mb-6">
                <p className="text-[8px] font-black text-blue-400 uppercase italic">Logged: {currentUser.email}</p>
                <button onClick={() => signOut(auth)} className="text-red-500"><LogOut size={16}/></button>
              </div>
              <Lock size={40} className="text-blue-500 mx-auto mb-6" />
              <input type="password" autoFocus onChange={(e) => { if (e.target.value === teacherPin) setIsTeacherAuthenticated(true); }} className="w-full py-4 bg-black border-2 border-slate-800 rounded-xl text-center text-4xl font-black outline-none text-white placeholder:text-slate-800" placeholder="••••" />
            </div>
          ) : (
            <div className="w-full">
              <div className="flex justify-end p-2"><button onClick={() => signOut(auth)} className="text-[8px] font-black uppercase bg-red-950 text-red-500 px-3 py-1 rounded-full border border-red-900">Sign Out Admin</button></div>
              <TeacherZoneMainView liveMocks={liveMocks} practiceSets={practiceSets} students={students} teacherPin={teacherPin} studentResults={studentResults} ads={ads} qaStatus={qaStatus} setQaStatus={setQaStatus} qaChapter={qaChapter} setQaChapter={setQaChapter} setTeacherPin={async (v) => await setDoc(doc(db, "settings", "adminConfig"), { pin: v }, { merge: true })} />
            </div>
          )
        )}
        {activeTab === 'growth' && <GrowthSectionView results={studentResults} students={students} />}
                        {activeTab === 'practice' && (
          <div className="w-full space-y-8 print:hidden">
            {(() => {
              const allMocks = [...practiceSets.filter(p => p.isPublished), ...shiftedLive.filter(m => m.isPublished)];
              const classes = [...new Set(allMocks.map(m => m.class || 'Other'))].sort((a, b) => parseInt(a) - parseInt(b));
              if (allMocks.length === 0) return <p className="text-center text-slate-500 italic text-[10px]">No practice sets available.</p>;
              
              return classes.map(cls => {
                const isOpen = openClass === cls;
                const classExams = allMocks.filter(m => (m.class || 'Other') === cls);
                const chapters = [...new Set(classExams.map(m => m.chapter || 'GENERAL'))];

                return (
                  <div key={cls} className="space-y-4">
                    <div onClick={() => setOpenClass(isOpen ? null : cls)} className="cursor-pointer flex justify-between items-center font-black uppercase text-blue-400 border-b-2 border-blue-900/50 pb-2 text-xs italic tracking-widest pl-2" >
                      <div className="flex items-center gap-2"> <BookOpen size={16} /> Class {cls} </div>
                      <ChevronRight size={16} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </div>

                    {isOpen && (
                      <div className="space-y-8 mt-4 pl-2">
                        {chapters.map(chName => (
                          <div key={chName} className="space-y-3">
                            <h4 className="text-[10px] font-black text-purple-400 uppercase italic flex items-center gap-2 tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></div>
                              {chName}
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {classExams.filter(e => (e.chapter || 'GENERAL') === chName).map((p, i) => (
                                <div 
                                  key={p.id} 
                                  onClick={() => {
                                    const s = p.status || (p.isGuestEnabled ? 'public' : 'premium');
                                    if (s === 'locked') return; 
                                    handleStartExamFlow(p);
                                  }}
                                  className={`w-full p-5 rounded-[1.8rem] shadow-xl flex justify-between items-center border transition-all cursor-pointer relative overflow-hidden group 
                                    ${(p.status || (p.isGuestEnabled ? 'public' : 'premium')) === 'locked' ? 'bg-white/5 border-white/5 opacity-60 cursor-not-allowed' : 'bg-black/40 border-white/10 active:scale-95 shadow-lg'}`}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">{i + 1}. {p.name}</h3>
                                      <LevelBadge level={p.level} />
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Time: {p.hours || 0}h {p.minutes || 0}m</p>
                                    <p className={`text-[8px] font-black uppercase italic mt-2 tracking-widest ${
                                      (p.status || (p.isGuestEnabled ? 'public' : 'premium')) === 'public' ? 'text-green-500' : 
                                      (p.status || (p.isGuestEnabled ? 'public' : 'premium')) === 'premium' ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                      {(p.status || (p.isGuestEnabled ? 'public' : 'premium')) === 'public' && "🌍 Public"}
                                      {(p.status || (p.isGuestEnabled ? 'public' : 'premium')) === 'premium' && "💎 Premium"}
                                      {(p.status || (p.isGuestEnabled ? 'public' : 'premium')) === 'locked' && "🔒 Locked"}
                                    </p>
                                  </div>
                                  <ChevronRight size={20} className="text-white/10 group-hover:text-blue-500 transition-colors" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </main>
    </div>
  );
};
// --- Teacher Zone Main View ---
const TeacherZoneMainView = ({ liveMocks, practiceSets, students, teacherPin, setTeacherPin, studentResults, ads, qaStatus, setQaStatus, qaChapter, setQaChapter }) => {
  const [quickAddType, setQuickAddType] = useState('live');
  const [qaName, setQaName] = useState('');
  const [qaHours, setQaHours] = useState('1');
  const [qaMinutes, setQaMinutes] = useState('0');
  const [qaLink, setQaLink] = useState('');
  const [qaKey, setQaKey] = useState('');
  const [qaMarks, setQaMarks] = useState('');
  const [qaNeg, setQaNeg] = useState('0');
  const [qaClass, setQaClass] = useState('10');
  const [qaLevel, setQaLevel] = useState('Moderate');

  const updateField = async (id, type, field, value) => {
    const coll = type === 'live' ? 'liveMocks' : 'practiceSets';
    await setDoc(doc(db, coll, id), { [field]: value }, { merge: true });
  };

  const handleQuickAdd = async () => {
    if (!qaName.trim()) return alert("Exam Name Required!");
    const coll = quickAddType === 'live' ? 'liveMocks' : 'practiceSets';
    await addDoc(collection(db, coll), {
      name: qaName.toUpperCase(),
      hours: qaHours,
      minutes: qaMinutes,
      fileUrl: qaLink.trim(),
      answerKey: qaKey.toUpperCase(),
      questionMarks: qaMarks,
      negativeMark: qaNeg || "0",
      isPublished: false,
      status: qaStatus,
      chapter: qaChapter.trim().toUpperCase() || 'GENERAL',
      class: qaClass,
      level: qaLevel,
      timestamp: Date.now()
    });
    setQaName(''); setQaLink(''); setQaKey(''); setQaMarks(''); setQaChapter('');
    alert("Added Successfully!");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6 animate-in fade-in">
      <div className="bg-slate-900/60 p-6 rounded-[2rem] border border-white/10 shadow-2xl">
        <h3 className="text-blue-400 font-black uppercase italic mb-4 flex items-center gap-2"><PlusCircle size={20}/> Quick Add Exam</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={quickAddType} onChange={(e) => setQuickAddType(e.target.value)} className="p-3 bg-black border border-white/10 rounded-xl text-white text-xs font-black uppercase italic">
            <option value="live">Live Exam Arena</option>
            <option value="practice">Practice Section</option>
          </select>
          <input type="text" placeholder="EXAM NAME" value={qaName} onChange={(e) => setQaName(e.target.value)} className="p-3 bg-black border border-white/10 rounded-xl text-white text-xs font-black uppercase outline-none focus:border-blue-500" />
          <input type="text" placeholder="CHAPTER NAME (e.g. CALCULUS)" value={qaChapter} onChange={(e) => setQaChapter(e.target.value)} className="p-3 bg-black border border-white/10 rounded-xl text-white text-xs font-black uppercase outline-none focus:border-purple-500" />
          <div className="flex gap-2">
            <input type="number" placeholder="HH" value={qaHours} onChange={(e) => setQaHours(e.target.value)} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-xs text-center" />
            <input type="number" placeholder="MM" value={qaMinutes} onChange={(e) => setQaMinutes(e.target.value)} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-xs text-center" />
          </div>
          <select value={qaStatus} onChange={(e) => setQaStatus(e.target.value)} className="p-3 bg-black border border-white/10 rounded-xl text-white text-xs font-black uppercase">
            <option value="public">Public (Guest Access)</option>
            <option value="premium">Premium (Registered Only)</option>
            <option value="locked">Locked (Manual Open)</option>
          </select>
          <select value={qaClass} onChange={(e) => setQaClass(e.target.value)} className="p-3 bg-black border border-white/10 rounded-xl text-white text-xs font-black uppercase">
             {[...Array(13)].map((_, i) => <option key={i} value={i+1}>Class {i+1}</option>)}
             <option value="Other">Other</option>
          </select>
        </div>
        <button onClick={handleQuickAdd} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 p-4 rounded-xl font-black uppercase text-xs shadow-lg transition-all active:scale-95">Deploy to Registry</button>
      </div>
      <p className="text-center text-[10px] text-slate-500 font-black uppercase italic">Registry Management Mode Active</p>
    </div>
  );
};
// --- Growth Section View ---
const GrowthSectionView = ({ results, students }) => {
  const [sel, setSel] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [vCode, setVCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const handlePrint = () => { window.print(); };
  const handleVerify = () => {
    const s = students.find(x => x.name === sel);
    if (s && s.studentCode?.toString().trim() === vCode.trim()) setIsVerified(true);
    else alert("INVALID CODE!");
  };

  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-500 text-left px-2">
      {selectedReview && <ReviewResultModal result={selectedReview} onClose={() => setSelectedReview(null)} />}
      {!sel && (
        <div className="mb-8 p-6 bg-yellow-500/10 border-2 border-yellow-500 rounded-[2rem] text-center animate-pulse print:hidden">
          <p className="text-yellow-400 font-black uppercase italic text-[14px] md:text-[16px] leading-tight tracking-tight">
            This section is exclusively for registered students ,CONTACT ANSHU SIR FOR REGISTRATION.
          </p>
        </div>
      )}
      {!sel ? (
        <div className="grid gap-4 print:hidden">
          {students.map((std) => (
            <button key={std.id} onClick={() => { setSel(std.name); setIsVerified(false); setVCode(''); }} className="w-full bg-black/60 backdrop-blur-xl p-5 rounded-[2rem] shadow-lg border border-white/10 flex justify-between items-center group active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><User size={18} /></div>
                <span className="font-black text-white uppercase text-[14px] italic tracking-tight break-words">{std.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase italic ${getRemainingDays(std.subscriptionEnd) <= 5 ? 'bg-red-900/40 text-red-500' : 'bg-blue-950 text-blue-400'}`}>
                  {getRemainingDays(std.subscriptionEnd)}D Left
                </div>
                <ChevronRight size={24} className="text-slate-600 group-hover:text-blue-400" />
              </div>
            </button>
          ))}
        </div>
      ) : !isVerified ? (
        <div className="bg-slate-900/80 p-10 rounded-[3rem] border border-white/10 text-center animate-in zoom-in">
          <Lock size={48} className="text-blue-500 mx-auto mb-4" />
          <h3 className="font-black text-white uppercase italic mb-6">Verify Access: {sel}</h3>
          <input type="password" value={vCode} onChange={(e) => setVCode(e.target.value)} placeholder="ENTER UNIQUE CODE" className="w-full p-4 bg-black border-2 border-slate-700 rounded-2xl text-center font-black text-white outline-none focus:border-blue-500 mb-6" />
          <div className="flex gap-4">
            <button onClick={() => setSel(null)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black uppercase text-[10px]">Back</button>
            <button onClick={handleVerify} className="flex-1 py-4 bg-blue-700 rounded-2xl font-black uppercase text-[10px] shadow-lg">Verify</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-20 duration-700 print-full-report">
          <div className="flex justify-between items-center print:hidden">
            <button onClick={() => setSel(null)} className="flex items-center gap-2 text-[12px] font-black text-blue-400 uppercase italic hover:underline ml-2"><ChevronLeft size={24} /> Return</button>
            <button onClick={handlePrint} className="bg-white text-black px-5 py-2 rounded-full font-black text-[10px] uppercase flex items-center gap-2 shadow-xl"><Download size={16} /> PDF</button>
          </div>
          <div className="bg-black/90 rounded-[3rem] shadow-2xl overflow-hidden border-2 border-white/10 flex flex-col print-full-report">
            <div className="bg-blue-700 p-8 text-white text-center relative flex-shrink-0 print:border-b-4 print:border-blue-900">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2 leading-none break-words px-4 text-white">Performance Transcript</h2>
              <div className="inline-block bg-white/20 px-6 py-1.5 rounded-full border border-white/30 max-w-[90%] overflow-hidden"><p className="text-sm font-black uppercase italic break-words text-white">{sel}</p></div>
              <p className="mt-3 text-[10px] font-black uppercase italic text-yellow-300 tracking-widest text-center"> Validity Remains: {getRemainingDays(students.find(s => s.name === sel)?.subscriptionEnd)} Days </p>
            </div>
            <div className="p-4 md:p-6 space-y-4 bg-white/5 print:bg-white print:overflow-visible h-auto">
              {(() => {
                const stdRes = results.filter(r => r.name === sel).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                const attemptsMap = {};
                const resWithAttempts = stdRes.map(r => { attemptsMap[r.exam] = (attemptsMap[r.exam] || 0) + 1; return { ...r, attemptNo: attemptsMap[r.exam] }; });
                return resWithAttempts.reverse().map((r) => {
                  const isMultiple = stdRes.filter(sr => sr.exam === r.exam).length > 1;
                  const hasPending = r.details && r.details.some(d => d.type === 'written' && d.pending === true);
                  const totalObtained = (parseFloat(r.obtained) || 0) + (parseFloat(r.bonus) || 0);
                  return (
                    <div key={r.id} className="w-full bg-slate-900/60 rounded-[2rem] border border-white/10 shadow-sm flex items-center p-4 md:p-5 gap-3 md:gap-6 hover:shadow-md transition-all group print-card">
                      <div className="flex-1 min-w-0 border-l-4 md:border-l-8 border-blue-600 pl-3 md:pl-5">
                        <p className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Exam Unit {isMultiple && <span className="text-yellow-500 ml-2">| ATTEMPT {r.attemptNo}</span>}</p>
                        <p className="text-xs md:text-lg font-black uppercase italic text-white leading-tight whitespace-normal break-words">{r.exam}</p>
                        {r.bonus > 0 && <p className="text-[7px] text-green-400 font-black uppercase italic">+ Includes {r.bonus} Bonus Marks</p>}
                        {hasPending && <p className="text-[7px] md:text-[8px] font-black text-orange-400 uppercase italic mt-0.5 animate-pulse">Score may increase after sir's review</p>}
                        <p className="text-[8px] md:text-[9px] font-black text-blue-400 uppercase italic mt-1">{new Date(r.timestamp).toLocaleDateString('en-GB')} • {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-center px-2 md:px-4 border-l border-white/10 min-w-[70px] md:min-w-[100px]">
                        <p className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase mb-0.5">Score</p>
                        <p className="text-xl md:text-3xl font-black italic text-blue-400 leading-none">{totalObtained}/{r.total}</p>
                        {r.timeTaken && <p className="text-[9px] font-black text-yellow-500 uppercase italic mt-1 border-t border-white/5 pt-1">Time: {r.timeTaken}</p>}
                      </div>
                      <div className="flex-shrink-0 print:hidden"><button onClick={() => setSelectedReview(r)} className="bg-slate-800 text-blue-400 p-2 md:p-3 rounded-2xl border border-white/10 shadow-sm hover:bg-blue-600 hover:text-white transition-all"><Eye size={18} /></button></div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
