import { Box, Typography, Button, Paper } from '@mui/material';
import { Restore, DeleteForever, Delete } from '@mui/icons-material';
import { Activity, restoreActivity, deleteActivityPermanently } from '../lib/api';

interface DeletedItemsProps {
  activities: Activity[];
  onRefresh: () => void;
}

export default function DeletedItems({ activities, onRefresh }: DeletedItemsProps) {
  const handleRestore = async (activityId: number) => {
    try {
      await restoreActivity(activityId);
      onRefresh();
    } catch (error) {
      console.error('Error restoring activity:', error);
    }
  };

  const handlePermanentDelete = async (activityId: number) => {
    if (!confirm('Are you sure you want to permanently delete this activity? This cannot be undone.')) {
      return;
    }

    try {
      await deleteActivityPermanently(activityId);
      onRefresh();
    } catch (error) {
      console.error('Error permanently deleting activity:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Paper
          sx={{
            bgcolor: 'primary.50',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          elevation={0}
        >
          <Delete color="primary" />
        </Paper>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Deleted Activities
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Restore items or permanently delete them
          </Typography>
        </Box>
      </Box>

      {activities.length === 0 ? (
        <Paper
          sx={{
            textAlign: 'center',
            py: 6,
            bgcolor: 'grey.50',
          }}
          elevation={0}
        >
          <Delete sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No deleted activities
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deleted items will appear here
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activities.map((activity) => (
            <Paper
              key={activity.id}
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'grey.50',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    textDecoration: 'line-through',
                    color: 'text.secondary',
                  }}
                >
                  {activity.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Deleted on {new Date(activity.updated_at).toLocaleDateString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Restore />}
                  onClick={() => handleRestore(activity.id)}
                >
                  Restore
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<DeleteForever />}
                  onClick={() => handlePermanentDelete(activity.id)}
                >
                  Delete Forever
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
