import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  Drawer,
  IconButton,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Favorite,
  Menu as MenuIcon,
  Share,
  FilterList,
} from '@mui/icons-material';
import {
  Activity,
  Section,
  ActivityReminder,
  getSections,
  getActivities,
  getActivityReminders,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import ActivityList from './ActivityList';
import DeletedItems from './DeletedItems';
import SectionManager from './SectionManager';
import ReminderPrompt from './ReminderPrompt';
import InviteCodeReminder from './InviteCodeReminder';

type ViewMode = 'activities' | 'deleted';
type FilterStatus = 'all' | 'not_started' | 'in_progress' | 'finished';

export default function Dashboard() {
  const { user, couple, signOut } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activities, setActivities] = useState<Activity[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [reminders, setReminders] = useState<ActivityReminder[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('activities');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (couple) {
      loadData();
    }
  }, [couple]);

  // Smart auto-refresh: only poll when window is focused to save resources
  useEffect(() => {
    if (!couple) return;

    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (intervalId) return;
      // Poll every 5 seconds when window is focused
      intervalId = setInterval(() => {
        loadData();
      }, 5000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Start polling if window is already focused
    if (document.hasFocus()) {
      startPolling();
    }

    // Listen for window focus/blur events
    const handleFocus = () => {
      loadData(); // Immediate refresh when returning to tab
      startPolling();
    };
    
    const handleBlur = () => {
      stopPolling();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      stopPolling();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [couple]);

  const loadData = async () => {
    if (!couple) return;

    try {
      const [sectionsData, activitiesData, remindersData] = await Promise.all([
        getSections(couple.id),
        getActivities(couple.id),
        getActivityReminders(couple.id),
      ]);

      setSections(sectionsData);
      setActivities(activitiesData);
      setReminders(remindersData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleShareInviteCode = async () => {
    if (!couple) return;

    try {
      await navigator.clipboard.writeText(couple.invite_code);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error copying invite code:', error);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    // Filter by view mode
    if (viewMode === 'deleted' && !activity.is_deleted) return false;
    if (viewMode === 'activities' && activity.is_deleted) return false;

    // Filter by section
    if (selectedSection && activity.section !== selectedSection.id) return false;

    // Filter by status
    if (filterStatus !== 'all' && activity.status !== filterStatus) return false;

    return true;
  });

  const sidebar = (
    <Box sx={{ width: 280, p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Invite Code Reminder - show only when partner hasn't joined */}
      {couple && !couple.user2 && (
        <Box sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <InviteCodeReminder couple={couple} onCopy={() => setSnackbarOpen(true)} />
        </Box>
      )}

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        View
      </Typography>
      <Button
        variant={viewMode === 'activities' ? 'contained' : 'outlined'}
        fullWidth
        sx={{ mb: 1, justifyContent: 'flex-start' }}
        onClick={() => setViewMode('activities')}
      >
        Activities
      </Button>
      <Button
        variant={viewMode === 'deleted' ? 'contained' : 'outlined'}
        fullWidth
        sx={{ mb: 3, justifyContent: 'flex-start' }}
        onClick={() => setViewMode('deleted')}
      >
        Deleted Items
      </Button>

      {viewMode === 'activities' && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList fontSize="small" />
              Filter by Status
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e: SelectChangeEvent) =>
                  setFilterStatus(e.target.value as FilterStatus)
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="not_started">Not Started</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="finished">Finished</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <SectionManager
            selectedSection={selectedSection}
            onSectionSelect={setSelectedSection}
            onRefresh={loadData}
          />
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Favorite sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Synk
          </Typography>

          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.email}
          </Typography>

          <Button color="inherit" onClick={signOut}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      {/* Reminder Prompt */}
      {viewMode === 'activities' && (
        <ReminderPrompt
          reminders={reminders}
          onDismiss={loadData}
          onAdd={loadData}
        />
      )}

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        {isMobile ? (
          <Drawer
            anchor="left"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          >
            {sidebar}
          </Drawer>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            {sidebar}
          </Paper>
        )}

        {/* Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {viewMode === 'activities' ? (
              <ActivityList
                activities={filteredActivities}
                sections={sections}
                selectedSection={selectedSection}
                onRefresh={loadData}
              />
            ) : (
              <DeletedItems
                activities={filteredActivities}
                onRefresh={loadData}
              />
            )}
          </Container>
        </Box>
      </Box>

      {/* Snackbar for invite code copied */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          Invite code copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
}
