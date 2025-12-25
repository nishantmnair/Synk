import {
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  ContentCopy,
  Close,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { Couple } from '../lib/api';

interface InviteCodeReminderProps {
  couple: Couple;
  onCopy?: () => void;
}

export default function InviteCodeReminder({ couple, onCopy }: InviteCodeReminderProps) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show if partner hasn't joined yet
  if (couple.user2 || dismissed) {
    return null;
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(couple.invite_code);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const inviteUrl = `${window.location.origin}?invite=${couple.invite_code}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Invite Partner
        </Typography>
        <Tooltip title="Dismiss">
          <IconButton
            size="small"
            onClick={() => setDismissed(true)}
            sx={{ p: 0.5 }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Share code or link so your partner can join
      </Typography>

      <Stack spacing={1}>
        <Box>
          <Typography variant="caption" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
            Code:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                p: 0.75,
                bgcolor: 'primary.light',
                borderRadius: 1,
                flex: 1,
                color: 'primary.dark',
              }}
            >
              {couple.invite_code}
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy'}>
              <IconButton
                size="small"
                onClick={handleCopyCode}
                sx={{ p: 0.5 }}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<LinkIcon fontSize="small" />}
          onClick={handleCopyLink}
          fullWidth
          sx={{ fontSize: '0.75rem', py: 0.5 }}
        >
          {copied ? 'Link Copied!' : 'Copy Link'}
        </Button>
      </Stack>
    </Box>
  );
}

