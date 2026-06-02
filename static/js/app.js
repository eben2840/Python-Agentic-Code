/**
 * CareIT Vibe Mini App Generator - Frontend JavaScript
 * Handles UI interactions, AJAX calls, and task management
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================
window.app = window.app || {};
window.app.currentTaskId = null;
window.app.currentIdea = null;
window.app.pollInterval = null;
window.app.detailPollInterval = null;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

window.app.showToast = showToast;

function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';

  // Parse the date string - server sends UTC time without 'Z' suffix
  let date;
  let dateStr = dateString;

  // Replace space with 'T' for ISO format
  if (dateStr.includes(' ')) {
    dateStr = dateStr.replace(' ', 'T');
  }

  // Add 'Z' suffix if not present to indicate UTC
  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    dateStr = dateStr + 'Z';
  }

  date = new Date(dateStr);

  // Check for invalid date
  if (isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle negative differences (server time slightly ahead)
  if (diff < 0) return 'Just now';
  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// ============================================================================
// MODAL HANDLING
// ============================================================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
  // Stop detail polling when closing task detail modal
  if (modalId === 'task-detail-modal' && window.app.detailPollInterval) {
    clearInterval(window.app.detailPollInterval);
    window.app.detailPollInterval = null;
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('open');
  });
  document.body.style.overflow = '';
}

// Modal close button handlers
document.querySelectorAll('[data-close-modal]').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
  });
});

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      // Stop polling when modal closes
      if (window.app.detailPollInterval) {
        clearInterval(window.app.detailPollInterval);
        window.app.detailPollInterval = null;
      }
    }
  });
});

// ESC key to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllModals();
    if (window.app.detailPollInterval) {
      clearInterval(window.app.detailPollInterval);
      window.app.detailPollInterval = null;
    }
  }
});

// ============================================================================
// VIEW SWITCHING
// ============================================================================

document.querySelectorAll('[data-view]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const viewName = link.getAttribute('data-view');

    // Hide all views and remove active class
    document.querySelectorAll('.view-container').forEach(view => {
      view.classList.add('hidden');
      view.classList.remove('active');
    });

    // Show selected view
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.remove('hidden');
      targetView.classList.add('active');
    }

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    link.classList.add('active');

    // Load mini apps if switching to that view
    if (viewName === 'mini') {
      loadMiniApps();
    }
  });
});

// Helper function to switch views programmatically
function switchToView(viewName) {
  // Hide all views and remove active class
  document.querySelectorAll('.view-container').forEach(view => {
    view.classList.add('hidden');
    view.classList.remove('active');
  });

  // Show selected view
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.remove('hidden');
    targetView.classList.add('active');
  }

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const navLink = document.querySelector(`[data-view="${viewName}"]`);
  if (navLink) {
    navLink.classList.add('active');
  }

  // Load mini apps if switching to that view
  if (viewName === 'mini') {
    loadMiniApps();
  }
}

// ============================================================================
// USE IDEA / EDIT IDEA FUNCTIONALITY
// ============================================================================

function parseIdeaContent(content) {
  // Parse the generated idea into title, description, and technical specification
  const lines = content.split('\n');
  let title = '';
  let description = '';
  let technicalSpec = '';
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    const lowerLine = trimmed.toLowerCase();

    // Detect section headers
    if (lowerLine.includes('title') && (trimmed.startsWith('#') || trimmed.startsWith('**'))) {
      currentSection = 'title';
      continue;
    } else if (lowerLine.includes('description') && (trimmed.startsWith('#') || trimmed.startsWith('**'))) {
      currentSection = 'description';
      continue;
    } else if ((lowerLine.includes('key features') || lowerLine.includes('technical approach') || lowerLine.includes('technical')) && (trimmed.startsWith('#') || trimmed.startsWith('**'))) {
      currentSection = 'technical';
      continue;
    }

    // Extract title from first heading if not found yet
    if (!title && (trimmed.startsWith('# ') || (trimmed.startsWith('**') && trimmed.endsWith('**')))) {
      title = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      continue;
    }

    // Add content to appropriate section
    if (currentSection === 'title' && trimmed && !title) {
      title = trimmed.replace(/\*\*/g, '').trim();
    } else if (currentSection === 'description') {
      description += trimmed + '\n';
    } else if (currentSection === 'technical') {
      technicalSpec += line + '\n';
    } else if (!currentSection && trimmed) {
      // Before any section detected, treat as description
      if (!title) {
        title = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      } else {
        description += trimmed + '\n';
      }
    }
  }

  // If parsing didn't work well, try simpler extraction
  if (!description && !technicalSpec) {
    const sections = content.split(/\*\*(?:Key Features|Technical Approach|Description)\*\*/i);
    if (sections.length > 1) {
      description = sections[1]?.split(/\*\*/)[0]?.trim() || '';
      technicalSpec = sections.slice(2).join('\n').trim();
    } else {
      // Fallback: first paragraph is description, rest is technical
      const paragraphs = content.split('\n\n');
      description = paragraphs[0]?.replace(/^#+.*\n/, '').trim() || '';
      technicalSpec = paragraphs.slice(1).join('\n\n').trim();
    }
  }

  return {
    title: title || 'SMART on FHIR Mini App',
    description: description.trim(),
    technicalSpec: technicalSpec.trim()
  };
}

