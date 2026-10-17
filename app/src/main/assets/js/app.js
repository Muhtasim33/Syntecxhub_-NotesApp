/* Offline Standalone React Runtime */
if (!window.React || !window.ReactDOM) {
  let stateStore = [];
  let stateCursor = 0;
  let rootContainer = null;
  let appRenderer = null;

  window.React = {
    createElement(type, props, ...children) {
      return { type, props: props || {}, children: children.flat().filter(c => c !== null && c !== undefined && c !== false) };
    },
    useState(initialVal) {
      const idx = stateCursor++;
      if (stateStore[idx] === undefined) {
        stateStore[idx] = typeof initialVal === 'function' ? initialVal() : initialVal;
      }
      const setState = (newVal) => {
        const nextVal = typeof newVal === 'function' ? newVal(stateStore[idx]) : newVal;
        if (stateStore[idx] !== nextVal) {
          stateStore[idx] = nextVal;
          reRender();
        }
      };
      return [stateStore[idx], setState];
    },
    useRef(initialVal) {
      const idx = stateCursor++;
      if (stateStore[idx] === undefined) {
        stateStore[idx] = { current: initialVal };
      }
      return stateStore[idx];
    },
    useEffect(effect, deps) {
      const idx = stateCursor++;
      const prevDeps = stateStore[idx];
      let changed = true;
      if (prevDeps && deps) {
        changed = deps.some((dep, i) => !Object.is(dep, prevDeps[i]));
      }
      if (changed) {
        stateStore[idx] = deps;
        setTimeout(effect, 0);
      }
    }
  };

  function renderVNode(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return document.createTextNode(vnode);
    }
    if (typeof vnode.type === 'function') {
      return renderVNode(vnode.type(vnode.props));
    }
    const el = document.createElement(vnode.type);
    const { children, ...props } = vnode.props;
    Object.keys(props).forEach(key => {
      if (key.startsWith('on') && typeof props[key] === 'function') {
        const eventName = key.substring(2).toLowerCase();
        el.addEventListener(eventName, props[key]);
      } else if (key === 'className') {
        el.className = props[key];
      } else if (key === 'ref' && props[key]) {
        props[key].current = el;
      } else if (key === 'style' && typeof props[key] === 'object') {
        Object.assign(el.style, props[key]);
      } else if (key !== 'key') {
        el.setAttribute(key, props[key]);
      }
    });
    (vnode.children || []).forEach(child => {
      if (child) el.appendChild(renderVNode(child));
    });
    return el;
  }

  function reRender() {
    if (appRenderer && rootContainer) {
      stateCursor = 0;
      rootContainer.innerHTML = '';
      const node = renderVNode(appRenderer());
      rootContainer.appendChild(node);
    }
  }

  window.ReactDOM = {
    createRoot(container) {
      rootContainer = container;
      return {
        render(componentFn) {
          appRenderer = () => React.createElement(componentFn, null);
          reRender();
        }
      };
    }
  };
}

/* React Single Page Application JS */
const { useState, useRef, useEffect, createElement: h } = React;

