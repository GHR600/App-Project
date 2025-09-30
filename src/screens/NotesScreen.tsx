import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { spacing } from '../styles/designSystem';
import { NotesService, CreateNoteData, UpdateNoteData } from '../services/notesService';
import { DatabaseNote } from '../config/supabase';

interface NotesScreenProps {
  onBack?: () => void;
  onMenuPress?: () => void;
}

export const NotesScreen: React.FC<NotesScreenProps> = ({ onBack, onMenuPress }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [notes, setNotes] = useState<DatabaseNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<DatabaseNote | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!user) return;

    try {
      const { notes: fetchedNotes, error } = await NotesService.getUserNotes(user.id);
      if (error) {
        console.error('Error loading notes:', error);
      } else {
        setNotes(fetchedNotes);
      }
    } catch (error) {
      console.error('Unexpected error loading notes:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNotes();
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setModalVisible(true);
  };

  const handleEditNote = (note: DatabaseNote) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!user) return;

    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert('Missing Information', 'Please provide both title and content for your note.');
      return;
    }

    setIsSaving(true);

    try {
      if (editingNote) {
        // Update existing note
        const { note, error } = await NotesService.updateNote(user.id, editingNote.id, {
          title: noteTitle.trim(),
          content: noteContent.trim()
        });

        if (error) {
          Alert.alert('Error', 'Failed to update note. Please try again.');
        } else {
          setModalVisible(false);
          loadNotes();
        }
      } else {
        // Create new note
        const { note, error } = await NotesService.createNote(user.id, {
          title: noteTitle.trim(),
          content: noteContent.trim()
        });

        if (error) {
          Alert.alert('Error', 'Failed to create note. Please try again.');
        } else {
          setModalVisible(false);
          loadNotes();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = (note: DatabaseNote) => {
    if (!user) return;

    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { success, error } = await NotesService.deleteNote(user.id, note.id);
            if (error) {
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            } else {
              loadNotes();
            }
          }
        }
      ]
    );
  };

  const renderNote = (note: DatabaseNote) => {
    const date = new Date(note.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <TouchableOpacity
        key={note.id}
        style={[styles.noteCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
        onPress={() => handleEditNote(note)}
      >
        <View style={styles.noteHeader}>
          <Text style={[styles.noteTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {note.title}
          </Text>
          <TouchableOpacity onPress={() => handleDeleteNote(note)} style={styles.deleteButton}>
            <Text style={[styles.deleteButtonText, { color: theme.error }]}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.noteContent, { color: theme.textSecondary }]} numberOfLines={3}>
          {note.content}
        </Text>
        <Text style={[styles.noteDate, { color: theme.textMuted }]}>{date}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with menu button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Text style={[styles.menuIcon, { color: theme.primary }]}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Notes</Text>
        <TouchableOpacity style={styles.menuButton} onPress={handleNewNote}>
          <Text style={[styles.addIcon, { color: theme.primary }]}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading notes...</Text>
          </View>
        ) : notes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyIcon, { color: theme.textMuted }]}>📝</Text>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Notes Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Create your first note to get started
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={handleNewNote}
            >
              <Text style={[styles.emptyButtonText, { color: theme.white }]}>+ New Note</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.notesList}>
            {notes.map(renderNote)}
          </View>
        )}
      </ScrollView>

      {/* Note Editor Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.backgroundSecondary }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
              <Text style={[styles.modalCloseText, { color: theme.textPrimary }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {editingNote ? 'Edit Note' : 'New Note'}
            </Text>
            <TouchableOpacity
              onPress={handleSaveNote}
              disabled={isSaving}
              style={[styles.modalSaveButton, { backgroundColor: theme.primary, opacity: isSaving ? 0.5 : 1 }]}
            >
              <Text style={[styles.modalSaveText, { color: theme.white }]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={[styles.modalTitleInput, { color: theme.textPrimary, borderBottomColor: theme.cardBorder }]}
              placeholder="Note Title"
              placeholderTextColor={theme.textMuted}
              value={noteTitle}
              onChangeText={setNoteTitle}
              editable={!isSaving}
            />
            <TextInput
              style={[styles.modalContentInput, { color: theme.textPrimary }]}
              placeholder="Write your note here..."
              placeholderTextColor={theme.textMuted}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
              editable={!isSaving}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addIcon: {
    fontSize: 36,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notesList: {
    gap: 12,
  },
  noteCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalTitleInput: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  modalContentInput: {
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
});