function useIdea() {
  if (!window.app.currentIdea) {
    showToast('No idea to use. Please generate an idea first.', 'warning');
    return;
  }

  // Parse the idea content into sections
  const parsed = parseIdeaContent(window.app.currentIdea.content);

  // Open the create task modal with the idea pre-filled
  const titleInput = document.getElementById('task-title');
  const descInput = document.getElementById('task-description');
  const specInput = document.getElementById('task-specification');

  if (titleInput) titleInput.value = parsed.title;
  if (descInput) descInput.value = parsed.description;
  if (specInput) specInput.value = parsed.technicalSpec;

  openModal('create-task-modal');
}

// Use Idea button handler
document.getElementById('use-idea-btn')?.addEventListener('click', useIdea);

// ============================================================================
// TASK MODALS
// ============================================================================

document.getElementById('create-task-btn')?.addEventListener('click', () => openModal('create-task-modal'));
document.getElementById('new-task-btn')?.addEventListener('click', () => openModal('create-task-modal'));

// ============================================================================
// TASK CARD MOVEMENT
// ============================================================================

function moveTaskCard(taskId, newStatus) {
  const card = document.querySelector(`[data-task-id="${taskId}"]`);
  if (!card) return;

  const targetColumn = getColumnForStatus(newStatus);
  const targetBody = document.querySelector(`[data-status="${targetColumn}"] [data-droppable]`);

  if (!targetBody) return;

  // Remove empty state from target if present
  const emptyState = targetBody.querySelector('.empty-state-text');
  if (emptyState) emptyState.remove();

  // Update card classes based on status
  card.className = 'task-card';
  if (['planning', 'executing', 'fixing'].includes(newStatus)) {
    card.classList.add('running-card');
  } else if (newStatus === 'reviewing') {
    card.classList.add('reviewing-card');
  } else if (newStatus === 'completed') {
    card.classList.add('completed-card');
  } else if (['failed', 'cancelled'].includes(newStatus)) {
    card.classList.add('failed-card');
  }

  // Update status dot
  const statusDot = card.querySelector('.status-dot');
  if (statusDot) {
    statusDot.className = `status-dot status-${targetColumn}`;
  }

  // Update status label
  const statusLabel = card.querySelector('.task-status-label');
  if (statusLabel) {
    statusLabel.textContent = getStatusLabel(newStatus);
  }

  // Move card if not already in target column
  if (card.parentElement !== targetBody) {
    targetBody.insertBefore(card, targetBody.firstChild);

    // Check if old column is now empty
    const oldColumn = card.parentElement;
    if (oldColumn && oldColumn.querySelectorAll('.task-card').length === 0) {
      const columnStatus = oldColumn.closest('.kanban-column')?.getAttribute('data-status');
      if (columnStatus) {
        oldColumn.innerHTML = `<div class="empty-state-text">No ${columnStatus} tasks</div>`;
      }
    }
  }

  updateColumnCounts();
}

function getColumnForStatus(status) {
  if (status === 'pending') return 'pending';
  if (['planning', 'executing', 'fixing'].includes(status)) return 'running';
  if (status === 'reviewing') return 'reviewing';
  if (status === 'completed') return 'completed';
  if (['failed', 'cancelled'].includes(status)) return 'failed';
  return 'pending';
}

