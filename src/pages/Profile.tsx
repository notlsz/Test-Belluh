
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, LoveNote, Goal, Circle, CircleStatus, JournalEntry, Mood, RelationshipReceipt } from '../types';
import { Settings, Heart, Plus, X, Trash2, Shield, ChevronRight, Users, Check, Send, Trophy, Activity, Lock, Flame, Download, CheckCircle2, Mail, Archive, Star, FileText, Film, Edit3, Camera, UserPlus, LogOut, Infinity, ArrowRight, Play, Receipt, Share2, Instagram, Facebook, Copy, MessageCircle, Twitter, Camera as CameraIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { generateRelationshipReceipt } from '../services/geminiService';

interface ProfileProps {
  user: User;
  entries?: JournalEntry[]; 
  streak?: number;
  onLogout?: () => void;
  onCircleChange: (circleId: string) => void;
  onCreateCircle?: (name: string) => void; 
  onTriggerPremium?: () => void;
  onUpdateUser: (updates: Partial<User>) => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onViewArtifact: (type: 'reel' | 'letter') => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  pendingInvites?: { id: string; inviter: { id: string; name: string; avatar: string; } }[];
  onAcceptInvite?: (id: string) => void;
  onDeclineInvite?: (id: string) => void;
}

// Updated Pastel Palette - "Sam Altman" Quality - Richer, trendier pastels
const RECEIPT_COLORS = [
    { name: 'Classic', hex: '#ffffff', text: 'text-slate-900', border: 'border-slate-200' },
    { name: 'Blush', hex: '#ffe4e6', text: 'text-rose-950', border: 'border-rose-200' }, // Richer Pink
    { name: 'Miami', hex: '#cffafe', text: 'text-cyan-950', border: 'border-cyan-200' }, // Vibrant Cyan
    { name: 'Matcha', hex: '#dcfce7', text: 'text-emerald-950', border: 'border-emerald-200' }, // Fresh Green
    { name: 'Lavender', hex: '#f3e8ff', text: 'text-purple-950', border: 'border-purple-200' }, // Soft Purple
    { name: 'Cream', hex: '#fef3c7', text: 'text-amber-950', border: 'border-amber-200' }, // Warm Yellow
];

interface CircleCardProps {
  circle: Circle;
  isActive: boolean;
  onClick: () => void;
  user: User;
  onInvite: (circleId: string) => void;
}

const CircleCard: React.FC<CircleCardProps> = ({ circle, isActive, onClick, onInvite }) => {
    const dotColor = circle.status === CircleStatus.Archived ? 'bg-yellow-400' : 'bg-[#f0addd]'; 
    return (
        <div onClick={onClick} className={`w-[240px] h-[140px] rounded-[1.8rem] p-6 flex flex-col justify-between cursor-pointer transition-all duration-500 relative overflow-hidden group shrink-0 ${isActive ? 'bg-white shadow-apple scale-[1.05] z-10 translate-y-[-4px]' : 'bg-white border border-slate-100 opacity-80'}`}>
            <div className="flex justify-between items-start relative z-10">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>{circle.name[0]}</div>
                {isActive && <div className={`w-3 h-3 ${dotColor} rounded-full animate-pulse border border-white`}></div>}
            </div>
            <div className="relative z-10">
                <h4 className={`font-bold text-lg leading-tight mb-1 truncate ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{circle.name}</h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{(circle.type as any)}</span>
                </div>
            </div>
            {isActive && circle.status === CircleStatus.Active && (
                <button onClick={(e) => { e.stopPropagation(); onInvite(circle.id); }} className="absolute top-4 right-4 bg-belluh-50 text-belluh-600 p-2 rounded-full hover:bg-belluh-100 transition-colors"><Plus size={14} /></button>
            )}
        </div>
    );
};

const Profile: React.FC<ProfileProps> = ({ user, entries = [], streak = 0, onLogout, onCircleChange, onCreateCircle, onUpdateUser, onShowLegal, onViewArtifact, onShowToast, pendingInvites = [], onAcceptInvite, onDeclineInvite, onTriggerPremium }) => {
  const [activeTab, setActiveTab] = useState<'us' | 'me'>('us');
  const [activeCircleId, setActiveCircleId] = useState(user.activeCircleId);
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [isCreatingCircle, setIsCreatingCircle] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'searching' | 'sent' | 'not-found'>('idle');
  const [invitingCircleId, setInvitingCircleId] = useState<string | null>(null);
  
  // Receipt State
  const [receiptData, setReceiptData] = useState<RelationshipReceipt | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [receiptColorIdx, setReceiptColorIdx] = useState(0);

  const activeCircle = user.circles.find(c => c.id === activeCircleId);
  const activeCircles = user.circles.filter(c => c.status === CircleStatus.Active);
  const archivedCircles = user.circles.filter(c => c.status === CircleStatus.Archived);

  const synergyScore = useMemo(() => {
      if (entries.length === 0) return 85; 
      const recentEntries = entries.slice(0, 15);
      let score = 80;
      recentEntries.forEach(e => {
          if (e.mood === Mood.Romantic || e.mood === Mood.Amazing) score += 4;
          if (e.mood === Mood.Good || e.mood === Mood.Grateful || e.mood === Mood.Playful) score += 2;
          if (e.mood === Mood.Stressed || e.mood === Mood.Anxious) score -= 3;
      });
      return Math.min(100, Math.max(0, score));
  }, [entries]);

  const pulseStatus = synergyScore >= 80 ? { text: "Deeply Connected", color: "text-[#f0addd]" } : { text: "Steady Growth", color: "text-slate-600" };

  useEffect(() => {
    if (!user.id) return;
    const fetchData = async () => {
        const { data: noteEntries } = await supabase.from('journal_entries').select('*').contains('tags', ['sticky_note']).order('created_at', { ascending: false });
        if (noteEntries) setNotes(noteEntries.map(e => ({ id: e.id, content: e.content, isPinned: false, createdAt: new Date(e.created_at), forUserId: 'all', authorId: e.user_id, circleId: 'c1' })));
        const { data: goalEntries } = await supabase.from('journal_entries').select('*').contains('tags', ['goal']).order('created_at', { ascending: false });
        if (goalEntries) setGoals(goalEntries.map(e => ({ id: e.id, title: e.content, isCompleted: e.is_favorite || false })));
    };
    fetchData();
  }, [user.id]);

  const handleCircleSwitch = (id: string) => { setActiveCircleId(id); onCircleChange(id); };

  const handleTriggerInvite = (circleId: string) => {
    setInvitingCircleId(circleId);
    setShowInviteModal(true);
  };

  const handleSaveProfile = () => { onUpdateUser({ name: editName, avatar: editAvatar }); setIsEditingProfile(false); };

  const handleGenerateReceipt = async () => {
      setGeneratingReceipt(true);
      setShowReceipt(true);
      if (!receiptData) {
          const data = await generateRelationshipReceipt(entries, `${user.name} & ${user.partnerName || 'Partner'}`);
          setReceiptData(data);
      }
      setGeneratingReceipt(false);
  };

  const handleShare = async (platform?: 'whatsapp' | 'twitter' | 'copy') => {
      if (!receiptData) return;
      const shareText = `🧾 RELATIONSHIP RECEIPT\n\n${receiptData.merchantName}\nDate: ${receiptData.date}\nTotal: ${receiptData.total}\n\n"${receiptData.footerQuote}"\n\nGenerated by Belluh AI`;
      
      if (platform === 'whatsapp') {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
      } else if (platform === 'twitter') {
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
      } else if (platform === 'copy') {
          await navigator.clipboard.writeText(shareText);
          onShowToast("Receipt copied to clipboard!", "success");
      } else {
          if (navigator.share) {
              try {
                  await navigator.share({
                      title: 'Our Relationship Receipt',
                      text: shareText,
                      url: window.location.href
                  });
              } catch (err) {
                  console.log("Share cancelled");
              }
          } else {
              handleShare('copy');
          }
      }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail.trim() || !invitingCircleId) return;
      
      setInviteStatus('searching');
      try {
          const { data: profiles } = await supabase.from('profiles').select('id').ilike('email', inviteEmail.trim());

          if (!profiles || profiles.length === 0) {
              setInviteStatus('not-found');
              return;
          }

          const partnerId = profiles[0].id;
          if (partnerId === user.id) {
              onShowToast("You cannot invite yourself!", "error");
              setInviteStatus('idle');
              return;
          }

          const { error } = await supabase.from('partner_connections').insert({
              user_id: user.id,
              partner_id: partnerId,
              status: 'pending'
          });

          if (error) console.error(error);
          
          setInviteStatus('sent');
          onShowToast('Invite sent!', 'success');
          setTimeout(() => {
              setShowInviteModal(false);
              setInviteStatus('idle');
              setInviteEmail('');
          }, 2000);
          
      } catch (err) {
          console.error(err);
          setInviteStatus('idle');
      }
  };

  const currentColor = RECEIPT_COLORS[receiptColorIdx];

  return (
    <div className="pb-32 pt-10 px-0 max-w-4xl mx-auto min-h-screen bg-paper">
      <div className="px-6 flex justify-end mb-8">
          <button onClick={() => setShowSettingsModal(true)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-soft border border-slate-50"><Settings size={20} /></button>
      </div>
      <div className="px-6 mb-10 flex justify-center">
          <div className="bg-white border border-slate-100 p-1 rounded-full flex w-[180px] shadow-sm">
              <button onClick={() => setActiveTab('us')} className={`flex-1 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'us' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Us</button>
              <button onClick={() => setActiveTab('me')} className={`flex-1 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'me' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Me</button>
          </div>
      </div>
      {activeTab === 'us' ? (
          <div className="animate-fade-in space-y-12 px-6">
              <div className="flex flex-col items-center justify-center pt-4">
                  <div className="relative flex items-center justify-center -space-x-5">
                      <div className="w-28 h-28 rounded-full border-[5px] border-white shadow-apple overflow-hidden bg-white"><img src={user.avatar} className="w-full h-full object-cover" /></div>
                      <div className="w-12 h-12 bg-white rounded-full shadow-lg border border-slate-50 text-[#f0addd] flex items-center justify-center z-20"><Infinity size={22} strokeWidth={2.5} /></div>
                      <div className="w-28 h-28 rounded-full border-[5px] border-white shadow-apple overflow-hidden bg-white"><img src={user.partnerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.partnerName}`} className="w-full h-full object-cover" /></div>
                  </div>
                  <h2 className="text-4xl font-serif text-slate-900 mt-8 tracking-tight">{user.name.split(' ')[0]} <span className="text-[#f0addd] italic mx-2">&</span> {user.partnerName ? user.partnerName.split(' ')[0] : 'Partner'}</h2>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 flex items-center gap-2"><Flame size={14} className="text-orange-500 fill-orange-500" /><span className="text-xs font-bold">{streak} Day Streak</span></div>
                        <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 flex items-center gap-2"><Activity size={14} className="text-[#f0addd]" /><span className="text-xs font-bold">{synergyScore}% Synergy</span></div>
                  </div>
              </div>
              <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Current Resonance</p>
                  <h3 className={`text-3xl font-serif ${pulseStatus.color}`}>{pulseStatus.text}</h3>
              </div>
              
              {/* Artifact Grid */}
              <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => onViewArtifact('letter')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col aspect-square justify-between cursor-pointer hover:shadow-md transition-shadow">
                      <Mail size={24} className="text-[#f0addd]" />
                      <div>
                          <h4 className="font-serif text-lg text-slate-900 font-bold">Future Letter</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Unlock 2030</p>
                      </div>
                  </div>
                  <div onClick={() => onViewArtifact('reel')} className="bg-slate-900 p-6 rounded-[2rem] shadow-lg flex flex-col aspect-square justify-between cursor-pointer hover:scale-[1.02] transition-transform">
                      <Film size={24} className="text-white" />
                      <div>
                          <h4 className="font-serif text-lg text-white font-bold">Chapter Reel</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Highlights</p>
                      </div>
                  </div>
                  <div onClick={handleGenerateReceipt} className="col-span-2 bg-[#f0addd] p-6 rounded-[2rem] shadow-lg flex items-center justify-between cursor-pointer hover:bg-[#e57ec3] transition-colors relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                       <div className="relative z-10 flex items-center gap-4">
                           <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                               <Receipt size={24} />
                           </div>
                           <div className="text-white">
                               <h4 className="font-serif text-xl font-bold">Print Receipt</h4>
                               <p className="text-xs font-medium opacity-80">Generate your relationship invoice</p>
                           </div>
                       </div>
                       <ArrowRight className="text-white" size={20} />
                  </div>
              </div>

              {/* Accept/Decline Invitations UI */}
              {pendingInvites.length > 0 && (
                  <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Invites</h3>
                      {pendingInvites.map(invite => (
                          <div key={invite.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between animate-slide-up">
                              <div className="flex items-center gap-3">
                                  <img src={invite.inviter.avatar} className="w-10 h-10 rounded-full" alt={invite.inviter.name} />
                                  <div>
                                      <p className="text-sm font-bold text-slate-900">{invite.inviter.name}</p>
                                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Wants to connect</p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => onAcceptInvite && onAcceptInvite(invite.id)} className="p-2 bg-slate-900 text-white rounded-full hover:bg-black transition-colors"><Check size={16}/></button>
                                  <button onClick={() => onDeclineInvite && onDeclineInvite(invite.id)} className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"><X size={16}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      ) : (
          <div className="px-6 animate-fade-in pb-20">
              <div className="flex flex-col items-center mb-12">
                  <div className="w-32 h-32 rounded-full border-[6px] border-white shadow-2xl overflow-hidden mb-6"><img src={user.avatar} className="w-full h-full object-cover" /></div>
                  <h2 className="text-3xl font-serif text-slate-900 tracking-tight">{user.name}</h2>
                  <button onClick={() => setIsEditingProfile(true)} className="mt-2 text-xs font-bold text-belluh-400 uppercase tracking-widest hover:text-belluh-600 transition-colors">Edit Profile</button>
              </div>

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Circles</h3>
                <button onClick={() => setIsCreatingCircle(true)} className="p-1.5 bg-slate-900 text-white rounded-full hover:bg-black transition-colors"><Plus size={14} /></button>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar">
                  {activeCircles.map(c => <CircleCard key={c.id} circle={c} isActive={activeCircleId === c.id} onClick={() => handleCircleSwitch(c.id)} user={user} onInvite={handleTriggerInvite} />)}
              </div>

              {archivedCircles.length > 0 && (
                  <div className="mt-12">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Archived Circles</h3>
                      <div className="grid grid-cols-1 gap-4">
                          {archivedCircles.map(c => (
                              <div key={c.id} onClick={() => handleCircleSwitch(c.id)} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer group">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center font-bold">{c.name[0]}</div>
                                      <span className="font-bold text-slate-700">{c.name}</span>
                                  </div>
                                  <Archive size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Settings Dialog Overlay */}
      {showSettingsModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowSettingsModal(false)}>
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <h3 className="font-serif text-2xl mb-8 text-slate-900">Settings</h3>
                  <div className="space-y-1">
                    <button onClick={() => onShowLegal('tos')} className="w-full py-3 flex items-center justify-between text-slate-500 hover:bg-slate-50 rounded-xl px-2"><span className="text-sm font-bold">Terms of Service</span><ChevronRight size={16} /></button>
                    <button onClick={() => onShowLegal('privacy')} className="w-full py-3 flex items-center justify-between text-slate-500 hover:bg-slate-50 rounded-xl px-2"><span className="text-sm font-bold">Privacy Policy</span><ChevronRight size={16} /></button>
                    <button onClick={onLogout} className="w-full py-3 flex items-center justify-between text-slate-500 hover:bg-slate-50 rounded-xl px-2"><span className="text-sm font-bold">Log Out</span><LogOut size={16} /></button>
                  </div>
                  <button onClick={() => setShowSettingsModal(false)} className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold">Done</button>
              </div>
          </div>
      )}

      {/* High-Fidelity Receipt Modal */}
      {showReceipt && (
           <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowReceipt(false)}>
               {generatingReceipt || !receiptData ? (
                   <div className="flex flex-col items-center gap-6 text-white animate-pulse">
                       <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                           <Receipt size={40} className="text-white/80" />
                       </div>
                       <p className="font-bold tracking-[0.2em] uppercase text-xs text-white/60">Calculations in progress...</p>
                   </div>
               ) : (
                   <div className="flex flex-col items-center gap-6 animate-slide-up w-full max-w-[360px]" onClick={e => e.stopPropagation()}>
                       
                       {/* THE RECEIPT CONTAINER WITH SCROLL */}
                       <div className="w-full max-h-[65vh] overflow-y-auto overflow-x-visible px-2 pb-4 pt-2">
                           <div className="w-[340px] relative shadow-2xl transition-all duration-500 mx-auto" style={{ filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.3))' }}>
                                {/* Receipt Body */}
                                <div 
                                    className={`relative w-full p-8 pb-12 transition-colors duration-500 ${currentColor.text}`}
                                    style={{ backgroundColor: currentColor.hex }}
                                >
                                    {/* Jagged Top - Inverted Convex Bumps (Holes) */}
                                    <div className="absolute top-0 left-0 w-full h-3 -mt-3" 
                                        style={{ 
                                            background: `radial-gradient(circle at 10px 10px, ${currentColor.hex} 10px, transparent 10.5px)`,
                                            backgroundSize: '20px 20px',
                                            backgroundPosition: 'top center',
                                            transform: 'rotate(180deg)'
                                        }}
                                    ></div>

                                    {/* Content */}
                                    <div className="flex flex-col items-center mb-8 relative z-10">
                                         <div className="w-12 h-12 border-2 border-current rounded-full flex items-center justify-center mb-4 opacity-80">
                                             <Infinity size={24} />
                                         </div>
                                         <h2 className="font-mono text-xl font-bold uppercase tracking-widest text-center leading-tight mb-2">{receiptData.merchantName}</h2>
                                         <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">{receiptData.date} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>

                                    <div className="border-b border-dashed border-current opacity-30 mb-6"></div>

                                    <div className="space-y-4 font-mono text-xs mb-8">
                                        {receiptData.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start gap-4">
                                                <div className="flex gap-2">
                                                    <span className="opacity-50">{item.qty}</span>
                                                    <span className="uppercase font-bold tracking-tight">{item.desc}</span>
                                                </div>
                                                <span className="font-bold whitespace-nowrap">{item.price}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-b border-dashed border-current opacity-30 mb-6"></div>

                                    <div className="space-y-2 font-mono text-xs mb-8">
                                        <div className="flex justify-between">
                                            <span className="opacity-60 uppercase">Subtotal</span>
                                            <span>{receiptData.subtotal}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="opacity-60 uppercase">Emotional Tax</span>
                                            <span>{receiptData.tax}</span>
                                        </div>
                                        <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t border-dashed border-current border-opacity-30">
                                            <span>TOTAL</span>
                                            <span>{receiptData.total}</span>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <p className="font-mono text-[10px] uppercase opacity-60 mb-6 max-w-[200px] mx-auto leading-relaxed">
                                            "{receiptData.footerQuote}"
                                        </p>
                                        
                                        {/* Simulated Barcode */}
                                        <div className="h-10 w-4/5 mx-auto opacity-80 mix-blend-multiply" 
                                            style={{ 
                                                background: `repeating-linear-gradient(90deg, 
                                                    currentColor 0px, currentColor 2px, 
                                                    transparent 2px, transparent 4px, 
                                                    currentColor 4px, currentColor 5px, 
                                                    transparent 5px, transparent 8px,
                                                    currentColor 8px, currentColor 11px,
                                                    transparent 11px, transparent 12px
                                                )` 
                                            }}>
                                        </div>
                                        <p className="font-mono text-[8px] uppercase tracking-[0.3em] mt-2 opacity-40">Thank You For Shopping</p>
                                    </div>

                                    {/* Paper Texture Overlay */}
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

                                    {/* Jagged Bottom - Convex Bumps */}
                                    <div className="absolute bottom-0 left-0 w-full h-3 -mb-3" 
                                        style={{ 
                                            background: `radial-gradient(circle at 10px 0, ${currentColor.hex} 10px, transparent 10.5px)`,
                                            backgroundSize: '20px 10px',
                                            backgroundRepeat: 'repeat-x',
                                        }}
                                    ></div>
                                </div>
                           </div>
                       </div>
                       
                       {/* Controls UI - The "Share & Customize" Center */}
                       <div className="flex flex-col items-center gap-6 w-full animate-fade-in shrink-0" style={{ animationDelay: '0.2s' }}>
                           
                           {/* Color Picker */}
                           <div className="flex gap-3 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 overflow-x-auto max-w-full">
                               {RECEIPT_COLORS.map((color, idx) => (
                                   <button 
                                     key={idx}
                                     onClick={() => setReceiptColorIdx(idx)}
                                     className={`w-8 h-8 rounded-full border-2 shrink-0 transition-all ${receiptColorIdx === idx ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'}`}
                                     style={{ backgroundColor: color.hex }}
                                     title={color.name}
                                   />
                               ))}
                           </div>

                           {/* Share Grid */}
                           <div className="flex gap-4">
                               <button 
                                 onClick={() => handleShare()}
                                 className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full font-bold text-sm shadow-xl hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
                               >
                                   <Share2 size={16} />
                                   <span>Share</span>
                               </button>
                               <div className="flex gap-2">
                                   <button onClick={() => handleShare('copy')} className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-md border border-white/10" title="Instagram/Snapchat (Copy)">
                                       <CameraIcon size={20} />
                                   </button>
                                   <button onClick={() => handleShare('twitter')} className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-md border border-white/10" title="X">
                                       <Twitter size={20} />
                                   </button>
                                   <button onClick={() => handleShare('whatsapp')} className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-md border border-white/10" title="Message">
                                       <MessageCircle size={20} />
                                   </button>
                               </div>
                           </div>
                           
                           <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                                Screenshot for Instagram Stories <Instagram size={10} />
                           </p>
                       </div>

                   </div>
               )}
           </div>
      )}

      {/* Partner Invite Modal Dialog */}
      {showInviteModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowInviteModal(false)}>
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-2xl text-slate-900">Invite Partner</h3>
                    <button onClick={() => setShowInviteModal(false)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  <p className="text-slate-500 text-sm mb-6">Invite someone to this circle via email. They must have a Belluh account.</p>
                  
                  {inviteStatus === 'sent' ? (
                      <div className="text-center py-6 animate-pop">
                          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32}/></div>
                          <p className="font-bold text-slate-900">Invite Sent!</p>
                      </div>
                  ) : (
                      <form onSubmit={handleInviteSubmit} className="space-y-4">
                          <input 
                              type="email" 
                              required 
                              autoFocus
                              value={inviteEmail}
                              onChange={e => setInviteEmail(e.target.value)}
                              placeholder="partner@email.com"
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-belluh-200"
                          />
                          {inviteStatus === 'not-found' && <p className="text-rose-500 text-xs font-bold px-1">User not found. Ask them to sign up first!</p>}
                          <button type="submit" disabled={inviteStatus === 'searching'} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2">
                              {inviteStatus === 'searching' ? <Loader2 size={18} className="animate-spin" /> : <><span>Send Invite</span> <Send size={16} /></>}
                          </button>
                      </form>
                  )}
              </div>
          </div>
      )}

      {/* Profile Modification Modal */}
      {isEditingProfile && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setIsEditingProfile(false)}>
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
                  <h3 className="font-serif text-2xl mb-8 text-slate-900">Edit Profile</h3>
                  <div className="space-y-6">
                      <div className="flex flex-col items-center">
                          <div className="relative group cursor-pointer" onClick={() => setEditAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`)}>
                              <img src={editAvatar} className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-sm object-cover" alt="Profile" />
                              <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Camera size={20} className="text-white" />
                              </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Shuffle Avatar</span>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-900 ml-1">Name</label>
                          <input 
                              type="text" 
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-belluh-200"
                          />
                      </div>
                  </div>
                  <button onClick={handleSaveProfile} className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold">Save Changes</button>
              </div>
          </div>
      )}

      {/* Circle Creation Modal */}
      {isCreatingCircle && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setIsCreatingCircle(false)}>
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
                  <h3 className="font-serif text-2xl mb-8 text-slate-900">New Circle</h3>
                  <div className="space-y-4">
                      <input 
                          type="text" 
                          autoFocus
                          placeholder="Circle name..."
                          value={newCircleName}
                          onChange={e => setNewCircleName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-belluh-200"
                      />
                      <button 
                        onClick={() => {
                            if (newCircleName.trim() && onCreateCircle) {
                                onCreateCircle(newCircleName);
                                setIsCreatingCircle(false);
                                setNewCircleName('');
                            }
                        }} 
                        disabled={!newCircleName.trim()}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50"
                      >
                          Create Circle
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Inline helper component for loading animations
const Loader2 = ({ size, className }: { size: number, className?: string }) => (
    <div className={`animate-spin ${className}`} style={{ width: size, height: size }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    </div>
);

export default Profile;
