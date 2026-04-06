// Employee Management System (EMS) Logic Core
// Author: Antigravity AI
// Technology: ES6 JS, LocalStorage

class EMSApp {
  constructor() {
    this.state = {
      employees: [],
      leadership: [], // Contains both Managers and HR
      projects: [],
      currentUser: null,
      activeView: 'dashboard'
    };
    
    this.init();
  }

  // --- Core Lifecycle ---
  init() {
    this.setData(); // Load from LocalStorage
    this.setupEventListeners();
    this.renderStats();
    this.switchView('dashboard');
  }

  setData() {
    const saved = localStorage.getItem('ems_data_state');
    if (saved) {
      this.state = JSON.parse(saved);
      this.state.activeView = 'dashboard';
    } else {
      // Initialize with empty arrays, no hardcoded data
      this.state.leadership = [];
      this.state.projects = [];
      this.state.employees = [];
      this.saveToStorage();
    }
  }

  saveToStorage() {
    localStorage.setItem('ems_data_state', JSON.stringify(this.state));
    this.renderStats();
  }

  // --- Routing ---
  switchView(viewName) {
    this.state.activeView = viewName;
    
    // UI Navigation Update
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Content Display Update
    document.querySelectorAll('.view-section').forEach(view => {
      view.style.display = view.id === `view-${viewName}` ? 'block' : 'none';
    });

    // Handle initial list renders
    this.renderActiveView();
  }

  renderActiveView() {
    switch(this.state.activeView) {
      case 'dashboard': this.renderStats(); this.renderTable('recent-list'); break;
      case 'employees': this.renderTable('employee-list'); break;
      case 'leadership': this.renderTable('leadership-list'); break;
      case 'projects': this.renderTable('project-list'); break;
    }
  }

  // --- Rendering UI ---
  renderStats() {
    const totalSalary = this.state.employees.reduce((acc, emp) => acc + parseInt(emp.salary || 0), 0);
    document.getElementById('stat-total').innerText = this.state.employees.length;
    document.getElementById('stat-payroll').innerText = `₹${totalSalary.toLocaleString()}`;
  }

  renderTable(listId) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '';

    if (listId === 'employee-list') {
      const data = this.filteredWorkforce || this.state.employees;
      data.forEach(emp => {
        const initials = emp.name.split(' ').map(n => n[0]).join('').slice(0, 2);
        list.innerHTML += `
          <tr>
            <td>
              <div class="emp-profile">
                <div class="avatar">${initials}</div>
                <div>
                   <span class="info-value">${emp.name}</span>
                   <span class="info-label">${emp.id}</span>
                </div>
              </div>
            </td>
            <td>
               <span class="info-value">${emp.designation}</span>
               <span class="info-label">${emp.dept}</span>
            </td>
            <td>${emp.contact}</td>
            <td><span class="badge ${emp.status === 'Active' ? 'status-active' : (emp.status === 'On Leave' ? 'status-leave' : 'status-term')}">${emp.status}</span></td>
            <td style="font-weight: 700;">₹${parseInt(emp.salary || 0).toLocaleString()}</td>
            <td style="color: var(--accent-purple); font-weight: 600;">${emp.manager}</td>
            <td style="color: var(--accent-cyan); font-weight: 600;">${emp.hr}</td>
            <td>
              <button class="btn-icon" onclick="app.deleteItem('employees', '${emp.id}')"><i class="ph ph-trash"></i></button>
            </td>
          </tr>
        `;
      });
    }

    if (listId === 'leadership-list') {
      this.state.leadership.forEach(lead => {
        list.innerHTML += `
          <tr>
            <td>${lead.id}</td>
            <td style="font-weight: 700;">${lead.name}</td>
            <td>${lead.spec}</td>
            <td><span class="badge status-active">${lead.type}</span></td>
            <td>${lead.email}</td>
            <td>
              <button class="btn-icon" onclick="app.deleteItem('leadership', '${lead.id}')"><i class="ph ph-trash"></i></button>
            </td>
          </tr>
        `;
      });
    }