function updateColumnCounts() {
  document.querySelectorAll('.kanban-column').forEach(column => {
    const count = column.querySelectorAll('.task-card').length;
    const countEl = column.querySelector('[data-count]');
    if (countEl) countEl.textContent = count;
  });
}

function getStatusLabel(status) {
  const labels = {
    'pending': 'Click to Start',
    'planning': 'Planning...',
    'executing': 'Executing...',
    'reviewing': 'AI Reviewing...',
    'fixing': 'Fixing...',
    'completed': 'Completed',
    'failed': 'Failed',
    'cancelled': 'Cancelled'
  };
  return labels[status] || status;
}

// ============================================================================
// TASK POLLING (for real-time updates)
// ============================================================================

function startTaskPolling(taskId) {
  if (window.app.pollInterval) {
    clearInterval(window.app.pollInterval);
  }

  window.app.pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { credentials: 'include' });
      const task = await response.json();

      // Move card to correct column
      moveTaskCard(taskId, task.status);

      // Stop polling if task is completed or failed
      if (['completed', 'failed', 'cancelled'].includes(task.status)) {
        clearInterval(window.app.pollInterval);
        window.app.pollInterval = null;

        if (task.status === 'completed') {
          showToast('Mini app generated successfully!', 'success');
        } else if (task.status === 'failed') {
          showToast(`Task failed: ${task.error_message || 'Unknown error'}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error polling task:', error);
    }
  }, 1500);
}

// ============================================================================
// TASK DETAIL MODAL
// ============================================================================

async function showTaskDetail(taskId) {
  window.app.currentTaskId = taskId;

  // Clear any existing polling
  if (window.app.detailPollInterval) {
    clearInterval(window.app.detailPollInterval);
    window.app.detailPollInterval = null;
  }

  try {
    const task = await fetchAndUpdateTaskDetail(taskId);
    openModal('task-detail-modal');

    // If task is running, start polling to update the modal
    if (['planning', 'executing', 'reviewing', 'fixing'].includes(task.status)) {
      startDetailPolling(taskId);
    }

  } catch (error) {
    console.error('Error loading task details:', error);
    showToast('Failed to load task details', 'error');
  }
}

function startDetailPolling(taskId) {
  // Clear any existing polling
  if (window.app.detailPollInterval) {
    clearInterval(window.app.detailPollInterval);
  }

  window.app.detailPollInterval = setInterval(async () => {
    try {
      const task = await fetchAndUpdateTaskDetail(taskId);

      // Also move the card in the background
      moveTaskCard(taskId, task.status);

      // Stop polling if task is completed or failed
      if (['completed', 'failed', 'cancelled', 'pending'].includes(task.status)) {
        clearInterval(window.app.detailPollInterval);
        window.app.detailPollInterval = null;

        if (task.status === 'completed') {
          showToast('Mini app generated successfully!', 'success');
        } else if (task.status === 'failed') {
          showToast(`Task failed: ${task.error_message || 'Unknown error'}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error polling task detail:', error);
    }
  }, 1500);
}

