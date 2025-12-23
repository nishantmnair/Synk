import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Paper,
  IconButton,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add,
  Delete,
  CheckCircle,
  RadioButtonUnchecked,
  PlayCircle,
  DragIndicator,
  Edit,
  Check,
  Close,
  Repeat,
} from '@mui/icons-material';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from '@hello-pangea/dnd';
import {
  Activity,
  Section,
  createActivity,
  updateActivity,
  deleteActivity,
  reorderActivities,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface ActivityListProps {
  activities: Activity[];
  sections: Section[];
  selectedSection: Section | null;
  onRefresh: () => void;
}

type ActivityStatus = 'not_started' | 'in_progress' | 'finished';

export default function ActivityList({
  activities,
  sections,
  selectedSection,
  onRefresh,
}: ActivityListProps) {
  const { couple } = useAuth();
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivitySection, setNewActivitySection] = useState<number | null>(null);
  const [newActivityRecurring, setNewActivityRecurring] = useState(false);
  const [editingActivity, setEditingActivity] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'not_started':
        return <RadioButtonUnchecked />;
      case 'in_progress':
        return <PlayCircle color="primary" />;
      case 'finished':
        return <CheckCircle color="success" />;
    }
  };

  const handleAddActivity = async () => {
    if (!couple || !newActivityTitle.trim()) return;

    const sectionId = selectedSection?.id || newActivitySection;

    try {
      await createActivity({
        title: newActivityTitle,
        couple: couple.id,
        section: sectionId,
        status: 'not_started',
        is_recurring: newActivityRecurring,
        order: activities.length,
      });
      setNewActivityTitle('');
      setNewActivitySection(null);
      setNewActivityRecurring(false);
      onRefresh();
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  const handleUpdateStatus = async (activity: Activity) => {
    const statusOrder: ActivityStatus[] = ['not_started', 'in_progress', 'finished'];
    const currentIndex = statusOrder.indexOf(activity.status as ActivityStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    try {
      await updateActivity(activity.id, { status: nextStatus });
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (activityId: number) => {
    try {
      await deleteActivity(activityId);
      onRefresh();
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const handleStartEdit = (activity: Activity) => {
    setEditingActivity(activity.id);
    setEditTitle(activity.title);
  };

  const handleSaveEdit = async (activityId: number) => {
    if (!editTitle.trim()) return;

    try {
      await updateActivity(activityId, { title: editTitle });
      setEditingActivity(null);
      setEditTitle('');
      onRefresh();
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
    setEditTitle('');
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(activities);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order field for all affected items
    const updates = items.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    try {
      await reorderActivities(updates);
      onRefresh();
    } catch (error) {
      console.error('Error reordering activities:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        {selectedSection ? selectedSection.title : 'All Activities'}
      </Typography>

      {/* Add Activity Form */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add New Activity
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Activity title"
            value={newActivityTitle}
            onChange={(e) => setNewActivityTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddActivity();
              }
            }}
          />

          {!selectedSection && (
            <Select
              fullWidth
              displayEmpty
              value={newActivitySection || ''}
              onChange={(e: SelectChangeEvent<number | string>) => {
                const value = e.target.value;
                setNewActivitySection(value === '' ? null : Number(value));
              }}
            >
              <MenuItem value="">
                <em>No section</em>
              </MenuItem>
              {sections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.title}
                </MenuItem>
              ))}
            </Select>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={newActivityRecurring}
                onChange={(e) => setNewActivityRecurring(e.target.checked)}
              />
            }
            label="Recurring activity"
          />

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddActivity}
            disabled={!newActivityTitle.trim()}
          >
            Add Activity
          </Button>
        </Box>
      </Paper>

      {/* Activities List */}
      {activities.length === 0 ? (
        <Paper
          sx={{
            textAlign: 'center',
            py: 6,
            bgcolor: 'grey.50',
          }}
          elevation={0}
        >
          <Typography variant="h6" gutterBottom>
            No activities yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add your first activity to get started
          </Typography>
        </Paper>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="activities">
            {(provided: DroppableProvided) => (
              <Box
                {...provided.droppableProps}
                ref={provided.innerRef}
                sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
              >
                {activities.map((activity, index) => (
                  <Draggable
                    key={activity.id}
                    draggableId={String(activity.id)}
                    index={index}
                  >
                    {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                      <Paper
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        variant="outlined"
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          bgcolor: snapshot.isDragging ? 'grey.100' : 'background.paper',
                          boxShadow: snapshot.isDragging ? 4 : 0,
                        }}
                      >
                        <Box {...provided.dragHandleProps}>
                          <DragIndicator sx={{ color: 'text.disabled', cursor: 'grab' }} />
                        </Box>

                        <IconButton
                          onClick={() => handleUpdateStatus(activity)}
                          sx={{ p: 0 }}
                        >
                          {getStatusIcon(activity.status as ActivityStatus)}
                        </IconButton>

                        <Box sx={{ flex: 1 }}>
                          {editingActivity === activity.id ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(activity.id);
                                }
                                if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                sx={{
                                  textDecoration:
                                    activity.status === 'finished'
                                      ? 'line-through'
                                      : 'none',
                                  color:
                                    activity.status === 'finished'
                                      ? 'text.disabled'
                                      : 'text.primary',
                                }}
                              >
                                {activity.title}
                              </Typography>
                              {activity.is_recurring && (
                                <Chip
                                  icon={<Repeat />}
                                  label="Recurring"
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          )}
                        </Box>

                        {editingActivity === activity.id ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSaveEdit(activity.id)}
                            >
                              <Check />
                            </IconButton>
                            <IconButton size="small" onClick={handleCancelEdit}>
                              <Close />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleStartEdit(activity)}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(activity.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        )}
                      </Paper>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </Box>
  );
}
