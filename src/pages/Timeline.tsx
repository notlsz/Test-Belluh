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

  useEffect(() => {
    const runDetection = async () => {
        const patterns = await detectPatterns(entries);
        setDetectedPatterns(patterns);
    };
    runDetection();
  }, [entries]);

  const hasUserPostedToday = useMemo(() => {
      const today = new Date();
      return entries.some(e => 
        e.userId === currentUserId && 
        e.timestamp.getDate() === today.getDate() &&
        e.timestamp.getMonth() === today.getMonth() &&
        e.timestamp.getFullYear() === today.getFullYear()
      );
  }, [entries, currentUserId]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (searchQuery.trim() && !searchAnswer) { 
        const query = searchQuery.toLowerCase();
        result = result.filter(e => 
            e.content.toLowerCase().includes(query) ||
            e.mood?.toLowerCase().includes(query) ||
            e.authorName.toLowerCase().includes(query)
        );
    }
    return result;
  }, [entries, searchQuery, searchAnswer]);

  const groupedItems = useMemo(() => {
    const sorted = [...filteredEntries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const items: (JournalEntry | { type: 'header', title: string } | { type: 'pattern', data: Insight })[] = [];
    const processedIds = new Set<string>();
    let lastMonthStr = '';

    if (!searchQuery && sorted.length > 0 && !isArchived) {
        detectedPatterns.forEach(p => {
            items.push({ type: 'pattern', data: p });
        });
    }

    sorted.forEach(entry => {
        if (processedIds.has(entry.id)) return;

        const entryMonthStr = entry.timestamp.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (entryMonthStr !== lastMonthStr) {
            items.push({ type: 'header', title: entryMonthStr });
            lastMonthStr = entryMonthStr;
        }

        items.push(entry);
        processedIds.add(entry.id);
    });

    return items;
  }, [filteredEntries, detectedPatterns, searchQuery, isArchived]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchAnswer(null);
    const answer = await askBelluhAboutJournal(searchQuery, entries);
    setSearchAnswer(answer);
    setIsSearching(false);
  };

  const handleClearSearch = () => {
      setSearchQuery('');
      setSearchAnswer(null);
  };

  const handleAskAboutEntry = (entryContent: string) => {
      const query = `What does this entry say about our pattern? "${entryContent.substring(0, 50)}..."`;
      setSearchQuery(query);
      setIsSearching(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      askBelluhAboutJournal(query, entries).then(answer => {
          setSearchAnswer(answer);
          setIsSearching(false);
      });
  };

  const handleSummarize = async () => {
      setIsSummarizing(true);
      const summary = generateRelationshipSummary(entries);
      setSummaryResult(await summary);
      setIsSummarizing(false);
  };

  return (
    <div className="pb-32 pt-2 px-0 max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto min-h-screen bg-[#fcfcfc] font-sans selection:bg-belluh-200">
       
       <div className="sticky top-0 z-40 bg-[#fcfcfc]/90 backdrop-blur-xl transition-all border-b border-transparent">
          <div className="px-6 pt-6 pb-2 max-w-3xl mx-auto">
             
             <div className="flex items-center justify-between mb-8">
                <div className="relative">
                    <button 
                        onClick={() => setIsCircleMenuOpen(!isCircleMenuOpen)}
                        className="flex items-center gap-2 group p-2 -ml-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        {isArchived && <Archive size={14} className="text-slate-400"/>}
                        {isConstellation ? (
                             <Star size={14} className="text-slate-900 fill-slate-900"/>
                        ) : null}
                        <h1 className="text-sm font-semibold text-slate-900 tracking-tight group-hover:text-slate-700">
                            {isConstellation ? "My Constellation" : activeCircle?.name}
                        </h1>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isCircleMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCircleMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 w-64 animate-pop z-50 origin-top-left ring-1 ring-black/5 max-h-80 overflow-y-auto">
                            <div className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-widest">Active Circles</div>
                            {circles.filter(c => c.status === CircleStatus.Active).map(c => (
                                <button key={c.id} className="w-full p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center gap-3 text-left group" onClick={() => { onCircleChange(c.id); setIsCircleMenuOpen(false); }}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${activeCircleId === c.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white border border-slate-200'}`}>
                                        {c.name[0]}
                                    </div>
                                    <span className={`font-medium text-sm ${activeCircleId === c.id ? 'text-slate-900' : 'text-slate-600'}`}>{c.name}</span>
                                    {activeCircleId === c.id && <div className="ml-auto w-1.5 h-1.5 bg-belluh-300 rounded-full"></div>}
                                </button>
                            ))}
                            {circles.some(c => c.status === CircleStatus.Archived) && (
                                <>
                                    <div className="text-[10px] font-bold text-slate-400 px-3 py-2 mt-2 uppercase tracking-widest border-t border-slate-50">Past Chapters</div>
                                    {circles.filter(c => c.status === CircleStatus.Archived).map(c => (
                                        <button key={c.id} className="w-full p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center gap-3 text-left group grayscale opacity-80" onClick={() => { onCircleChange(c.id); setIsCircleMenuOpen(false); }}>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                                {c.name[0]}
                                            </div>
                                            <span className="font-medium text-sm text-slate-500">{c.name}</span>
                                        </button>
                                    ))}
                                </>
                            )}
                            <div className="text-[10px] font-bold text-slate-400 px-3 py-2 mt-2 uppercase tracking-widest border-t border-slate-50">Universal</div>
                            <button className="w-full p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center gap-3 text-left group" onClick={() => { onCircleChange('constellation'); setIsCircleMenuOpen(false); }}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${isConstellation ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white border border-slate-200'}`}>
                                    <Star size={14} className={isConstellation ? "fill-current" : ""} />
                                </div>
                                <span className={`font-medium text-sm ${isConstellation ? 'text-slate-900' : 'text-slate-600'}`}>My Constellation</span>
                            </button>
                        </div>
                    )}
                </div>

                {!isConstellation && (
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={() => setShowWeeklyReport(true)}
                            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-2 rounded-full text-xs font-semibold transition-all active:scale-95"
                        >
                            <BarChart3 size={14} />
                            <span className="hidden sm:inline">Our Report</span>
                        </button>

                        <button 
                            onClick={handleSummarize}
                            disabled={isSummarizing || isArchived}
                            className="flex items-center gap-2 bg-transparent hover:bg-slate-100 text-slate-500 px-3 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSummarizing ? (
                                <Loader2 size={12} className="animate-spin text-belluh-400" />
                            ) : (
                                <Sparkles size={14} className="text-belluh-400" />
                            )}
                            <span className="hidden sm:inline">Summarize</span>
                        </button>
                    </div>
                )}
             </div>

             <div className="relative w-full group mb-6">
                 <form 
                    onSubmit={handleSearchSubmit} 
                    className={`relative bg-white rounded-3xl transition-all duration-300 flex items-center px-4 py-4 ${
                        isSearching || searchAnswer || searchQuery 
                        ? 'shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100 transform -translate-y-1' 
                        : 'shadow-float hover:shadow-lg border border-transparent'
                    }`}
                 >
                    <div className="mr-3">
                        {isSearching ? (
                            <Loader2 size={18} className="text-belluh-400 animate-spin" />
                        ) : (
                            <Sparkles size={18} className={`transition-colors ${searchQuery ? 'text-slate-900' : 'text-belluh-300'}`} />
                        )}
                    </div>
                    
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isArchived ? "Search past memories..." : isConstellation ? "Search across all constellations..." : "Ask Belluh about your patterns..."}
                        className="flex-1 bg-transparent text-[16px] placeholder:text-slate-400 focus:outline-none text-slate-900 font-normal"
                    />
                    
                    {searchQuery && (
                        <div className="flex items-center gap-2 pl-2">
                             <button type="button" onClick={handleClearSearch} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                                 <X size={16} />
                             </button>
                             {!isSearching && !searchAnswer && (
                                <button type="submit" className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black transition-colors shadow-sm active:scale-90">
                                    <ArrowRight size={14} />
                                </button>
                             )}
                        </div>
                    )}
                 </form>

                 {searchAnswer && (
                     <div className="mt-4 animate-slide-up pb-2">
                         <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1.5 h-full bg-belluh-300"></div>
                             <div className="flex items-start gap-4">
                                 <div className="flex-1">
                                     <div className="flex justify-between items-start mb-6">
                                         <div className="flex items-center gap-2">
                                             <div className="w-6 h-6 rounded-full bg-belluh-50 flex items-center justify-center">
                                                <Sparkles size={12} className="text-belluh-400" />
                                             </div>
                                             <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Belluh Insight</h4>
                                         </div>
                                         <button onClick={handleClearSearch} className="text-slate-300 hover:text-slate-500 transition-colors bg-slate-50 rounded-full p-2"><X size={14}/></button>
                                     </div>
                                     <p className="text-slate-800 font-serif leading-loose text-lg">{searchAnswer}</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}
             </div>
          </div>
       </div>

       {isArchived && (
           <div className="max-w-3xl mx-auto px-6 mb-8 animate-fade-in">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4 text-slate-500">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <Archive size={16} className="text-slate-500"/>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">Past Chapter</h4>
                        <p className="text-xs">This timeline is read-only. Your memories are safe here.</p>
                    </div>
                </div>
           </div>
       )}

       {showWeeklyReport && (
           <WeeklyReport 
               onClose={() => setShowWeeklyReport(false)} 
               onTryRitual={(prompt) => {
                   setShowWeeklyReport(false);
                   onCompose(prompt);
               }}
               entries={entries}
           />
       )}

       {summaryResult && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/90 backdrop-blur-xl animate-fade-in" onClick={() => setSummaryResult(null)}>
               <div className="bg-white rounded-[2rem] w-full max-w-xl mx-4 md:mx-auto shadow-2xl shadow-slate-200/50 relative animate-scale-in border border-slate-100 ring-1 ring-black/5 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                   <button onClick={() => setSummaryResult(null)} className="absolute top-4 right-4 z-20 p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors shadow-sm">
                       <X size={20} className="text-slate-400" />
                   </button>
                   
                   <div className="overflow-y-auto p-6 md:p-12 pb-48 scrollbar-hide h-full w-full">
                       <div className="text-center mb-6 mt-2">
                           <div className="w-12 h-12 md:w-16 md:h-16 bg-belluh-50 rounded-full flex items-center justify-center mb-4 mx-auto shadow-sm">
                               <Sparkles size={20} className="text-belluh-400 md:w-6 md:h-6" />
                           </div>
                           <h2 className="text-2xl md:text-3xl font-serif text-slate-900 mb-2 leading-tight">State of the Union</h2>
                           <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Analysis by Belluh</p>
                       </div>
                       
                       <div className="prose prose-slate mx-auto font-serif leading-loose text-slate-700 text-base md:text-lg">
                           <div className="whitespace-pre-wrap">{summaryResult}</div>
                       </div>
                   </div>

                   <div className="absolute bottom-0 left-0 right-0 p-6 pt-24 bg-gradient-to-t from-white via-white to-transparent flex justify-center z-10 pointer-events-none">
                        <button onClick={() => setSummaryResult(null)} className="pointer-events-auto px-8 py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg hover:shadow-xl">
                            Close Story
                        </button>
                   </div>
               </div>
           </div>
       )}
       
       {selectedPattern && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={() => setSelectedPattern(null)}>
               <div className="bg-white rounded-[2rem] w-full max-w-lg mx-4 md:mx-auto shadow-2xl overflow-hidden animate-scale-in relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setSelectedPattern(null)} 
                        className="absolute top-4 right-4 z-30 p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-slate-500 hover:text-slate-900 shadow-sm backdrop-blur-sm"
                    >
                        <X size={20} />
                    </button>

                    <div className="overflow-y-auto h-full flex flex-col">
                        <div className={`p-6 md:p-8 relative shrink-0 ${selectedPattern.type === 'Spiral' ? 'bg-[#CDE9F2] text-cyan-950' : 'bg-belluh-50 text-slate-900'}`}>
                            {selectedPattern.type === 'Spiral' && <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-[80px] pointer-events-none"></div>}
                            
                            <div className="flex items-center gap-3 mb-6 relative z-10 pr-10">
                                {selectedPattern.type === 'Spiral' ? (
                                    <div className="w-10 h-10 rounded-full bg-cyan-900/10 flex items-center justify-center"><Waves size={20} className="text-cyan-900"/></div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"><History size={20} className="text-belluh-500"/></div>
                                )}
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedPattern.type === 'Spiral' ? 'text-cyan-800' : 'text-belluh-600'}`}>
                                    {selectedPattern.title}
                                </span>
                            </div>
                            
                            <h2 className={`text-2xl md:text-3xl font-serif relative z-10 leading-tight ${selectedPattern.type === 'Spiral' ? 'text-cyan-950' : 'text-slate-900'}`}>
                                {selectedPattern.content}
                            </h2>
                        </div>

                        <div className="p-6 md:p-8 bg-white flex-1">
                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">The Evidence</h4>
                                <div className="space-y-4">
                                    {selectedPattern.relatedEntryIds?.slice(0, 2).map(id => {
                                        const entry = entries.find(e => e.id === id);
                                        if (!entry) return null;
                                        return (
                                            <div key={id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-3 items-start">
                                                <Quote size={14} className="text-slate-300 shrink-0 mt-1" />
                                                <div>
                                                    <p className="text-sm font-serif text-slate-600 italic mb-2">"{entry.content.substring(0, 80)}..."</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{entry.timestamp.toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="bg-belluh-50/50 p-5 md:p-6 rounded-2xl border border-belluh-100 flex items-start gap-4 mb-4">
                                <Sparkles size={20} className="text-belluh-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-1">Belluh's Advice</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {selectedPattern.type === 'Spiral' 
                                            ? "This pattern often appears when you feel disconnected. Try sharing a small, vulnerable truth with your partner today instead of withdrawing." 
                                            : "You are building a beautiful reservoir of shared meaning. Keep reinforcing this positive loop."}
                                    </p>
                                </div>
                            </div>
                            
                            <button onClick={() => setSelectedPattern(null)} className="w-full mt-4 bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-black transition-transform active:scale-95 shadow-lg">
                                Acknowledged
                            </button>
                        </div>
                    </div>
               </div>
           </div>
       )}

       <div className="relative min-h-[400px]">
          <div className="absolute left-14 md:left-20 top-0 bottom-0 w-px bg-slate-100"></div>

          {!searchQuery && !searchAnswer && !isArchived && !isConstellation && (
              <div className="relative pl-20 md:pl-24 pr-6 mb-12 animate-slide-up pt-4">
                  <div className="absolute left-14 md:left-20 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-200 rounded-full z-10 -translate-x-[2.5px] ring-4 ring-[#fcfcfc]"></div>
                  <div className="flex gap-4">
                    <div className="bg-white rounded-full px-5 py-2 border border-slate-100 shadow-sm flex items-center gap-2 max-w-fit hover:shadow-md transition-shadow">
                        <Flame size={14} className="text-belluh-400 fill-belluh-50" />
                        <p className="font-semibold text-slate-900 text-xs leading-none">{streak} Day Streak</p>
                    </div>
                  </div>
              </div>
          )}

          {!hasUserPostedToday && !searchQuery && !searchAnswer && !isArchived && !isConstellation && (
              <div className="relative pl-20 md:pl-24 pr-6 mb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="absolute left-14 md:left-20 top-8 w-2 h-2 bg-belluh-300 border-[2px] border-[#fcfcfc] rounded-full z-10 shadow-glow -translate-x-[3.5px]"></div>
                  
                  <button onClick={() => onCompose()} className="w-full text-left group max-w-xl">
                      <div className="bg-white border border-slate-100 shadow-sm hover:shadow-lg rounded-[2rem] p-8 transition-all duration-500 relative overflow-hidden group-hover:border-belluh-100 group-hover:-translate-y-1">
                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><PenLine size={80} className="rotate-12" /></div>
                          <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-4">
                                  <span className="bg-belluh-50 text-belluh-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Daily Ritual</span>
                              </div>
                              <h3 className="font-serif text-2xl text-slate-800 leading-tight mb-6 group-hover:text-belluh-600 transition-colors">
                                  {todaysPrompt}
                              </h3>
                              <div className="flex items-center gap-3 text-sm font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:shadow-sm"><Plus size={18} /></div>
                                  <span>Tap to capture</span>
                              </div>
                          </div>
                      </div>
                  </button>
              </div>
          )}

          {groupedItems.map((item, index) => {
              if ('type' in item && item.type === 'header') {
                  return (
                      <div key={`header-${index}`} className="relative pl-20 md:pl-24 pr-6 mb-6 mt-6 animate-fade-in">
                          <div className="absolute left-14 md:left-20 top-1/2 w-1 h-1 bg-slate-300 rounded-full z-10 -translate-x-[2px] ring-4 ring-[#fcfcfc]"></div>
                          <span className="text-[10px] font-bold text-slate-400 bg-[#fcfcfc] pr-2 relative z-10 uppercase tracking-widest">{item.title}</span>
                      </div>
                  );
              }

              if ('type' in item && item.type === 'pattern') {
                  const pattern = item.data as Insight;
                  const isSpiral = pattern.type === 'Spiral';
                  
                  return (
                    <div key={pattern.id} className="relative pl-20 md:pl-24 pr-6 mb-8 animate-pop">
                        <div className="absolute left-14 md:left-20 top-8 w-2 h-2 bg-white border-[2px] border-slate-200 rounded-full z-10 ring-4 ring-[#fcfcfc] -translate-x-[3.5px]"></div>
                        
                        <div 
                            onClick={() => setSelectedPattern(pattern)}
                            className={`max-w-xl w-full rounded-[2rem] p-8 shadow-xl relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform ${isSpiral ? 'bg-[#CDE9F2] text-cyan-950' : 'bg-white border border-belluh-100'}`}
                        >
                             {isSpiral && (
                                 <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/40 rounded-full blur-[80px]"></div>
                             )}
                             {!isSpiral && (
                                 <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-belluh-100 rounded-full blur-[60px] opacity-60"></div>
                             )}

                             <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    {isSpiral ? (
                                        <div className="w-8 h-8 rounded-full bg-cyan-900/10 flex items-center justify-center">
                                            <Waves size={16} className="text-cyan-900" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-belluh-50 flex items-center justify-center">
                                            <History size={16} className="text-belluh-500" />
                                        </div>
                                    )}
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isSpiral ? 'text-cyan-800' : 'text-belluh-500'}`}>
                                        {pattern.title}
                                    </span>
                                </div>
                                
                                <p className={`font-serif text-xl leading-relaxed mb-6 ${isSpiral ? 'text-cyan-950' : 'text-slate-800'}`}>
                                    {pattern.content}
                                </p>
                                
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPattern(pattern);
                                    }}
                                    className={`text-xs font-bold px-5 py-3 rounded-full transition-all flex items-center gap-2 ${isSpiral ? 'bg-white/60 text-cyan-950 hover:bg-white' : 'bg-belluh-50 text-belluh-900 hover:bg-belluh-100'}`}
                                >
                                    {pattern.actionLabel || 'Understand Why'}
                                    <ArrowRight size={14} />
                                </button>
                             </div>
                        </div>
                    </div>
                  )
              }

              const entry = item as JournalEntry;
              const sourceCircle = circles.find(c => c.id === entry.circleId);

              return (
                  <div key={entry.id} className="relative pl-20 md:pl-24 pr-6 group transition-[padding] duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="absolute left-14 md:left-20 top-8 w-2 h-2 bg-white border-[2px] border-slate-200 rounded-full z-10 shadow-sm group-hover:border-belluh-300 group-hover:scale-110 transition-all duration-300 ring-4 ring-[#fcfcfc] -translate-x-[3.5px]"></div>
                    <div className="max-w-xl w-full">
                        <EntryCard 
                            entry={entry} 
                            isCurrentUser={entry.userId === currentUserId} 
                            onLike={isArchived ? undefined : onLikeEntry}
                            onAskBelluh={() => handleAskAboutEntry(entry.content)}
                            onDelete={isArchived ? undefined : () => onDeleteEntry(entry.id)}
                            onUpdate={isArchived ? undefined : (content) => onUpdateEntry(entry.id, content)}
                            showContext={isConstellation}
                            circleName={sourceCircle?.name}
                            circleColor={sourceCircle?.themeColor}
                        />
                    </div>
                  </div>
              );
          })}
       </div>
    </div>
  );
};

export default Timeline;