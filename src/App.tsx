import { useState, useEffect, FormEvent } from 'react';
import { Mic, MicOff, MessageSquare, AlertCircle, RotateCcw, Volume2, Sparkles, Languages, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAura, Correction, PronunciationFeedback } from './hooks/useAura';

export default function App() {
  const {
    isConnected,
    isListening,
    corrections,
    pronunciationFeedbacks,
    error,
    startChat,
    stopChat,
    sendText,
    clearCorrections,
    clearPronunciationFeedbacks
  } = useAura();

  const [activeTab, setActiveTab] = useState<'grammar' | 'pronunciation'>('grammar');
  const [practicePhrase, setPracticePhrase] = useState('');

  const handlePracticeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!practicePhrase.trim() || !isConnected) return;
    
    sendText(`I want to practice the pronunciation of: "${practicePhrase}"`);
    setPracticePhrase('');
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-lg mx-auto bg-off-white">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-sage-600 tracking-tight">Aura</h1>
          <p className="text-sage-400 text-sm font-medium uppercase tracking-widest">English Tutor</p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2 px-3 py-1 bg-sage-100 rounded-full border border-sage-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-sage-600">LIVE</span>
          </div>
        )}
      </header>

      {/* Main Interaction Area */}
      <main className="flex-1 flex flex-col items-center justify-center space-y-12">
        <div className="relative group">
          <AnimatePresence>
            {isListening && (
              <>
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 bg-sage-300 rounded-full"
                />
                <motion.div
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                  className="absolute inset-0 bg-sage-200 rounded-full"
                />
              </>
            )}
          </AnimatePresence>

          <button
            onClick={isConnected ? stopChat : startChat}
            id="chat-trigger"
            className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-xl ${
              isConnected 
                ? 'bg-sage-100 border-4 border-sage-200 text-sage-600 hover:scale-105' 
                : 'bg-sage-400 border-4 border-sage-300 text-white hover:bg-sage-500 hover:scale-105'
            }`}
          >
            {isConnected ? (
              <div className="flex flex-col items-center">
                <MicOff className="w-12 h-12 mb-2" />
                <span className="text-sm font-bold uppercase tracking-widest">End Chat</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Mic className="w-12 h-12 mb-2" />
                <span className="text-sm font-bold uppercase tracking-widest">Start Chat</span>
              </div>
            )}
          </button>
        </div>

        <p className="text-sage-500 font-medium text-center max-w-[280px]">
          {error ? (
            <span className="text-red-500 flex items-center justify-center gap-2 text-sm leading-tight">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </span>
          ) : isConnected ? (
            "Speak naturally. I'm listening to help you improve."
          ) : (
            "Tap the button to start your conversation practice."
          )}
        </p>
      </main>

      {/* Logs Section */}
      <section className="mt-8 flex flex-col h-[400px]">
        {/* Tabs and Actions */}
        <div className="flex items-center gap-2 mb-4 p-1 bg-sage-100 rounded-2xl">
          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'grammar' ? 'bg-white text-sage-600 shadow-sm' : 'text-sage-400'
            }`}
          >
            <Languages className="w-4 h-4" /> Grammar
          </button>
          <button
            onClick={() => setActiveTab('pronunciation')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'pronunciation' ? 'bg-white text-sage-600 shadow-sm' : 'text-sage-400'
            }`}
          >
            <Volume2 className="w-4 h-4" /> Pronunciation
          </button>
          
          <button
            onClick={activeTab === 'grammar' ? clearCorrections : clearPronunciationFeedbacks}
            title="Clear History"
            className="p-2.5 text-sage-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'grammar' ? (
              <motion.div
                key="grammar-list"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                {corrections.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-sage-300 border-2 border-dashed border-sage-100 rounded-3xl">
                    <RotateCcw className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm italic">No grammar tips yet!</p>
                  </div>
                ) : (
                  corrections.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-5 rounded-3xl shadow-sm border border-sage-100"
                    >
                      <span className="text-[10px] font-bold text-red-300 uppercase tracking-widest block mb-1">Mistake</span>
                      <p className="text-sage-600 line-through decoration-red-200 decoration-2 mb-3">{item.mistake}</p>
                      <div className="pt-3 border-t border-sage-50">
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest block mb-1">Suggested</span>
                        <p className="text-sage-600 font-medium">{item.correction}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="pronunciation-list"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {/* Practice Input Field */}
                <form 
                  onSubmit={handlePracticeSubmit}
                  className="bg-white p-4 rounded-3xl shadow-sm border border-sage-100 flex gap-2"
                >
                  <input
                    type="text"
                    value={practicePhrase}
                    onChange={(e) => setPracticePhrase(e.target.value)}
                    placeholder="Type a word to practice..."
                    disabled={!isConnected}
                    className="flex-1 bg-sage-50 rounded-2xl px-4 py-2 text-sm text-sage-600 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-200 transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!isConnected || !practicePhrase.trim()}
                    className="bg-sage-400 text-white p-2 rounded-2xl hover:bg-sage-500 disabled:opacity-50 transition-all shadow-md"
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                </form>

                {pronunciationFeedbacks.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-sage-300 border-2 border-dashed border-sage-100 rounded-3xl">
                    <Sparkles className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm italic px-4 text-center">Ask me "How do I pronounce..." to get feedback!</p>
                  </div>
                ) : (
                  pronunciationFeedbacks.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-5 rounded-3xl shadow-sm border border-sage-100"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-sage-400 uppercase tracking-widest block mb-1">Phrase</span>
                          <p className="text-sage-600 font-semibold text-lg leading-tight">{item.phrase}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-sage-400 uppercase tracking-widest block mb-1">Score</span>
                          <div className={`text-lg font-black ${
                            item.accuracyScore > 80 ? 'text-green-500' : 
                            item.accuracyScore > 50 ? 'text-yellow-500' : 'text-red-400'
                          }`}>
                            {item.accuracyScore}%
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-sage-50 bg-sage-50/30 p-3 rounded-2xl">
                        <span className="text-[10px] font-bold text-sage-400 uppercase tracking-widest block mb-1">Feedback</span>
                        <p className="text-sage-600 text-sm italic">"{item.feedback}"</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e1e9e0;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
