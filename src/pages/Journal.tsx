
import React, { useState, useRef } from 'react';
import { EntryType, Mood } from '../types';
import { DAILY_PROMPTS, MOOD_EMOJIS } from '../constants';
import { Mic, Image as ImageIcon, Send, X, Heart, Loader2, Music, CheckCircle2, Lock, Globe, StopCircle } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';

interface JournalProps {
  onAddEntry: (content: string, mood: Mood | undefined, type: EntryType, prompt?: string, isPrivate?: boolean, audioUrl?: string, mediaUrl?: string) => void;
  userName: string;
  partnerName: string;
  partnerHasEntry?: boolean;
  onTriggerPremium: () => void;
  initialPrompt?: string;
}

const Journal: React.FC<JournalProps> = ({ onAddEntry, userName, partnerName, partnerHasEntry = false, onTriggerPremium, initialPrompt }) => {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | undefined>(undefined);
  const [dailyPrompt] = useState(initialPrompt || DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [step, setStep] = useState<'write' | 'mood' | 'success'>('write');
  
  // Media States
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const handleNext = () => {
      if(content.trim() || hasImage || audioUrl) setStep('mood');
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Transcribe
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            if (reader.result) {
                const base64Audio = (reader.result as string).split(',')[1];
                setIsTranscribing(true);
                const text = await transcribeAudio(base64Audio, 'audio/webm');
                setContent(prev => prev + (prev ? ' ' : '') + text);
                setIsTranscribing(false);
            }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleMicClick = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  const handleImageClick = () => {
      if (hasImage) {
          setHasImage(false);
          setImagePreview(null);
      } else {
          fileInputRef.current?.click();
      }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setImagePreview(reader.result as string);
              setHasImage(true);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleDeleteAudio = () => {
      setAudioUrl(null);
      // We don't clear content as user might have edited the transcription
  }

  const handleSubmit = () => {
    if (!content.trim() && !hasImage && !audioUrl) return;
    
    // If we have audio, we treat it as Voice type unless there's an image, 
    // but the system supports mixed. We'll default to Voice if audio is present.
    let entryType = audioUrl ? EntryType.Voice : EntryType.Prompt;
    if (hasImage && !audioUrl) entryType = EntryType.Photo;
    
    // Pass imagePreview directly as the mediaUrl (it's a base64 string)
    // In a real app, you would upload this to storage and pass the URL
    // We update the call to include mediaUrl
    onAddEntry(
        content + (hasImage ? ' [Image Attached]' : ''), 
        selectedMood, 
        entryType, 
        dailyPrompt, 
        isPrivate, 
        audioUrl || undefined,
        imagePreview || undefined
    );
  };
  
  // Custom submit handler to pass the image
  const handleFinalSubmit = () => {
       onAddEntry(
           content, 
           selectedMood, 
           hasImage ? EntryType.Photo : (audioUrl ? EntryType.Voice : EntryType.Prompt), 
           dailyPrompt, 
           isPrivate, 
           audioUrl || undefined, 
           imagePreview || undefined
       );
       
       setStep('success');
  };

  return (
    <div className="pb-32 pt-16 px-6 max-w-xl mx-auto h-full flex flex-col relative overflow-hidden">
      <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileSelect}
      />
      
      {/* Dynamic Background */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-belluh-300/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Success State */}
      {step === 'success' ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-scale-in">
           <div className="relative mb-8">
              <div className="w-24 h-24 bg-belluh-50 rounded-full flex items-center justify-center animate-pulse-slow">
                 <CheckCircle2 size={40} className="text-belluh-400" />
              </div>
              <div className="absolute inset-0 border-4 border-belluh-100 rounded-full animate-ping opacity-20"></div>
           </div>
           <h2 className="text-3xl font-serif text-slate-900 mb-3 text-center">Moment Captured</h2>
           <p className="text-slate-500 text-sm font-medium tracking-wide text-center max-w-xs leading-relaxed">
               {!isPrivate 
                 ? `Belluh will remind ${partnerName} about this tonight to make them smile.`
                 : "Saved to your private vault."}
           </p>
        </div>
      ) : (
        <>
            {/* Input Card */}
            <div className="relative flex-1 flex flex-col">
                {/* Step 1: Write */}
                <div className={`transition-all duration-500 flex-1 flex flex-col ${step === 'write' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none absolute inset-0'}`}>
                    
                    <div className="mb-8 mt-4">
                        <p className="text-xs font-bold text-belluh-400 uppercase tracking-widest mb-3">Daily Ritual</p>
                        <p className="text-2xl text-slate-800 font-serif leading-tight">{dailyPrompt}</p>
                    </div>

                    {/* Media Previews */}
                    <div className="space-y-4 mb-4">
                        {hasImage && imagePreview && (
                            <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-sm animate-scale-in group">
                                <img src={imagePreview} alt="Attached" className="w-full h-full object-cover" />
                                <button onClick={handleImageClick} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                        
                        {audioUrl && !isRecording && (
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-slide-up">
                                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white">
                                    <Mic size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-slate-900 mb-0.5">Voice Note Recorded</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Attached to entry</div>
                                </div>
                                <button onClick={handleDeleteAudio} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={isTranscribing ? "Transcribing your voice..." : "Start typing..."}
                        className="w-full bg-transparent text-slate-800 placeholder:text-slate-300 focus:outline-none resize-none font-serif text-xl leading-relaxed flex-1"
                        autoFocus
                        disabled={isTranscribing}
                    />
                    
                    {isTranscribing && (
                        <div className="flex items-center gap-2 text-belluh-500 text-sm font-medium mb-4 animate-pulse">
                            <Loader2 size={16} className="animate-spin" />
                            <span>Transcribing...</span>
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="mt-auto pt-6 flex items-center justify-between">
                        <div className="flex gap-2">
                             <button 
                                onClick={handleMicClick}
                                className={`h-12 px-5 rounded-full flex items-center gap-2 transition-all duration-300 ${isRecording ? 'bg-red-50 text-red-500 ring-2 ring-red-100 w-32 justify-center' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                            >
                                {isRecording ? (
                                    <>
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-xs font-bold">Stop</span>
                                    </>
                                ) : (
                                    <Mic size={18} />
                                )}
                            </button>
                            {!isRecording && (
                                <button 
                                    onClick={handleImageClick}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${hasImage ? 'bg-belluh-50 text-belluh-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <ImageIcon size={18} />
                                </button>
                            )}
                        </div>
                        
                        {(content.trim() || hasImage || audioUrl) && !isRecording && (
                            <button 
                                onClick={handleNext}
                                disabled={isTranscribing}
                                className="h-12 px-8 bg-slate-900 text-white rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 disabled:opacity-50"
                            >
                                <span>Next</span>
                                <Send size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Step 2: Mood & Details */}
                <div className={`transition-all duration-500 flex flex-col h-full ${step === 'mood' ? 'opacity-100 scale-100 z-10' : 'opacity-0 translate-x-10 pointer-events-none absolute inset-0'}`}>
                     <div className="flex justify-between items-center mb-10">
                        <h3 className="text-slate-800 font-serif text-2xl">How did this feel?</h3>
                        <button onClick={() => setStep('write')} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Back</button>
                     </div>
                     
                     <div className="grid grid-cols-4 gap-4 mb-auto">
                        {Object.values(Mood).map((m) => (
                            <button
                            key={m}
                            onClick={() => setSelectedMood(m)}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${
                                selectedMood === m 
                                ? 'bg-white shadow-apple ring-2 ring-belluh-300 scale-110' 
                                : 'bg-slate-50/50 hover:bg-white hover:shadow-sm opacity-60 hover:opacity-100'
                            }`}
                            >
                            <span className="text-3xl mb-1">{MOOD_EMOJIS[m]}</span>
                            </button>
                        ))}
                     </div>

                     <div className="space-y-4 mb-8">
                         <div className="bg-slate-50 p-1.5 rounded-xl flex">
                             <button 
                                onClick={() => setIsPrivate(false)}
                                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${!isPrivate ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                             >
                                 <Globe size={14} />
                                 Share w/ {partnerName}
                             </button>
                             <button 
                                onClick={() => setIsPrivate(true)}
                                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isPrivate ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                             >
                                 <Lock size={14} />
                                 Private Vault
                             </button>
                         </div>
                         
                         <button 
                            onClick={onTriggerPremium}
                            className="w-full p-4 rounded-2xl border border-dashed border-slate-200 text-slate-400 hover:text-belluh-500 hover:border-belluh-200 hover:bg-belluh-50/30 transition-all flex items-center gap-3 justify-center group"
                         >
                             <Music size={16} className="group-hover:scale-110 transition-transform" />
                             <span className="text-xs font-bold">Attach Song</span>
                             <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded ml-2">PRO</span>
                         </button>
                     </div>

                     <button 
                        onClick={handleFinalSubmit}
                        disabled={!selectedMood}
                        className={`w-full py-4 rounded-full font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                            selectedMood ? 'bg-slate-900 text-white hover:bg-black hover:scale-[1.02]' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                     >
                        <span>Save to Story</span>
                        <Send size={16} />
                     </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default Journal;