async function fetchAndUpdateTaskDetail(taskId) {
  const response = await fetch(`/api/tasks/${taskId}`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const task = await response.json();

  // Update status badge
  const statusEl = document.getElementById('detail-task-status');
  const statusLabel = getStatusLabel(task.status);
  statusEl.textContent = statusLabel;
  statusEl.className = `task-status-badge ${task.status}`;

  if (['planning', 'executing', 'reviewing', 'fixing'].includes(task.status)) {
    statusEl.classList.add('status-running');
  }

  document.getElementById('detail-task-title').textContent = task.title;
  document.getElementById('detail-task-description').textContent = task.specification || task.description || 'No specification';

  // Update plan section - show full plan content
  const planSection = document.getElementById('detail-task-plan');
  if (planSection) {
    const isRunning = ['planning', 'executing', 'reviewing', 'fixing'].includes(task.status);

    if (task.plan) {
      // Show the plan with markdown-like formatting
      let planHtml = task.plan
        .replace(/^## (.+)$/gm, '<h3 class="plan-heading">$1</h3>')
        .replace(/^### (.+)$/gm, '<h4 class="plan-subheading">$1</h4>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^(\d+\. ✅.+)$/gm, '<div class="plan-step completed">$1</div>')
        .replace(/^(\d+\. ⏳.+)$/gm, '<div class="plan-step pending">$1</div>')
        .replace(/---/g, '<hr class="plan-divider">')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');

      if (isRunning) {
        planHtml = `<div class="plan-status-header"><span class="loading-spinner-small"></span> ${getStatusLabel(task.status)}...</div>` + planHtml;
      }

      planSection.innerHTML = `<div class="plan-content">${planHtml}</div>`;
    } else if (isRunning) {
      planSection.innerHTML = '<div class="plan-status"><span class="loading-spinner-small"></span> Starting generation...</div>';
    } else if (task.status === 'pending') {
      planSection.innerHTML = '<p class="text-muted">Plan will appear after task starts. Click "Start Task" to begin.</p>';
    } else {
      planSection.innerHTML = '<p class="text-muted">No plan available</p>';
    }
  }

  // Update files section
  const filesSection = document.getElementById('detail-task-files');
  if (filesSection) {
    if (task.html_content || task.css_content || task.js_content) {
      // Show clickable file badges
      let filesHtml = '<div class="file-badges">';
      if (task.html_content) {
        filesHtml += `<button class="file-badge clickable" onclick="openFileViewer('${taskId}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          </svg>
          index.htmls
        </button>`;
      }
      if (task.css_content) {
        filesHtml += `<button class="file-badge clickable" onclick="openFileViewer('${taskId}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          </svg>
          styles.css
        </button>`;
      }
      if (task.js_content) {
        filesHtml += `<button class="file-badge clickable" onclick="openFileViewer('${taskId}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          </svg>
          app.js
        </button>`;
      }
      filesHtml += '</div>';
      filesSection.innerHTML = filesHtml;
    } else if (['planning', 'executing', 'reviewing'].includes(task.status)) {
      filesSection.innerHTML = '<p class="text-muted">Files will be generated...</p>';
    } else {
      filesSection.innerHTML = '<p class="text-muted">No files generated</p>';
    }
  }

  // Load task logs
  await loadTaskLogs(taskId);

  // Update buttons visibility
  updateDetailButtons(task);

  return task;
}

function updateDetailButtons(task) {
  const startBtn = document.getElementById('start-task-btn');
  const restartBtn = document.getElementById('restart-task-btn');
  const previewBtn = document.getElementById('preview-task-btn');
  const editBtn = document.getElementById('edit-prompt-btn');
  const stopBtn = document.getElementById('stop-task-detail-btn');
  const deleteBtn = document.getElementById('delete-task-btn');
  const continueBtn = document.getElementById('continue-prompt-btn');

  const isPending = task.status === 'pending';
  const isRunning = ['planning', 'executing', 'reviewing', 'fixing'].includes(task.status);
  const isFailed = ['failed', 'cancelled'].includes(task.status);
  const isCompleted = task.status === 'completed';

  if (startBtn) startBtn.style.display = isPending ? 'flex' : 'none';
  if (restartBtn) restartBtn.style.display = isFailed ? 'flex' : 'none';
  if (previewBtn) previewBtn.style.display = task.html_content ? 'flex' : 'none';
  if (editBtn) editBtn.style.display = (isPending || isFailed || isCompleted) ? 'flex' : 'none';
  if (stopBtn) stopBtn.style.display = isRunning ? 'flex' : 'none';
  if (deleteBtn) deleteBtn.style.display = !isRunning ? 'flex' : 'none';
  if (continueBtn) continueBtn.style.display = isCompleted ? 'flex' : 'none';
}

async function loadTaskLogs(taskId) {
  const logsContainer = document.getElementById('detail-task-logs');
  if (!logsContainer) return;

  try {
    const response = await fetch(`/api/tasks/${taskId}/logs`, { credentials: 'include' });
    const logs = await response.json();

    if (logs.length === 0) {
      logsContainer.innerHTML = '<p class="text-muted">Activity will appear here...</p>';
      return;
    }

    logsContainer.innerHTML = logs.slice(0, 20).map(log => `
      <div class="task-log-entry">
        <span class="log-indicator ${log.level}"></span>
        <div class="log-content">
          <div class="log-text">${log.message}</div>
          <div class="log-timestamp">${formatTimeAgo(log.created_at)}</div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading task logs:', error);
    logsContainer.innerHTML = '<p class="text-error">Failed to load logs</p>';
  }
}

// Task card click handlers
document.querySelectorAll('.task-card').forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    const taskId = card.getAttribute('data-task-id');
    if (taskId) {
      showTaskDetail(taskId);
    }
  });
});

// ============================================================================
// TASK ACTIONS
// ============================================================================

async function startTask() {
  const taskId = window.app.currentTaskId;
  if (!taskId) return;

  const startBtn = document.getElementById('start-task-btn');
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="loading-spinner-small"></span> Starting...';
  }

  try {
    const response = await fetch(`/api/tasks/${taskId}/run`, {
      method: 'POST',
      credentials: 'include'
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Close modal immediately
    closeModal('task-detail-modal');

    // Move card to running column
    moveTaskCard(taskId, 'planning');

    showToast('Task started! Watch it progress...', 'success');

    // Start polling for updates
    startTaskPolling(taskId);

  } catch (error) {
    console.error('Error starting task:', error);
    showToast(`Failed to start task: ${error.message}`, 'error');
  } finally {
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Task`;
    }
  }
}

async function restartTask() {
  const taskId = window.app.currentTaskId;
  if (!taskId) return;

  try {
    const response = await fetch(`/api/tasks/${taskId}/run`, {
      method: 'POST',
      credentials: 'include'
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    closeModal('task-detail-modal');
    moveTaskCard(taskId, 'planning');
    showToast('Task restarted!', 'success');
    startTaskPolling(taskId);

  } catch (error) {
    console.error('Error restarting task:', error);
    showToast(`Failed to restart: ${error.message}`, 'error');
  }
}

async function deleteTask() {
  const taskId = window.app.currentTaskId;
  if (!taskId) return;

  // No confirmation - delete directly
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    closeModal('task-detail-modal');

    // Remove card from DOM
    const card = document.querySelector(`[data-task-id="${taskId}"]`);
    if (card) {
      const column = card.closest('.kanban-column');
      card.remove();

      // Add empty state if column is now empty
      const columnBody = column?.querySelector('[data-droppable]');
      if (columnBody && columnBody.querySelectorAll('.task-card').length === 0) {
        const status = column.getAttribute('data-status');
        columnBody.innerHTML = `<div class="empty-state-text">No ${status} tasks</div>`;
      }
    }

    updateColumnCounts();
    showToast('Task deleted', 'success');

  } catch (error) {
    console.error('Error deleting task:', error);
    showToast(`Failed to delete: ${error.message}`, 'error');
  }
}

async function stopTask() {
  const taskId = window.app.currentTaskId;
  if (!taskId) return;

  try {
    const response = await fetch(`/api/tasks/${taskId}/cancel`, {
      method: 'POST',
      credentials: 'include'
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    // Stop polling
    if (window.app.detailPollInterval) {
      clearInterval(window.app.detailPollInterval);
      window.app.detailPollInterval = null;
    }
    if (window.app.pollInterval) {
      clearInterval(window.app.pollInterval);
      window.app.pollInterval = null;
    }

    closeModal('task-detail-modal');
    moveTaskCard(taskId, 'cancelled');
    showToast('Task stopped', 'success');

  } catch (error) {
    console.error('Error stopping task:', error);
    showToast(`Failed to stop: ${error.message}`, 'error');
  }
}

// Button handlers
document.getElementById('start-task-btn')?.addEventListener('click', startTask);
document.getElementById('restart-task-btn')?.addEventListener('click', restartTask);
document.getElementById('delete-task-btn')?.addEventListener('click', deleteTask);
document.getElementById('stop-task-detail-btn')?.addEventListener('click', stopTask);

// Continue Prompt button - opens continue modal for completed tasks
document.getElementById('continue-prompt-btn')?.addEventListener('click', () => {
  closeModal('task-detail-modal');
  document.getElementById('continue-changes').value = '';
  openModal('continue-prompt-modal');
});

// Apply Changes button - sends changes to backend for incremental update
document.getElementById('apply-changes-btn')?.addEventListener('click', async () => {
  const taskId = window.app.currentTaskId;
  if (!taskId) return;

  const changes = document.getElementById('continue-changes')?.value?.trim();
  if (!changes) {
    showToast('Please describe the changes you want to make', 'warning');
    return;
  }

  const applyBtn = document.getElementById('apply-changes-btn');
  if (applyBtn) {
    applyBtn.disabled = true;
    applyBtn.innerHTML = '<span class="loading-spinner-small"></span> Applying...';
  }

  try {
    const response = await fetch(`/api/tasks/${taskId}/continue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ changes })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    closeModal('continue-prompt-modal');
    switchToView('dashboard');

    // Move card to running
    moveTaskCard(taskId, 'planning');
    startTaskPolling(taskId);

    showToast('Applying changes...', 'success');

  } catch (error) {
    console.error('Error applying changes:', error);
    showToast(`Failed: ${error.message}`, 'error');
  } finally {
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg> Apply Changes`;
    }
  }
});

// Edit Prompt button - opens edit modal with current task data
document.getElementById('edit-prompt-btn')?.addEventListener('click', async () => {
  const taskId = window.app.currentTaskId;
  if (!taskId) return;

  try {
    const response = await fetch(`/api/tasks/${taskId}`, { credentials: 'include' });
    const task = await response.json();

    // Populate the edit form
    document.getElementById('edit-task-title').value = task.title || '';
    document.getElementById('edit-task-description').value = task.description || '';
    document.getElementById('edit-task-specification').value = task.specification || '';

    // Close detail modal and open edit modal
    closeModal('task-detail-modal');
    openModal('edit-prompt-modal');

  } catch (error) {
    console.error('Error loading task for edit:', error);
    showToast('Failed to load task data', 'error');
  }
});

// Save & Restart button - saves edits and restarts the task
document.getElementById('save-restart-btn')?.addEventListener('click', async () => {
  const taskId = window.app.currentTaskId;
  if (!taskId) return;

  const title = document.getElementById('edit-task-title')?.value?.trim();
  const description = document.getElementById('edit-task-description')?.value?.trim();
  const specification = document.getElementById('edit-task-specification')?.value?.trim();

  if (!title) {
    showToast('Title is required', 'warning');
    return;
  }

  const saveBtn = document.getElementById('save-restart-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
  }

  try {
    // Update the task
    const updateResponse = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, description, specification })
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update task');
    }

    // Update the card title in the DOM
    const card = document.querySelector(`[data-task-id="${taskId}"]`);
    if (card) {
      const titleEl = card.querySelector('.task-card-title');
      if (titleEl) titleEl.textContent = title;
      const descEl = card.querySelector('.task-card-description');
      if (descEl) descEl.textContent = description ? description.substring(0, 100) + (description.length > 100 ? '...' : '') : '';
    }

    // Start the task
    const runResponse = await fetch(`/api/tasks/${taskId}/run`, { method: 'POST', credentials: 'include' });
    const runData = await runResponse.json();

    if (runData.error) {
      throw new Error(runData.error);
    }

    closeModal('edit-prompt-modal');
    moveTaskCard(taskId, 'planning');
    showToast('Task updated and restarted!', 'success');
    startTaskPolling(taskId);

  } catch (error) {
    console.error('Error saving and restarting:', error);
    showToast(`Failed: ${error.message}`, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 4v6h-6M1 20v-6h6"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg> Save & Restart`;
    }
  }
});

// Preview button - opens preview modal
document.getElementById('preview-task-btn')?.addEventListener('click', async () => {
  const taskId = window.app.currentTaskId;
  if (!taskId) return;

  try {
    const response = await fetch(`/api/tasks/${taskId}`, { credentials: 'include' });
    const task = await response.json();
    openMiniAppPreview(taskId, task.title, task.final_score);
  } catch (error) {
    console.error('Error loading task for preview:', error);
    showToast('Failed to load preview', 'error');
  }
});

// Open Mini App Preview Modal
function openMiniAppPreview(taskId, title, score) {
  const previewTitle = document.getElementById('preview-app-title');
  const previewScore = document.getElementById('preview-app-score');
  const previewIframe = document.getElementById('mini-app-iframe');
  const openExternalBtn = document.getElementById('preview-new-tab-btn');

  if (previewTitle) previewTitle.textContent = title || 'Mini App Preview';
  if (previewScore) {
    previewScore.textContent = score ? `Score: ${score}/10` : '';
    previewScore.style.display = score ? 'inline-block' : 'none';
  }
  if (previewIframe) {
    previewIframe.src = `/mini-apps/${taskId}/raw`;
  }

  // Store task ID for Open External button
  window.app.previewTaskId = taskId;

  openModal('mini-app-preview-modal');
}

// Open External button
document.getElementById('preview-new-tab-btn')?.addEventListener('click', () => {
  const taskId = window.app.previewTaskId;
  if (taskId) {
    window.open(`/mini-apps/${taskId}`, '_blank');
  }
});

// Stop buttons on cards
document.querySelectorAll('.stop-task-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const taskId = btn.getAttribute('data-task-id');
    if (!taskId) return;

    try {
      await fetch(`/api/tasks/${taskId}/cancel`, { method: 'POST', credentials: 'include' });
      moveTaskCard(taskId, 'cancelled');
      showToast('Task stopped', 'success');
    } catch (error) {
      showToast('Failed to stop task', 'error');
    }
  });
});