    if (listId === 'project-list') {
      this.state.projects.forEach(proj => {
        const teamCount = this.state.employees.filter(e => e.project === proj.title).length;
        const statusEmoji = proj.status === 'Completed' ? '✅' : proj.status === 'In Progress' ? '🔨' : proj.status === 'On Hold' ? '⏸' : '📋';
        const priorityColor = proj.priority === 'Critical' ? '#ff4444' : proj.priority === 'High' ? '#ffaa00' : proj.priority === 'Medium' ? '#ffdd00' : '#88ff00';
        list.innerHTML += `
          <tr>
            <td style="font-weight: 600; color: var(--accent-cyan);">${proj.code || proj.id}</td>
            <td style="font-weight: 700;">${proj.title}</td>
            <td><span class="badge" style="background: rgba(255,255,255,0.1); color: ${priorityColor}; border: 1px solid ${priorityColor};">${proj.priority || 'N/A'}</span></td>
            <td><span class="badge ${proj.status === 'Completed' ? 'badge-emp' : 'badge-hr'}">${statusEmoji} ${proj.status}</span></td>
            <td>${proj.mgr}</td>
            <td><strong>${teamCount}</strong>/${proj.teamSize || '?'} Members</td>
            <td style="color: var(--accent-green); font-weight: 600;">₹${parseInt(proj.budget || 0).toLocaleString()}</td>
            <td>
              <button class="btn-icon" onclick="app.deleteItem('projects', '${proj.id}')" title="Delete"><i class="ph ph-trash"></i></button>
            </td>
          </tr>
        `;
      });
    }

