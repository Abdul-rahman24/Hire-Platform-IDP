import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiClock, FiBookOpen, FiGrid } from 'react-icons/fi';

const PREVIEW_QUESTIONS = [
  { id: 1, text: 'What is the difference between JRE, JDK, and JVM in the Java ecosystem?', options: ['JRE is the Java Runtime Environment providing execution environment', 'JDK is the Java Development Kit including JRE and compiler', 'JVM is the Java Virtual Machine that executes bytecode', 'All of the above are correct'], correct: 3 },
  { id: 2, text: 'Which of the following correctly describes autoboxing in Java?', options: ['Automatic conversion of primitive types to their wrapper classes', 'Manual conversion from wrapper class to primitive', 'A form of polymorphism in Java', 'A design pattern for boxing objects'], correct: 0 },
  { id: 3, text: 'What access modifier in Java restricts access to the current class only?', options: ['protected', 'default', 'private', 'package-private'], correct: 2 },
  { id: 4, text: 'How does Java\'s garbage collector determine if an object should be collected?', options: ['When the object has been used more than 100 times', 'When there are no more references to the object', 'When the object is older than 5 minutes', 'When the developer calls gc.collect()'], correct: 1 },
  { id: 5, text: 'What is the output of comparing two String objects with == in Java?', options: ['Always true', 'Always false', 'Depends on string pool', 'Depends on string length'], correct: 2 },
  { id: 6, text: 'Which Java keyword is used to declare a constant variable?', options: ['const', 'static', 'final', 'immutable'], correct: 2 },
];

export default function PreviewTest({ tests }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const test = tests.find(t => t.id === Number(id));

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState(new Set());
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft] = useState(test?.duration ? test.duration * 60 : 3600);

  const formatTime = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  const question = PREVIEW_QUESTIONS[currentQ];
  const total = PREVIEW_QUESTIONS.length;

  const handleSelect = (optIdx) => {
    setSelected(p => ({ ...p, [currentQ]: optIdx }));
    setAnswered(p => new Set([...p, currentQ]));
  };

  const handleNext = () => { if (currentQ < total - 1) setCurrentQ(q => q + 1); };
  const handlePrev = () => { if (currentQ > 0) setCurrentQ(q => q - 1); };
  const toggleFlag = () => setFlagged(p => { const s = new Set(p); s.has(currentQ) ? s.delete(currentQ) : s.add(currentQ); return s; });

  return (
    <div className="max-w-[1100px] mx-auto space-y-4">
      {/* Back + Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/test-configuration/details/${id}`)} className="flex items-center text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
          <FiArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Exit Preview
        </button>
        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
          <FiClock className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-amber-700">{formatTime(timeLeft)}</span>
          <span className="text-[10px] text-amber-500 font-medium">Remaining</span>
        </div>
      </div>

      {/* Instructions Banner */}
      <div className="bg-[#1D5DB8] text-white rounded-2xl px-6 py-4">
        <h1 className="font-bold text-base">{test?.name || 'Test Preview'}</h1>
        <p className="text-blue-100 text-xs mt-1">{test?.instructions || 'Read each question carefully. Select the best answer.'}</p>
        <div className="flex items-center space-x-4 mt-2 text-blue-200 text-xs">
          <span><FiBookOpen className="inline mr-1 w-3 h-3" />{total} Questions</span>
          <span><FiClock className="inline mr-1 w-3 h-3" />{test?.duration} Minutes</span>
          <span className="px-2 py-0.5 bg-white/10 rounded-full">{test?.difficulty}</span>
          <span className="bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold">READ ONLY PREVIEW</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_220px] gap-4">
        {/* Main Question Area */}
        <div className="space-y-4">
          {/* Question */}
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6"
          >
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question {currentQ + 1} of {total}</span>
                <span className="px-2 py-0.5 bg-[#1D5DB8]/10 text-[#1D5DB8] text-[10px] font-bold rounded-full">+5 marks</span>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full">-1.25 negative</span>
              </div>
              <button onClick={toggleFlag} className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${flagged.has(currentQ) ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100'}`}>
                {flagged.has(currentQ) ? '🚩 Flagged' : '🏳 Flag'}
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-6">{question.text}</p>
            <div className="space-y-3">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full flex items-center p-3.5 rounded-xl border text-left text-sm font-medium transition-all ${selected[currentQ] === i ? 'border-[#1D5DB8] bg-[#1D5DB8]/5 text-slate-800' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mr-3 flex-shrink-0 ${selected[currentQ] === i ? 'bg-[#1D5DB8] text-white' : 'bg-slate-100 text-slate-500'}`}>{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button onClick={handlePrev} disabled={currentQ === 0} className="flex items-center px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50 disabled:opacity-40 transition-colors">
              <FiArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Previous
            </button>
            <span className="text-xs text-slate-400 font-medium">{answered.size} of {total} answered</span>
            <button onClick={handleNext} disabled={currentQ === total - 1} className="flex items-center px-4 py-2 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] disabled:opacity-40 transition-colors">
              Next <FiArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>

        {/* Question Palette */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4">
          <div className="flex items-center mb-3">
            <FiGrid className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <h3 className="text-xs font-bold text-slate-700">Question Palette</h3>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {PREVIEW_QUESTIONS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`w-full aspect-square rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${i === currentQ ? 'bg-[#1D5DB8] text-white' : flagged.has(i) ? 'bg-amber-100 text-amber-700' : answered.has(i) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            {[
              { color: 'bg-emerald-100', label: 'Answered', count: answered.size },
              { color: 'bg-slate-100', label: 'Not Answered', count: total - answered.size },
              { color: 'bg-amber-100', label: 'Flagged', count: flagged.size },
              { color: 'bg-[#1D5DB8]', label: 'Current', count: 1 },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${item.color}`} />
                  <span className="text-slate-500 font-medium">{item.label}</span>
                </div>
                <span className="font-bold text-slate-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
