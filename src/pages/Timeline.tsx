
import React, { useMemo, useState, useEffect } from 'react';
import { JournalEntry, Circle, Insight, CircleStatus } from '../types';
import EntryCard from '../components/EntryCard';
import WeeklyReport from '../components/WeeklyReport';
import { ChevronDown, Plus, Sparkles, PenLine, Flame, X, Loader2, ArrowRight, Waves, Quote, Archive, Star, BarChart3, History } from 'lucide-react';
import { DAILY_PROMPTS } from '../constants';
import { askBelluhAboutJournal, generateRelationshipSummary, detectPatterns } from '../services/geminiService';

interface TimelineProps {
  entries: JournalEntry[];
  currentUserId: string;
  onTriggerPremium: () => void;
  activeCircleId: string;
  circles: Circle[];
  onCircleChange: (circleId: string) => void;
  onLikeEntry: (id: string) => void;
  onCompose: (prompt?: string) => void;
  onSearch?: (query: string) => void; 
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (id: string, content: string) => void;
  streak: number;
}

const Timeline: React.FC<TimelineProps> = ({ entries, currentUserId, activeCircleId, circles, onCircleChange, onLikeEntry, onCompose, onSearch: _onSearch, onDeleteEntry, onUpdateEntry, streak }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCircleMenuOpen, setIsCircleMenuOpen] = useState(false);
  const [todaysPrompt] = useState(DAILY_PROMPTS[0]); 

  const [isSearching, setIsSearching] = useState(false);
  const [searchAnswer, setSearchAnswer] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [detectedPatterns, setDetectedPatterns] = useState<Insight[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Insight | null>(null);

  const isConstellation = activeCircleId === 'constellation';
  const activeCircle = isConstellation ? null : circles.find(c => c.id === activeCircleId);
  const isArchived = activeCircle?.status === CircleStatus.Archived;

  // Run pattern detection when entries change
  useEffect(() => {
    const runDetection = async () => {
        const patterns = await detectPatterns(entries);
        setDetectedPatterns(patterns);
    };
    runDetection();
  }, [entries]);

  const hasUserPostedToday = useMemo(() => {
      const today = new Date();
      return entries.some(e => e.userId === currentUserId && e.timestamp.toDateString() === today.toDateString());
  }, [entries, currentUserId]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (searchQuery.trim() && !searchAnswer) { 
        const query = searchQuery.toLowerCase();
        result = result.filter(e => e.content.toLowerCase().includes(query) || e.authorName.toLowerCase().includes(query));
    }
    return result;
  }, [entries, searchQuery, searchAnswer]);

  const groupedItems = useMemo(() => {
    const sorted = [...filteredEntries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const items: (JournalEntry | { type: 'header', title: string } | { type: 'pattern', data: Insight })[] = [];
    let lastMonthStr = '';
    if (!searchQuery && sorted.length > 0 && !isArchived) detectedPatterns.forEach(p => items.push({ type: 'pattern', data: p }));
    sorted.forEach(entry => {
        const entryMonthStr = entry.timestamp.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (entryMonthStr !== lastMonthStr) { items.push({ type: 'header', title: entryMonthStr }); lastMonthStr = entryMonthStr; }
        items.push(entry);
    });
    return items;
  }, [filteredEntries, detectedPatterns, searchQuery, isArchived]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true); setSearchAnswer(null);
    setSummaryResult(null); // Clear previous summary when searching
    const answer = await askBelluhAboutJournal(searchQuery, entries);
    setSearchAnswer(answer); setIsSearching(false);
  };

  // handleSummarize implementation to generate relationship summary using Gemini
  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummaryResult(null);
    setSearchAnswer(null); // Clear previous search when summarizing
    const summary = await generateRelationshipSummary(entries);
    setSummaryResult(summary);
    setIsSummarizing(false);
  };

  const handleAskAboutEntry = (content: string) => {
      setSearchQuery(`Pattern for: "${content.substring(0, 30)}..."`);
      handleSearchSubmit({ preventDefault: () => {} } as any);
  };

  return (
    <div className="pb-32 pt-2 px-0 max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto min-h-screen bg-[#fcfcfc]">
       {/* Weekly Report Modal Overlay */}
       {showWeeklyReport && (
           <WeeklyReport 
             onClose={() => setShowWeeklyReport(false)} 
             onTryRitual={(prompt) => {
                 onCompose(prompt);
                 setShowWeeklyReport(false);
             }} 
             entries={entries}
           />
       )}

       <div className="sticky top-0 z-40 bg-[#fcfcfc]/90 backdrop-blur-xl border-b border-transparent">
          <div className="px-6 pt-6 pb-2 max-w-3xl mx-auto">
             <div className="flex items-center justify-between mb-8">
                <button onClick={() => setIsCircleMenuOpen(!isCircleMenuOpen)} className="flex items-center gap-2 p-2 -ml-2 rounded-xl hover:bg-slate-50 transition-colors">
                    {isArchived && <Archive size={14} className="text-slate-400"/>}
                    {isConstellation ? <Star size={14} className="text-slate-900 fill-slate-900"/> : null}
                    <h1 className="text-sm font-semibold text-slate-900 tracking-tight">{isConstellation ? "My Constellation" : activeCircle?.name}</h1>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCircleMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {!isConstellation && (
                    <div className="flex items-center gap-2">
                         <button onClick={() => setShowWeeklyReport(true)} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-full text-xs font-semibold"><BarChart3 size={14} /><span className="hidden sm:inline">Our Report</span></button>
                        <button onClick={handleSummarize} disabled={isSummarizing || isArchived} className="flex items-center gap-2 bg-transparent px-3 py-2 rounded-full text-xs font-semibold">{isSummarizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={14} className="text-belluh-400" />}<span className="hidden sm:inline">Summarize</span></button>
                    </div>
                )}
             </div>

             {/* Dropdown for Circle Selection */}
             {isCircleMenuOpen && (
                 <div className="absolute top-20 left-6 bg-white border border-slate-100 shadow-xl rounded-2xl p-2 z-50 animate-pop">
                     <button onClick={() => { onCircleChange('constellation'); setIsCircleMenuOpen(false); }} className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium ${isConstellation ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>My Constellation</button>
                     {circles.map(c => (
                         <button key={c.id} onClick={() => { onCircleChange(c.id); setIsCircleMenuOpen(false); }} className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium ${activeCircleId === c.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{c.name}</button>
                     ))}
                 </div>
             )}

             <form onSubmit={handleSearchSubmit} className={`relative bg-white rounded-3xl transition-all duration-300 flex items-center px-4 py-4 ${searchQuery ? 'shadow-2xl' : 'shadow-float'}`}>
                <div className="mr-3">{isSearching ? <Loader2 size={18} className="animate-spin text-belluh-400" /> : <Sparkles size={18} className="text-belluh-300" />}</div>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ask Belluh..." className="flex-1 bg-transparent text-[16px] focus:outline-none font-normal" />
                {searchQuery && <button type="button" onClick={() => { setSearchQuery(''); setSearchAnswer(null); setSummaryResult(null); }}><X size={16} className="text-slate-400" /></button>}
             </form>

             {/* Search Result Display */}
             {searchAnswer && <div className="mt-4 animate-slide-up bg-white rounded-3xl p-8 shadow-2xl border border-slate-50 relative overflow-hidden"><div className="absolute top-0 left-0 w-1.5 h-full bg-belluh-300"></div><p className="text-slate-800 font-serif leading-loose text-lg">{searchAnswer}</p></div>}
             
             {/* Relationship Summary Result Display */}
             {summaryResult && (
                 <div className="mt-4 animate-slide-up bg-[#f8fdff] rounded-3xl p-8 shadow-2xl border border-cyan-50 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1.5 h-full bg-[#f0addd]"></div>
                     <button onClick={() => setSummaryResult(null)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors">
                        <X size={16} />
                     </button>
                     <p className="text-slate-800 font-serif leading-loose text-lg">{summaryResult}</p>
                 </div>
             )}
          </div>
       </div>
       <div className="relative min-h-[400px]">
          <div className="absolute left-14 md:left-20 top-0 bottom-0 w-px bg-slate-100"></div>
          {!hasUserPostedToday && !isArchived && !isConstellation && (
              <div className="relative pl-20 md:pl-24 pr-6 mb-16 animate-slide-up">
                  <button onClick={() => onCompose()} className="w-full text-left group max-w-xl">
                      <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-8 relative overflow-hidden group-hover:border-belluh-100">
                          <div className="relative z-10"><span className="bg-belluh-50 text-belluh-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">Daily Ritual</span><h3 className="font-serif text-2xl text-slate-800 mb-6">{todaysPrompt}</h3><div className="flex items-center gap-3 text-sm font-bold text-slate-400"><Plus size={18} /><span>Tap to capture</span></div></div>
                      </div>
                  </button>
              </div>
          )}
          {groupedItems.map((item, index) => {
              if ('type' in item && item.type === 'header') return <div key={index} className="relative pl-20 md:pl-24 pr-6 mb-6 mt-6 animate-fade-in"><span className="text-[10px] font-bold text-slate-400 bg-[#fcfcfc] pr-2 uppercase tracking-widest">{item.title}</span></div>;
              if ('type' in item && item.type === 'pattern') return <div key={item.data.id} className="relative pl-20 md:pl-24 pr-6 mb-8 animate-pop"><div className="max-w-xl w-full rounded-[2rem] p-8 shadow-xl relative overflow-hidden bg-[#CDE9F2] text-cyan-950"><h2 className="text-2xl font-serif leading-tight">{item.data.content}</h2></div></div>;
              const entry = item as JournalEntry;
              return <div key={entry.id} className="relative pl-20 md:pl-24 pr-6 group"><EntryCard entry={entry} isCurrentUser={entry.userId === currentUserId} onLike={onLikeEntry} onAskBelluh={() => handleAskAboutEntry(entry.content)} onDelete={() => onDeleteEntry(entry.id)} onUpdate={(content) => onUpdateEntry(entry.id, content)} showContext={isConstellation} circleName={circles.find(c => c.id === entry.circleId)?.name} /></div>;
          })}
       </div>
    </div>
  );
};

export default Timeline;