// ============================================================================
// MINI APPS GALLERY
// ============================================================================

async function loadMiniApps() {
  const grid = document.getElementById('mini-apps-grid');
  const emptyState = document.getElementById('mini-apps-empty');

  if (!grid) return;

  try {
    const response = await fetch('/api/tasks', { credentials: 'include' });
    const tasks = await response.json();

    const miniApps = tasks.filter(t => t.status === 'completed' && t.html_content);

    if (miniApps.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.querySelectorAll('.mini-app-card').forEach(card => card.remove());

    miniApps.forEach(task => {
      const card = document.createElement('div');
      card.className = 'mini-app-card';
      card.innerHTML = `
        <div class="mini-app-card-preview">
          <iframe src="/mini-apps/${task.id}/raw" class="mini-app-thumbnail" sandbox="allow-scripts"></iframe>
        </div>
        <div class="mini-app-card-body">
          <h3 class="mini-app-card-title">${task.title}</h3>
          <p class="mini-app-card-desc">${task.description || 'No description'}</p>
          <div class="mini-app-card-meta">
            <span class="mini-app-card-score">Score: ${task.final_score || 'N/A'}/10</span>
            <span>${formatTimeAgo(task.completed_at)}</span>
          </div>
          <button class="btn btn-primary btn-sm mini-app-preview-btn" data-task-id="${task.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Preview
          </button>
        </div>
      `;

      // Preview button click - opens preview modal
      card.querySelector('.mini-app-preview-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openMiniAppPreview(task.id, task.title, task.final_score);
      });

      grid.appendChild(card);
    });

  } catch (error) {
    console.error('Error loading mini apps:', error);
    showToast('Failed to load mini apps', 'error');
  }
}

