import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { 
  Trophy, BookOpen, TrendingUp, User, Clock, ChevronRight, GraduationCap, PlusCircle, 
  FileText, Lock, Award, Timer, Settings2, CheckCircle, PenTool, ShieldAlert, 
  Loader2, ChevronLeft, Trash2, UserPlus, History, UserCheck, X, CheckSquare, AlertCircle, ListChecks
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
    setCurrentExam({ 
      ...pendingExam, 
      studentName: studentNameInput.trim(), 
      studentCode: studentCodeInput.trim() 
    });
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
              <input autoFocus type="text" value={studentNameInput} onChange={(e) => setStudentNameInput(e.target.value)} className="w-full p-3 rounded-xl border-2 font-bold text-center outline-none focus:border-blue-500 uppercase" placeholder="YOUR NAME" />
              <input type="text" value={studentCodeInput} onChange={(e) => setStudentCodeInput(e.target.value)} className="w-full p-3 rounded-xl border-2 font-bold text-center outline-none focus:border-blue-500" placeholder="4-DIGIT CODE (OPTIONAL)" />
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-[10px] uppercase">Cancel</button>
              <button onClick={finalizeExamStart} className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-bold text-[10px] uppercase shadow-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b sticky top-0 z-50 shadow-sm px-6 py-2 flex justify-between items-center w-full max-w-6xl">
        <h1 className="text-lg font-black text-blue-700 uppercase italic tracking-tighter cursor-pointer" onClick={() => setActiveTab('home')}>MATH EXCELLENCE</h1>
        <p className="text-[9px] font-bold text-slate-400 italic">ANSHU SIR'S ACADEMY</p>
      </header>

      <nav className="bg-blue-700 text-white w-full sticky top-[45px] z-40 flex justify-center shadow-lg">
        <div className="max-w-6xl w-full flex overflow-x-auto no-scrollbar">
          {[{ id: 'home', label: 'Home', icon: <History size={12}/> }, { id: 'live', label: 'Live Mock', icon: <Clock size={12}/> }, { id: 'practice', label: 'Practice', icon: <BookOpen size={12}/> }, { id: 'growth', label: 'Growth', icon: <TrendingUp size={12}/> }, { id: 'teacher', label: 'Admin', icon: <User size={12}/> }].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 font-bold text-[9px] uppercase border-b-4 transition-all ${activeTab === item.id ? 'border-yellow-400 bg-blue-800' : 'border-transparent'}`}>{item.icon} {item.label}</button>
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
              <div className="space-y-2">
                {activityLogs.slice(0, 8).map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border-l-4 border-blue-600 shadow-sm transition-all hover:bg-white">
                    <div><p className="text-[10px] font-black uppercase text-slate-800">{log.studentName}</p><p className="text-[8px] font-bold text-slate-400 uppercase italic">{log.examTitle} {log.scoreDisplay ? `• Score: ${log.scoreDisplay}` : ''}</p></div>
                    <div className="text-right text-[7px] font-bold text-slate-300 uppercase leading-tight">{log.timeDisplay} <br/> {log.dateDisplay}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* ... (Keep your Admin and Growth logic same as previous response) ... */}
      </main>
    </div>
  );
};

// --- Sub-component: 🔴 Interactive Exam Hall (সংশোধিত ডিজাইন - সরু ও বড় পিডিএফ) ---
const InteractiveExamHall = ({ exam, onFinish, studentsList }) => {
  const [timeLeft, setTimeLeft] = useState(parseInt(exam?.duration) || 3600);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [scoreData, setScoreData] = useState(null);

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
        const isCorrect = (answers[qNum] || '') === key;
        totalPossibleMarks += qMark;
        if (isCorrect) totalObtainedMarks += qMark;
        return { qNum, selected: answers[qNum] || 'None', correct: key, status: isCorrect, mark: qMark };
      });

      const percent = totalPossibleMarks > 0 ? Math.round((totalObtainedMarks / totalPossibleMarks) * 100) : 0;
      const d = new Date();
      const scoreString = `${totalObtainedMarks} / ${totalPossibleMarks}`;

      let finalStudentName = exam.studentName.toUpperCase(); 
      let isRegistered = false;
      const matchedStudent = studentsList.find(s => s.studentCode && s.studentCode.toString().trim() === exam.studentCode.toString().trim());
      if (matchedStudent) { finalStudentName = matchedStudent.name; isRegistered = true; }

      await addDoc(collection(db, "logs"), { 
        studentName: finalStudentName, examTitle: exam.name, timestamp: Date.now(), 
        timeDisplay: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateDisplay: d.toLocaleDateString('en-GB'), scoreDisplay: scoreString 
      });

      if (isRegistered) {
        await addDoc(collection(db, "results"), { 
          name: finalStudentName, exam: exam.name, percent, obtained: totalObtainedMarks, 
          total: totalPossibleMarks, date: d.toLocaleDateString('en-GB'), timestamp: Date.now() 
        });
      }
      setScoreData({ correct: totalObtainedMarks, total: totalPossibleMarks, percent, details: detailResults });
      setIsSubmitted(true);
    } catch (e) { alert("Submission error!"); setIsSubmitted(true); }
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${s%60 < 10 ? '0'+(s%60) : s%60}`;

  if (isSubmitted) return (
    <div className="fixed inset-0 bg-white z-[2000] flex flex-col items-center overflow-y-auto p-8 text-center animate-in zoom-in duration-500">
      <CheckCircle size={64} className="text-green-600 mb-6 animate-bounce" />
      <h2 className="text-2xl font-black text-slate-800 uppercase italic mb-6">Performance Report</h2>
      <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 mb-8 w-full max-w-xs shadow-inner">
         <h3 className="text-4xl font-black text-blue-700 italic tracking-tighter leading-none">{scoreData?.correct} / {scoreData?.total}</h3>
      </div>
      <button onClick={onFinish} className="bg-blue-700 text-white px-12 py-3 rounded-full font-black uppercase text-[11px] shadow-lg">Close Exam Hall</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden">
      {/* 🔴 সুপার স্লিম হেডার (সরু করা হয়েছে) */}
      <div className="bg-white p-1.5 md:p-2 flex justify-between items-center border-b-4 border-yellow-400 shadow-xl relative z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center text-white"><ShieldAlert size={16}/></div>
          <div>
            <h2 className="font-black text-slate-800 text-[10px] md:text-xs uppercase italic tracking-tighter leading-none truncate max-w-[120px]">{exam?.name}</h2>
            <p className="text-[7px] text-blue-700 font-black uppercase mt-0.5 italic">{exam?.studentName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-1 rounded-xl font-black text-xl md:text-2xl border-2 ${timeLeft < 300 ? 'text-red-600 border-red-200 animate-pulse' : 'text-slate-800 border-slate-200'}`}>{formatTime(timeLeft)}</div>
          <button onClick={() => { if(window.confirm("SUBMIT?")) submitExam(); }} className="bg-green-600 text-white px-5 py-1.5 rounded-full font-black text-[9px] uppercase shadow-lg border-b-4 border-green-800 active:border-b-0 transition-all active:scale-95">SUBMIT</button>
        </div>
      </div>

      {/* 🔴 পিডিএফ ভিউয়ার এলাকা (এখন আরও বড় জায়গা পাবে) */}
      <div className="flex-1 bg-slate-900 overflow-hidden relative">
         <iframe src={exam?.fileUrl?.replace('/view?usp=sharing', '/preview').replace('/view', '/preview')} className="w-full h-full border-none" title="PDF" />
         
         {/* 🔴 কমপ্যাক্ট ওএমআর প্যানেল (উচ্চতা কমিয়ে জায়গা বের করা হয়েছে) */}
         <div className="absolute bottom-0 left-0 right-0 z-50 bg-slate-800/98 border-t-2 border-slate-700 backdrop-blur-xl p-2 md:p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="max-w-4xl mx-auto">
               <div className="flex items-center justify-between mb-1.5 px-2">
                  <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest italic flex items-center gap-2"><PenTool size={14} className="animate-bounce"/> RESPONSE PANEL</span>
                  {activeQuestion && <button onClick={() => setActiveQuestion(null)} className="text-slate-500 font-black text-[9px] uppercase border-b border-slate-700 hover:text-white transition-all">Deselect</button>}
               </div>
               {activeQuestion ? (
                 <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 duration-300 pb-1">
                    <div className="flex gap-4">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <button key={opt} onClick={() => { setAnswers({...answers, [activeQuestion]: opt}); setActiveQuestion(null); }} className={`w-11 h-11 rounded-xl font-black text-xl flex items-center justify-center border-b-4 transition-all active:scale-90 active:border-b-0 ${answers[activeQuestion] === opt ? 'bg-blue-600 text-white border-blue-900 shadow-lg' : 'bg-slate-700 text-slate-300 border-slate-950 hover:bg-slate-600'}`}>{opt}</button>
                      ))}
                    </div>
                 </div>
               ) : (
                 <div className="flex overflow-x-auto gap-3 pb-1 no-scrollbar snap-x items-center justify-start">
                    {answerKeyArray.map((_, index) => {
                      const num = index + 1;
                      return (
                        <button key={num} onClick={() => setActiveQuestion(num)} className={`min-w-[38px] h-[38px] rounded-lg font-black text-xs flex items-center justify-center transition-all snap-center border-b-4 shadow-lg active:scale-90 ${answers[num] ? 'bg-green-600 text-white border-green-900' : 'bg-slate-700 text-slate-400 border-slate-900 hover:bg-slate-600'}`}>{num}</button>
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