    if (listId === 'recent-list') {
      const recent = this.state.employees.slice(-5).reverse();
      if (recent.length === 0) {
        list.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 4rem; color: var(--text-muted);">
            <i class="ph ph-database" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
            No active workforce data. Begin by registering <span style="color: var(--accent-cyan);">Managers</span> and <span style="color: var(--accent-purple);">HR</span> leads.
        </td></tr>`;
        return;
      }
      recent.forEach(emp => {
        list.innerHTML += `
          <tr>
            <td>${emp.name}</td>
            <td>Employee</td>
            <td>${emp.manager}</td>
            <td>${emp.project || 'Unassigned'}</td>
            <td>${new Date().toLocaleDateString()}</td>
          </tr>
        `;
      });
    }
  }

  // --- Dynamic Operations ---
  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', () => this.switchView(item.dataset.view));
    });

    // Generic form submission (Add modal)
    document.getElementById('generic-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.processFormSubmission();
    });

    // Import Center - ENHANCED with validation & relationship mapping
    document.getElementById('import-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported.employees && imported.leadership && imported.projects) {
                    app.pendingImport = imported;
                    app.validateAndPreviewImport();
                } else {
                    alert("❌ Invalid JSON structure. Required fields: employees, leadership, projects");
                }
            } catch(err) {
                alert("❌ Error parsing file: " + err.message);
            }
        };
        reader.readAsText(file);
    });
  }

  filterWorkforce() {
      const query = document.getElementById('employee-search').value.toLowerCase();
      const status = document.getElementById('status-filter').value;
      const dept = document.getElementById('dept-filter').value;

      this.filteredWorkforce = this.state.employees.filter(emp => {
          const matchQuery = emp.name.toLowerCase().includes(query) || 
                            emp.designation.toLowerCase().includes(query) || 
                            emp.id.toLowerCase().includes(query);
          const matchStatus = status === 'all' || emp.status === status;
          const matchDept = dept === 'all' || emp.dept === dept;
          return matchQuery && matchStatus && matchDept;
      });

      this.renderTable('employee-list');
  }

  processFormSubmission() {
    const formData = new FormData(document.getElementById('generic-form'));
    const entry = {};
    formData.forEach((value, key) => entry[key] = value);
    entry.id = 'ID-' + Math.floor(Math.random() * 10000);

    const type = document.getElementById('modal-title').dataset.type;

    if (type === 'employee') {
      this.state.employees.push(entry);
    } else if (type === 'leadership') {
      this.state.leadership.push(entry);
    } else if (type === 'project') {
      this.state.projects.push(entry);
    }

    this.saveToStorage();
    closeModal();
    this.renderActiveView();
  }

  deleteItem(category, id) {
    if (confirm("Permanently delete this entry?")) {
      this.state[category] = this.state[category].filter(item => item.id !== id);
      this.saveToStorage();
      this.renderActiveView();
    }
  }

  // --- ADVANCED DATA IMPORT: Validation & Relationship Mapping ---
  validateAndPreviewImport() {
    const report = {
      errors: [],
      warnings: [],
      stats: {
        employees: this.pendingImport.employees.length,
        leadership: this.pendingImport.leadership.length,
        projects: this.pendingImport.projects.length
      },
      relationshipIssues: [],
      missingReferences: []
    };

    // Validate Leadership (Managers & HR)
    const leadershipIds = new Map();
    this.pendingImport.leadership.forEach(lead => {
      leadershipIds.set(lead.name, lead);
    });

    // Validate Employee References
    this.pendingImport.employees.forEach(emp => {
      if (emp.manager && !leadershipIds.has(emp.manager)) {
        report.relationshipIssues.push(`⚠️ Employee "${emp.name}" references Manager "${emp.manager}" (not found)`);
        report.missingReferences.push({ type: 'manager', employee: emp.name, reference: emp.manager });
      }
      if (emp.hr && !leadershipIds.has(emp.hr)) {
        report.relationshipIssues.push(`⚠️ Employee "${emp.name}" references HR "${emp.hr}" (not found)`);
        report.missingReferences.push({ type: 'hr', employee: emp.name, reference: emp.hr });
      }
    });

    // Validate Project References
    this.pendingImport.projects.forEach(proj => {
      if (proj.mgr && !leadershipIds.has(proj.mgr)) {
        report.relationshipIssues.push(`⚠️ Project "${proj.title}" references Manager "${proj.mgr}" (not found)`);
      }
    });

    // Validate Budget & Priority consistency
    this.pendingImport.projects.forEach(proj => {
      if (!proj.budget || proj.budget < 0) {
        report.warnings.push(`Incomplete: Project "${proj.title}" has no valid budget`);
      }
      if (!proj.priority) {
        report.warnings.push(`Incomplete: Project "${proj.title}" has no priority level`);
      }
    });

    // Check for duplicate IDs
    const allIds = new Set();
    [...this.pendingImport.employees, ...this.pendingImport.leadership, ...this.pendingImport.projects].forEach(item => {
      if (allIds.has(item.id)) {
        report.errors.push(`❌ Duplicate ID found: ${item.id}`);
      }
      allIds.add(item.id);
    });

    this.importReport = report;
    this.showImportPreview(report);
  }

  showImportPreview(report) {
    const panel = document.getElementById('import-panel');
    const reportDiv = document.getElementById('import-report');
    const reportContent = document.getElementById('report-content');

    let html = `
      <div style="margin-bottom: 1rem;">
        <strong style="color: var(--accent-cyan);">✅ Data Summary:</strong>
        <div style="margin-top: 0.5rem; padding-left: 1rem;">
          📋 <strong>${report.stats.employees}</strong> Employees to import<br>
          👔 <strong>${report.stats.leadership}</strong> Leadership profiles<br>
          🎯 <strong>${report.stats.projects}</strong> Projects
        </div>
      </div>
    `;

    if (report.relationshipIssues.length > 0) {
      html += `
        <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(255,170,0,0.1); border-left: 3px solid var(--accent-amber); border-radius: 4px;">
          <strong style="color: var(--accent-amber);">⚠️ Relationship Issues (${report.relationshipIssues.length}):</strong>
          <div style="margin-top: 0.5rem; padding-left: 1rem; font-size: 0.9rem;">
            ${report.relationshipIssues.map(issue => `• ${issue}`).join('<br>')}
          </div>
        </div>
      `;
    }

    if (report.warnings.length > 0) {
      html += `
        <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(255,200,0,0.1); border-left: 3px solid #ffdd00; border-radius: 4px;">
          <strong style="color: #ffdd00;">📌 Warnings (${report.warnings.length}):</strong>
          <div style="margin-top: 0.5rem; padding-left: 1rem; font-size: 0.9rem;">
            ${report.warnings.map(warn => `• ${warn}`).join('<br>')}
          </div>
        </div>
      `;
    }

    if (report.errors.length > 0) {
      html += `
        <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(255,68,68,0.1); border-left: 3px solid #ff4444; border-radius: 4px;">
          <strong style="color: #ff4444;">❌ Critical Errors (${report.errors.length}):</strong>
          <div style="margin-top: 0.5rem; padding-left: 1rem; font-size: 0.9rem;">
            ${report.errors.map(err => `• ${err}`).join('<br>')}
          </div>
        </div>
      `;
    }

    if (report.relationshipIssues.length === 0 && report.warnings.length === 0 && report.errors.length === 0) {
      html += '<div style="padding: 1rem; background: rgba(0,255,136,0.1); border-left: 3px solid var(--accent-green); border-radius: 4px;"><strong style="color: var(--accent-green);">✨ All validations passed! Data is ready to import.</strong></div>';
    }

    reportContent.innerHTML = html;
    reportDiv.style.display = 'block';
    panel.style.display = 'block';
  }

  confirmImport() {
    const validateRel = document.getElementById('validate-relationships').checked;
    const validateProj = document.getElementById('validate-projects').checked;
    const autoFix = document.getElementById('auto-fix-missing').checked;
    const merge = document.getElementById('merge-data').checked;

    if (validateRel && this.importReport.relationshipIssues.length > 0 && !autoFix) {
      alert('⚠️ Fix relationship issues or enable "Auto-Assign Missing References"');
      return;
    }

    // Auto-fix logic
    if (autoFix && this.importReport.missingReferences.length > 0) {
      const availableLeads = this.pendingImport.leadership;
      this.importReport.missingReferences.forEach(issue => {
        const emp = this.pendingImport.employees.find(e => e.name === issue.employee);
        if (emp && availableLeads.length > 0) {
          const autoLead = availableLeads.find(l => l.type === (issue.type === 'manager' ? 'Manager' : 'HR')) || availableLeads[0];
          if (issue.type === 'manager') emp.manager = autoLead.name;
          else emp.hr = autoLead.name;
        }
      });
    }

    // Merge or replace
    if (merge) {
      this.state.employees = [...this.state.employees, ...this.pendingImport.employees];
      this.state.leadership = [...this.state.leadership, ...this.pendingImport.leadership];
      this.state.projects = [...this.state.projects, ...this.pendingImport.projects];
    } else {
      this.state = this.pendingImport;
    }

    this.saveToStorage();
    alert('✅ Data import successful! System refreshing...');
    location.reload();
  }

  cancelImport() {
    document.getElementById('import-panel').style.display = 'none';
    document.getElementById('import-report').style.display = 'none';
    this.pendingImport = null;
    document.getElementById('import-input').value = '';
  }
}

// --- Multi-purpose Modal Logic ---
function openModal(type) {
  const modal = document.getElementById('modal-container');
  const title = document.getElementById('modal-title');
  const formBody = document.getElementById('form-body');
  
  title.innerText = type === 'employee' ? 'Enroll New Employee' : 
                    type === 'leadership' ? 'Register Leadership Profile' : 'Initiate Project';
  title.dataset.type = type;
  formBody.innerHTML = '';

  if (type === 'employee') {
    const managers = app.state.leadership.filter(l => l.type === 'Manager');
    const hrs = app.state.leadership.filter(l => l.type === 'HR');
    const projects = app.state.projects;

    formBody.innerHTML = `
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" name="name" required placeholder="John Doe">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div class="form-group">
            <label>Designation</label>
            <input type="text" name="designation" required placeholder="Senior Developer">
          </div>
          <div class="form-group">
            <label>Department</label>
             <select name="dept" required>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
            </select>
          </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div class="form-group">
            <label>Annual Salary (₹)</label>
            <input type="number" name="salary" required placeholder="800000">
          </div>
          <div class="form-group">
            <label>Employment Status</label>
             <select name="status" required>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
            </select>
          </div>
      </div>
      <div class="form-group">
        <label>Contact Email</label>
        <input type="email" name="contact" required placeholder="john@example.com">
      </div>
      <div class="form-group">
        <label>Relational Manager</label>
        <select name="manager" required>
          ${managers.map(m => `<option value="${m.name}">${m.name}</option>`).join('') || '<option value="N/A">Register Managers first</option>'}
        </select>
      </div>
      <div class="form-group">
        <label>HR Partner</label>
        <select name="hr" required>
          ${hrs.map(m => `<option value="${m.name}">${m.name}</option>`).join('') || '<option value="N/A">Register HR first</option>'}
        </select>
      </div>
      <div class="form-group">
        <label>Assigned Project</label>
        <select name="project">
          <option value="">No Project Assignment</option>
          ${projects.map(p => `<option value="${p.title}">${p.title} (${p.code || 'ID'})</option>`).join('') || '<option value="">No projects available</option>'}
        </select>
      </div>
    `;
  } else if (type === 'leadership') {
    formBody.innerHTML = `
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" name="name" required>
      </div>
      <div class="form-group">
        <label>Role Type</label>
        <select name="type" required>
          <option value="Manager">Manager</option>
          <option value="HR">HR</option>
        </select>
      </div>
      <div class="form-group">
        <label>Core Department</label>
        <select name="spec" required>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
            </select>
      </div>
      <div class="form-group">
        <label>Official Email</label>
        <input type="email" name="email" required>
      </div>
    `;
  } else if (type === 'project') {
    const managers = app.state.leadership.filter(l => l.type === 'Manager');
    formBody.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="form-group">
          <label>Project Title</label>
          <input type="text" name="title" required placeholder="Enterprise Portal">
        </div>
        <div class="form-group">
          <label>Project Code</label>
          <input type="text" name="code" required placeholder="PRJ-2026-001">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="form-group">
          <label>Project Manager (Lead)</label>
          <select name="mgr" required>
            ${managers.map(m => `<option value="${m.name}">${m.name}</option>`).join('') || '<option value="N/A">No Managers found</option>'}
          </select>
        </div>
        <div class="form-group">
          <label>Department/Client</label>
          <select name="dept" required>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Project Description</label>
        <textarea name="description" placeholder="Brief description of project objectives and scope..." style="min-height: 70px; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); color: var(--text-main);" required></textarea>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="form-group">
          <label>Budget (₹)</label>
          <input type="number" name="budget" placeholder="500000" required>
        </div>
        <div class="form-group">
          <label>Priority Level</label>
          <select name="priority" required>
            <option value="Critical">🔴 Critical</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="form-group">
          <label>Team Size (Planned)</label>
          <input type="number" name="teamSize" placeholder="5" min="1" required>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select name="status" required>
            <option value="Planning">📋 Planning</option>
            <option value="In Progress">🔨 In Progress</option>
            <option value="On Hold">⏸ On Hold</option>
            <option value="Completed">✅ Completed</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="form-group">
          <label>Start Date</label>
          <input type="date" name="startDate" required>
        </div>
        <div class="form-group">
          <label>Deadline</label>
          <input type="date" name="deadline" required>
        </div>
      </div>

      <div class="form-group">
        <label>Required Technologies/Skills</label>
        <input type="text" name="skills" placeholder="React, Node.js, MongoDB, AWS" required>
      </div>
    `;
  }

  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('modal-container').classList.remove('active');
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(app.state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "ems_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Global initialization
const app = new EMSApp();
window.app = app;
