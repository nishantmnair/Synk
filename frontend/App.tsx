
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Task, Milestone, Suggestion, Activity, TaskStatus, Collection } from './types';
import BoardView from './components/BoardView';
import MilestonesView from './components/MilestonesView';
import InboxView from './components/InboxView';
import TodayView from './components/TodayView';
import CollectionView from './components/CollectionView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import CouplingOnboarding from './components/CouplingOnboarding';
import MemoriesView from './components/MemoriesView';
import Sidebar from './components/Sidebar';
import RightAside from './components/RightAside';
import Header from './components/Header';
import Toast, { ToastType } from './components/Toast';
import ConfirmDialog, { ConfirmDialogProps } from './components/ConfirmDialog';
import { djangoAuthService, User } from './services/djangoAuth';
import { djangoRealtimeService } from './services/djangoRealtime';
import { tasksApi, milestonesApi, activitiesApi, suggestionsApi, collectionsApi, preferencesApi } from './services/djangoApi';
import { getUserAvatar } from './utils/avatar';
import { getDisplayName } from './utils/userDisplay';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCouplingOnboarding, setShowCouplingOnboarding] = useState(false);
  
  // Notification states
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'> & { onConfirm: () => void } | null>(null);
  
  // Initialize with empty arrays - data will be loaded from API after login
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    // Check localStorage first, otherwise use window width as default
    try {
      const saved = localStorage.getItem('synk_rightSidebar');
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // localStorage not available
    }
    return window.innerWidth >= 1024; // Only open by default on desktop (lg breakpoint)
  });
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    // Check localStorage first, otherwise use window width as default
    try {
      const saved = localStorage.getItem('synk_leftSidebar');
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // localStorage not available
    }
    return window.innerWidth >= 1024; // Only open by default on desktop (lg breakpoint)
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light') ? 'light' : 'dark'
  );
  // Track if real-time listeners have been registered
  const listenersRegisteredRef = useRef(false);
  // Notification helpers
  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const showConfirm = (config: Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'> & { onConfirm: () => void }) => {
    setConfirmDialog(config);
  };

  // Persist sidebar states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('synk_rightSidebar', JSON.stringify(isRightSidebarOpen));
    } catch {
      // localStorage not available
    }
  }, [isRightSidebarOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('synk_leftSidebar', JSON.stringify(isLeftSidebarOpen));
    } catch {
      // localStorage not available
    }
  }, [isLeftSidebarOpen]);

  // Transform Django snake_case to frontend camelCase
  const transformTask = (task: any): Task => ({
    id: String(task.id),
    title: task.title,
    category: task.category,
    priority: task.priority,
    status: task.status as TaskStatus,
    liked: task.liked,
    fired: task.fired,
    progress: task.progress,
    alexProgress: task.alex_progress || task.alexProgress,
    samProgress: task.sam_progress || task.samProgress,
    description: task.description,
    time: task.time,
    location: task.location,
    avatars: task.avatars || [],
  });

  const transformMilestone = (milestone: any): Milestone => ({
    id: String(milestone.id),
    name: milestone.name,
    date: milestone.date,
    status: milestone.status,
    samExcitement: milestone.sam_excitement || milestone.samExcitement,
    alexExcitement: milestone.alex_excitement || milestone.alexExcitement,
    icon: milestone.icon,
  });

  const transformActivity = (activity: any): Activity => ({
    id: String(activity.id),
    user: activity.user || activity.activity_user || 'User',
    action: activity.action,
    item: activity.item,
    timestamp: activity.timestamp,
    avatar: activity.avatar,
  });

  const transformSuggestion = (suggestion: any): Suggestion => ({
    id: String(suggestion.id),
    title: suggestion.title,
    suggestedBy: suggestion.suggested_by || suggestion.suggestedBy,
    date: suggestion.date,
    description: suggestion.description,
    location: suggestion.location,
    category: suggestion.category,
    excitement: suggestion.excitement,
    tags: suggestion.tags || [],
  });

  const transformCollection = (collection: any): Collection => ({
    id: String(collection.id),
    name: collection.name,
    icon: collection.icon,
    color: collection.color,
  });

  // Load data from API
  const loadData = async () => {
    try {
      const [tasksData, milestonesData, activitiesData, suggestionsData, collectionsData, preferencesData] = await Promise.all([
        tasksApi.getAll().catch((err) => {
          console.error('[DEBUG] Error loading tasks:', err);
          return [];
        }),
        milestonesApi.getAll().catch((err) => {
          console.error('[DEBUG] Error loading milestones:', err);
          return [];
        }),
        activitiesApi.getAll(50).catch((err) => {
          console.error('[DEBUG] Error loading activities:', err);
          return [];
        }),
        suggestionsApi.getAll().catch((err) => {
          console.error('[DEBUG] Error loading suggestions:', err);
          return [];
        }),
        collectionsApi.getAll().catch((err) => {
          console.error('[DEBUG] Error loading collections:', err, err?.data);
          return [];
        }),
        preferencesApi.get().catch((err) => {
          console.error('[DEBUG] Error loading preferences:', err);
          return null;
        }),
      ]);

      console.log('[DEBUG] Collections fetched from API:', collectionsData);

      // Only set data if arrays are returned (not empty errors)
      setTasks((tasksData as any[]).length > 0 ? (tasksData as any[]).map(transformTask) : []);
      setMilestones((milestonesData as any[]).length > 0 ? (milestonesData as any[]).map(transformMilestone) : []);
      setActivities((activitiesData as any[]).length > 0 ? (activitiesData as any[]).map(transformActivity) : []);
      setSuggestions((suggestionsData as any[]).length > 0 ? (suggestionsData as any[]).map(transformSuggestion) : []);
      const transformedCollections = (collectionsData as any[]).length > 0 ? (collectionsData as any[]).map(transformCollection) : [];
      console.log('[DEBUG] Transformed collections:', transformedCollections);
      setCollections(transformedCollections);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Set up real-time listeners
  useEffect(() => {
    if (!isLoggedIn || listenersRegisteredRef.current) return;

    listenersRegisteredRef.current = true;

    const setupRealtimeListeners = () => {
      djangoRealtimeService.on('task:created', (data: any) => {
        setTasks(prev => [transformTask(data), ...prev]);
      });
      djangoRealtimeService.on('task:updated', (data: any) => {
        setTasks(prev => prev.map(t => t.id === String(data.id) ? transformTask(data) : t));
      });
      djangoRealtimeService.on('task:deleted', (data: { id: string | number }) => {
        const taskId = typeof data.id === 'number' ? data.id.toString() : data.id;
        setTasks(prev => prev.filter(t => t.id !== taskId));
      });

      djangoRealtimeService.on('milestone:created', (data: any) => {
        setMilestones(prev => [transformMilestone(data), ...prev]);
      });
      djangoRealtimeService.on('milestone:updated', (data: any) => {
        setMilestones(prev => prev.map(m => m.id === String(data.id) ? transformMilestone(data) : m));
      });
      djangoRealtimeService.on('milestone:deleted', (data: { id: string | number }) => {
        const milestoneId = typeof data.id === 'number' ? data.id.toString() : data.id;
        setMilestones(prev => prev.filter(m => m.id !== milestoneId));
      });

      djangoRealtimeService.on('activity:created', (data: any) => {
        setActivities(prev => [transformActivity(data), ...prev]);
      });

      djangoRealtimeService.on('suggestion:created', (data: any) => {
        const transformed = transformSuggestion(data);
        setSuggestions(prev => {
          const exists = prev.some(s => s.id === transformed.id);
          if (exists) return prev.map(s => s.id === transformed.id ? transformed : s);
          return [transformed, ...prev];
        });
      });
      djangoRealtimeService.on('suggestion:deleted', (data: { id: string | number }) => {
        const suggestionId = typeof data.id === 'number' ? data.id.toString() : data.id;
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      });

      djangoRealtimeService.on('collection:created', (data: any) => {
        setCollections(prev => {
          // Prevent duplicates by checking if collection already exists
          const exists = prev.some(c => c.id === String(data.id));
          if (exists) return prev;
          return [transformCollection(data), ...prev];
        });
      });
      djangoRealtimeService.on('collection:updated', (data: any) => {
        setCollections(prev => prev.map(c => c.id === String(data.id) ? transformCollection(data) : c));
      });
      djangoRealtimeService.on('collection:deleted', (data: { id: string | number }) => {
        const collectionId = typeof data.id === 'number' ? data.id.toString() : data.id;
        setCollections(prev => prev.filter(c => c.id !== collectionId));
      });
    };

    setupRealtimeListeners();

    return () => {
      // Cleanup only on logout
      if (!isLoggedIn) {
        listenersRegisteredRef.current = false;
        djangoRealtimeService.off('task:created');
        djangoRealtimeService.off('task:updated');
        djangoRealtimeService.off('task:deleted');
        djangoRealtimeService.off('milestone:created');
        djangoRealtimeService.off('milestone:updated');
        djangoRealtimeService.off('milestone:deleted');
        djangoRealtimeService.off('activity:created');
        djangoRealtimeService.off('suggestion:created');
        djangoRealtimeService.off('suggestion:deleted');
        djangoRealtimeService.off('collection:created');
        djangoRealtimeService.off('collection:updated');
        djangoRealtimeService.off('collection:deleted');
      }
    };
  }, [isLoggedIn]);

  // Initialize auth state and real-time connection
  useEffect(() => {
    // Check if user is already logged in
    djangoAuthService.getCurrentUser().then(async (user) => {
      console.log('[DEBUG] Current user check result:', user);
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        // Connect to real-time service
        djangoRealtimeService.connect();
        // Load data from API
        await loadData();
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const unsubscribe = djangoAuthService.onAuthStateChange(async (user) => {
      console.log('[DEBUG] Auth state changed:', user);
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        djangoRealtimeService.connect();
        await loadData();
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        djangoRealtimeService.disconnect();
        // Reset to empty state (no placeholder data)
        setTasks([]);
        setMilestones([]);
        setActivities([]);
        setSuggestions([]);
        setCollections([]);
        // Clear the hash when logging out
        window.location.hash = '';
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      djangoRealtimeService.disconnect();
    };
  }, []);

  // Auto-refresh user profile every 30 seconds to catch updates from profile page
  useEffect(() => {
    if (!isLoggedIn) return;

    const refreshUserProfile = async () => {
      try {
        const user = await djangoAuthService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.debug('Auto-refresh user profile failed:', error);
      }
    };

    const interval = setInterval(refreshUserProfile, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Auto-refresh activities every 20 seconds to stay up-to-date
  useEffect(() => {
    if (!isLoggedIn) return;

    const refreshActivities = async () => {
      try {
        const activitiesData = await activitiesApi.getAll(50);
        if (activitiesData && Array.isArray(activitiesData)) {
          setActivities(activitiesData.map(transformActivity));
        }
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.debug('Auto-refresh activities failed:', error);
      }
    };

    const interval = setInterval(refreshActivities, 20000); // Refresh every 20 seconds
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogin = async (email: string, password: string): Promise<void> => {
    try {
      // Clear any existing toast before logging in
      setToast(null);
      // Set the hash first before any state updates
      window.location.hash = '#/today';
      const user = await djangoAuthService.login(email, password);
      setCurrentUser(user);
      setIsLoggedIn(true);
      djangoRealtimeService.connect();
      // Load data after login
      await loadData();
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error; // Let AuthView handle the error display
    }
  };

  const handleSignup = async (email: string, password: string, passwordConfirm: string, firstName?: string, lastName?: string, couplingCode?: string): Promise<void> => {
    try {
      // Clear any existing toast before signing up
      setToast(null);
      // Set the hash first before any state updates
      window.location.hash = '#/today';
      const user = await djangoAuthService.signup(email, password, passwordConfirm, firstName, lastName, couplingCode);
      setCurrentUser(user);
      setIsLoggedIn(true);
      djangoRealtimeService.connect();
      // Load data after signup
      await loadData();
      
      // If they didn't use a coupling code, show onboarding
      // (If they used a code, they're already coupled, so onboarding will auto-complete)
      if (!couplingCode || !couplingCode.trim()) {
        setShowCouplingOnboarding(true);
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      throw error; // Let AuthView handle the error display
    }
  };

  const handleLogout = async () => {
    try {
      await djangoAuthService.logout();
      setCurrentUser(null);
      setIsLoggedIn(false);
      djangoRealtimeService.disconnect();
      showToast('Successfully logged out.', 'success');
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('Logout failed. Please try again.', 'error');
    }
  };


  const addActivity = async (action: string, item: string, activityUser?: string) => {
    try {
      const userName = activityUser || getDisplayName(currentUser);
      const newActivity = {
        user: userName,
        action,
        item,
        timestamp: 'Just now',
        avatar: getUserAvatar(currentUser)
      };
      await activitiesApi.create(newActivity);
    } catch (error) {
      // Log detailed error information for debugging
      if (error instanceof Error && (error as any).data) {
        const errorData = (error as any).data;
        if (errorData.errors) {
          console.error('Validation errors:', errorData.errors);
        }
      }
      console.error('Error creating activity:', error);
      // Don't show error to user as activity logging is secondary
    }
  };

  const addTask = async (newTask: Task) => {
    try {
      // Use current user's avatar if no avatars specified
      const taskAvatars = newTask.avatars && newTask.avatars.length > 0 
        ? newTask.avatars 
        : [getUserAvatar(currentUser)];
      
      // Convert to Django format
      const djangoTask = {
        title: newTask.title,
        category: newTask.category,
        priority: newTask.priority,
        status: newTask.status,
        liked: newTask.liked,
        fired: newTask.fired,
        progress: newTask.progress,
        alex_progress: newTask.alexProgress,
        sam_progress: newTask.samProgress,
        description: newTask.description,
        time: newTask.time,
        location: newTask.location,
        avatars: taskAvatars,
      };
      await tasksApi.create(djangoTask);
      await addActivity('added', `${newTask.title} to ${newTask.status}`);
    } catch (error) {
      console.error('Error creating task:', error);
      showToast?.('Failed to add task', 'error');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const taskIdNum = parseInt(taskId);
      if (isNaN(taskIdNum)) throw new Error('Invalid task ID');
      // Convert updates to Django format
      const djangoUpdates: any = { ...updates };
      if (updates.alexProgress !== undefined) djangoUpdates.alex_progress = updates.alexProgress;
      if (updates.samProgress !== undefined) djangoUpdates.sam_progress = updates.samProgress;
      delete djangoUpdates.alexProgress;
      delete djangoUpdates.samProgress;
      
      await tasksApi.update(taskIdNum, djangoUpdates);
      if (updates.status) {
        const task = tasks.find(t => t.id === taskId);
        if (task) await addActivity('moved', `${task.title} to ${updates.status}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showToast?.('Failed to update task', 'error');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const taskIdNum = parseInt(taskId);
      if (isNaN(taskIdNum)) throw new Error('Invalid task ID');
      const task = tasks.find(t => t.id === taskId);
      await tasksApi.delete(taskIdNum);
      if (task) await addActivity('removed', task.title);
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast?.('Failed to delete task', 'error');
    }
  };

  const addCollection = async (name: string, icon: string) => {
    try {
      const newCol = { name, icon };
      await collectionsApi.create(newCol);
      await addActivity('created', `the ${name} collection`);
    } catch (error) {
      console.error('Error creating collection:', error);
      showToast?.('Failed to create collection', 'error');
    }
  };

  const deleteCollection = async (collectionId: string) => {
    const collectionToDelete = collections.find(c => c.id === collectionId);
    if (!collectionToDelete) return;

    // Show confirmation dialog
    showConfirm({
      title: 'Delete Collection?',
      message: `Are you sure you want to delete "${collectionToDelete.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const collectionIdNum = parseInt(collectionId);
          if (isNaN(collectionIdNum)) throw new Error('Invalid collection ID');
          await collectionsApi.delete(collectionIdNum);
          await addActivity('deleted', `the ${collectionToDelete.name} collection`);
          showToast('Collection deleted successfully', 'success');
        } catch (error) {
          console.error('Error deleting collection:', error);
          showToast('Failed to delete collection', 'error');
        }
      }
    });
  };

  const addSuggestionFromIdea = async (payload: {
    title: string;
    suggested_by: string;
    date: string;
    description: string;
    location: string;
    category: string;
    excitement: number;
    tags: string[];
  }) => {
    try {
      await suggestionsApi.create(payload);
      await addActivity('suggested', payload.title);
    } catch (error) {
      console.error('Error saving date idea to inbox:', error);
      showToast?.('Failed to save suggestion', 'error');
    }
  };

  const toggleRightSidebar = () => setIsRightSidebarOpen(!isRightSidebarOpen);
  const toggleLeftSidebar = () => setIsLeftSidebarOpen(!isLeftSidebarOpen);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('synk_theme', next);
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="h-screen bg-main flex items-center justify-center">
        <div className="text-primary text-lg">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <AuthView onLogin={handleLogin} onSignup={handleSignup} />
        {/* Toast for logout message */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  return (
    <Router>
      {showCouplingOnboarding && (
        <CouplingOnboarding
          currentUser={currentUser}
          onComplete={() => setShowCouplingOnboarding(false)}
          showToast={showToast}
        />
      )}
      <div className="h-screen flex overflow-hidden bg-main">
        {/* Navigation Sidebar */}
        <div className={`transition-all duration-300 ease-in-out border-r border-subtle bg-sidebar overflow-hidden shrink-0 ${isLeftSidebarOpen ? 'w-60' : 'w-0 border-r-0'}`}>
          <div className="w-60 h-full">
            <Sidebar 
              collections={collections} 
              onAddCollection={addCollection}
              onDeleteCollection={deleteCollection}
              onToggle={toggleLeftSidebar}
              suggestionsCount={suggestions.length}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-main">
          <Header 
            currentUser={currentUser}
            onToggleRightSidebar={toggleRightSidebar} 
            isRightSidebarOpen={isRightSidebarOpen} 
            onToggleLeftSidebar={toggleLeftSidebar}
            isLeftSidebarOpen={isLeftSidebarOpen}
            onLogout={handleLogout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSaveDateIdea={addSuggestionFromIdea}
            showConfirm={showConfirm}
          />
          
          <main className="flex-1 overflow-hidden relative">
            <Routes>
              <Route path="/" element={<TodayView tasks={tasks} onShareAnswer={() => addActivity('answered', "today's connection prompt")} />} />
              <Route path="/today" element={<TodayView tasks={tasks.filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))} onShareAnswer={() => addActivity('answered', "today's connection prompt")} />} />
              <Route path="/board" element={<BoardView tasks={tasks.filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))} setTasks={setTasks} onAction={addActivity} onAddTask={addTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} showConfirm={showConfirm} />} />
              <Route path="/milestones" element={<MilestonesView milestones={milestones} />} />
              <Route path="/inbox" element={<InboxView suggestions={suggestions} onAccept={addTask} onSave={() => {}} onDecline={(id) => setSuggestions(prev => prev.filter(s => s.id !== id))} showToast={showToast} showConfirm={showConfirm} />} />
              <Route path="/collection/:collectionId" element={<CollectionView tasks={tasks} collections={collections} onAddTask={addTask} />} />
              <Route path="/profile" element={<ProfileView currentUser={currentUser} activities={activities} milestonesCount={milestones.length} />} />
              <Route path="/settings" element={<SettingsView currentUser={currentUser} showToast={showToast} showConfirm={showConfirm} onLogout={handleLogout} />} />
              <Route path="/memories" element={<MemoriesView />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>

        {/* Info Sidebar */}
        <div className={`transition-[width] duration-300 ease-in-out border-l border-subtle bg-sidebar overflow-hidden shrink-0 ${isRightSidebarOpen ? 'w-72' : 'w-0 border-l-0'}`}>
           <div className="w-72 h-full">
            <RightAside activities={activities} milestones={milestones} onToggle={toggleRightSidebar} />
           </div>
        </div>
      </div>

      {/* Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </Router>
  );
};

export default App;
