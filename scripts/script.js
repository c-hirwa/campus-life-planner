// ============ Storage Module ============
        const STORAGE_KEY = 'campus:tasks';
        const SETTINGS_KEY = 'campus:settings';

        const Storage = {
            load() {
                try {
                    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                } catch {
                    return [];
                }
            },
            save(data) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            },
            loadSettings() {
                try {
                    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"durationCap": 40}');
                } catch {
                    return { durationCap: 40 };
                }
            },
            saveSettings(settings) {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            }
        };

        // ============ Validation Module ============
        const Validators = {
            title: /^\S(?:.*\S)?$/,
            duration: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
            date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
            tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
            duplicateWord: /\b(\w+)\s+\1\b/i,

            validate(field, value) {
                if (!value) return false;
                return this[field] && this[field].test(value);
            },

            checkDuplicates(text) {
                return this.duplicateWord.test(text);
            }
        };

        // ============ Search Module ============
        const Search = {
            compile(pattern, flags = 'i') {
                try {
                    return pattern ? new RegExp(pattern, flags) : null;
                } catch {
                    return null;
                }
            },

            highlight(text, regex) {
                if (!regex || !text) return text;
                return String(text).replace(regex, match => `<mark>${match}</mark>`);
            }
        };

        // ============ State Management ============
        let state = {
            tasks: Storage.load(),
            settings: Storage.loadSettings(),
            currentSort: { field: null, direction: 'asc' },
            currentSearch: null,
            editingId: null
        };

        // ============ Helper Functions ============
        function generateId() {
            return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        function getTimestamp() {
            return new Date().toISOString();
        }

        function getWeekAgo() {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            return d.toISOString().split('T')[0];
        }

        // ============ UI Updates ============
        function updateStats() {
            const tasks = state.tasks;
            const weekAgo = getWeekAgo();
            
            document.getElementById('totalTasks').textContent = tasks.length;
            
            const totalMinutes = tasks.reduce((sum, t) => sum + parseFloat(t.duration || 0), 0);
            document.getElementById('totalHours').textContent = (totalMinutes / 60).toFixed(1);
            
            const tagCounts = {};
            tasks.forEach(t => {
                tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
            });
            const topTag = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])[0] || '-';
            document.getElementById('topTag').textContent = topTag;
            
            const recentTasks = tasks.filter(t => t.date >= weekAgo).length;
            document.getElementById('last7Days').textContent = recentTasks;

            updateCapStatus(totalMinutes);
        }

        function updateCapStatus(totalMinutes) {
            const cap = state.settings.durationCap || 40;
            const capMinutes = cap * 60;
            const percentage = (totalMinutes / capMinutes) * 100;
            
            const capBar = document.getElementById('capBar');
            const capStatus = document.getElementById('capStatus');
            
            capBar.style.width = Math.min(percentage, 100) + '%';
            
            if (percentage > 100) {
                capBar.style.background = 'var(--danger)';
                capStatus.className = 'status-danger';
                capStatus.setAttribute('aria-live', 'assertive');
                capStatus.textContent = `⚠️ Duration cap exceeded by ${((totalMinutes - capMinutes) / 60).toFixed(1)} hours!`;
                capStatus.classList.remove('hidden');
            } else {
                capBar.style.background = 'var(--accent)';
                const remaining = (capMinutes - totalMinutes) / 60;
                if (remaining < 5) {
                    capStatus.className = 'status-warning';
                    capStatus.setAttribute('aria-live', 'polite');
                    capStatus.textContent = `⏰ Only ${remaining.toFixed(1)} hours remaining in cap`;
                    capStatus.classList.remove('hidden');
                } else {
                    capStatus.classList.add('hidden');
                }
            }
        }

        function renderTable() {
            const tbody = document.getElementById('recordsTable');
            let tasks = [...state.tasks];

            // Apply search filter
            if (state.currentSearch) {
                tasks = tasks.filter(t => 
                    state.currentSearch.test(t.title) ||
                    state.currentSearch.test(t.tag) ||
                    state.currentSearch.test(t.notes || '')
                );
            }

            // Apply sorting
            if (state.currentSort.field) {
                tasks.sort((a, b) => {
                    let aVal = a[state.currentSort.field];
                    let bVal = b[state.currentSort.field];
                    
                    if (state.currentSort.field === 'duration') {
                        aVal = parseFloat(aVal);
                        bVal = parseFloat(bVal);
                    }
                    
                    if (aVal < bVal) return state.currentSort.direction === 'asc' ? -1 : 1;
                    if (aVal > bVal) return state.currentSort.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }

            if (tasks.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No tasks found</td></tr>';
                return;
            }

            tbody.innerHTML = tasks.map(task => {
                const title = Search.highlight(task.title, state.currentSearch);
                const tag = Search.highlight(task.tag, state.currentSearch);
                
                return `
                    <tr>
                        <td>${title}</td>
                        <td>${task.dueDate}</td>
                        <td>${task.duration}</td>
                        <td>${tag}</td>
                        <td class="actions">
                            <button onclick="window.editTask('${task.id}')">Edit</button>
                            <button class="danger" onclick="window.deleteTask('${task.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function showPage(pageId) {
            document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            
            document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
            document.querySelector(`nav button[data-page="${pageId}"]`).classList.add('active');
        }

        function showStatus(elementId, message, type = 'info') {
            const el = document.getElementById(elementId);
            el.textContent = message;
            el.className = `status-${type}`;
            el.classList.remove('hidden');
            setTimeout(() => el.classList.add('hidden'), 5000);
        }

        // ============ Form Handling ============
        function validateForm() {
            let valid = true;
            
            const title = document.getElementById('title').value;
            const titleError = document.getElementById('titleError');
            if (!Validators.validate('title', title)) {
                titleError.classList.add('show');
                valid = false;
            } else {
                titleError.classList.remove('show');
                // Check for duplicate words
                if (Validators.checkDuplicates(title)) {
                    titleError.textContent = 'Warning: Title contains duplicate words';
                    titleError.classList.add('show');
                }
            }
            
            const dueDate = document.getElementById('dueDate').value;
            const dueDateError = document.getElementById('dueDateError');
            if (!Validators.validate('date', dueDate)) {
                dueDateError.classList.add('show');
                valid = false;
            } else {
                dueDateError.classList.remove('show');
            }
            
            const duration = document.getElementById('duration').value;
            const durationError = document.getElementById('durationError');
            if (!Validators.validate('duration', duration)) {
                durationError.classList.add('show');
                valid = false;
            } else {
                durationError.classList.remove('show');
            }
            
            const tag = document.getElementById('tag').value;
            const tagError = document.getElementById('tagError');
            if (!Validators.validate('tag', tag)) {
                tagError.classList.add('show');
                valid = false;
            } else {
                tagError.classList.remove('show');
            }
            
            return valid;
        }

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!validateForm()) return;
            
            const editId = document.getElementById('editId').value;
            const task = {
                id: editId || generateId(),
                title: document.getElementById('title').value,
                dueDate: document.getElementById('dueDate').value,
                duration: document.getElementById('duration').value,
                tag: document.getElementById('tag').value,
                notes: document.getElementById('notes').value,
                createdAt: editId ? state.tasks.find(t => t.id === editId).createdAt : getTimestamp(),
                updatedAt: getTimestamp()
            };
            
            if (editId) {
                const idx = state.tasks.findIndex(t => t.id === editId);
                state.tasks[idx] = task;
            } else {
                state.tasks.push(task);
            }
            
            Storage.save(state.tasks);
            updateStats();
            renderTable();
            
            document.getElementById('taskForm').reset();
            document.getElementById('editId').value = '';
            document.getElementById('formTitle').textContent = 'Add New Task';
            
            showPage('records');
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            document.getElementById('taskForm').reset();
            document.getElementById('editId').value = '';
            document.getElementById('formTitle').textContent = 'Add New Task';
        });

        // ============ Edit & Delete ============
        window.editTask = (id) => {
            const task = state.tasks.find(t => t.id === id);
            if (!task) return;
            
            document.getElementById('editId').value = task.id;
            document.getElementById('title').value = task.title;
            document.getElementById('dueDate').value = task.dueDate;
            document.getElementById('duration').value = task.duration;
            document.getElementById('tag').value = task.tag;
            document.getElementById('notes').value = task.notes || '';
            
            document.getElementById('formTitle').textContent = 'Edit Task';
            showPage('add');
        };

        window.deleteTask = (id) => {
            if (!confirm('Delete this task?')) return;
            
            state.tasks = state.tasks.filter(t => t.id !== id);
            Storage.save(state.tasks);
            updateStats();
            renderTable();
        };

        // ============ Search & Sort ============
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const pattern = e.target.value;
            const flags = document.getElementById('caseInsensitive').checked ? 'gi' : 'g';
            
            state.currentSearch = Search.compile(pattern, flags);
            
            if (pattern && !state.currentSearch) {
                showStatus('searchStatus', '⚠️ Invalid regex pattern', 'warning');
            } else if (pattern) {
                showStatus('searchStatus', `✓ Searching with pattern: ${pattern}`, 'success');
            }
            
            renderTable();
        });

        document.getElementById('caseInsensitive').addEventListener('change', () => {
            const pattern = document.getElementById('searchInput').value;
            if (pattern) {
                const flags = document.getElementById('caseInsensitive').checked ? 'gi' : 'g';
                state.currentSearch = Search.compile(pattern, flags);
                renderTable();
            }
        });

        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            state.currentSearch = null;
            renderTable();
            document.getElementById('searchStatus').classList.add('hidden');
        });

        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                
                if (state.currentSort.field === field) {
                    state.currentSort.direction = state.currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    state.currentSort.field = field;
                    state.currentSort.direction = 'asc';
                }
                
                document.querySelectorAll('th').forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                th.classList.add(`sort-${state.currentSort.direction}`);
                
                renderTable();
            });
        });

        // ============ Navigation ============
        document.querySelectorAll('nav button').forEach(btn => {
            btn.addEventListener('click', () => {
                showPage(btn.dataset.page);
            });
        });

        // ============ Settings ============
        document.getElementById('durationCap').addEventListener('change', (e) => {
            state.settings.durationCap = parseFloat(e.target.value) || 40;
            Storage.saveSettings(state.settings);
            updateStats();
        });

        document.getElementById('minutesInput').addEventListener('input', (e) => {
            const minutes = parseFloat(e.target.value) || 0;
            const hours = (minutes / 60).toFixed(2);
            document.getElementById('hoursOutput').value = hours;
        });

        // ============ Import/Export ============
        document.getElementById('exportBtn').addEventListener('click', () => {
            const dataStr = JSON.stringify(state.tasks, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `campus-planner-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showStatus('dataStatus', '✓ Data exported successfully', 'success');
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Validate structure
                    if (!Array.isArray(data)) {
                        throw new Error('Data must be an array');
                    }
                    
                    const valid = data.every(task => 
                        task.id && task.title && task.dueDate && 
                        task.duration && task.tag
                    );
                    
                    if (!valid) {
                        throw new Error('Invalid task structure');
                    }
                    
                    state.tasks = data;
                    Storage.save(state.tasks);
                    updateStats();
                    renderTable();
                    
                    showStatus('dataStatus', `✓ Imported ${data.length} tasks successfully`, 'success');
                } catch (err) {
                    showStatus('dataStatus', `⚠️ Import failed: ${err.message}`, 'danger');
                }
                
                e.target.value = '';
            };
            reader.readAsText(file);
        });

        // ============ Initialize ============
        state.settings.durationCap = state.settings.durationCap || 40;
        document.getElementById('durationCap').value = state.settings.durationCap;
        
        updateStats();
        renderTable();
