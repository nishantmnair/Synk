import { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Paper, IconButton } from '@mui/material';
import { Add, ExpandMore, ChevronRight, Folder, FolderOpen } from '@mui/icons-material';
import { Section, getSections, createSection } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface SectionManagerProps {
  selectedSection: Section | null;
  onSectionSelect: (section: Section | null) => void;
  onRefresh: () => void;
}

export default function SectionManager({
  selectedSection,
  onSectionSelect,
  onRefresh,
}: SectionManagerProps) {
  const { couple } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [addingSubsectionTo, setAddingSubsectionTo] = useState<number | null>(null);
  const [newSubsectionTitle, setNewSubsectionTitle] = useState('');

  useEffect(() => {
    loadSections();
  }, [couple]);

  const loadSections = async () => {
    if (!couple) return;

    try {
      const data = await getSections(couple.id);
      setSections(data);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const handleAddSection = async () => {
    if (!couple || !newSectionTitle.trim()) return;

    try {
      await createSection({
        title: newSectionTitle,
        couple: couple.id,
        parent_section: undefined,
      });
      setNewSectionTitle('');
      await loadSections();
      onRefresh();
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  const handleAddSubsection = async (parentId: number) => {
    if (!couple || !newSubsectionTitle.trim()) return;

    try {
      await createSection({
        title: newSubsectionTitle,
        couple: couple.id,
        parent_section: parentId,
      });
      setNewSubsectionTitle('');
      setAddingSubsectionTo(null);
      setExpandedSections(new Set([...expandedSections, parentId]));
      await loadSections();
      onRefresh();
    } catch (error) {
      console.error('Error creating subsection:', error);
    }
  };

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderSection = (section: Section, depth: number = 0): React.ReactNode => {
    const hasChildren = sections.some((s) => s.parent_section === section.id);
    const isExpanded = expandedSections.has(section.id);
    const isSelected = selectedSection?.id === section.id;

    return (
      <Box key={section.id} sx={{ ml: depth * 3 }}>
        <Paper
          variant={isSelected ? 'elevation' : 'outlined'}
          elevation={isSelected ? 2 : 0}
          sx={{
            p: 1.5,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            bgcolor: isSelected ? 'primary.50' : 'transparent',
            borderColor: isSelected ? 'primary.main' : 'divider',
            '&:hover': {
              bgcolor: isSelected ? 'primary.100' : 'grey.50',
            },
          }}
          onClick={() => onSectionSelect(section)}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(section.id);
              }}
              sx={{ mr: 1 }}
            >
              {isExpanded ? <ExpandMore /> : <ChevronRight />}
            </IconButton>
          )}

          {!hasChildren && <Box sx={{ width: 40 }} />}

          {isExpanded ? (
            <FolderOpen sx={{ mr: 1, color: 'primary.main' }} />
          ) : (
            <Folder sx={{ mr: 1, color: 'text.secondary' }} />
          )}

          <Typography sx={{ flex: 1 }}>{section.title}</Typography>

          <Button
            size="small"
            startIcon={<Add />}
            onClick={(e) => {
              e.stopPropagation();
              setAddingSubsectionTo(section.id);
              setExpandedSections(new Set([...expandedSections, section.id]));
            }}
          >
            Add Subsection
          </Button>
        </Paper>

        {isExpanded && addingSubsectionTo === section.id && (
          <Box sx={{ ml: 3, mb: 1, display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="New subsection title"
              value={newSubsectionTitle}
              onChange={(e) => setNewSubsectionTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddSubsection(section.id);
                }
              }}
              autoFocus
            />
            <Button
              variant="contained"
              size="small"
              onClick={() => handleAddSubsection(section.id)}
            >
              Add
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setAddingSubsectionTo(null);
                setNewSubsectionTitle('');
              }}
            >
              Cancel
            </Button>
          </Box>
        )}

        {isExpanded &&
          sections
            .filter((s) => s.parent_section === section.id)
            .map((child) => renderSection(child, depth + 1))}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Sections
      </Typography>

      <Button
        variant={selectedSection === null ? 'contained' : 'outlined'}
        fullWidth
        sx={{ mb: 2, justifyContent: 'flex-start' }}
        onClick={() => onSectionSelect(null)}
      >
        All Activities
      </Button>

      <Box sx={{ mb: 2 }}>
        {sections
          .filter((section) => section.parent_section === null)
          .map((section) => renderSection(section))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="New section title"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddSection();
            }
          }}
        />
        <Button variant="contained" onClick={handleAddSection} startIcon={<Add />}>
          Add
        </Button>
      </Box>
    </Box>
  );
}
