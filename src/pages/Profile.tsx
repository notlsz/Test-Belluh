import React, { useState, useEffect, useMemo } from 'react';
import { User, LoveNote, Goal, CircleType, Circle, CircleStatus, JournalEntry, Mood } from '../types';
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
  'bg-[#fefce8] text-amber-900/80 shadow-soft rotate-1 hover:rotate-0',   // Soft Yellow
  'bg-[#fff1f2] text-rose-900/80 shadow-soft -rotate-1 hover:rotate-0',   // Soft Pink
  'bg-[#f0f9ff] text-sky-900/80 shadow-soft rotate-2 hover:rotate-0',    // Soft Blue
  'bg-[#faf5ff] text-purple-900/80 shadow-soft -rotate-2 hover:rotate-0', // Soft Purple
];

interface CircleCardProps {
  circle: Circle;
  isActive: boolean;
  onClick: () => void;
  user: User;
  onInvite: (circleId: string) => void;
}

const CircleCard: React.FC<CircleCardProps> = ({ circle, isActive, onClick, onInvite }) => {
    const dotColor = circle.status === CircleStatus.Archived 
        ? 'bg-yellow-400' 
        : 'bg-[#f0addd]'; 

    return (
        <div 
        onClick={onClick}
        className={`
            w-[240px] h-[140px] rounded-[1.8rem] p-6 flex flex-col justify-between cursor-pointer transition-all duration-500 relative overflow-hidden group shrink-0
            ${isActive 
                ? 'bg-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] scale-[1.05] z-10 translate-y-[-4px]' 
                : 'bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 opacity-80 hover:opacity-100 hover:scale-[1.02]'
            }
        `}
        >
        {isActive && (
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/50 to-transparent"></div>
                {circle.id === 'constellation' ? (
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
                ) : (
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-belluh-50/40 rounded-full blur-3xl"></div>
                )}
            </div>
        )}

        <div className="flex justify-between items-start relative z-10">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>
                {circle.name[0]}
            </div>
            {isActive && <div className={`w-3 h-3 ${dotColor} rounded-full animate-pulse shadow-glow mt-2 mr-2 border border-white`}></div>}
        </div>
        
        <div className="relative z-10">
            <h4 className={`font-bold text-lg leading-tight mb-1 truncate transition-colors ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{circle.name}</h4>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{circle.type}</span>
                {circle.status === CircleStatus.Archived && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded ml-1">Archived</span>}
            </div>
        </div>

        {isActive && circle.status === CircleStatus.Active && (
            <button 
                onClick={(e) => { e.stopPropagation(); onInvite(circle.id); }}
                className="absolute top-4 right-4 bg-belluh-50 hover:bg-belluh-100 text-belluh-600 p-2 rounded-full transition-colors z-20"
                title="Invite to Circle"
            >
                <Plus size={14} />
            </button>
        )}
        </div>
    );
};

const Profile: React.FC<ProfileProps> = ({ user, entries = [], streak = 0, onLogout, onCircleChange, onCreateCircle, onUpdateUser, onShowLegal, onViewArtifact, onShowToast, pendingInvites = [], onAcceptInvite, onDeclineInvite }) => {
  const [activeTab, setActiveTab] = useState<'us' | 'me'>('us');
  const [activeCircleId, setActiveCircleId] = useState(user.activeCircleId);
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  // Profile Editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  
  // Circles & Invites
  const [isCreatingCircle, setIsCreatingCircle] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'searching' | 'sent' | 'not-found'>('idle');
  const [invitingCircleId, setInvitingCircleId] = useState<string | null>(null);

  // Archive State
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Drag and Drop State
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Bucket List State
  const [newGoal, setNewGoal] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  const activeCircle = user.circles.find(c => c.id === activeCircleId);
  const activeCircles = user.circles.filter(c => c.status === CircleStatus.Active);
  const archivedCircles = user.circles.filter(c => c.status === CircleStatus.Archived);

  // Stats
  const totalMemories = entries.length;
  const synergyScore = useMemo(() => {
      if (entries.length === 0) return 85; 
      const recentEntries = entries.slice(0, 15);
      let score = 80;
      recentEntries.forEach(e => {
          if (e.mood === Mood.Romantic || e.mood === Mood.Amazing) score += 4;
          if (e.mood === Mood.Good || e.mood === Mood.Grateful || e.mood === Mood.Playful) score += 2;
          if (e.mood === Mood.Stressed || e.mood === Mood.Anxious) score -= 3;
          if (e.mood === Mood.Tired) score -= 1;
      });
      return Math.min(100, Math.max(0, score));
  }, [entries]);

  const pulseStatus = useMemo(() => {
      if (synergyScore >= 90) return { text: "Deeply Connected", color: "text-[#f0addd]" };
      if (synergyScore >= 75) return { text: "Growing Stronger", color: "text-cyan-900" };
      if (synergyScore >= 60) return { text: "Finding Balance", color: "text-cyan-800" };
      return { text: "Needs Attention", color: "text-slate-600" };
  }, [synergyScore]);

  // Fetch Notes and Goals
  useEffect(() => {
    if (!user.id) return;

    const fetchData = async () => {
        const { data: noteEntries } = await supabase
            .from('journal_entries')
            .select('*')
            .contains('tags', ['sticky_note'])
            .order('created_at', { ascending: false });
        
        if (noteEntries) {
            setNotes(noteEntries.map(e => ({
                id: e.id,
                content: e.content,
                isPinned: false, 
                createdAt: new Date(e.created_at),
                forUserId: 'all',
                authorId: e.user_id,
                circleId: 'c1'
            })));
        }

        const { data: goalEntries } = await supabase
            .from('journal_entries')
            .select('*')
            .contains('tags', ['goal'])
            .order('created_at', { ascending: false });

        if (goalEntries) {
            setGoals(goalEntries.map(e => ({
                id: e.id,
                title: e.content,
                isCompleted: e.is_favorite || false 
            })));
        }
    };
    fetchData();
  }, [user.id]);

  useEffect(() => {
    setEditName(user.name);
    setEditAvatar(user.avatar);
  }, [user]);

  const handleCircleSwitch = (circleId: string) => {
      setActiveCircleId(circleId);
      onCircleChange(circleId);
  };

  const handleSaveProfile = () => {
      onUpdateUser({ name: editName, avatar: editAvatar });
      setIsEditingProfile(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              setEditAvatar(base64String);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    const tempId = Date.now().toString();
    const newNote: LoveNote = {
      id: tempId,
      content: newNoteContent,
      isPinned: false,
      createdAt: new Date(),
      forUserId: 'all',
      authorId: user.id,
      circleId: activeCircleId
    };
    setNotes([newNote, ...notes]);
    setNewNoteContent('');
    setIsAddingNote(false);

    await supabase.from('journal_entries').insert({
        user_id: user.id,
        content: newNote.content,
        type: 'Freeform',
        tags: ['sticky_note'],
        is_shared: true,
        date: new Date().toISOString()
    });
    onShowToast('Note added!', 'success');
  };

  const deleteNote = async (id: string) => {
      setNotes(notes.filter(n => n.id !== id));
      await supabase.from('journal_entries').delete().eq('id', id);
  }

  const toggleGoal = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const newStatus = !goal.isCompleted;
    setGoals(goals.map(g => g.id === id ? { ...g, isCompleted: newStatus } : g));
    await supabase.from('journal_entries').update({ is_favorite: newStatus }).eq('id', id);
    if(newStatus) onShowToast('Dream completed!', 'success');
  };

  const handleDeleteGoal = async (id: string) => {
      setGoals(goals.filter(g => g.id !== id));
      await supabase.from('journal_entries').delete().eq('id', id);
  };

  const handleAddGoal = async () => {
    if (!newGoal.trim()) return;
    const tempId = Date.now().toString();
    setGoals([...goals, { id: tempId, title: newGoal, isCompleted: false }]);
    setNewGoal('');
    setIsAddingGoal(false);

    await supabase.from('journal_entries').insert({
        user_id: user.id,
        content: newGoal,
        type: 'Milestone',
        tags: ['goal'],
        is_shared: true,
        is_favorite: false,
        date: new Date().toISOString()
    });
    onShowToast('Dream added', 'success');
  };

  const handleCreateCircle = () => {
      if (!newCircleName.trim()) return;
      if (onCreateCircle) {
          onCreateCircle(newCircleName);
      } else {
          onShowToast("Circle creation is not available.", 'error');
      }
      setNewCircleName('');
      setIsCreatingCircle(false);
  };

  const handleArchiveCircle = () => {
      if (!activeCircle) return;
      onShowToast("Archiving is managed in Settings for synced data.", 'info');
      setShowArchiveConfirm(false);
      setShowSettingsModal(false);
  };

  const handleTriggerInvite = (circleId: string) => {
      setInvitingCircleId(circleId);
      setShowInviteModal(true);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
      e.preventDefault();
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
              onShowToast("You cannot invite yourself!", 'error');
              setInviteStatus('idle');
              return;
          }

          const { error } = await supabase.from('partner_connections').insert({
              user_id: user.id,
              partner_id: partnerId,
              status: 'pending' 
          });

          if (invitingCircleId && invitingCircleId !== 'c1') {
              await supabase.from('journal_entries').insert({
                  user_id: user.id,
                  title: 'Member Added',
                  content: partnerId,
                  type: 'Milestone',
                  tags: ['system_circle_member', `circle:${invitingCircleId}`, `member:${partnerId}`],
                  is_shared: false,
                  date: new Date().toISOString()
              });
          }

          if (error && error.code !== '23505') {
                 onShowToast("Failed to connect.", 'error');
                 setInviteStatus('idle');
                 return;
          }
          
          setInviteStatus('sent');
          setTimeout(() => {
            setShowInviteModal(false);
            setInviteStatus('idle');
            setInviteEmail('');
            setInvitingCircleId(null);
            window.location.reload();
          }, 1500);
          
      } catch (err) {
          console.error(err);
          onShowToast("An unexpected error occurred.", 'error');
          setInviteStatus('idle');
      }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id); 
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingId || draggingId === targetId) return;
    const draggedIndex = notes.findIndex(n => n.id === draggingId);
    const targetIndex = notes.findIndex(n => n.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const newNotes = [...notes];
    const [reorderedItem] = newNotes.splice(draggedIndex, 1);
    newNotes.splice(targetIndex, 0, reorderedItem);
    setNotes(newNotes);
    setDraggingId(null);
  };

  const handleExportData = () => {
      const dataStr = JSON.stringify({ user, entries: [], notes, goals }, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `belluh-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast("Your data has been exported successfully.", 'success');
  };

  const handleDeleteData = () => {
      if (confirm("Are you sure? This will delete ALL entries, patterns, and notes. This cannot be undone.")) {
          onShowToast("Please contact support to fully wipe your account data from the cloud.", 'info');
      }
  };

  return (
    <div className="pb-32 pt-10 px-0 max-w-4xl mx-auto min-h-screen bg-paper transition-all duration-300">
      
      {/* Header - Cleaned up */}
      <div className="px-6 flex justify-end items-center mb-8">
          <button onClick={() => setShowSettingsModal(true)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-soft hover:shadow-md transition-all border border-slate-50">
              <Settings size={20} />
          </button>
      </div>

      {/* Tab Switcher - Pill Shaped */}
      <div className="px-6 mb-10 flex justify-center">
          <div className="bg-white border border-slate-100 p-1 rounded-full flex relative w-[180px] shadow-sm">
              <button 
                onClick={() => setActiveTab('us')}
                className={`flex-1 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    activeTab === 'us' 
                    ? 'bg-slate-900 text-white shadow-md transform scale-100' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                Us
              </button>
              <button 
                onClick={() => setActiveTab('me')}
                className={`flex-1 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    activeTab === 'me' 
                    ? 'bg-slate-900 text-white shadow-md transform scale-100' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                Me
              </button>
          </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites && pendingInvites.length > 0 && (
          <div className="px-6 mb-8 animate-slide-up">
              <div className="bg-belluh-50 border border-belluh-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                      <Mail size={16} className="text-belluh-600" />
                      <h3 className="text-xs font-bold text-belluh-800 uppercase tracking-widest">Pending Invite</h3>
                  </div>
                  {pendingInvites.map(invite => (
                      <div key={invite.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <img src={invite.inviter.avatar} alt="Inviter" className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                              <div>
                                  <p className="text-sm font-bold text-slate-900">{invite.inviter.name}</p>
                                  <p className="text-xs text-slate-500">Wants to connect journals</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button 
                                onClick={() => onDeclineInvite && onDeclineInvite(invite.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                              >
                                  <X size={18} />
                              </button>
                              <button 
                                onClick={() => onAcceptInvite && onAcceptInvite(invite.id)}
                                className="p-2 bg-slate-900 text-white hover:bg-green-600 rounded-full transition-colors shadow-md"
                              >
                                  <Check size={18} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'us' ? (
          <div className="animate-fade-in space-y-12">
              
              {activeCircle?.status === CircleStatus.Archived ? (
                  <div className="px-6">
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
                          <Archive size={20} className="text-amber-500" />
                          <p className="text-sm text-amber-900">You are viewing an archived relationship. This space is read-only.</p>
                      </div>
                  </div>
              ) : activeCircleId === 'constellation' ? (
                  <div className="px-6">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                          <Star size={20} className="text-belluh-300 fill-belluh-300" />
                          <div>
                            <h3 className="text-sm font-bold text-white">The Constellation</h3>
                            <p className="text-xs text-slate-400">Viewing your entire universe of moments across all chapters.</p>
                          </div>
                      </div>
                  </div>
              ) : (
                  <>
                      {/* HERO: SHARED SOUL */}
                      <div className="flex flex-col items-center justify-center relative mb-8 px-6 pt-4">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-[#f0addd]/20 via-purple-100/30 to-blue-100/20 rounded-full blur-[80px] pointer-events-none animate-pulse-slow"></div>

                          <div className="relative z-10 flex items-center justify-center -space-x-5">
                              <div className="relative z-10 transform transition-transform duration-700 hover:-translate-x-2 hover:scale-105 group cursor-pointer">
                                  <div className="w-28 h-28 rounded-full border-[5px] border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden bg-white">
                                      <img src={user.avatar} className="w-full h-full object-cover" alt="Me" />
                                  </div>
                              </div>
                              <div className="relative z-20 flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg border border-slate-50 text-[#f0addd]">
                                  <Infinity size={22} strokeWidth={2.5} className="animate-pulse-slow" />
                              </div>
                              <div className="relative z-10 transform transition-transform duration-700 hover:translate-x-2 hover:scale-105 group cursor-pointer">
                                  {user.partnerName || user.partnerAvatar ? (
                                      <div className="w-28 h-28 rounded-full border-[5px] border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden bg-white">
                                          <img src={user.partnerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.partnerName}`} className="w-full h-full object-cover" alt="Partner" />
                                      </div>
                                  ) : (
                                      <div onClick={() => handleTriggerInvite(activeCircleId)} className="w-28 h-28 rounded-full border-[5px] border-white border-dashed bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-inner text-slate-300 hover:text-slate-400">
                                          <Plus size={32} />
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="text-center mt-8 relative z-10 animate-slide-up">
                              <h2 className="text-4xl md:text-5xl font-serif text-slate-900 tracking-tight leading-tight">
                                  <span className="font-medium">{user.name.split(' ')[0]}</span>
                                  <span className="text-[#f0addd] font-serif italic mx-3 font-light">&</span>
                                  <span className="font-medium">{user.partnerName ? user.partnerName.split(' ')[0] : 'Partner'}</span>
                              </h2>
                          </div>

                          <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in relative z-20">
                                <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 flex items-center gap-2 hover:shadow-md transition-shadow">
                                    <Flame size={14} className="text-orange-500 fill-orange-500 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{streak} Day Streak</span>
                                </div>
                                <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 flex items-center gap-2 hover:shadow-md transition-shadow">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{totalMemories} Memories</span>
                                </div>
                                <div className="group relative px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 flex items-center gap-2 cursor-help hover:shadow-md transition-shadow">
                                    <Activity size={14} className="text-[#f0addd]" />
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{synergyScore}% Synergy</span>
                                </div>
                          </div>
                      </div>

                      {/* PULSE SECTION */}
                      <div className="px-6 mb-16 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                          <div className="text-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Current Resonance</p>
                              <h3 className={`text-3xl font-serif ${pulseStatus.color} tracking-tight transition-colors duration-1000`}>
                                  {pulseStatus.text}
                              </h3>
                              <div className="h-1 w-16 bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-auto mt-8 opacity-50"></div>
                          </div>
                      </div>

                      {/* ARTIFACTS */}
                      <div className="px-6 max-w-2xl mx-auto space-y-12">
                          <div className="grid grid-cols-2 gap-4">
                              <div 
                                onClick={() => onViewArtifact('letter')}
                                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between aspect-square relative overflow-hidden"
                              >
                                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ArrowRight size={16} className="text-[#f0addd]" />
                                  </div>
                                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-[#f0addd] group-hover:text-white transition-colors duration-500">
                                      <Mail size={20} strokeWidth={1.5} />
                                  </div>
                                  <div>
                                      <h4 className="font-serif text-lg text-slate-900 mb-1 font-bold">To Future Us</h4>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-[#f0addd] transition-colors">Opens in 5 Years</p>
                                  </div>
                              </div>

                              <div 
                                onClick={() => onViewArtifact('reel')}
                                className="bg-slate-900 p-6 rounded-[2rem] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between aspect-square relative overflow-hidden"
                              >
                                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/noise.png')]"></div>
                                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                      <Play size={16} fill="currentColor" />
                                  </div>
                                  <div className="relative z-10 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm group-hover:bg-white group-hover:text-slate-900 transition-colors duration-500">
                                      <Film size={20} strokeWidth={1.5} />
                                  </div>
                                  <div className="relative z-10">
                                      <h4 className="font-serif text-lg text-white mb-1 font-bold">Chapter Reel</h4>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">The Highlights</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </>
              )}

               {/* Love Notes Wall */}
              <div className="px-6">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                          <Heart size={18} className="text-belluh-300 fill-belluh-300" />
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Love Notes</h3>
                      </div>
                      {activeCircle?.status === CircleStatus.Active && (
                          <button onClick={() => setIsAddingNote(!isAddingNote)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-belluh-50 hover:text-belluh-500 transition-colors">
                              {isAddingNote ? <X size={14} /> : <Plus size={14} />}
                          </button>
                      )}
                  </div>

                  {isAddingNote && (
                      <div className="mb-8 animate-slide-up relative z-20">
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl ring-4 ring-slate-50/50">
                                <textarea 
                                    autoFocus
                                    value={newNoteContent}
                                    onChange={e => setNewNoteContent(e.target.value)}
                                    placeholder="Leave a sweet note..."
                                    className="w-full text-xl font-serif mb-4 focus:outline-none resize-none bg-transparent placeholder:text-slate-300 leading-relaxed"
                                    rows={3}
                                />
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <Lock size={10} />
                                        Visible to {activeTab === 'us' ? 'Partner' : 'Me'}
                                    </div>
                                    <button 
                                        onClick={handleAddNote} 
                                        disabled={!newNoteContent.trim()}
                                        className="bg-slate-900 text-white pl-5 pr-6 py-3 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-black transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg"
                                    >
                                        <span>Stick It</span>
                                        <Send size={12} />
                                    </button>
                                </div>
                          </div>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                      {notes.length === 0 && (
                          <div className="col-span-2 text-center py-8 text-slate-400 text-sm italic">
                              No notes yet. Leave one for your partner to find.
                          </div>
                      )}
                      {notes.map((note, index) => {
                          const styleClass = STICKY_STYLES[index % STICKY_STYLES.length];
                          const isDragging = draggingId === note.id;
                          return (
                            <div 
                                key={note.id} 
                                className={`relative group transition-all duration-500 ${isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}`}
                                draggable={activeCircle?.status === CircleStatus.Active}
                                onDragStart={(e) => handleDragStart(e, note.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, note.id)}
                            >
                                <div className={`p-6 aspect-square flex flex-col justify-between transition-all duration-300 hover:scale-[1.05] hover:z-20 hover:shadow-xl cursor-grab active:cursor-grabbing rounded-3xl ${styleClass}`}>
                                    {note.isPinned && <div className="w-8 h-1.5 bg-black/10 mx-auto -mt-2 mb-2 rounded-full"></div>}
                                    <p className="font-serif text-[15px] leading-snug font-medium text-center flex-1 flex items-center justify-center pointer-events-none select-none">{note.content}</p>
                                </div>
                                {activeCircle?.status === CircleStatus.Active && (
                                    <button onClick={() => deleteNote(note.id)} className="absolute -top-2 -right-2 bg-white p-2 rounded-full text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer z-30 scale-75 hover:scale-100">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                          );
                      })}
                  </div>
              </div>

               {/* Shared Dreams */}
              <div className="px-6 pb-20">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                          <Trophy size={18} className="text-[#f0addd] fill-[#f0addd]" />
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Shared Dreams</h3>
                      </div>
                      {activeCircle?.status === CircleStatus.Active && (
                          <button onClick={() => setIsAddingGoal(!isAddingGoal)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-belluh-50 hover:text-belluh-500 transition-colors">
                              {isAddingGoal ? <X size={14} /> : <Plus size={14} />}
                          </button>
                      )}
                  </div>

                  {isAddingGoal && (
                      <div className="mb-6 animate-slide-up flex gap-2">
                          <input 
                              type="text" 
                              value={newGoal} 
                              onChange={(e) => setNewGoal(e.target.value)} 
                              onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                              placeholder="Add a new dream..." 
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-belluh-100"
                              autoFocus
                          />
                          <button onClick={handleAddGoal} disabled={!newGoal.trim()} className="bg-slate-900 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-black transition-colors">
                              <Plus size={20} />
                          </button>
                      </div>
                  )}

                  <div className="space-y-2">
                      {goals.length === 0 && (
                          <div className="text-center py-4 text-slate-400 text-sm italic">
                              What do you want to achieve together?
                          </div>
                      )}
                      {goals.map(goal => (
                          <div 
                              key={goal.id} 
                              className="group flex items-center justify-between p-4 bg-transparent hover:bg-white rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100 hover:shadow-sm" 
                              onClick={() => activeCircle?.status === CircleStatus.Active && toggleGoal(goal.id)}
                          >
                              <div className="flex items-center gap-4">
                                  <div className={`
                                      w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-300
                                      ${goal.isCompleted 
                                        ? 'bg-[#f0addd] border-[#f0addd]' 
                                        : 'bg-transparent border-slate-300 group-hover:border-slate-500'
                                      }
                                  `}>
                                      {goal.isCompleted && <Check size={14} className="text-white" />}
                                  </div>
                                  <span className={`text-[15px] font-medium font-serif transition-all ${goal.isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'}`}>
                                      {goal.title}
                                  </span>
                              </div>
                              {activeCircle?.status === CircleStatus.Active && (
                                  <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteGoal(goal.id);
                                    }}
                                    className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      ) : (
          <div className="px-6 animate-fade-in pb-20">
              <div className="flex flex-col items-center mb-12 relative">
                  <div className="relative group cursor-pointer">
                      <div className="w-32 h-32 rounded-full border-[6px] border-white shadow-2xl overflow-hidden mb-6 relative ring-1 ring-slate-100">
                          <img src={user.avatar} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Avatar"/>
                          {isEditingProfile && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm animate-fade-in">
                                  <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                                      <Camera size={24} className="text-white mb-1" />
                                      <span className="text-[10px] text-white font-bold uppercase tracking-widest">Upload</span>
                                      <input 
                                          type="file" 
                                          accept="image/*"
                                          className="hidden"
                                          onChange={handleAvatarUpload}
                                      />
                                  </label>
                              </div>
                          )}
                      </div>
                      <button 
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className="absolute bottom-6 right-0 w-8 h-8 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-110 transition-all"
                      >
                          {isEditingProfile ? <X size={14} /> : <Edit3 size={14} />}
                      </button>
                  </div>
                  
                  {isEditingProfile ? (
                      <div className="w-full max-w-xs animate-slide-up space-y-4">
                          <input 
                              type="text" 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Your Name"
                              className="w-full text-center text-xl font-serif text-slate-900 border-b-2 border-slate-200 py-1 focus:outline-none focus:border-slate-900 bg-transparent"
                          />
                          
                          <div className="flex justify-center">
                              <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 border border-slate-100">
                                  <Camera size={14} />
                                  <span>Choose Photo</span>
                                  <input 
                                      type="file" 
                                      accept="image/*"
                                      className="hidden"
                                      onChange={handleAvatarUpload}
                                  />
                              </label>
                          </div>

                          <button 
                            onClick={handleSaveProfile}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-black transition-colors"
                          >
                              Save Changes
                          </button>
                      </div>
                  ) : (
                      <h2 className="text-3xl font-serif text-slate-900 tracking-tight">{user.name}</h2>
                  )}

                  {!user.partnerName && (
                      <button 
                        onClick={() => handleTriggerInvite('c1')}
                        className="mt-6 flex items-center gap-2 px-5 py-3 rounded-full bg-belluh-50 hover:bg-belluh-100 text-belluh-600 font-bold text-sm shadow-sm hover:shadow-md transition-all animate-pulse-slow"
                      >
                          <UserPlus size={16} />
                          <span>Connect Partner</span>
                      </button>
                  )}
              </div>

              {/* Circles */}
              <div className="mb-12">
                   <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                             <Users size={16} className="text-slate-900" />
                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Circles</h3>
                        </div>
                   </div>

                   <div className="flex gap-4 overflow-x-auto pb-6 pt-8 -mx-6 px-6 no-scrollbar snap-x items-center">
                       <div 
                           onClick={() => setIsCreatingCircle(!isCreatingCircle)}
                           className="w-[240px] h-[140px] shrink-0 rounded-[1.8rem] bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-all duration-300 group snap-start shadow-sm hover:shadow-md"
                       >
                           <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 transition-colors mb-3">
                               <Plus size={24} />
                           </div>
                           <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800">New Circle</span>
                       </div>

                       {isCreatingCircle && (
                            <div className="w-[240px] h-[140px] shrink-0 bg-white p-4 rounded-[1.8rem] shadow-xl border border-slate-100 flex flex-col justify-between animate-scale-in snap-start">
                                <input 
                                    type="text" 
                                    value={newCircleName} 
                                    onChange={(e) => setNewCircleName(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCircle()} 
                                    placeholder="Circle Name..." 
                                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold mb-2"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setIsCreatingCircle(false)} className="flex-1 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                                    <button onClick={handleCreateCircle} disabled={!newCircleName.trim()} className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-black disabled:opacity-50">Create</button>
                                </div>
                            </div>
                       )}

                       {activeCircles.map(circle => (
                           <CircleCard 
                                key={circle.id} 
                                circle={circle} 
                                isActive={activeCircleId === circle.id} 
                                onClick={() => handleCircleSwitch(circle.id)} 
                                user={user}
                                onInvite={handleTriggerInvite}
                           />
                       ))}
                   </div>
                   
                   {archivedCircles.length > 0 && (
                       <div className="mt-8">
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Past Chapters</h3>
                           <div className="flex gap-4 overflow-x-auto pb-6 pt-8 -mx-6 px-6 no-scrollbar snap-x items-center">
                                {archivedCircles.map(circle => (
                                    <div key={circle.id} className="opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                                        <CircleCard 
                                            circle={circle} 
                                            isActive={activeCircleId === circle.id} 
                                            onClick={() => handleCircleSwitch(circle.id)} 
                                            user={user}
                                            onInvite={handleTriggerInvite}
                                        />
                                    </div>
                                ))}
                           </div>
                       </div>
                   )}

                   <div className="mt-8">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-1">Your Story</h3>
                      <button 
                        onClick={() => handleCircleSwitch('constellation')}
                        className={`w-full relative overflow-hidden rounded-[1.8rem] p-6 text-left group transition-all duration-300
                            ${activeCircleId === 'constellation' 
                                ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' 
                                : 'bg-slate-900 text-white shadow-md hover:shadow-xl hover:scale-[1.01]'
                            }
                        `}
                      >
                           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] group-hover:bg-white/10 transition-colors pointer-events-none"></div>
                           <div className="absolute bottom-0 left-0 w-40 h-40 bg-belluh-500/30 rounded-full blur-[60px] pointer-events-none"></div>
                           
                           <div className="relative z-10 flex items-center justify-between">
                               <div>
                                   <div className="flex items-center gap-2 mb-2">
                                       <Star size={16} className={activeCircleId === 'constellation' ? "text-belluh-300 fill-belluh-300" : "text-belluh-300"} />
                                       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">The Constellation</span>
                                   </div>
                                   <h4 className="text-xl font-serif">All Your Stars Aligned</h4>
                                   <p className="text-xs text-slate-400 mt-1 max-w-xs">A combined timeline of every relationship, every moment, and every lesson learned.</p>
                               </div>
                               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                                   <ChevronRight size={20} />
                               </div>
                           </div>
                      </button>
                   </div>
              </div>

              {showInviteModal && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowInviteModal(false)}>
                      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm animate-pop shadow-2xl border border-slate-50 text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
                          
                          <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                              <UserPlus size={28} />
                          </div>

                          <h2 className="text-2xl font-serif text-slate-900 mb-3">Invite to Circle</h2>
                          <p className="text-slate-500 text-sm mb-8 leading-relaxed px-4">
                             Enter their email to add them. They must have a Belluh account.
                          </p>

                          {inviteStatus === 'sent' ? (
                              <div className="py-8 animate-pop">
                                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                      <CheckCircle2 size={32} className="text-green-500" />
                                  </div>
                                  <h3 className="text-xl font-bold text-slate-900">Invite Sent!</h3>
                                  <p className="text-sm text-slate-500 mt-2">Refreshing...</p>
                              </div>
                          ) : (
                              <form onSubmit={handleSendInvite} className="space-y-4">
                                  <div className="relative">
                                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                      <input 
                                          type="email" 
                                          required
                                          autoFocus
                                          value={inviteEmail}
                                          onChange={(e) => setInviteEmail(e.target.value)}
                                          placeholder="friend@email.com"
                                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-belluh-200 transition-all"
                                      />
                                  </div>

                                  {inviteStatus === 'not-found' && (
                                      <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold">
                                          User not found. Ask them to sign up!
                                      </div>
                                  )}

                                  <button 
                                      type="submit"
                                      disabled={inviteStatus === 'searching'}
                                      className="w-full bg-[#f0addd] text-white py-4 rounded-xl font-bold hover:bg-belluh-400 transition-all shadow-lg active:scale-95 disabled:opacity-70"
                                  >
                                      {inviteStatus === 'searching' ? 'Checking...' : 'Send Invite'}
                                  </button>
                              </form>
                          )}
                      </div>
                  </div>
              )}

              <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2">Data & Privacy</h3>
                  
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-start gap-4">
                             <div className="p-3 bg-slate-50 rounded-full"><Shield size={20} className="text-slate-600"/></div>
                             <div>
                                 <h4 className="font-bold text-slate-900 text-sm">End-to-End Encryption</h4>
                                 <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                     Your entries are private. Only you can read them. Not even Belluh staff can access your journal.
                                 </p>
                             </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex gap-4">
                            <button 
                                onClick={handleExportData}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                            >
                                <Download size={14} />
                                Export JSON
                            </button>
                            <button 
                                onClick={handleDeleteData}
                                className="flex-1 py-3 px-4 rounded-xl border border-red-100 text-red-500 bg-red-50/50 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100/50 transition-colors"
                            >
                                <Trash2 size={14} />
                                Delete All
                            </button>
                        </div>
                        
                        <div className="pt-2 flex flex-col gap-2">
                             <button onClick={() => onShowLegal('tos')} className="flex items-center gap-3 text-sm text-slate-500 hover:text-slate-900 transition-colors px-2 py-2 rounded-xl hover:bg-slate-50">
                                 <FileText size={16} />
                                 Terms of Service
                             </button>
                             <button onClick={() => onShowLegal('privacy')} className="flex items-center gap-3 text-sm text-slate-500 hover:text-slate-900 transition-colors px-2 py-2 rounded-xl hover:bg-slate-50">
                                 <Shield size={16} />
                                 Privacy Policy
                             </button>
                        </div>
                  </div>

                  <button onClick={onLogout} className="w-full p-4 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors text-sm font-bold mt-8">
                      Log Out
                  </button>
              </div>
          </div>
      )}

      {showSettingsModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 transition-opacity" onClick={() => setShowSettingsModal(false)}>
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm animate-pop shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <h3 className="font-serif text-2xl mb-8 text-slate-900 tracking-tight">Settings</h3>
                  
                  {!showArchiveConfirm ? (
                      <>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center p-2">
                                <span className="text-sm font-bold text-slate-600">Notifications</span>
                                <div className="w-12 h-7 bg-green-400 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm"></div></div>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    setShowSettingsModal(false);
                                    if (onLogout) onLogout();
                                }}
                                className="w-full py-3 text-left px-2 flex items-center justify-between text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                            >
                                <span className="text-sm font-bold">Log Out</span>
                                <LogOut size={16} />
                            </button>

                            {activeCircle?.status === CircleStatus.Active && activeCircle.type === CircleType.Couple && (
                                <button 
                                    onClick={() => setShowArchiveConfirm(true)}
                                    className="w-full py-4 text-left px-2 flex items-center justify-between text-rose-500 hover:bg-rose-50 rounded-xl transition-colors mt-2 border-t border-slate-50"
                                >
                                    <span className="text-sm font-bold">End Shared Space</span>
                                    <ChevronRight size={16} />
                                </button>
                            )}
                        </div>
                        <button onClick={() => setShowSettingsModal(false)} className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-black transition-transform active:scale-95 shadow-xl shadow-slate-200">Done</button>
                      </>
                  ) : (
                      <div className="animate-slide-up">
                          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Archive size={24} className="text-rose-500" />
                          </div>
                          <h4 className="text-xl font-bold text-slate-900 text-center mb-2">Archive Relationship?</h4>
                          <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">
                              This will move <strong>{activeCircle?.name}</strong> to "Past Chapters". You will keep your copy of all memories, but you won't be able to add new ones.
                          </p>
                          <div className="space-y-3">
                              <button onClick={handleArchiveCircle} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold text-sm hover:bg-rose-600 shadow-lg shadow-rose-200">
                                  Yes, Archive It
                              </button>
                              <button onClick={() => setShowArchiveConfirm(false)} className="w-full py-4 text-slate-500 font-bold text-sm">
                                  Cancel
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Profile;