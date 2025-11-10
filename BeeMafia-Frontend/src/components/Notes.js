import React, { useState, useEffect } from 'react';
import './Notes.css';

function Notes({ gameId }) {
  const [notes, setNotes] = useState('');

  // Load notes from localStorage when component mounts
  useEffect(() => {
    const savedNotes = localStorage.getItem(`beemafia_notes_${gameId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [gameId]);

  // Save notes to localStorage when they change
  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    localStorage.setItem(`beemafia_notes_${gameId}`, newNotes);
  };

  // Clear notes
  const handleClearNotes = () => {
    setNotes('');
    localStorage.removeItem(`beemafia_notes_${gameId}`);
  };

  return (
    <div className="notes-panel">
      <div className="notes-header">
        <h3>📝 Notes</h3>
        <button
          onClick={handleClearNotes}
          className="btn-clear-notes"
          title="Clear notes"
        >
          Clear
        </button>
      </div>
      <textarea
        className="notes-textarea"
        placeholder="Keep track of suspects, alliances, and clues here..."
        value={notes}
        onChange={handleNotesChange}
      />
    </div>
  );
}

export default Notes;
