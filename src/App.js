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
    const [practiceSets, setPracticeSets] = useState([]);
    const [students, setStudents] = useState([]);
    const [studentResults, setStudentResults] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [examStartTime, setExamStartTime] = useState(null);

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
                   {/* --- BRAND HEADER --- */}
        <header className="fixed top-0 left-0 w-full z-50 h-[55px] bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-center overflow-hidden">
            <div className="relative">
                <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-[length:200%_auto] animate-pulse">
                    Math Excellence
                </h1>
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
            <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)} 
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 relative group ${
                    activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)] scale-105' 
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
            >
                {/* আইকন এনিমেশন - ঠিক আগের মতোই মারাত্মক থাকবে */}
                <span className={`transition-all duration-500 ease-in-out ${
                    activeTab === item.id 
                    ? 'scale-110 animate-bounce' 
                    : 'group-hover:rotate-[360deg] group-hover:scale-110'
                }`}>
                    {item.icon}
                </span>
                
                {/* টেক্সট সাইজ একটু কমিয়ে স্লাইম করা হয়েছে */}
                <span className={`text-[9px] font-black uppercase italic tracking-tighter transition-all duration-300 ${
                    activeTab === item.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                }`}>
                    {item.label}
                </span>

                {/* এক্টিভ ইন্ডিকেটর - ছোট বিন্দু */}
                {activeTab === item.id && (
                    <span className="absolute bottom-0.5 w-4 h-0.5 bg-white rounded-full animate-pulse"></span>
                )}
            </button>
        ))}
    </div>
