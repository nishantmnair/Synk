import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { theme } from './theme';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';

function App() {
  const { user, profile, couple, loading } = useAuth();

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #fce4ec 100%)',
          }}
        >
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!user ? (
        <Auth />
      ) : !couple || !profile ? (
        <OnboardingFlow />
      ) : (
        <Dashboard />
      )}
    </ThemeProvider>
  );
}

export default App;
