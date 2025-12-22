
import React, { useState, useEffect, useMemo } from 'react';
import { User, LoveNote, Goal, Circle, CircleStatus, JournalEntry, Mood } from '../types';
import { Settings, Heart, Plus, X, Trash2, Shield, ChevronRight, Users, Check, Send, Trophy, Activity, Lock, Flame, Download, CheckCircle2, Mail, Archive, Star, FileText, Film, Edit3, Camera, UserPlus, LogOut, Infinity, ArrowRight, Play } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

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

const STICKY_STYLES = [
  'bg-[#fefce8] text-amber-900/80 shadow-soft rotate-1 hover:rotate-0',
  'bg-[#fff1f2] text-rose-900/80 shadow-soft -rotate-1 hover:rotate-0',
  'bg-[#f0f9ff] text-sky-900/80 shadow-soft rotate-2 hover:rotate-0',
  'bg-[#faf5ff] text-purple-900/80 shadow-soft -rotate-2 hover:rotate-0',
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
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);

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

  // Triggering the invite modal for a specific circle
  const handleTriggerInvite = (circleId: string) => {
    setInvitingCircleId(circleId);
    setShowInviteModal(true);
  };

  const handleSaveProfile = () => { onUpdateUser({ name: editName, avatar: editAvatar }); setIsEditingProfile(false); };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    const newNote: LoveNote = { id: Date.now().toString(), content: newNoteContent, isPinned: false, createdAt: new Date(), forUserId: 'all', authorId: user.id, circleId: activeCircleId };
    setNotes([newNote, ...notes]);
    setNewNoteContent(''); setIsAddingNote(false);
    await supabase.from('journal_entries').insert({ user_id: user.id, content: newNote.content, type: 'Freeform', tags: ['sticky_note'], is_shared: true, date: new Date().toISOString() });
    onShowToast('Note added!', 'success');
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail.trim() || !invitingCircleId) return;
      
      setInviteStatus('searching');
      try {
          const { data: profiles } = await supabase
              .from('profiles')
              .select('id')
              .ilike('email', inviteEmail.trim());

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

          // Create pending connection invite
          const { error } = await supabase.from('partner_connections').insert({
              user_id: user.id,
              partner_id: partnerId,
              status: 'pending'
          });

          if (error) {
              console.error(error);
          }
          
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
              <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => onViewArtifact('letter')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col aspect-square justify-between cursor-pointer"><Mail size={20} className="text-[#f0addd]" /><h4 className="font-serif text-lg text-slate-900 font-bold">To Future Us</h4></div>
                  <div onClick={() => onViewArtifact('reel')} className="bg-slate-900 p-6 rounded-[2rem] shadow-lg flex flex-col aspect-square justify-between cursor-pointer"><Film size={20} className="text-white" /><h4 className="font-serif text-lg text-white font-bold">Chapter Reel</h4></div>
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