document.getElementById('refresh-mini-apps-btn')?.addEventListener('click', loadMiniApps);

// ============================================================================
// FILE VIEWER
// ============================================================================

// Store current file contents
window.app.fileContents = {
  html: '',
  css: '',
  js: ''
};
window.app.currentFileType = 'html';

// Open file viewer for a task
async function openFileViewer(taskId) {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, { credentials: 'include' });
    const task = await response.json();

    // Store file contents
    window.app.fileContents = {
      html: task.html_content || '<!-- No HTML content -->',
      css: task.css_content || '/* No CSS content */',
      js: task.js_content || '// No JavaScript content'
    };

    // Show HTML by default
    window.app.currentFileType = 'html';
    displayFileContent('html');

    // Update tab states
    document.querySelectorAll('.file-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.file === 'html') {
        tab.classList.add('active');
      }
    });

    openModal('file-viewer-modal');
  } catch (error) {
    console.error('Error loading files:', error);
    showToast('Failed to load file contents', 'error');
  }
}

// Display file content
function displayFileContent(fileType) {
  const display = document.getElementById('file-content-display');
  if (!display) return;

  const content = window.app.fileContents[fileType] || '';
  window.app.currentFileType = fileType;

  // Escape HTML for display
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  display.querySelector('code').textContent = content;
}

// File tab click handlers
document.querySelectorAll('.file-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Update active state
    document.querySelectorAll('.file-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Display content
    displayFileContent(tab.dataset.file);
  });
});

// Copy file content
document.getElementById('copy-file-btn')?.addEventListener('click', () => {
  const content = window.app.fileContents[window.app.currentFileType] || '';

  navigator.clipboard.writeText(content).then(() => {
    showToast('Code copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy code', 'error');
  });
});

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] CareIT Vibe initialized');

  // Load mini apps if on that view
  const miniView = document.getElementById('view-mini');
  if (miniView && !miniView.classList.contains('hidden')) {
    loadMiniApps();
  }
});