</nav>
            <main className="w-full max-w-5xl pt-36 mb-20 flex flex-col items-center">
                {activeTab === 'home' && (
                    <div className="space-y-6 animate-in fade-in w-full text-center print:hidden">
                        <div className="bg-black/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border-2 border-white/10">
                            <GraduationCap size={48} className="text-blue-400 mx-auto mb-3 animate-bounce-slow" />
                            <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tight leading-tight text-white">Elevate Your Mathematics <br /> <span className="text-blue-400 underline decoration-yellow-400 decoration-2 underline-offset-8">with Anshu Sir</span></h2>
                            <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/10 shadow-inner">
                                <p className="text-slate-400 font-bold uppercase italic text-[11px] mb-4 tracking-widest">To become a Registered Student, please contact Anshu Sir</p>
                                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                                    <a href="tel:9002892918" className="text-3xl font-black text-yellow-400 italic tracking-tighter flex items-center gap-3 drop-shadow-xl hover:scale-105 transition-transform">
                                        <Phone size={28} className="text-blue-500 animate-pulse" /> 9002892918
                                    </a>
                                    <a href="https://wa.me/919002892918" target="_blank" rel="noreferrer" className="text-3xl font-black text-green-400 italic tracking-tighter flex items-center gap-3 drop-shadow-xl hover:scale-105 transition-transform">
                                        <Send size={28} className="text-green-500" /> WhatsApp
                                    </a>
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
                            <div key={m.id} className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl shadow-xl flex flex-wrap justify-between items-center border border-white/10 gap-3">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-center flex-wrap">
                                        <h3 className="text-sm font-black uppercase italic tracking-tighter text-white break-words">{i + 1}. {m.name}</h3>
                                        <LevelBadge level={m.level} />
                                    </div>
                                    <LiveCountdown timestamp={m.timestamp} />
                                </div>
                                <button onClick={() => handleStartExamFlow(m)} className={`px-6 py-2 rounded-full font-black text-[9px] uppercase shadow-lg h-fit flex items-center gap-2 flex-shrink-0 ${m.isGuestEnabled ? 'bg-red-600 text-white' : 'bg-slate-800 text-blue-400 border border-blue-900/50'}`}>
                                    {!m.isGuestEnabled && <Lock size={12} />} {m.isGuestEnabled ? 'Attend' : 'Protected'}
                                </button>
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
                            <TeacherZoneMainView liveMocks={liveMocks} practiceSets={practiceSets} students={students} teacherPin={teacherPin} studentResults={studentResults} setTeacherPin={async (v) => await setDoc(doc(db, "settings", "adminConfig"), { pin: v }, { merge: true })} />
                        </div>
                    )
                )}
                {activeTab === 'growth' && <GrowthSectionView results={studentResults} students={students} />}
                {activeTab === 'practice' && (
                    <div className="w-full space-y-8 print:hidden">
                        {(() => {
                            const allMocks = [...practiceSets.filter(p => p.isPublished), ...shiftedLive];
                            const classes = [...new Set(allMocks.map(m => m.class || 'Other'))].sort((a, b) => parseInt(a) - parseInt(b));
                            if (allMocks.length === 0) return <p className="text-center text-slate-500 italic text-[10px]">No practice sets available.</p>;
                            return classes.map(cls => (
                                <div key={cls} className="space-y-4">
                                    <h2 className="font-black uppercase text-blue-400 border-b-2 border-blue-900/50 pb-2 text-xs flex items-center gap-2 italic tracking-widest pl-2">
                                        <BookOpen size={16} /> Class {cls}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {allMocks.filter(m => (m.class || 'Other') === cls).map((p, i) => (
                                            <div key={p.id} className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl shadow flex flex-wrap justify-between items-center border border-white/10 hover:border-blue-500/50 transition-all gap-3">
                                                <div className="flex-1 min-w-[150px]">
                                                    <div className="flex items-center flex-wrap">
                                                        <h3 className="font-bold uppercase text-xs italic text-white break-words">{i + 1}. {p.name}</h3>
                                                        <LevelBadge level={p.level} />
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase italic mt-1">Time: {p.hours || 0}h {p.minutes || 0}m</p>
                                                </div>
                                                <button onClick={() => handleStartExamFlow(p)} className={`px-6 py-2 rounded-full font-black text-[9px] uppercase shadow-md h-fit flex items-center gap-2 flex-shrink-0 ${p.isGuestEnabled ? 'bg-blue-600 text-white' : 'bg-slate-800 text-blue-400 border border-blue-900/50'}`}>
                                                    {!p.isGuestEnabled && <Lock size={12} />} {p.isGuestEnabled ? 'Start' : 'Protected'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
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
    const [expandedId, setExpandedId] = useState(null);
    const [quickAddType, setQuickAddType] = useState('live');
    const [qaName, setQaName] = useState('');
    const [qaHours, setQaHours] = useState('1');
    const [qaMinutes, setQaMinutes] = useState('0');
    const [qaLink, setQaLink] = useState('');
    const [qaKey, setQaKey] = useState('');
    const [qaMarks, setQaMarks] = useState('');
    const [qaNeg, setQaNeg] = useState('0');
    const [qaGuest, setQaGuest] = useState(false);
    const [qaClass, setQaClass] = useState('10');
    const [qaLevel, setQaLevel] = useState('Moderate');

    const updateField = async (id, type, field, value) => {
        const coll = type === 'live' ? 'liveMocks' : 'practiceSets';
        const finalVal = (field === 'isPublished' && value === true) ? { [field]: value, timestamp: Date.now() } : { [field]: value };
        await setDoc(doc(db, coll, id), finalVal, { merge: true });
    };

    const handleQuickAdd = async () => {
        if (!qaName.trim()) return alert("Exam Name Required!");
        const coll = quickAddType === 'live' ? 'liveMocks' : 'practiceSets';
        await addDoc(collection(db, coll), { name: qaName.toUpperCase(), hours: qaHours, minutes: qaMinutes, fileUrl: qaLink.trim(), answerKey: qaKey.toUpperCase(), questionMarks: qaMarks, negativeMark: qaNeg || "0", isPublished: false, isGuestEnabled: qaGuest, class: qaClass, level: qaLevel, timestamp: Date.now() });
        setQaName(''); setQaLink(''); setQaKey(''); setQaMarks(''); setQaNeg('0'); setQaGuest(false);
        alert(`Success: Added to Registry`);
    };

    const adminLive = liveMocks.filter(m => (Date.now() - (m.timestamp || 0) < 6 * 3600000)).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
    const adminShifted = [...practiceSets, ...liveMocks.filter(m => (Date.now() - (m.timestamp || 0) >= 6 * 3600000))].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

    const AdminPaperManager = ({ title, items, color }) => {
        const classes = [...new Set(items.map(m => m.class || 'Other'))].sort((a,b) => parseInt(a) - parseInt(b));
        return (
            <div className="bg-black/60 backdrop-blur-xl rounded-[2rem] shadow-2xl border-t-8 border-slate-900 mb-8 w-full overflow-hidden print:hidden border-x border-b border-white/5">
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <h3 className={`font-black uppercase text-xs italic ${color}`}>{title} Manager ({items.length})</h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto p-4 space-y-6 bg-white/5 no-scrollbar">
                    {classes.map(cls => (
                        <div key={cls} className="space-y-3">
                            <h4 className="text-[10px] font-black text-blue-400 uppercase italic border-b border-white/5 pb-1">Class {cls}</h4>
                            {items.filter(m => (m.class || 'Other') === cls).map((item, index) => (
                                <div key={item.id} className="bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden transition-all">
                                    <div onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 group">
                                        <div className="flex-1 pr-2">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isPublished ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></div>
                                                    <span className="text-xs font-black uppercase italic text-white break-words">{item.name}</span>
                                                    {item.isGuestEnabled && <span className="text-[7px] bg-green-600 px-1.5 py-0.5 rounded text-white font-black italic">GUEST ON</span>}
                                                    {item.level && <span className="text-[7px] bg-blue-900 px-1.5 py-0.5 rounded text-blue-300 font-black italic">{item.level}</span>}
                                                </div>
                                                <p className="text-[8px] font-bold text-slate-500 uppercase italic ml-5 mt-1"> Last Change: {item.timestamp ? `${new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • ${new Date(item.timestamp).toLocaleDateString('en-GB')}` : 'N/A'} </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={(e) => { e.stopPropagation(); updateField(item.id, item.source, 'isPublished', !item.isPublished); }} className={`px-4 py-1.5 rounded-full text-[8px] font-black shadow-sm ${item.isPublished ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{item.isPublished ? 'LIVE' : 'HIDDEN'}</button>
                                            <button onClick={async (e) => { e.stopPropagation(); if(window.confirm("Permanent delete?")) { await deleteDoc(doc(db, item.source === 'live' ? 'liveMocks' : 'practiceSets', item.id)); } }} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                            <ChevronRight size={18} className={`transition-transform text-slate-600 ${expandedId === item.id ? 'rotate-90 text-blue-400' : ''}`} />
                                        </div>
                                    </div>
                                    {expandedId === item.id && (
                                        <div className="p-5 border-t border-white/5 bg-black/40 space-y-4 animate-in slide-in-from-top-2">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                                <div className="flex items-center gap-2"><input type="checkbox" checked={item.isGuestEnabled} onChange={(e) => updateField(item.id, item.source, 'isGuestEnabled', e.target.checked)} className="accent-green-500 w-4 h-4" /><p className="text-[10px] font-black text-green-400 uppercase italic">Guest Mode</p></div>
                                                <div><p className="text-[8px] font-black text-blue-400 uppercase mb-1 ml-1">Class</p><select value={item.class || '10'} onChange={(e) => updateField(item.id, item.source, 'class', e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded-xl text-white text-xs font-black">{[5,6,7,8,9,10,11,12].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                                <div className="md:col-span-2">
                                                    <p className="text-[8px] font-black text-yellow-500 uppercase mb-1 ml-1">Complexity Level</p>
                                                    <select value={item.level || 'Moderate'} onChange={(e) => updateField(item.id, item.source, 'level', e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded-xl text-white text-xs font-black">
                                                        {['Easy', 'Moderate', 'Hard'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><p className="text-[8px] font-black text-slate-500 uppercase mb-1 ml-1">Exam Name</p><input type="text" defaultValue={item.name} onBlur={(e) => updateField(item.id, item.source, 'name', e.target.value.toUpperCase())} className="w-full p-2.5 rounded-xl border border-white/10 bg-black text-white text-xs font-black outline-none focus:border-blue-500" /></div>
                                                <div><p className="text-[8px] font-black text-red-500 uppercase mb-1 ml-1">Negative Marking</p><input type="number" step="0.01" defaultValue={item.negativeMark || 0} onBlur={(e) => updateField(item.id, item.source, 'negativeMark', e.target.value)} className="w-full p-2.5 rounded-xl border border-white/10 bg-black text-white text-xs font-black outline-none" /></div>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <div className="bg-black p-2.5 rounded-xl border border-white/10 shadow-sm min-w-[120px]"><p className="text-[8px] font-black text-blue-400 uppercase mb-1 ml-1">Time Limit</p><div className="flex items-center gap-1"><input type="number" defaultValue={item.hours} onBlur={(e) => updateField(item.id, item.source, 'hours', e.target.value)} className="w-10 text-center font-black bg-slate-900 rounded-lg outline-none text-white" /> <span className="font-bold text-[9px]">H</span><input type="number" defaultValue={item.minutes} onBlur={(e) => updateField(item.id, item.source, 'minutes', e.target.value)} className="w-10 text-center font-black bg-slate-900 rounded-lg outline-none text-white" /> <span className="font-bold text-[9px]">M</span></div></div>
                                                <div className="flex-1 bg-black p-2.5 rounded-xl border border-white/10 shadow-sm"><p className="text-[8px] font-black text-slate-500 uppercase mb-1 ml-1">Google Drive Link</p><input type="text" defaultValue={item.fileUrl} onBlur={(e) => updateField(item.id, item.source, 'fileUrl', e.target.value)} className="w-full p-2 rounded-lg border border-white/5 bg-black text-white text-[10px] outline-none font-bold" /></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><p className="text-[8px] font-black text-yellow-500 uppercase mb-1 ml-1 italic">Correct Answer Key</p><input type="text" defaultValue={item.answerKey} onBlur={(e) => updateField(item.id, item.source, 'answerKey', e.target.value.toUpperCase())} className="w-full p-2.5 bg-black border border-white/10 rounded-xl text-xs font-bold text-white outline-none" placeholder="e.g. A,B,W,D" /></div>
                                                <div><p className="text-[8px] font-black text-green-500 uppercase mb-1 ml-1 italic">Marks per Question</p><input type="text" defaultValue={item.questionMarks} onBlur={(e) => updateField(item.id, item.source, 'questionMarks', e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded-xl text-xs font-bold text-white outline-none" placeholder="e.g. 1,1,5,1" /></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col items-center">
            <div className="bg-slate-950/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border-t-8 border-blue-700 w-full mb-8 text-left animate-in fade-in print:hidden border-x border-b border-white/5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-[10px] uppercase flex items-center gap-2 italic text-blue-400"><Zap size={20} /> KUI GET (Quick Add)</h3>
                    <div className="flex gap-1 p-1 bg-black rounded-xl border border-white/5">
                        <button onClick={() => setQuickAddType('live')} className={`px-4 py-1.5 rounded-lg font-black text-[8px] uppercase transition-all ${quickAddType === 'live' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500'}`}>Live</button>
                        <button onClick={() => setQuickAddType('practice')} className={`px-4 py-1.5 rounded-lg font-black text-[8px] uppercase transition-all ${quickAddType === 'practice' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>Practice</button>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={qaGuest} onChange={(e) => setQaGuest(e.target.checked)} className="accent-blue-500" />
                            <p className="text-[9px] font-black text-slate-400 uppercase italic">Enable Guest Access</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-blue-400 uppercase mb-1 ml-1">Class</p>
                            <select value={qaClass} onChange={(e) => setQaClass(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded-xl text-white text-[10px] font-black outline-none">
                                {[5, 6, 7, 8, 9, 10, 11, 12].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-yellow-500 uppercase mb-1 ml-1">Level</p>
                            <select value={qaLevel} onChange={(e) => setQaLevel(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded-xl text-white text-[10px] font-black outline-none">
                                {['Easy', 'Moderate', 'Hard'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                            </select>
                        </div>
                    </div>
                    <div><p className="text-[8px] font-black text-slate-500 uppercase mb-1 ml-1 italic leading-none">Exam Name</p><input type="text" value={qaName} onChange={(e) => setQaName(e.target.value)} className="w-full p-3.5 bg-black border border-white/10 rounded-2xl text-[10px] font-black outline-none shadow-inner focus:border-blue-500 text-white transition-all uppercase" placeholder="New Slot" /></div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="bg-black p-3 rounded-2xl border border-white/10 shadow-inner min-w-[120px]"><p className="text-[8px] font-black text-blue-400 uppercase mb-1 ml-1 italic">Time Limit</p><div className="flex items-center gap-1 font-black text-[10px] text-white"><input type="number" value={qaHours} onChange={(e) => setQaHours(e.target.value)} className="w-8 text-center bg-transparent outline-none" /> <span>H</span><input type="number" value={qaMinutes} onChange={(e) => setQaMinutes(e.target.value)} className="w-8 text-center bg-transparent outline-none" /> <span>M</span></div></div>
                        <div className="flex-1 bg-black p-3 rounded-2xl border border-white/10 shadow-inner"><p className="text-[8px] font-black text-red-400 uppercase mb-1 ml-1 italic tracking-widest">Negative Mark (Ex: 0.25)</p><input type="number" step="0.01" value={qaNeg} onChange={(e) => setQaNeg(e.target.value)} className="w-full bg-transparent outline-none text-[10px] font-bold text-white" placeholder="0 for no negative" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-black p-3 rounded-2xl border border-white/10 shadow-inner"><p className="text-[9px] font-black text-blue-400 uppercase mb-1 italic">Correct Key</p><input type="text" value={qaKey} onChange={(e) => setQaKey(e.target.value)} className="w-full bg-transparent outline-none font-black text-[10px] uppercase text-white" placeholder="e.g. A,B,W,D" /></div>
                        <div className="bg-black p-3 rounded-2xl border border-white/10 shadow-inner"><p className="text-[9px] font-black text-yellow-500 uppercase mb-1 italic">Marks/Q</p><input type="text" value={qaMarks} onChange={(e) => setQaMarks(e.target.value)} className="w-full bg-transparent outline-none font-black text-[10px] text-white" placeholder="e.g. 1,1,5,1" /></div>
                    </div>
                    <div className="bg-black p-3 rounded-2xl border border-white/10 shadow-inner">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1 ml-1 italic tracking-widest">Google Drive Link</p>
                        <input type="text" value={qaLink} onChange={(e) => setQaLink(e.target.value)} className="w-full bg-transparent outline-none text-[9px] font-bold text-white" placeholder="Paste PDF/Doc Link" />
                    </div>
                    <button onClick={handleQuickAdd} className="w-full bg-blue-700 text-white py-4 rounded-[1.5rem] font-black text-[11px] uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-blue-900 hover:bg-blue-600 italic tracking-tighter"><Send size={18} /> Deploy to Registry</button>
                </div>
            </div>
            <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl flex justify-between items-center w-full mb-8 border border-white/10 shadow-sm print:hidden">
                <div className="flex gap-2">
                    {isChangingPin ? (
                        <div className="flex gap-2 animate-in slide-in-from-left-2">
                            <input type="password" value={pinVal} onChange={(e) => setPinVal(e.target.value)} className="bg-black border border-white/10 rounded-full px-4 text-xs font-black outline-none text-white w-24" placeholder="NEW" />
                            <button onClick={async () => { if (pinVal.length >= 4) { await setTeacherPin(pinVal); setIsChangingPin(false); setPinVal(''); alert("PIN UPDATED"); } }} className="bg-green-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase">Save</button>
                            <button onClick={() => setIsChangingPin(false)} className="text-slate-500 text-[8px] font-black uppercase">X</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsChangingPin(true)} className="px-5 py-2 rounded-full bg-blue-900/40 text-blue-400 text-[10px] font-black uppercase border border-blue-800/50">PIN</button>
                    )}
                    <button onClick={async () => { if (window.confirm("Clear Logs?")) { const q = query(collection(db, "logs")); const snapshot = await getDocs(q); const batch = writeBatch(db); snapshot.docs.forEach((d) => batch.delete(d.ref)); await batch.commit(); } }} className="px-5 py-2 rounded-full bg-red-900/40 text-red-400 text-[10px] font-black uppercase border border-red-800/50">Clear Activity</button>
                </div>
            </div>
            <AdminPaperManager title="Live Mock Exam" items={adminLive} color="text-red-500" />
            <AdminPaperManager title="Practice Sets" items={adminShifted} color="text-blue-400" />
            <div className="bg-black/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border-t-8 border-slate-900 w-full mb-20 text-center print:hidden border-x border-b border-white/5">
                <h3 className="font-black text-xs uppercase mb-8 flex items-center justify-center gap-3 italic text-blue-300"><Trophy size={28} className="text-yellow-500" /> Student Registry</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map((std) => (
                        <div key={std.id} className="relative group p-5 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center shadow-lg hover:bg-white/10 transition-all">
                            <button onClick={async () => await setDoc(doc(db, "students", std.id), { isAccessEnabled: std.isAccessEnabled === false ? true : false }, { merge: true })} className={`absolute top-4 right-4 p-2 rounded-full transition-all ${std.isAccessEnabled === false ? 'bg-red-900/40 text-red-500' : 'bg-green-900/40 text-green-500'}`} >
                                {std.isAccessEnabled === false ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                            <input type="text" defaultValue={std.name} onBlur={async (e) => { if (e.target.value !== std.name) await setDoc(doc(db, "students", std.id), { name: e.target.value.toUpperCase() }, { merge: true }); }} className="bg-transparent text-center text-md font-black uppercase italic tracking-tighter text-white outline-none focus:bg-white/10 rounded-lg px-2" />
                            <div className="mt-2 flex items-center gap-2 bg-blue-950 px-3 py-1 rounded-full border border-blue-900">
                                <Lock size={10} className="text-blue-400" />
                                <input type="text" defaultValue={std.studentCode} onBlur={async (e) => { if (e.target.value !== std.studentCode) await setDoc(doc(db, "students", std.id), { studentCode: e.target.value }, { merge: true }); }} className="bg-transparent text-[10px] font-black text-blue-400 uppercase tracking-widest outline-none w-20 text-center" />
                            </div>
                            <div className="mt-4 w-full px-2">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1 italic text-left">Valid Until:</p>
                                <input type="date" defaultValue={std.subscriptionEnd || ""} onChange={async (e) => await setDoc(doc(db, "students", std.id), { subscriptionEnd: e.target.value }, { merge: true })} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold text-white outline-none" />
                                <p className={`text-[9px] font-black mt-1 uppercase italic text-left ${getRemainingDays(std.subscriptionEnd) <= 5 ? 'text-red-500' : 'text-green-500'}`}> {getRemainingDays(std.subscriptionEnd)} Days Left </p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setSelectedStudent(std)} className="px-5 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm italic">Reports</button>
                                <button onClick={async (e) => { if (window.confirm(`Delete ${std.name}?`)) await deleteDoc(doc(db, "students", std.id)); }} className="p-2 bg-red-950/40 text-red-500 rounded-full border border-red-900/50 active:scale-90"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                    <button onClick={async () => { const n = prompt("Student Name:"); const c = prompt("Unique Code (Phone last 4):"); if (n) await addDoc(collection(db, "students"), { name: n.toUpperCase(), studentCode: c || "", subscriptionEnd: "2026-12-31", isAccessEnabled: true }); }} className="p-8 border-4 border-dashed border-white/10 rounded-[2.5rem] text-[12px] font-black text-slate-600 uppercase hover:text-blue-500 transition-all">+ REGISTER</button>
                </div>
            </div>
            {selectedStudent && <AdminMarksheetModal student={selectedStudent} results={studentResults} onClose={() => setSelectedStudent(null)} />}
        </div>
    );
};

const AdminMarksheetModal = ({ student, results, onClose }) => {
    const [newRes, setNewRes] = useState({ exam: "", obtained: "", total: "", date: "" });
    const [previewImg, setPreviewImg] = useState(null);
    return (
        <div className="fixed inset-0 bg-slate-950 z-[1200] p-6 overflow-y-auto animate-in slide-in-from-right-full duration-500 print:hidden text-white">
            {previewImg && <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />}
            <button onClick={onClose} className="font-black text-blue-400 mb-10 flex items-center gap-3 border-b-4 border-blue-400 w-fit uppercase text-[11px] italic tracking-tighter hover:text-blue-200 transition-all print:hidden"><ChevronLeft size={24} /> Return to Registry</button>
            <div className="bg-slate-900/60 backdrop-blur-md p-10 rounded-[3rem] border border-white/10 shadow-3xl max-w-xl mx-auto space-y-10">
                <div className="flex items-center gap-5 border-b border-white/10 pb-6"><div className="w-16 h-16 bg-blue-700 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl italic font-black text-2xl">{student?.name?.charAt(0)}</div><div><h3 className="text-3xl font-black uppercase italic tracking-tighter text-white leading-none">{student?.name}</h3><p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Performance Logs</p></div></div>
                <div className="p-8 bg-black rounded-[2.5rem] space-y-5 border border-white/10 print:hidden"><div className="grid grid-cols-1 gap-5 text-left"><input type="text" value={newRes.exam} onChange={(e) => setNewRes({ ...newRes, exam: e.target.value.toUpperCase() })} className="w-full p-4 rounded-xl border border-white/10 bg-slate-900 text-white font-black text-xs outline-none focus:border-blue-500" placeholder="Module Name" /><input type="date" value={newRes.date} onChange={(e) => setNewRes({ ...newRes, date: e.target.value })} className="w-full p-4 rounded-xl border border-white/10 bg-slate-900 text-white font-black text-xs outline-none" /><div className="flex gap-3"><input type="number" placeholder="Obt" value={newRes.obtained} onChange={(e) => setNewRes({ ...newRes, obtained: e.target.value })} className="w-1/2 p-4 rounded-xl border border-white/10 bg-slate-900 text-white font-black text-lg text-center outline-none focus:border-blue-500" /><input type="number" placeholder="Full" value={newRes.total} onChange={(e) => setNewRes({ ...newRes, total: e.target.value })} className="w-1/2 p-4 rounded-xl border border-white/10 bg-slate-900 text-white font-black text-lg text-center outline-none focus:border-blue-500" /></div></div><button onClick={async () => { if (newRes.exam && newRes.obtained && newRes.total && newRes.date) { const p = Math.round((parseFloat(newRes.obtained) / parseFloat(newRes.total)) * 100); await addDoc(collection(db, "results"), { ...newRes, name: student.name, percent: p, timestamp: Date.now() }); setNewRes({ exam: "", obtained: "", total: "", date: "" }); alert("Saved!"); } }} className="w-full py-5 bg-blue-700 text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Manual Entry</button></div>
                <div className="space-y-8 pt-8 border-t border-white/10">
                    {results.filter(r => r.name === student?.name).sort((a, b) => b.timestamp - a.timestamp).map(r => (
                        <div key={r.id} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col gap-6 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start w-full">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg bg-blue-900/40 text-blue-400 border border-blue-800/50 shadow-sm">{r.percent}%</div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="text-sm font-black uppercase italic tracking-tighter text-white leading-none break-words whitespace-normal">{r.exam}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 italic"> {r.date} • Score: {r.obtained}/{r.total} {r.timeTaken && `• Time: ${r.timeTaken}`} </p>
                                    </div>
                                </div>
                                <button onClick={async () => { if (window.confirm("Purge record?")) await deleteDoc(doc(db, "results", r.id)); }} className="text-slate-600 hover:text-red-500 active:scale-90 transition-all flex-shrink-0 print:hidden"><Trash2 size={24} /></button>
                            </div>
                            {r.details && r.details.some(d => d.pending) && (
                                <div className="bg-orange-950/30 border border-orange-900/50 rounded-[2rem] p-4 flex flex-col gap-3 shadow-inner print:hidden"><p className="text-[10px] font-black text-orange-400 uppercase italic text-center animate-pulse tracking-widest">Action Required: Written Solutions</p><div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x snap-mandatory">
                                    {r.details.filter(d => d.pending).map((pendingQ, pIdx) => {
                                        const photoList = Array.isArray(pendingQ.selected) ? pendingQ.selected : [pendingQ.selected];
                                        return photoList.map((photoUrl, imgIdx) => (
                                            <div key={`${pIdx}-${imgIdx}`} className="min-w-[200px] bg-black border border-white/10 shadow-md rounded-2xl p-4 flex flex-col items-center gap-3 snap-center"><p className="text-[9px] font-black text-slate-500 uppercase italic">Q{pendingQ.qNum} - Page {imgIdx + 1}</p><button onClick={() => setPreviewImg(photoUrl)} className="w-full py-2 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase shadow-sm">View Page</button>
                                            {imgIdx === photoList.length - 1 && (<div className="flex gap-2 w-full mt-2"><input id={`mark-input-${r.id}-${pendingQ.qNum}`} type="number" placeholder="Marks" className="w-1/2 p-2 border border-slate-700 rounded-xl text-center font-black text-[10px] outline-none focus:border-orange-500 bg-black text-white" /><button onClick={async () => { const markVal = document.getElementById(`mark-input-${r.id}-${pendingQ.qNum}`).value; if (!markVal) return alert("Enter marks!"); const updatedDetails = r.details.map(d => (d.pending && d.qNum === pendingQ.qNum) ? { ...d, status: true, mark: parseFloat(markVal), pending: false, selected: "PHOTO_DELETED" } : d); const newObt = updatedDetails.reduce((sum, d) => sum + (d.status ? d.mark : 0), 0); await setDoc(doc(db, "results", r.id), { details: updatedDetails, obtained: newObt, percent: Math.round((newObt / r.total) * 100) }, { merge: true }); alert(`Q${pendingQ.qNum} Marks Updated!`); }} className="w-1/2 py-2 bg-orange-600 text-white rounded-xl font-black text-[9px] uppercase shadow-sm">Save</button></div>)}</div>));
                                    })}</div></div>)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const InteractiveExamHall = ({ exam, onFinish, studentsList }) => {
    const recoveryKey = `exam_recovery_${exam.studentCode}_${exam.id}`;
    const timerKey = `timer_end_${exam.studentCode}_${exam.id}`;
    const [timeLeft, setTimeLeft] = useState(() => {
        const savedEnd = localStorage.getItem(timerKey);
        if (savedEnd) {
            const remaining = Math.floor((parseInt(savedEnd) - Date.now()) / 1000);
            return remaining > 0 ? remaining : 0;
        }
        const initialDuration = parseInt(exam?.duration) || 3600;
        localStorage.setItem(timerKey, (Date.now() + initialDuration * 1000).toString());
        return initialDuration;
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [answers, setAnswers] = useState(() => {
        const savedAnswers = localStorage.getItem(recoveryKey);
        return savedAnswers ? JSON.parse(savedAnswers) : {};
    });
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [scoreData, setScoreData] = useState(null);

    useEffect(() => { localStorage.setItem(recoveryKey, JSON.stringify(answers)); }, [answers, recoveryKey]);
    useEffect(() => {
        const handleBeforeUnload = (e) => { if (!isSubmitted) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isSubmitted]);

    const handleImageUpload = (qNum, file) => {
        if (exam.isGuest) return alert("Guest users cannot upload images. Only MCQ is allowed.");
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas'); const MAX_WIDTH = 800;
                canvas.width = MAX_WIDTH; canvas.height = img.height * (MAX_WIDTH / img.width);
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
                setAnswers(prev => {
                    const existingPhotos = Array.isArray(prev[qNum]) ? prev[qNum] : [];
                    return { ...prev, [qNum]: [...existingPhotos, compressedBase64] };
                });
            };
        };
    };

    const removeImage = (qNum, indexToRemove) => {
        setAnswers(prev => {
            const existingPhotos = Array.isArray(prev[qNum]) ? prev[qNum] : [];
            const updatedPhotos = existingPhotos.filter((_, idx) => idx !== indexToRemove);
            if (updatedPhotos.length === 0) { const newAnswers = { ...prev }; delete newAnswers[qNum]; return newAnswers; }
            return { ...prev, [qNum]: updatedPhotos };
        });
    };

    const handleOptionSelect = (qNum, opt) => {
        setAnswers(prev => {
            const newAnswers = { ...prev };
            if (prev[qNum] === opt) { delete newAnswers[qNum]; }
            else { newAnswers[qNum] = opt; }
            return newAnswers;
        });
    };

    const answerKeyArray = exam?.answerKey ? exam.answerKey.split(',').map(k => k.trim().toUpperCase()) : [];
    const marksArray = exam?.questionMarks ? exam.questionMarks.split(',').map(m => parseFloat(m.trim()) || 1) : [];
    const negVal = parseFloat(exam?.negativeMark) || 0;

    useEffect(() => {
        let t;
        if (!isSubmitted && timeLeft > 0) t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        else if (timeLeft <= 0 && !isSubmitted) submitExam();
        return () => clearInterval(t);
    }, [timeLeft, isSubmitted]);

    const submitExam = async () => {
        try {
            const startTimeKey = `timer_end_${exam.studentCode}_${exam.id}`;
            const savedTimerEnd = localStorage.getItem(startTimeKey);
            const startTime = savedTimerEnd ? (parseInt(savedTimerEnd) - (parseInt(exam?.duration) * 1000)) : Date.now();
            const timeDiff = Date.now() - startTime;
            const actualDiff = timeDiff > 0 ? timeDiff : 1000;
            const minutesTaken = Math.floor(actualDiff / 60000);
            const secondsTaken = Math.floor((actualDiff % 60000) / 1000);
            const timeDuration = `${minutesTaken}m ${secondsTaken}s`;

            let totalObtainedMarks = 0; let totalPossibleMarks = 0;
            const detailResults = answerKeyArray.map((key, index) => {
                const qNum = index + 1; const qMark = marksArray[index] !== undefined ? marksArray[index] : 1;
                const studentAns = answers[qNum] || 'None'; const isCorrect = studentAns === key;
                const isWrong = studentAns !== 'None' && studentAns !== key;
                totalPossibleMarks += qMark;
                if (key !== 'W') { if (isCorrect) totalObtainedMarks += qMark; else if (isWrong) totalObtainedMarks -= negVal; }
                return { qNum, selected: studentAns, correct: key, status: isCorrect, mark: qMark, type: key === 'W' ? 'written' : 'mcq', pending: key === 'W' };
            });

            const percent = totalPossibleMarks > 0 ? Math.round((totalObtainedMarks / totalPossibleMarks) * 100) : 0;
            const d = new Date(); let finalStudentName = exam.studentName.toUpperCase();
            await addDoc(collection(db, "logs"), { studentName: exam.isGuest ? `(Guest) ${finalStudentName}` : finalStudentName, examTitle: exam.name, timestamp: Date.now() });
            if (!exam.isGuest) { await addDoc(collection(db, "results"), { name: finalStudentName, exam: exam.name, percent, obtained: totalObtainedMarks, total: totalPossibleMarks, date: d.toLocaleDateString('en-GB'), timestamp: Date.now(), details: detailResults, timeTaken: timeDuration }); }
            setScoreData({ correct: totalObtainedMarks, total: totalPossibleMarks, percent, details: detailResults });
            localStorage.removeItem(recoveryKey); localStorage.removeItem(timerKey); setIsSubmitted(true);
        } catch (e) { console.error(e); setIsSubmitted(true); }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' + (s % 60) : s % 60}`;

    if (isSubmitted) return (
        <div className="fixed inset-0 bg-slate-950 z-[2000] flex flex-col items-center overflow-y-auto p-10 text-center animate-in zoom-in duration-500 text-white"><CheckCircle size={80} className="text-green-500 mb-6 animate-bounce shadow-2xl rounded-full" /><h2 className="text-3xl font-black uppercase italic mb-8 tracking-tighter leading-none">Session Completed</h2><div className="bg-slate-900 p-10 rounded-[3rem] border-4 border-slate-800 mb-10 w-full max-sm shadow-2xl text-center"><p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 opacity-60">Result Transcript</p><h3 className="text-5xl font-black text-blue-400 italic tracking-tighter leading-none">{scoreData?.correct} / {scoreData?.total}</h3>{exam.isGuest && <p className="text-orange-400 text-[10px] font-black mt-4 uppercase italic">Notice: Guest data is not saved permanentally.</p>}
    {/* --- QUICK REVIEW SECTION --- */}
<div className="mt-8 space-y-2 max-h-60 overflow-y-auto no-scrollbar border-t border-slate-800 pt-4 w-full px-2">
    <p className="text-[9px] font-black text-slate-500 uppercase italic mb-3 text-center">Quick Review:</p>
    <div className="grid grid-cols-5 gap-2">
        {scoreData?.details?.map((item, idx) => (
            <div key={idx} className={`p-2 rounded-lg border flex flex-col items-center ${item.type === 'written' ? 'bg-orange-900/20 border-orange-800 text-orange-400' : (item.status ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-400')}`}>
                <span className="text-[8px] font-black">Q{item.qNum}</span>
                {item.type === 'written' ? <Clock size={10} /> : (item.status ? <CheckCircle size={10} /> : <X size={10} />)}
            </div>
        ))}
    </div>
</div>
</div><button onClick={onFinish} className="bg-blue-700 text-white px-16 py-4 rounded-full font-black uppercase text-[12px] shadow-2xl">Close Arena</button></div>
    );

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden animate-in fade-in duration-500">
            <div className="bg-slate-900 p-2 md:p-3 flex justify-between items-center border-b-4 border-yellow-500 shadow-2xl relative z-50 text-white"><div className="flex-1 min-w-0 pr-2"><h2 className="font-black text-[10px] uppercase italic tracking-tighter leading-none truncate max-w-[150px]">{exam?.name}</h2><p className="text-[8px] md:text-[9px] text-blue-400 font-black uppercase mt-1 tracking-widest italic leading-none">{exam?.studentName} {exam.isGuest && '(GUEST)'}</p></div><div className="flex items-center gap-6"><div className="px-5 py-1.5 rounded-xl font-black text-2xl border-4 text-white border-slate-800 bg-black">{formatTime(timeLeft)}</div><button onClick={() => { if (window.confirm("SUBMIT EXAM?")) submitExam(); }} className="bg-green-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-lg">SUBMIT</button></div></div>
            <div className="flex-1 bg-slate-950 overflow-hidden relative"><iframe src={exam?.fileUrl?.replace('/view?usp=sharing', '/preview').replace('/view', '/preview')} className="w-full h-full border-none opacity-90" title="Paper" /><div className="absolute bottom-0 left-0 right-0 z-50 bg-slate-900/98 border-t-2 border-white/10 backdrop-blur-xl p-3 md:p-4 shadow-2xl"><div className="max-w-4xl mx-auto"><div className="flex items-center justify-between mb-2 px-2"><span className="text-[9px] font-black text-blue-400 uppercase italic flex items-center gap-3"><PenTool size={16} /> RESPONSE INTERFACE</span>{activeQuestion && <button onClick={() => setActiveQuestion(null)} className="text-white bg-slate-700 px-3 py-1 rounded-lg font-black text-[10px] uppercase shadow-lg">Close</button>}</div> {activeQuestion ? (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 pb-2"><p className="text-slate-400 font-black text-xs mb-4 italic uppercase">{answerKeyArray[activeQuestion - 1] === 'W' ? `Page Capturing Q${activeQuestion}:` : `Choice for Q${activeQuestion}:`}</p> {answerKeyArray[activeQuestion - 1] === 'W' ? (
                    <div className="flex flex-col items-center gap-4">{exam.isGuest ? (<div className="p-4 bg-orange-900/20 border-2 border-orange-800 rounded-2xl text-center"><AlertCircle className="text-orange-500 mx-auto mb-2" /><p className="text-[9px] font-black text-orange-200 uppercase">Guest users can't upload. Skip this question.</p></div>) : (<> <div className="flex gap-2 flex-wrap justify-center">{Array.isArray(answers[activeQuestion]) && answers[activeQuestion].map((_, i) => (<div key={i} className="relative"><div className="bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase">Page {i + 1} ✓</div><button onClick={() => removeImage(activeQuestion, i)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 shadow-lg active:scale-75 transition-all"><X size={12} /></button></div>))}</div> <div className="flex gap-4"><label className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase cursor-pointer shadow-xl flex items-center gap-2 active:scale-95 transition-all"><Camera size={16} /> {Array.isArray(answers[activeQuestion]) && answers[activeQuestion].length > 0 ? 'ADD ANOTHER' : 'CAPTURE'}<input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { handleImageUpload(activeQuestion, e.target.files[0]); e.target.value = null; }} /></label>{Array.isArray(answers[activeQuestion]) && answers[activeQuestion].length > 0 && (<button onClick={() => setActiveQuestion(null)} className="bg-green-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-xl">DONE</button>)}</div></>)}</div>
                ) : (
                    <div className="flex gap-5">{['A', 'B', 'C', 'D'].map(opt => (<button key={opt} onClick={() => handleOptionSelect(activeQuestion, opt)} className={`w-12 h-12 rounded-xl font-black text-xl flex items-center justify-center border-b-8 transition-all active:scale-90 ${answers[activeQuestion] === opt ? 'bg-blue-600 text-white border-blue-900 shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'bg-slate-800 text-slate-400 border-black hover:bg-slate-700'}`}>{opt}</button>))}</div>)}</div>
            ) : (
                <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x items-center justify-start">{answerKeyArray.map((_, index) => { const num = index + 1; return (<button key={num} onClick={() => setActiveQuestion(num)} className={`min-w-[42px] h-[42px] rounded-xl font-black text-xs flex items-center justify-center transition-all snap-center border-b-4 shadow-lg ${answers[num] ? 'bg-green-600 text-white border-green-900' : 'bg-slate-800 text-slate-500 border-black hover:bg-slate-700 hover:text-white'}`}>{num}</button>); })}</div>)}</div></div></div></div>
    );
};

const GrowthSectionView = ({ results, students }) => {
    const [sel, setSel] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [vCode, setVCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const handlePrint = () => { window.print(); };
    const handleVerify = () => {
        const student = students.find(s => s.name === sel);
        if (student && student.studentCode?.toString().trim() === vCode.trim()) { setIsVerified(true); }
        else { alert("INVALID CODE! ACCESS DENIED."); }
    };

    return (
        <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-500 text-left px-2">
            {selectedReview && <ReviewResultModal result={selectedReview} onClose={() => setSelectedReview(null)} />}
            
            {/* --- NEW NOTICE SECTION --- */}
            {!sel && (
                <div className="mb-8 p-6 bg-yellow-500/10 border-2 border-yellow-500 rounded-[2rem] text-center animate-pulse print:hidden">
                    <p className="text-yellow-400 font-black uppercase italic text-[14px] md:text-[16px] leading-tight tracking-tight">
                        This section is exclusively for registered students. <br /> 
                        To become a registered student, please contact Anshu Sir.
                    </p>
                </div>
            )}

            {!sel ? (
                <div className="grid gap-4 print:hidden">{students.map((std) => (
                    <button key={std.id} onClick={() => { setSel(std.name); setIsVerified(false); setVCode(''); }} className="w-full bg-black/60 backdrop-blur-xl p-5 rounded-[2rem] shadow-lg border border-white/10 flex justify-between items-center group active:scale-95 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-400 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all"><User size={18} /></div>
                            <span className="font-black text-white uppercase text-[14px] italic tracking-tight break-words">{std.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase italic ${getRemainingDays(std.subscriptionEnd) <= 5 ? 'bg-red-900/40 text-red-500' : 'bg-blue-950 text-blue-400'}`}> {getRemainingDays(std.subscriptionEnd)}D Left </div>
                            <ChevronRight size={24} className="text-slate-600 group-hover:text-blue-400" />
                        </div>
                    </button>
                ))}</div>
            ) : !isVerified ? (
                <div className="bg-slate-900/80 p-10 rounded-[3rem] border border-white/10 text-center animate-in zoom-in"><Lock size={48} className="text-blue-500 mx-auto mb-4" /><h3 className="font-black text-white uppercase italic mb-6">Verify Access: {sel}</h3><input type="password" value={vCode} onChange={(e) => setVCode(e.target.value)} placeholder="ENTER YOUR UNIQUE CODE" className="w-full p-4 bg-black border-2 border-slate-700 rounded-2xl text-center font-black text-white outline-none focus:border-blue-500 mb-6" /><div className="flex gap-4"><button onClick={() => setSel(null)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black uppercase text-[10px]">Back</button><button onClick={handleVerify} className="flex-1 py-4 bg-blue-700 rounded-2xl font-black uppercase text-[10px] shadow-lg">Verify</button></div></div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right-20 duration-700 print-full-report">
                    <div className="flex justify-between items-center print:hidden"><button onClick={() => setSel(null)} className="flex items-center gap-2 text-[12px] font-black text-blue-400 uppercase italic hover:underline ml-2"><ChevronLeft size={24} /> Return</button><button onClick={handlePrint} className="bg-white text-black px-5 py-2 rounded-full font-black text-[10px] uppercase flex items-center gap-2 shadow-xl"><Download size={16} /> PDF</button></div>
                    <div className="bg-black/90 rounded-[3rem] shadow-2xl overflow-hidden border-2 border-white/10 flex flex-col print-full-report">
                        <div className="bg-blue-700 p-8 text-white text-center relative overflow-hidden flex-shrink-0 print:border-b-4 print:border-blue-900">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2 leading-none break-words px-4 text-white">Performance Transcript</h2>
                            <div className="inline-block bg-white/20 px-6 py-1.5 rounded-full border border-white/30 max-w-[90%] overflow-hidden"><p className="text-sm font-black uppercase italic break-words text-white">{sel}</p></div>
                            <p className="mt-3 text-[10px] font-black uppercase italic text-yellow-300 tracking-widest text-center"> Valid Remaining: {getRemainingDays(students.find(s => s.name === sel)?.subscriptionEnd)} Days </p>
                        </div>
                        <div className="p-4 md:p-6 space-y-4 bg-white/5 print:bg-white print:overflow-visible h-auto">
                            {(() => {
                                const studentResults = results.filter(r => r.name === sel).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                                const examAttemptsMap = {};
                                const resultsWithAttempts = studentResults.map(r => {
                                    examAttemptsMap[r.exam] = (examAttemptsMap[r.exam] || 0) + 1;
                                    return { ...r, attemptNo: examAttemptsMap[r.exam] };
                                });
                                return resultsWithAttempts.reverse().map((r) => {
                                    const isMultiple = studentResults.filter(sr => sr.exam === r.exam).length > 1;
                                    const hasPendingWritten = r.details && r.details.some(d => d.type === 'written' && d.pending === true);
                                    return (
                                        <div key={r.id} className="w-full bg-slate-900/60 rounded-[2rem] border border-white/10 shadow-sm flex items-center p-4 md:p-5 gap-3 md:gap-6 hover:shadow-md transition-all group print-card">
                                            <div className="flex-1 min-w-0 border-l-4 md:border-l-8 border-blue-600 pl-3 md:pl-5"><p className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Exam Unit {isMultiple && <span className="text-yellow-500 ml-2">| ATTEMPT {r.attemptNo}</span>}</p><p className="text-xs md:text-lg font-black uppercase italic text-white leading-tight whitespace-normal break-words">{r.exam}</p> {hasPendingWritten && <p className="text-[7px] md:text-[8px] font-black text-orange-400 uppercase italic mt-0.5 animate-pulse">Score may increase after Anshu Sir's review</p>} <p className="text-[8px] md:text-[9px] font-black text-blue-400 uppercase italic mt-1">{new Date(r.timestamp).toLocaleDateString('en-GB')} • {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                                            <div className="text-center px-2 md:px-4 border-l border-white/10 min-w-[70px] md:min-w-[100px]"> <p className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase mb-0.5">Score</p> <p className="text-xl md:text-3xl font-black italic text-blue-400 leading-none">{r.obtained}/{r.total}</p> {r.timeTaken && <p className="text-[9px] font-black text-yellow-500 uppercase italic mt-1 border-t border-white/5 pt-1">Time: {r.timeTaken}</p>} </div>
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
