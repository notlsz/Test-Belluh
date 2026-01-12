import React, { useState, useMemo, useEffect } from 'react';
import TabBar from './components/TabBar';
import Journal from './pages/Journal';
import Timeline from './pages/Timeline';
import AICoach from './pages/AICoach';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import AdminMetrics from './pages/AdminMetrics';
import LegalModal from './components/LegalModal';
import ArtifactModal from './components/ArtifactModal';
import { CURRENT_USER, MOCK_INSIGHTS } from './constants';
import { JournalEntry, EntryType, Mood, User, CircleType, CircleStatus } from './types';
import { Sparkles, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { useAdminAccess } from './hooks/useAdminAccess';
import { trackEvent } from './services/analytics';

// Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-slate-900 text-white',
    error: 'bg-rose-500 text-white',
    info: 'bg-belluh-300 text-slate-900',
  };

  const Icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  const Icon = Icons[type];

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl animate-slide-up ${bgColors[type]}`}>
      <Icon size={18} strokeWidth={2.5} />
      <span className="text-sm font-bold">{message}</span>
    </div>
  );
};

// Types for Invite Handling
type PendingInvite = {
  id: string; // Connection ID
  inviter: {
    id: string;
    name: string;
    avatar: string;
  }
};

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added loading state to prevent flash
  const [isOnboarding, setIsOnboarding] = useState(false);
  
  // View State for Unauthenticated Users ('landing' | 'auth' | 'about')
  const [authView, setAuthView] = useState<'landing' | 'auth' | 'about'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  
  // App State
  const [currentTab, setCurrentTab] = useState('timeline');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composePrompt, setComposePrompt] = useState<string | undefined>(undefined);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [streak, setStreak] = useState(0);
  
  // Pending Invites State
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  
  // Notification State
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  // Initialize with empty user state for fresh start
  const [user, setUser] = useState<User>({
      id: '',
      name: '',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
      partnerName: undefined,
      circles: [],
      isPremium: false,
      joinDate: new Date(),
      activeCircleId: 'c1',
      settings: CURRENT_USER.settings,
      hasCompletedOnboarding: false,
      detectedPersona: CURRENT_USER.detectedPersona
  });
  
  const [showPremiumOverlay, setShowPremiumOverlay] = useState(false);

  // Legal Modal State
  const [legalModalOpen, setLegalModalOpen] = useState<'tos' | 'privacy' | null>(null);
  
  // Artifact Modal State
  const [artifactModalOpen, setArtifactModalOpen] = useState<'reel' | 'letter' | null>(null);

  // STEALTH ADMIN ACCESS HOOK
  const { showAdmin, setShowAdmin, isUserAdmin } = useAdminAccess(user.id);

  // --- Auth Helpers ---

  const resetUserState = () => {
      setIsAuthenticated(false);
      setEntries([]);
      setStreak(0);
      setUser({
          id: '',
          name: '',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
          partnerName: undefined,
          circles: [],
          isPremium: false,
          joinDate: new Date(),
          activeCircleId: 'c1',
          settings: CURRENT_USER.settings,
          hasCompletedOnboarding: false,
          detectedPersona: CURRENT_USER.detectedPersona
      });
      setIsLoading(false);
  };

  const loadUserData = async (sessionUser: any) => {
      try {
        trackEvent('app_opened', { source: 'web' });

        // --- HANDLE INVITE LINKS ---
        // Check for ?invite=USER_ID in URL
        const params = new URLSearchParams(window.location.search);
        const inviteId = params.get('invite');
        if (inviteId && inviteId !== sessionUser.id) {
            // Check if connection already exists
            const { data: existing } = await supabase.from('partner_connections').select('*')
                .or(`and(user_id.eq.${inviteId},partner_id.eq.${sessionUser.id}),and(user_id.eq.${sessionUser.id},partner_id.eq.${inviteId})`);
            
            if (!existing || existing.length === 0) {
                // Insert new pending invite (inviteId invited sessionUser)
                await supabase.from('partner_connections').insert({
                    user_id: inviteId,
                    partner_id: sessionUser.id,
                    status: 'pending'
                });
                showNotification("Invite received! Check your profile.", "success");
                trackEvent('invite_received', { inviter_id: inviteId });
            }
            // Clean URL
            window.history.replaceState({}, document.title, "/");
        }

        // 1. Fetch User Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .single();

        // 2. Fetch Active Partner Connections (Connected) - Support Multiple
        const { data: connections } = await supabase
            .from('partner_connections')
            .select('*')
            .eq('status', 'connected')
            .or(`user_id.eq.${sessionUser.id},partner_id.eq.${sessionUser.id}`);
        
        let connectedUserIds: string[] = [];
        let partnerProfile = null;

        if (connections && connections.length > 0) {
            // Get all connected IDs
            connectedUserIds = connections.map((c: any) => 
                c.user_id === sessionUser.id ? c.partner_id : c.user_id
            );

            // Fetch all connected profiles
            const { data: connectedProfiles } = await supabase
                .from('profiles')
                .select('*')
                .in('id', connectedUserIds);
            
            // Set primary partner as the first one found (for backward compat with UI showing one partner)
            if (connectedProfiles && connectedProfiles.length > 0) {
                partnerProfile = connectedProfiles[0];
            }
        }

        // 3. Fetch Pending Incoming Invites
        const { data: pendingRows } = await supabase
            .from('partner_connections')
            .select('*')
            .eq('partner_id', sessionUser.id)
            .eq('status', 'pending');
        
        if (pendingRows && pendingRows.length > 0) {
            const inviterIds = pendingRows.map((r: any) => r.user_id);
            const { data: inviters } = await supabase.from('profiles').select('*').in('id', inviterIds);
            
            const invites: PendingInvite[] = pendingRows.map((r: any) => {
                const inviter = inviters?.find((p: any) => p.id === r.user_id);
                return {
                    id: r.id, // connection id
                    inviter: {
                        id: inviter?.id,
                        name: inviter?.full_name || 'Unknown User',
                        avatar: inviter?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown'
                    }
                };
            });
            setPendingInvites(invites);
        } else {
            setPendingInvites([]);
        }

        // 4. Fetch All Journal Entries (Content + System Data for ALL connected users)
        // Includes: My entries + Connected users' entries + System definitions
        const allUserIds = [sessionUser.id, ...connectedUserIds];
        
        const { data: dbEntries } = await supabase
            .from('journal_entries')
            .select('*')
            .in('user_id', allUserIds)
            .order('created_at', { ascending: false });

        // 5. Build Circles
        const newCircles: any[] = [];
        const myFirstName = profile?.full_name?.trim().split(' ')[0] || 'Me';
        
        // Couple Circle (Default / Primary)
        if (partnerProfile) {
            const partnerFirstName = partnerProfile.full_name?.trim().split(' ')[0] || 'Partner';
            const circleName = `${myFirstName} & ${partnerFirstName}`;

            newCircles.push({
                id: 'c1',
                name: circleName,
                type: CircleType.Couple as any,
                status: CircleStatus.Active as any,
                members: [sessionUser.id, partnerProfile.id],
                themeColor: '#f0addd',
                avatar: partnerProfile.avatar_url,
                startDate: new Date()
            });
        } else {
             newCircles.push({
                id: 'c1',
                name: `${myFirstName}'s Space`,
                type: CircleType.Custom as any,
                status: CircleStatus.Active as any,
                members: [sessionUser.id],
                themeColor: '#cbd5e1'
             });
        }

        // Custom Circles (from System Entries)
        if (dbEntries) {
            // A. Find Circle Definitions
            const systemEntries = dbEntries.filter((e: any) => e.tags && e.tags.includes('system_circle_def'));
            
            // B. Find Circle Memberships (Users added to circles via system entries)
            const membershipEntries = dbEntries.filter((e: any) => e.tags && e.tags.includes('system_circle_member'));

            systemEntries.forEach((e: any) => {
                // Determine members: Owner + anyone with a membership entry for this circle
                const memberIds = [e.user_id]; 
                
                // Look for memberships for this circle
                const relatedMemberships = membershipEntries.filter((m: any) => 
                    m.tags && m.tags.some((t: string) => t === `circle:${e.id}`)
                );
                
                relatedMemberships.forEach((m: any) => {
                    // Extract member ID from tags (member:uuid) or content
                    const memberTag = m.tags.find((t: string) => t.startsWith('member:'));
                    if (memberTag) {
                        const memberId = memberTag.split(':')[1];
                        if (memberId && !memberIds.includes(memberId)) {
                            memberIds.push(memberId);
                        }
                    }
                });

                newCircles.push({
                    id: e.id,
                    name: e.title || 'Untitled Circle',
                    type: CircleType.Custom,
                    status: CircleStatus.Active,
                    members: memberIds,
                    themeColor: e.content || '#cbd5e1', 
                    startDate: new Date(e.created_at)
                });
            });
        }

        // 6. Process User Content Entries (Filter out system tags)
        if (dbEntries) {
            const contentEntries = dbEntries.filter((e: any) => 
                !e.tags || (!e.tags.includes('system_circle_def') && !e.tags.includes('system_circle_member'))
            );
            
            const mappedEntries: JournalEntry[] = contentEntries.map((e: any) => {
                const isMine = e.user_id === sessionUser.id;
                
                // Determine Author Name/Avatar
                // If it's mine, use my profile. If not, look in connected profiles (only if we fetched them previously, otherwise fallback)
                
                let authorName = 'Unknown';
                let authorAvatar = '';

                if (isMine) {
                    authorName = profile?.full_name || 'Me';
                    authorAvatar = profile?.avatar_url || '';
                } else {
                    if (partnerProfile && e.user_id === partnerProfile.id) {
                        authorName = partnerProfile.full_name;
                        authorAvatar = partnerProfile.avatar_url;
                    } else {
                        authorName = 'Friend'; 
                        authorAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + e.user_id;
                    }
                }

                // Parse circle ID from tags (format: circle:uuid)
                const circleTag = e.tags && Array.isArray(e.tags) 
                    ? e.tags.find((t: string) => t.startsWith('circle:')) 
                    : null;
                // Default to 'c1' if no tag is present (backward compatibility)
                const entryCircleId = circleTag ? circleTag.split(':')[1] : 'c1';

                return {
                    id: e.id,
                    userId: e.user_id,
                    authorName,
                    authorAvatar,
                    content: e.content || '',
                    timestamp: new Date(e.created_at),
                    type: e.type as EntryType,
                    mood: e.mood as Mood,
                    prompt: e.title,
                    isPrivate: !e.is_shared,
                    circleId: entryCircleId, 
                    likes: e.is_favorite ? 1 : 0, 
                    isLiked: e.is_favorite,
                    mediaUrl: e.photo_url,
                    audioUrl: e.audio_url
                };
            });
            setEntries(mappedEntries);
        }

        // Update User State
        const currentStreak = profile?.journal_streak || 0;
        setStreak(currentStreak);

        const displayPartnerName = profile?.partner_name || partnerProfile?.full_name || undefined;

        setUser(prev => ({ 
            ...prev, 
            id: sessionUser.id, 
            name: profile?.full_name || sessionUser.email?.split('@')[0] || 'User',
            avatar: profile?.avatar_url || prev.avatar,
            partnerName: displayPartnerName,
            partnerAvatar: partnerProfile?.avatar_url || undefined,
            circles: newCircles as any,
            activeCircleId: 'c1',
            isPremium: false,
            settings: CURRENT_USER.settings,
            hasCompletedOnboarding: !!displayPartnerName
        }));
        
        if (!displayPartnerName && !partnerProfile) {
           setIsOnboarding(true);
        } else {
            setIsOnboarding(false);
        }

        setIsAuthenticated(true);
      } catch (err) {
          console.error("Failed to load user data", err);
          // Don't reset state here, just stop loading to allow retry or show error
      } finally {
          setIsLoading(false);
      }
  };

  // Initialize Supabase Auth & Data
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
        // 1. Immediate Session Check (try local storage first)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
            if (mounted) await loadUserData(session.user);
        } else {
             // Do not reset immediately if we suspect a race condition with subscription
             // But usually it's safe to assume no session if getSession returns null
             if (mounted) resetUserState();
        }

        // 2. Auth State Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                if (session?.user && mounted) {
                    await loadUserData(session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                if (mounted) resetUserState();
            }
        });

        return () => subscription.unsubscribe();
    };

    initialize();

    return () => { mounted = false; };
  }, []);

  const partnerHasEntry = useMemo(() => {
    const today = new Date();
    return entries.some(e => 
        e.userId !== user.id && 
        e.circleId === user.activeCircleId &&
        e.timestamp.getDate() === today.getDate() && 
        e.timestamp.getMonth() === today.getMonth() &&
        e.timestamp.getFullYear() === today.getFullYear()
    );
  }, [entries, user.id, user.activeCircleId]);

  const handleTriggerPremium = () => {
    trackEvent('premium_trigger_clicked');
    setShowPremiumOverlay(true);
  };

  const handleLogin = () => {
      // Handled by onAuthStateChange
  };

  const handleLogout = async () => {
      try {
        trackEvent('logout');
        await supabase.auth.signOut();
        showNotification('Logged out successfully', 'success');
      } catch (error) {
        console.warn("Logout error:", error);
      } finally {
        resetUserState();
      }
  };

  const updateStreakLogic = async (userId: string) => {
    const today = new Date().toDateString();
    
    const existingEntryToday = entries.some(e => 
        e.userId === userId && 
        e.timestamp.toDateString() === today
    );

    let newStreak = streak;

    if (!existingEntryToday) {
        // If they hadn't posted today yet, check yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        const hasEntryYesterday = entries.some(e => 
            e.userId === userId && 
            e.timestamp.toDateString() === yesterdayStr
        );

        if (streak === 0) {
            newStreak = 1;
        } else if (hasEntryYesterday) {
            newStreak = streak + 1;
        } else {
            // Broken streak, reset to 1 (since they just posted)
            newStreak = 1;
        }
    } 
    // If they already posted today, streak doesn't increase again

    setStreak(newStreak);
    await supabase.from('profiles').update({ journal_streak: newStreak }).eq('id', userId);
  };

  const handleOnboardingComplete = async (partnerName: string, firstEntry: string) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    trackEvent('onboarding_completed');

    const { error: profileError } = await supabase
        .from('profiles')
        .update({ partner_name: partnerName })
        .eq('id', currentUser.id)
        .select()
        .single();

    const newEntryPayload = {
        user_id: currentUser.id,
        content: firstEntry,
        type: 'Freeform', 
        is_shared: false, 
        is_favorite: false,
        tags: ['onboarding', 'first_magic_moment', 'circle:c1'], // Default to c1
        date: new Date().toISOString()
    };
    
    const { data: entryData, error: entryError } = await supabase.from('journal_entries').insert([newEntryPayload]).select().single();

    if (profileError || entryError) console.error(profileError || entryError);

    if (entryData) {
        const newEntry: JournalEntry = {
            id: entryData.id,
            userId: currentUser.id,
            authorName: user.name,
            authorAvatar: user.avatar,
            content: firstEntry,
            timestamp: new Date(),
            type: EntryType.Freeform,
            mood: Mood.Grateful,
            isPrivate: true,
            circleId: 'c1',
            likes: 0,
            isLiked: false
        };
        setEntries(prev => [newEntry, ...prev]);
        setUser(prev => ({ ...prev, partnerName: partnerName, hasCompletedOnboarding: true }));
        await updateStreakLogic(currentUser.id);
    } else {
        setUser(prev => ({ ...prev, partnerName: partnerName, hasCompletedOnboarding: true }));
    }
    
    setIsOnboarding(false);
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
          showNotification('You must be logged in to update your profile', 'error');
          return;
      }

      const updatePayload: any = {};
      if (updates.name !== undefined) updatePayload.full_name = updates.name;
      if (updates.avatar !== undefined) updatePayload.avatar_url = updates.avatar;

      if (Object.keys(updatePayload).length > 0) {
          const { data, error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', currentUser.id)
            .select()
            .single();

          if (error) {
              console.error(error);
              showNotification('Failed to update profile', 'error');
              return;
          }
          
          trackEvent('profile_updated');

          // Dynamic Circle Renaming Logic
          const myNewName = (data.full_name || user.name).split(' ')[0];
          const partnerName = user.partnerName ? user.partnerName.split(' ')[0] : 'Partner';
          
          const updatedCircles = user.circles.map(c => {
              if (c.type === CircleType.Couple) {
                  return { ...c, name: `${myNewName} & ${partnerName}` };
              }
              return c;
          });

          setUser(prev => ({ 
              ...prev, 
              name: data.full_name, 
              avatar: data.avatar_url,
              circles: updatedCircles
          }));
          showNotification('Profile updated successfully', 'success');
      }
  };

  // NEW: Create Circle Logic (Persisted via Journal Entry workaround)
  const handleCreateCircle = async (name: string) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

      // Create a "System" entry to store the circle definition
      const { data, error } = await supabase.from('journal_entries').insert([{
          user_id: currentUser.id,
          title: name,
          content: randomColor, // Store color in content
          type: 'Milestone', // Use Milestone type for system events
          tags: ['system_circle_def'], // Tag to identify as circle def
          is_shared: false,
          date: new Date().toISOString()
      }]).select().single();

      if (data && !error) {
          trackEvent('circle_created', { circle_name: name });
          const newCircle: any = {
              id: data.id,
              name: name,
              type: CircleType.Custom,
              status: CircleStatus.Active,
              members: [currentUser.id],
              themeColor: randomColor,
              startDate: new Date()
          };
          
          setUser(prev => ({
              ...prev,
              circles: [...prev.circles, newCircle],
              activeCircleId: newCircle.id // Automatically switch to the new circle
          }));
          showNotification('New circle created!', 'success');
      } else {
          console.error(error);
          showNotification('Failed to create circle.', 'error');
      }
  };

  const handleAcceptInvite = async (connectionId: string) => {
      const { error } = await supabase
          .from('partner_connections')
          .update({ status: 'connected' })
          .eq('id', connectionId);

      if (error) {
          showNotification('Failed to accept invite', 'error');
      } else {
          trackEvent('invite_accepted');
          showNotification('Invite accepted! Refreshing...', 'success');
          window.location.reload(); 
      }
  };

  const handleDeclineInvite = async (connectionId: string) => {
      const { error } = await supabase
          .from('partner_connections')
          .delete()
          .eq('id', connectionId);

      if (error) {
          showNotification('Failed to decline invite', 'error');
      } else {
          setPendingInvites(prev => prev.filter(i => i.id !== connectionId));
          showNotification('Invite declined', 'success');
      }
  };

  const handleCompose = (prompt?: string) => {
      const actualPrompt = typeof prompt === 'string' ? prompt : undefined;
      setComposePrompt(actualPrompt);
      setIsComposeOpen(true);
  };

  const handleAddEntry = async (content: string, mood: Mood | undefined, type: EntryType, prompt?: string, isPrivate?: boolean, audioUrl?: string, mediaUrl?: string) => {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return;

    const newEntryPayload = {
        user_id: currentUser.id,
        content,
        type,
        mood,
        title: prompt,
        is_shared: !isPrivate,
        audio_url: audioUrl,
        photo_url: mediaUrl,
        date: new Date().toISOString(),
        tags: [`circle:${user.activeCircleId}`] // Persist Circle ID
    };

    const { data, error } = await supabase.from('journal_entries').insert([newEntryPayload]).select().single();

    if (data && !error) {
         trackEvent('journal_entry_created', { type, mood, has_media: !!mediaUrl || !!audioUrl });
         const newEntry: JournalEntry = {
            id: data.id,
            userId: currentUser.id,
            authorName: user.name,
            authorAvatar: user.avatar,
            content,
            timestamp: new Date(data.created_at),
            type,
            mood,
            prompt,
            isPrivate: isPrivate || false,
            circleId: user.activeCircleId, 
            likes: 0,
            isLiked: false,
            audioUrl: audioUrl,
            mediaUrl: mediaUrl
        };
        setEntries(prev => [newEntry, ...prev]);
        setIsComposeOpen(false); 
        setComposePrompt(undefined);
        await updateStreakLogic(currentUser.id);
        showNotification('Memory captured successfully', 'success');

    } else if (error) {
        console.error("Error saving entry:", error);
        showNotification('Failed to save entry. Please try again.', 'error');
    }
  };

  const handleUpdateEntry = async (entryId: string, newContent: string) => {
    const { error } = await supabase
        .from('journal_entries')
        .update({ content: newContent })
        .eq('id', entryId);

    if (!error) {
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, content: newContent } : e));
        showNotification('Entry updated', 'success');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
      const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
      if (!error) {
        setEntries(prev => prev.filter(e => e.id !== entryId));
        showNotification('Entry deleted', 'success');
      }
  };

  const handleLikeEntry = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    const newLikedState = !entry.isLiked;
    if (newLikedState) trackEvent('entry_liked');
    
    setEntries(prevEntries => prevEntries.map(e => {
      if (e.id === entryId) {
        return { ...e, isLiked: newLikedState, likes: (e.likes || 0) + (newLikedState ? 1 : -1) };
      }
      return e;
    }));

    await supabase
        .from('journal_entries')
        .update({ is_favorite: newLikedState })
        .eq('id', entryId);
  };

  const handleCircleChange = (circleId: string) => {
      setUser({...user, activeCircleId: circleId});
  };

  // --- Routing Logic ---
  
  if (isLoading) {
      return (
          <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
              <div className="flex flex-col items-center animate-pulse">
                  <Sparkles className="text-belluh-300 w-10 h-10 mb-4" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Belluh...</p>
              </div>
          </div>
      );
  }

  // Admin Overlay (Stealth Mode)
  // This renders ON TOP of everything else if active, instead of as a route.
  if (showAdmin && isUserAdmin) {
      return <AdminMetrics onBack={() => setShowAdmin(false)} />;
  }

  if (!isAuthenticated) {
      if (authView === 'landing') {
          return (
              <>
                <LandingPage 
                    onGetStarted={() => {
                        setAuthMode('signup');
                        setAuthView('auth');
                    }} 
                    onLogin={() => {
                        setAuthMode('login');
                        setAuthView('auth');
                    }} 
                    onShowLegal={(type) => setLegalModalOpen(type)}
                    onGoToAbout={() => setAuthView('about')}
                />
                {legalModalOpen && (
                    <LegalModal type={legalModalOpen} onClose={() => setLegalModalOpen(null)} />
                )}
                {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
              </>
          );
      }
      
      if (authView === 'about') {
          return (
            <About 
                onBack={() => setAuthView('landing')} 
                onGetStarted={() => {
                    setAuthMode('signup');
                    setAuthView('auth');
                }} 
                onLogin={() => {
                    setAuthMode('login');
                    setAuthView('auth');
                }}
            />
          );
      }

      // 'auth' view
      return (
        <>
            <Auth 
                initialView={authMode}
                onLogin={handleLogin} 
                onShowLegal={(type) => setLegalModalOpen(type)} 
                onShowToast={showNotification} 
            />
            {legalModalOpen && (
                <LegalModal type={legalModalOpen} onClose={() => setLegalModalOpen(null)} />
            )}
            {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        </>
      );
  }

  if (isOnboarding) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'timeline':
        let timelineEntries: JournalEntry[] = entries;
        
        // Isolate entries to the active circle unless viewing "Constellation"
        if (user.activeCircleId !== 'constellation') {
             timelineEntries = entries.filter(e => e.circleId === user.activeCircleId);
        }

        return (
          <Timeline 
            entries={timelineEntries} 
            currentUserId={user.id} 
            onTriggerPremium={handleTriggerPremium}
            activeCircleId={user.activeCircleId}
            circles={user.circles}
            onCircleChange={handleCircleChange}
            onLikeEntry={handleLikeEntry}
            onCompose={handleCompose}
            onDeleteEntry={handleDeleteEntry}
            onUpdateEntry={handleUpdateEntry}
            streak={streak}
          />
        );
      case 'ai-coach':
        return (
          <AICoach 
            insights={MOCK_INSIGHTS} 
            entryTexts={entries.map(e => e.content)} 
            onTriggerPremium={handleTriggerPremium}
          />
        );
      case 'profile':
        return (
          <Profile 
            user={user} 
            entries={entries} // Pass entries for Pulse Calculation
            streak={streak}   // Pass streak for synchronization
            onCircleChange={handleCircleChange} 
            onCreateCircle={handleCreateCircle} // Pass create function
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            onShowLegal={(type) => setLegalModalOpen(type)}
            onViewArtifact={(type) => setArtifactModalOpen(type)}
            onShowToast={showNotification}
            pendingInvites={pendingInvites}
            onAcceptInvite={handleAcceptInvite}
            onDeclineInvite={handleDeclineInvite}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-paper min-h-screen text-slate-800 font-sans selection:bg-belluh-100 selection:text-belluh-900 overflow-x-hidden animate-fade-in">
      {renderContent()}
      
      {notification && (
        <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      <TabBar 
        currentTab={currentTab} 
        onTabChange={(tab) => {
            trackEvent('tab_changed', { tab });
            setCurrentTab(tab);
        }} 
        onCompose={() => handleCompose()} 
      />

      {isComposeOpen && (
          <div className="fixed inset-0 z-[60] bg-paper animate-slide-up">
              <button 
                  onClick={() => setIsComposeOpen(false)}
                  className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 z-50 transition-colors"
              >
                  <X size={20} />
              </button>
              <Journal 
                  onAddEntry={handleAddEntry} 
                  partnerName={user.partnerName || 'Partner'} 
                  onTriggerPremium={handleTriggerPremium}
                  initialPrompt={composePrompt}
                  userName={user.name}
                  partnerHasEntry={partnerHasEntry}
              />
          </div>
      )}

      {legalModalOpen && (
          <LegalModal type={legalModalOpen} onClose={() => setLegalModalOpen(null)} />
      )}

      {artifactModalOpen && (
          <ArtifactModal 
            type={artifactModalOpen} 
            onClose={() => setArtifactModalOpen(null)} 
            entries={entries}
            currentUserId={user.id}
            userName={user.name}
            partnerName={user.partnerName || 'Partner'}
          />
      )}

      {showPremiumOverlay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowPremiumOverlay(false)}>
           <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center relative overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-belluh-300 via-purple-300 to-indigo-300" />
             <div className="w-20 h-20 bg-belluh-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-apple animate-float">
                <Sparkles size={32} className="text-belluh-500" />
             </div>
             <h2 className="text-3xl font-serif text-slate-900 mb-3 tracking-tight">Belluh Premium</h2>
             <p className="text-slate-500 mb-8 text-sm leading-relaxed font-medium">Unlock deeper intimacy. Get advanced relationship insights, conflict resolution tools, and unlimited history.</p>
             
             <div className="space-y-3">
               <button 
                 onClick={() => setShowPremiumOverlay(false)}
                 className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-black transition-transform active:scale-95 shadow-xl shadow-slate-200"
               >
                 Start Free Trial
               </button>
               <button 
                 onClick={() => setShowPremiumOverlay(false)}
                 className="w-full py-3 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest"
               >
                 Maybe Later
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;