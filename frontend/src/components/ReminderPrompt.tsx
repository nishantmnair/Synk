import { Alert, Button, Box, Typography, Paper, IconButton } from '@mui/material';
import { NotificationsActive, Close, Add } from '@mui/icons-material';
import { ActivityReminder, dismissReminder, markActivityComplete } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface ReminderPromptProps {
  reminders: ActivityReminder[];
  onDismiss: () => void;
  onAdd: () => void;
}

export default function ReminderPrompt({ reminders, onDismiss, onAdd }: ReminderPromptProps) {
  const { couple } = useAuth();

  const handleDismiss = async (reminderId: number) => {
    try {
      await dismissReminder(reminderId);
      onDismiss();
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  const handleAddActivity = async (reminder: ActivityReminder) => {
    if (!couple) return;

    try {
      await markActivityComplete(reminder.activity);
      await dismissReminder(reminder.id);
      onAdd();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  if (reminders.length === 0) return null;

  return (
    <Alert
      severity="info"
      icon={<NotificationsActive />}
      sx={{
        borderRadius: 0,
        borderBottom: 2,
        borderColor: 'primary.light',
        bgcolor: 'primary.50',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Did you complete any activities recently?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Add them to your list to keep track of your memories together
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {reminders.map((reminder) => (
          <Paper
            key={reminder.id}
            variant="outlined"
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'background.paper',
            }}
          >
            <Typography>{reminder.activity_title}</Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={() => handleAddActivity(reminder)}
              >
                Add
              </Button>
              <IconButton
                size="small"
                onClick={() => handleDismiss(reminder.id)}
                color="default"
              >
                <Close />
              </IconButton>
            </Box>
          </Paper>
        ))}
      </Box>
    </Alert>
  );
}
