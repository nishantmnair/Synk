
import React, { useState, useEffect } from 'react';
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
  
  // Initialize with empty arrays - data will be loaded from API after login
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [vibe, setVibe] = useState('Feeling adventurous');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
        tasksApi.getAll().catch(() => []),
        milestonesApi.getAll().catch(() => []),
        activitiesApi.getAll(50).catch(() => []),
        suggestionsApi.getAll().catch(() => []),
        collectionsApi.getAll().catch(() => []),
        preferencesApi.get().catch(() => null),
      ]);

      // Only set data if arrays are returned (not empty errors)
      setTasks((tasksData as any[]).length > 0 ? (tasksData as any[]).map(transformTask) : []);
      setMilestones((milestonesData as any[]).length > 0 ? (milestonesData as any[]).map(transformMilestone) : []);
      setActivities((activitiesData as any[]).length > 0 ? (activitiesData as any[]).map(transformActivity) : []);
      setSuggestions((suggestionsData as any[]).length > 0 ? (suggestionsData as any[]).map(transformSuggestion) : []);
      setCollections((collectionsData as any[]).length > 0 ? (collectionsData as any[]).map(transformCollection) : []);
      
      if (preferencesData) {
        const prefs = preferencesData as { vibe?: string };
        setVibe(prefs.vibe || 'Feeling adventurous');
      } else {
        // Set default vibe if no preferences exist
        setVibe('Feeling adventurous');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Set up real-time listeners
  useEffect(() => {
    if (!isLoggedIn) return;

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
        setSuggestions(prev => [transformSuggestion(data), ...prev]);
      });
      djangoRealtimeService.on('suggestion:deleted', (data: { id: string | number }) => {
        const suggestionId = typeof data.id === 'number' ? data.id.toString() : data.id;
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      });

      djangoRealtimeService.on('collection:created', (data: any) => {
        setCollections(prev => [transformCollection(data), ...prev]);
      });
      djangoRealtimeService.on('collection:updated', (data: any) => {
        setCollections(prev => prev.map(c => c.id === String(data.id) ? transformCollection(data) : c));
      });
      djangoRealtimeService.on('collection:deleted', (data: { id: string | number }) => {
        const collectionId = typeof data.id === 'number' ? data.id.toString() : data.id;
        setCollections(prev => prev.filter(c => c.id !== collectionId));
      });

      djangoRealtimeService.on('preferences:updated', (data: any) => {
        const prefs = data as { vibe?: string };
        if (prefs.vibe) setVibe(prefs.vibe);
      });
    };

    setupRealtimeListeners();

    return () => {
      // Cleanup listeners if needed
    };
  }, [isLoggedIn]);

  // Initialize auth state and real-time connection
  useEffect(() => {
    // Check if user is already logged in
    djangoAuthService.getCurrentUser().then(async (user) => {
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
        setVibe('Feeling adventurous');
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      djangoRealtimeService.disconnect();
    };
  }, []);

  const handleLogin = async (email: string, password: string): Promise<void> => {
    try {
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
    } catch (error) {
      console.error('Logout failed:', error);
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
      const created = await activitiesApi.create(newActivity);
      setActivities(prev => [transformActivity(created), ...prev]);
    } catch (error) {
      console.error('Error creating activity:', error);
      const userName = activityUser || getDisplayName(currentUser);
      const newActivity: Activity = {
        id: Math.random().toString(),
        user: userName,
        action,
        item,
        timestamp: 'Just now',
        avatar: getUserAvatar(currentUser)
      };
      setActivities(prev => [newActivity, ...prev]);
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
      const created = await tasksApi.create(djangoTask);
      setTasks(prev => [...prev, transformTask(created)]);
      await addActivity('added', `${newTask.title} to ${newTask.status}`);
    } catch (error) {
      console.error('Error creating task:', error);
      // Fallback to local state
      setTasks(prev => [...prev, newTask]);
      addActivity('added', `${newTask.title} to ${newTask.status}`);
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
      
      const updated = await tasksApi.update(taskIdNum, djangoUpdates);
      setTasks(prev => prev.map(t => t.id === taskId ? transformTask(updated) : t));
      if (updates.status) {
        const task = tasks.find(t => t.id === taskId);
        if (task) await addActivity('moved', `${task.title} to ${updates.status}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Fallback to local state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      if (updates.status) {
        const task = tasks.find(t => t.id === taskId);
        if (task) addActivity('moved', `${task.title} to ${updates.status}`);
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const taskIdNum = parseInt(taskId);
      if (isNaN(taskIdNum)) throw new Error('Invalid task ID');
      const task = tasks.find(t => t.id === taskId);
      await tasksApi.delete(taskIdNum);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (task) await addActivity('removed', task.title);
    } catch (error) {
      console.error('Error deleting task:', error);
      // Fallback to local state
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        addActivity('removed', task.title);
      }
    }
  };

  const addCollection = async (name: string, icon: string) => {
    try {
      const newCol = { name, icon };
      const created = await collectionsApi.create(newCol);
      setCollections(prev => [...prev, transformCollection(created)]);
      await addActivity('created', `the ${name} collection`);
    } catch (error) {
      console.error('Error creating collection:', error);
      // Fallback to local state
      const id = name.toLowerCase().replace(/\s+/g, '-');
      if (collections.find(c => c.id === id)) return;
      const newCol: Collection = { id, name, icon };
      setCollections([...collections, newCol]);
      addActivity('created', `the ${name} collection`);
    }
  };

  const toggleRightSidebar = () => setIsRightSidebarOpen(!isRightSidebarOpen);
  const toggleLeftSidebar = () => setIsLeftSidebarOpen(!isLeftSidebarOpen);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="h-screen bg-main flex items-center justify-center">
        <div className="text-primary text-lg">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthView onLogin={handleLogin} onSignup={handleSignup} />;
  }

  return (
    <Router>
      {showCouplingOnboarding && (
        <CouplingOnboarding
          currentUser={currentUser}
          onComplete={() => setShowCouplingOnboarding(false)}
        />
      )}
      <div className="h-screen flex overflow-hidden bg-main">
        {/* Navigation Sidebar */}
        <div className={`transition-all duration-300 ease-in-out border-r border-subtle bg-sidebar overflow-hidden shrink-0 ${isLeftSidebarOpen ? 'w-60' : 'w-0 border-r-0'}`}>
          <div className="w-60 h-full">
            <Sidebar 
              vibe={vibe} 
              collections={collections} 
              onAddCollection={addCollection} 
              onToggle={toggleLeftSidebar} 
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-main">
          <Header 
            currentUser={currentUser}
            vibe={vibe}
            onToggleRightSidebar={toggleRightSidebar} 
            isRightSidebarOpen={isRightSidebarOpen} 
            onToggleLeftSidebar={toggleLeftSidebar}
            isLeftSidebarOpen={isLeftSidebarOpen}
            onLogout={handleLogout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          
          <main className="flex-1 overflow-hidden relative">
            <Routes>
              <Route path="/" element={<TodayView tasks={tasks} vibe={vibe} onShareAnswer={() => addActivity('answered', "today's connection prompt")} />} />
              <Route path="/today" element={<TodayView tasks={tasks.filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))} vibe={vibe} onShareAnswer={() => addActivity('answered', "today's connection prompt")} />} />
              <Route path="/board" element={<BoardView tasks={tasks.filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))} setTasks={setTasks} onAction={addActivity} onAddTask={addTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} />} />
              <Route path="/milestones" element={<MilestonesView milestones={milestones} />} />
              <Route path="/inbox" element={<InboxView suggestions={suggestions} onAccept={addTask} onSave={() => {}} onDecline={(id) => setSuggestions(prev => prev.filter(s => s.id !== id))} />} />
              <Route path="/collection/:collectionId" element={<CollectionView tasks={tasks} collections={collections} onAddTask={addTask} />} />
              <Route path="/profile" element={<ProfileView currentUser={currentUser} activities={activities} milestonesCount={milestones.length} />} />
              <Route path="/settings" element={<SettingsView currentUser={currentUser} />} />
              <Route path="/memories" element={<MemoriesView />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>

        {/* Info Sidebar */}
        <div className={`transition-all duration-300 ease-in-out border-l border-subtle bg-sidebar overflow-hidden shrink-0 ${isRightSidebarOpen ? 'w-72' : 'w-0 border-l-0'}`}>
           <div className="w-72 h-full">
            <RightAside activities={activities} milestones={milestones} onToggle={toggleRightSidebar} />
           </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