function NotesApp() {
  const [currentView, setCurrentView] = useState('LIST');

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('notes_app_data');
      return saved ? JSON.parse(saved) : [
        {
          id: '1',
          title: 'Welcome Note 📝',
          body: 'Welcome to your Notes Application! Star notes as favourites, set reminders, and write notes in a spacious, large editor.',
          isFavorite: true,
          reminder: null,
          createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          updatedAt: null
        }
      ];
    } catch (err) {
      console.error("Error loading notes from localStorage:", err);
      return [];
    }
  });

  const [titleInput, setTitleInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');
  const [reminderInput, setReminderInput] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const titleInputRef = useRef(null);
  const bodyInputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('notes_app_data', JSON.stringify(notes));
    } catch (err) {
      console.error("Error saving notes to localStorage:", err);
    }
  }, [notes]);

  useEffect(() => {
    if (currentView === 'EDITOR') {
      const timer = setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  const goToList = () => {
    setCurrentView('LIST');
    setEditingId(null);
    setSelectedNoteId(null);
    setTitleInput('');
    setBodyInput('');
    setReminderInput('');
  };

  const goToAddNote = () => {
    setEditingId(null);
    setTitleInput('');
    setBodyInput('');
    setReminderInput('');
    setCurrentView('EDITOR');
  };

  const goToEditNote = (note, e) => {
    if (e) e.stopPropagation();
    setEditingId(note.id);
    setTitleInput(note.title || '');
    setBodyInput(note.body || '');
    setReminderInput(note.reminder || '');
    setCurrentView('EDITOR');
  };

  const goToDetail = (note) => {
    setSelectedNoteId(note.id);
    setCurrentView('DETAIL');
  };

  const goToSettings = () => {
    setCurrentView('SETTINGS');
  };

  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    setNotes(notes.map(note =>
      note.id === id ? { ...note, isFavorite: !note.isFavorite } : note
    ));
  };

  const clearReminder = (id, e) => {
    if (e) e.stopPropagation();
    setNotes(notes.map(note =>
      note.id === id ? { ...note, reminder: null } : note
    ));
  };

  const handleSaveNote = (e) => {
    if (e) e.preventDefault();
    const trimmedTitle = titleInput.trim() || 'Untitled Note';
    const trimmedBody = bodyInput.trim();

    if (!trimmedBody && !trimmedTitle) return;

    const timeString = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (editingId) {
      setNotes(notes.map(note =>
        note.id === editingId
          ? { ...note, title: trimmedTitle, body: trimmedBody, reminder: reminderInput || null, updatedAt: timeString }
          : note
      ));
    } else {
      const newNote = {
        id: Date.now().toString(),
        title: trimmedTitle,
        body: trimmedBody,
        isFavorite: false,
        reminder: reminderInput || null,
        createdAt: timeString,
        updatedAt: null
      };
      setNotes([newNote, ...notes]);
    }

    goToList();
  };

  const requestDeleteNote = (id, e) => {
    if (e) e.stopPropagation();
    setDeletingNoteId(id);
  };

  const confirmDeleteNote = () => {
    if (!deletingNoteId) return;
    setNotes(notes.filter(note => note.id !== deletingNoteId));
    if (selectedNoteId === deletingNoteId || editingId === deletingNoteId) {
      goToList();
    }
    setDeletingNoteId(null);
  };

  const confirmClearAllData = () => {
    setNotes([]);
    localStorage.removeItem('notes_app_data');
    setShowClearAllModal(false);
    goToList();
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  const filteredNotes = notes.filter(note =>
    (note.title && note.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (note.body && note.body.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const favoriteNotes = notes.filter(n => n.isFavorite);
  const reminderNotes = notes.filter(n => n.reminder);

  const formatReminderDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    } catch (err) {
      return dateStr;
    }
  };

  return h('div', { className: 'app-container' },
    // Top Navbar
    h('div', { className: 'navbar' },
      h('div', { className: 'navbar-brand' },
        currentView !== 'LIST'
          ? h('button', { onClick: goToList, className: 'btn btn-outline btn-sm' }, '← Back')
          : h('span', null, '📝 Notes App')
      ),
      h('div', { className: 'nav-actions' },
        currentView === 'LIST' && h('button', { onClick: goToAddNote, className: 'btn btn-primary btn-sm' }, '➕ New Note'),
        currentView === 'DETAIL' && selectedNote && [
          h('button', { key: 'fav', onClick: (e) => toggleFavorite(selectedNote.id, e), className: 'star-btn' }, selectedNote.isFavorite ? '⭐' : '☆'),
          h('button', { key: 'edit', onClick: (e) => goToEditNote(selectedNote, e), className: 'btn btn-outline btn-sm' }, '✏️ Edit'),
          h('button', { key: 'del', onClick: (e) => requestDeleteNote(selectedNote.id, e), className: 'btn btn-danger btn-sm' }, '🗑️ Delete')
        ]
      )
    ),

    // Layout 1: LIST VIEW
    currentView === 'LIST' && h('div', null,
      h('div', { className: 'search-bar' },
        h('input', {
          type: 'text',
          className: 'search-input',
          placeholder: '🔍 Search title or content...',
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value)
        })
      ),
      h('div', { className: 'notes-header' },
        h('h2', null, 'All Notes'),
        h('span', { className: 'notes-count' }, `${filteredNotes.length} ${filteredNotes.length === 1 ? 'note' : 'notes'}`)
      ),
      h('div', { className: 'notes-grid' },
        filteredNotes.length === 0
          ? h('div', { className: 'card empty-state' },
              h('div', { className: 'empty-icon' }, '📁'),
              h('h3', null, 'No notes found'),
              h('p', { style: { marginTop: '6px' } }, searchTerm ? 'Try adjusting your search criteria.' : 'Tap "New Note" below to create your first note!'),
              !searchTerm && h('button', { onClick: goToAddNote, className: 'btn btn-primary', style: { marginTop: '16px' } }, '➕ Create Note')
            )
          : filteredNotes.map(note =>
              h('div', { key: note.id, className: 'note-card', onClick: () => goToDetail(note) },
                h('div', { className: 'note-card-top' },
                  h('div', { className: 'note-title' }, note.title),
                  h('button', { onClick: (e) => toggleFavorite(note.id, e), className: 'star-btn', title: 'Toggle Favourite' }, note.isFavorite ? '⭐' : '☆')
                ),
                note.reminder && h('div', { style: { marginBottom: '8px' } },
                  h('span', { className: 'reminder-badge' }, `⏰ ${formatReminderDate(note.reminder)}`)
                ),
                h('div', { className: 'note-snippet' }, note.body),
                h('div', { className: 'note-footer' },
                  h('span', { className: 'note-date' }, note.updatedAt ? `Updated: ${note.updatedAt}` : `Created: ${note.createdAt}`),
                  h('div', { className: 'note-actions' },
                    h('button', { onClick: (e) => goToEditNote(note, e), className: 'btn btn-outline btn-sm' }, '✏️ Edit'),
                    h('button', { onClick: (e) => requestDeleteNote(note.id, e), className: 'btn btn-danger btn-sm' }, '🗑️')
                  )
                )
              )
            )
      )
    ),

    // Layout 2: DETAIL VIEW
    currentView === 'DETAIL' && selectedNote && h('div', { className: 'card detail-container' },
      h('div', { className: 'detail-title' },
        h('span', null, selectedNote.title),
        h('button', { onClick: (e) => toggleFavorite(selectedNote.id, e), className: 'star-btn' }, selectedNote.isFavorite ? '⭐' : '☆')
      ),
      h('div', null,
        h('span', { className: 'meta-badge' }, `📅 ${selectedNote.updatedAt ? `Updated ${selectedNote.updatedAt}` : `Created ${selectedNote.createdAt}`}`),
        h('span', { className: 'meta-badge' }, `📊 ${selectedNote.body ? selectedNote.body.trim().split(/\s+/).length : 0} words`),
        h('span', { className: 'meta-badge' }, `🔤 ${selectedNote.body ? selectedNote.body.length : 0} chars`),
        selectedNote.reminder && h('span', { className: 'reminder-badge', style: { fontSize: '12px' } }, `⏰ Reminder: ${formatReminderDate(selectedNote.reminder)}`)
      ),
      h('div', { className: 'detail-body' }, selectedNote.body),
      h('div', { className: 'button-group', style: { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' } },
        h('button', { onClick: goToList, className: 'btn btn-secondary' }, '← Back to List'),
        h('button', { onClick: (e) => goToEditNote(selectedNote, e), className: 'btn btn-primary' }, '✏️ Edit Note'),
        h('button', { onClick: (e) => requestDeleteNote(selectedNote.id, e), className: 'btn btn-danger' }, '🗑️ Delete')
      )
    ),

    // Layout 3: SPACIOUS ADD / EDIT NOTE EDITOR VIEW
    currentView === 'EDITOR' && h('div', { className: 'editor-card' },
      h('div', { className: 'editor-title' }, editingId ? '✏️ Edit Note' : '➕ Create New Note'),
      h('form', { onSubmit: handleSaveNote, className: 'input-form' },
        h('div', { className: 'input-group' },
          h('label', { htmlFor: 'titleInput' }, 'Note Title'),
          h('input', {
            id: 'titleInput',
            type: 'text',
            className: 'input-title-large',
            ref: titleInputRef,
            value: titleInput,
            onChange: (e) => setTitleInput(e.target.value),
            placeholder: 'Enter note title...'
          })
        ),
        h('div', { className: 'input-group', style: { flexGrow: 1, display: 'flex', flexDirection: 'column' } },
          h('label', { htmlFor: 'bodyInput' }, 'Note Content'),
          h('textarea', {
            id: 'bodyInput',
            className: 'textarea-large',
            ref: bodyInputRef,
            value: bodyInput,
            onChange: (e) => setBodyInput(e.target.value),
            placeholder: 'Type note details here...'
          })
        ),
        h('div', { className: 'input-group' },
          h('label', { htmlFor: 'reminderInput' }, '⏰ Set Reminder (Optional)'),
          h('input', {
            id: 'reminderInput',
            type: 'datetime-local',
            value: reminderInput,
            onChange: (e) => setReminderInput(e.target.value)
          })
        ),
        h('div', { className: 'button-group' },
          h('button', { type: 'submit', className: 'btn btn-primary btn-large' }, '💾 Save Note'),
          h('button', { type: 'button', onClick: goToList, className: 'btn btn-secondary btn-large' }, 'Cancel')
        )
      )
    ),

    // Layout 4: SETTINGS VIEW
    currentView === 'SETTINGS' && h('div', { className: 'card' },
      h('h2', { style: { marginBottom: '16px' } }, '⚙️ App Settings & Overview'),
      h('div', { className: 'stat-row' },
        h('span', null, 'Total Saved Notes'),
        h('span', { className: 'stat-value' }, notes.length)
      ),
      h('div', { className: 'stat-row' },
        h('span', null, 'Total Words Stored'),
        h('span', { className: 'stat-value' }, notes.reduce((acc, curr) => acc + (curr.body ? curr.body.trim().split(/\s+/).filter(Boolean).length : 0), 0))
      ),
      h('div', { className: 'settings-section' },
        h('h3', null, `⭐ Favourites (${favoriteNotes.length})`),
        favoriteNotes.length === 0
          ? h('p', { style: { fontSize: '13px', color: 'var(--text-muted)' } }, 'No favourite notes starred yet.')
          : favoriteNotes.map(note =>
              h('div', { key: note.id, className: 'mini-card', onClick: () => goToDetail(note) },
                h('div', null,
                  h('div', { style: { fontWeight: 600, fontSize: '14px' } }, note.title),
                  h('div', { style: { fontSize: '12px', color: 'var(--text-muted)' } }, note.createdAt)
                ),
                h('button', { onClick: (e) => toggleFavorite(note.id, e), className: 'star-btn', title: 'Remove Favourite' }, '⭐')
              )
            )
      ),
      h('div', { className: 'settings-section' },
        h('h3', null, '📌 All Notes'),
        notes.length === 0
          ? h('p', { style: { fontSize: '13px', color: 'var(--text-muted)' } }, 'No notes available.')
          : h('ul', { className: 'bullet-list' },
              notes.map(note =>
                h('li', { key: note.id, onClick: () => goToDetail(note), className: 'bullet-item' },
                  h('span', null, `• ${note.title}`),
                  h('span', null, note.isFavorite ? '⭐' : '›')
                )
              )
            )
      ),
      h('div', { className: 'settings-section' },
        h('h3', null, `⏰ Reminders (${reminderNotes.length})`),
        reminderNotes.length === 0
          ? h('p', { style: { fontSize: '13px', color: 'var(--text-muted)' } }, 'No active reminders scheduled.')
          : reminderNotes.map(note =>
              h('div', { key: note.id, className: 'mini-card', onClick: () => goToDetail(note) },
                h('div', null,
                  h('div', { style: { fontWeight: 600, fontSize: '14px' } }, note.title),
                  h('div', { className: 'reminder-badge', style: { marginTop: '4px' } }, `⏰ ${formatReminderDate(note.reminder)}`)
                ),
                h('button', { onClick: (e) => clearReminder(note.id, e), className: 'btn btn-outline btn-sm', title: 'Clear Reminder' }, '🔕 Clear')
              )
            )
      ),
      h('div', { style: { marginTop: '24px' } },
        h('button', { onClick: () => setShowClearAllModal(true), className: 'btn btn-danger', style: { width: '100%' } }, '🗑️ Clear All Saved Data')
      )
    ),

    // Bottom Navigation Bar
    h('div', { className: 'bottom-nav' },
      h('button', { onClick: goToList, className: `nav-item ${currentView === 'LIST' ? 'active' : ''}` },
        h('span', { className: 'nav-item-icon' }, '📋'),
        h('span', null, 'Notes List')
      ),
      h('button', { onClick: goToAddNote, className: `nav-item ${currentView === 'EDITOR' ? 'active' : ''}` },
        h('span', { className: 'nav-item-icon' }, '➕'),
        h('span', null, 'New Note')
      ),
      h('button', { onClick: goToSettings, className: `nav-item ${currentView === 'SETTINGS' ? 'active' : ''}` },
        h('span', { className: 'nav-item-icon' }, '⚙️'),
        h('span', null, 'Settings')
      )
    ),

    // Delete Modal
    deletingNoteId && h('div', { className: 'modal-overlay', onClick: () => setDeletingNoteId(null) },
      h('div', { className: 'modal-card', onClick: (e) => e.stopPropagation() },
        h('h3', { style: { fontSize: '18px', marginBottom: '8px' } }, '🗑️ Delete Note'),
        h('p', { style: { fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' } }, 'Are you sure you want to delete this note? This action cannot be undone.'),
        h('div', { className: 'button-group', style: { justifyContent: 'flex-end' } },
          h('button', { onClick: () => setDeletingNoteId(null), className: 'btn btn-secondary btn-sm' }, 'Cancel'),
          h('button', { onClick: confirmDeleteNote, className: 'btn btn-danger btn-sm' }, 'Yes, Delete')
        )
      )
    ),

    // Clear All Modal
    showClearAllModal && h('div', { className: 'modal-overlay', onClick: () => setShowClearAllModal(false) },
      h('div', { className: 'modal-card', onClick: (e) => e.stopPropagation() },
        h('h3', { style: { fontSize: '18px', marginBottom: '8px', color: 'var(--danger-color)' } }, '⚠️ Clear All Data'),
        h('p', { style: { fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' } }, 'WARNING: This will permanently delete ALL your saved notes from local storage. Are you sure?'),
        h('div', { className: 'button-group', style: { justifyContent: 'flex-end' } },
          h('button', { onClick: () => setShowClearAllModal(false), className: 'btn btn-secondary btn-sm' }, 'Cancel'),
          h('button', { onClick: confirmClearAllData, className: 'btn btn-danger btn-sm' }, 'Clear All')
        )
      )
    )
  );
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(React.createElement(NotesApp));
