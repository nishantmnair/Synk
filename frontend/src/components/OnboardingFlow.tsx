import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Favorite,
  Link as LinkIcon,
  PersonAdd,
  ArrowBack,
  ArrowForward,
  Logout,
} from '@mui/icons-material';
import { createProfile, createCouple, joinCouple } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type Step = 'choose' | 'create' | 'join';

export default function OnboardingFlow() {
  const { refreshCouple, refreshProfile, signOut } = useAuth();
  const [step, setStep] = useState<Step>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setInviteCode(invite);
      setStep('join');
    }
  }, []);

  const handleCreateCouple = async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Try to create profile, but if it already exists, continue
      try {
        await createProfile({
          full_name: fullName,
        });
      } catch (profileErr: any) {
        // If profile already exists, that's fine - continue
        const errorMsg = JSON.stringify(profileErr.response?.data || '');
        if (!errorMsg.includes('already exists')) {
          throw profileErr;
        }
      }

      await createCouple();
      console.log('Couple created successfully');

      await refreshProfile();
      console.log('Profile refreshed');
      
      await refreshCouple();
      console.log('Couple refreshed');
    } catch (err: any) {
      console.error('Error creating couple:', err);
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to create couple');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Try to create profile, but continue if it already exists
      try {
        await createProfile({
          full_name: fullName,
        });
      } catch (profileErr: any) {
        // Ignore "profile already exists" error, throw others
        const profileErrorMsg = profileErr.response?.data?.[0] || profileErr.response?.data?.detail || '';
        if (!profileErrorMsg.includes('already exists')) {
          throw profileErr;
        }
      }

      await joinCouple(inviteCode);

      await refreshProfile();
      await refreshCouple();
    } catch (err: any) {
      // Extract error message from different possible response formats
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail || 
                          err.response?.data?.message ||
                          err.message ||
                          'Failed to join couple';
      setError(errorMessage);
      console.error('Join couple error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'choose') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #fce4ec 100%)',
          p: 2,
        }}
      >
        <Container maxWidth="md">
          <Paper elevation={6} sx={{ p: { xs: 4, md: 6 }, borderRadius: 4, position: 'relative' }}>
            <IconButton
              onClick={signOut}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
              }}
              title="Sign Out"
            >
              <Logout />
            </IconButton>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 2,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ec407a 0%, #e91e63 100%)',
                  mb: 3,
                }}
              >
                <Favorite sx={{ fontSize: 48, color: 'white' }} />
              </Box>

              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Let's Get Started
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Choose how you'd like to set up your couple's account
              </Typography>
            </Box>

            <Stack spacing={2}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => setStep('create')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonAdd color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="h6">Create & Share Link</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Start solo and invite your partner later
                      </Typography>
                    </Box>
                  </Box>
                  <ArrowForward />
                </Box>
              </Paper>

              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => setStep('join')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinkIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="h6">Join with Code</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Use an invite code from your partner
                      </Typography>
                    </Box>
                  </Box>
                  <ArrowForward />
                </Box>
              </Paper>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (step === 'create') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #fce4ec 100%)',
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Paper elevation={6} sx={{ p: { xs: 4, md: 6 }, borderRadius: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => setStep('choose')}
              sx={{ mb: 3 }}
            >
              Back
            </Button>

            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 2,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ec407a 0%, #e91e63 100%)',
                  mb: 3,
                }}
              >
                <PersonAdd sx={{ fontSize: 48, color: 'white' }} />
              </Box>

              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Create Your Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set up your profile and get a shareable link
              </Typography>
            </Box>

            <Stack spacing={3}>
              <TextField
                label="Your Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
                required
              />

              <TextField
                label="Partner's Name (Optional)"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                fullWidth
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Button
                variant="contained"
                size="large"
                onClick={handleCreateCouple}
                disabled={loading}
                fullWidth
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #fce4ec 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: { xs: 4, md: 6 }, borderRadius: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => setStep('choose')}
            sx={{ mb: 3 }}
          >
            Back
          </Button>

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ec407a 0%, #e91e63 100%)',
                mb: 3,
              }}
            >
              <LinkIcon sx={{ fontSize: 48, color: 'white' }} />
            </Box>

            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Join Your Partner
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the invite code they shared with you
            </Typography>
          </Box>

          <Stack spacing={3}>
            <TextField
              label="Your Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Invite Code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              fullWidth
              required
              inputProps={{ style: { fontFamily: 'monospace' } }}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              variant="contained"
              size="large"
              onClick={handleJoinCouple}
              disabled={loading}
              fullWidth
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Joining...' : 'Join Account'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
