class FileStorageManager {
  constructor() {
    this.storageKey = 'file_storage_data';
  }

  saveFile(fileName, fileData, fileType = 'text') {
    const storage = this.getStorage();
    const fileId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    storage.files[fileId] = {
      name: fileName,
      type: fileType,
      data: fileData,
      created: Date.now(),
      size: typeof fileData === 'string' ? fileData.length : fileData.byteLength || 0
    };
    this.saveStorage(storage);
    return fileId;
  }

  getFile(fileId) {
    const storage = this.getStorage();
    return storage.files[fileId] || null;
  }

  getAllFiles() {
    const storage = this.getStorage();
    return Object.values(storage.files);
  }

  deleteFile(fileId) {
    const storage = this.getStorage();
    delete storage.files[fileId];
    this.saveStorage(storage);
  }

  getStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : { files: {} };
    } catch {
      return { files: {} };
    }
  }

  saveStorage(storage) {
    localStorage.setItem(this.storageKey, JSON.stringify(storage));
  }

  saveToDrive(driveLetter, path, fileName, fileData, fileType = 'text') {
    const fsKey = 'filesystem_data';
    try {
      const fsData = localStorage.getItem(fsKey);
      const fs = fsData ? JSON.parse(fsData) : null;
      if (!fs || !fs[driveLetter]) return false;

      const pathArray = path.split('\\').filter(p => p);
      let current = fs[driveLetter];

      for (const folder of pathArray) {
        if (!current.folders[folder]) {
          current.folders[folder] = { folders: {}, files: {} };
        }
        current = current.folders[folder];
      }

      const fileSize = typeof fileData === 'string' ? fileData.length : (fileData.byteLength || 0);
      current.files[fileName] = fileSize;

      const fileStorageKey = `file_${driveLetter}_${path}_${fileName}`;
      localStorage.setItem(fileStorageKey, typeof fileData === 'string' ? fileData : JSON.stringify(fileData));

      localStorage.setItem(fsKey, JSON.stringify(fs));
      return true;
    } catch (e) {
      console.error('Error saving to drive:', e);
      return false;
    }
  }

  showSaveDialog(defaultFileName, fileData, fileType, callback) {
    const fsKey = 'filesystem_data';
    const fsData = localStorage.getItem(fsKey);
    const fs = fsData ? JSON.parse(fsData) : null;
    if (!fs) {
      alert('Файловая система не инициализирована. Откройте Explorer для настройки.');
      return;
    }

    const overlay = el('div', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10000'
    });

    const dialog = el('div', {
      background: 'rgba(30, 30, 50, 0.98)',
      border: '2px solid rgba(100, 150, 255, 0.4)',
      borderRadius: '12px',
      padding: '24px',
      minWidth: '500px',
      maxWidth: '80vw',
      maxHeight: '80vh',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      gap: '16px'
    });

    const title = el('div', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#4bf'
    }, '💾 Сохранить как');

    const content = el('div', {
      display: 'grid',
      gridTemplateColumns: '200px 1fr',
      gap: '16px',
      maxHeight: '400px',
      overflow: 'auto'
    });

    const sidebar = el('div', {
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '8px',
      padding: '8px',
      overflow: 'auto'
    });

    const drivesTitle = el('div', {
      fontWeight: 'bold',
      marginBottom: '8px',
      fontSize: '12px'
    }, 'Диски:');
    sidebar.appendChild(drivesTitle);

    let selectedDrive = Object.keys(fs)[0];
    let selectedPath = [];

    const updateSidebar = () => {
      sidebar.innerHTML = '';
      sidebar.appendChild(drivesTitle);

      for (const letter in fs) {
        const driveBtn = el('div', {
          padding: '8px',
          marginBottom: '4px',
          background: selectedDrive === letter ? 'rgba(100, 150, 255, 0.3)' : 'rgba(100, 150, 255, 0.1)',
          borderRadius: '4px',
          cursor: 'pointer',
          border: '1px solid rgba(100, 150, 255, 0.2)'
        });
        driveBtn.textContent = `💿 ${letter}:`;
        driveBtn.addEventListener('click', () => {
          selectedDrive = letter;
          selectedPath = [];
          updateSidebar();
          updateContent();
        });
        sidebar.appendChild(driveBtn);
      }
    };

    const mainArea = el('div', {
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '8px',
      padding: '8px',
      overflow: 'auto'
    });

    const updateContent = () => {
      mainArea.innerHTML = '';

      let current = fs[selectedDrive];
      for (const folder of selectedPath) {
        current = current.folders[folder];
      }

      if (selectedPath.length > 0) {
        const backBtn = el('div', {
          padding: '8px',
          marginBottom: '4px',
          background: 'rgba(100, 150, 255, 0.1)',
          borderRadius: '4px',
          cursor: 'pointer',
          border: '1px solid rgba(100, 150, 255, 0.2)'
        }, '← Назад');
        backBtn.addEventListener('click', () => {
          selectedPath.pop();
          updateContent();
        });
        mainArea.appendChild(backBtn);
      }

      const folders = Object.keys(current.folders);
      folders.forEach(folder => {
        const folderBtn = el('div', {
          padding: '8px',
          marginBottom: '4px',
          background: 'rgba(100, 150, 255, 0.1)',
          borderRadius: '4px',
          cursor: 'pointer',
          border: '1px solid rgba(100, 150, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        });
        folderBtn.innerHTML = `📁 ${folder}`;
        folderBtn.addEventListener('click', () => {
          selectedPath.push(folder);
          updateContent();
        });
        mainArea.appendChild(folderBtn);
      });

      const newFolderBtn = el('div', {
        padding: '8px',
        marginTop: '8px',
        background: 'rgba(76, 175, 80, 0.2)',
        borderRadius: '4px',
        cursor: 'pointer',
        border: '1px solid rgba(76, 175, 80, 0.3)',
        textAlign: 'center'
      }, '+ Создать папку');
      newFolderBtn.addEventListener('click', () => {
        const folderName = prompt('Имя папки:');
        if (folderName && folderName.trim()) {
          current.folders[folderName.trim()] = { folders: {}, files: {} };
          localStorage.setItem(fsKey, JSON.stringify(fs));
          updateContent();
        }
      });
      mainArea.appendChild(newFolderBtn);
    };

    content.append(sidebar, mainArea);

    const bottom = el('div', {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    });

    const fileNameInput = input('text', 'Имя файла', {
      flex: '1',
      padding: '8px',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '4px',
      color: '#fff'
    });
    fileNameInput.value = defaultFileName;

    const saveBtn = btn('Сохранить', {
      padding: '8px 16px',
      background: 'rgba(76, 175, 80, 0.8)',
      color: '#fff'
    });

    const cancelBtn = btn('Отмена', {
      padding: '8px 16px',
      background: 'rgba(220, 80, 80, 0.6)',
      color: '#fff'
    });

    saveBtn.addEventListener('click', () => {
      const fileName = fileNameInput.value.trim();
      if (!fileName) {
        alert('Введите имя файла');
        return;
      }
      const path = selectedPath.join('\\');
      if (this.saveToDrive(selectedDrive, path, fileName, fileData, fileType)) {
        if (callback) callback(selectedDrive, path, fileName);
        overlay.remove();
      } else {
        alert('Ошибка сохранения');
      }
    });

    cancelBtn.addEventListener('click', () => overlay.remove());

    bottom.append(fileNameInput, saveBtn, cancelBtn);
    dialog.append(title, content, bottom);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    updateSidebar();
    updateContent();
  }
}

class SettingsManager {
  constructor() {
    this.settingsKey = 'w12_settings';
    this.desktopWallpaperEl = document.querySelector('.desktop-wallpaper');
  }

  loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.settingsKey) || '{}');
    } catch {
      return {};
    }
  }



  saveSettings(next) {
    const current = this.loadSettings();
    const merged = { ...current, ...next };
    localStorage.setItem(this.settingsKey, JSON.stringify(merged));
    return merged;
  }

  applyTheme(theme) {
    document.body.classList.remove('theme-blue', 'theme-purple', 'theme-green', 'theme-orange', 'theme-pink', 'theme-hollow', 'theme-red');
  }

  applyMenuStyle(style) {
    document.body.classList.remove('menu-left', 'menu-right', 'menu-center');

    if (style === 'left') {
      document.body.classList.add('menu-left');
    } else if (style === 'right') {
      document.body.classList.add('menu-right');
    } else {
      document.body.classList.add('menu-center');
    }

    try {
      const taskbar = document.querySelector('.taskbar');
      const taskbarLeft = document.querySelector('.taskbar-left');
      const taskbarRight = document.querySelector('.taskbar-right');
      const taskbarCenter = document.getElementById('taskbar-center');
      const taskbarClock = document.getElementById('taskbar-clock');
      if (!taskbar || !taskbarLeft || !taskbarRight || !taskbarCenter || !taskbarClock) return;

      if (taskbarClock.parentElement !== taskbarCenter) {
        taskbarCenter.insertBefore(taskbarClock, taskbarCenter.firstChild);
      }

      if (style === 'left') {
      } else if (style === 'right') {
      } else {
      }
    } catch (error) {
      console.error('Error applying menu style:', error);
    }
  }

  applyWindowsVersion(version) {
    document.body.classList.remove('windows-10', 'windows-8', 'windows-7',
      'windows-xp', 'windows-2000', 'windows-98', 'windows-95',
      'windows-31', 'windows-1'
    );

    if (version) {
      document.body.classList.add(`windows-${version}`);
    } else {
      document.body.classList.add('windows-11');
    }
  }

  applyWallpaper(url) {
    if (!this.desktopWallpaperEl) return;
    if (!url) {
      this.desktopWallpaperEl.style.removeProperty('--wallpaper-image');
      return;
    }
    this.desktopWallpaperEl.style.setProperty('--wallpaper-image', `url("${url}")`);
  }
}
class WindowManager {
  constructor(windowsRoot, taskbarCenter) {
    if (!windowsRoot || !taskbarCenter) {
      console.error('WindowManager: windowsRoot and taskbarCenter are required');
      return;
    }
    this.windowsRoot = windowsRoot;
    this.taskbarCenter = taskbarCenter;
    this.lastZ = 10;
    this.windows = new Map();
    this.appGroups = new Map();
    this.taskbar = document.querySelector('.taskbar');
    this.updateScreenSize();
    window.addEventListener('resize', () => this.updateScreenSize());

    if (this.taskbarCenter) {
      this.taskbarCenter.style.display = 'flex';
    }
  }

  updateScreenSize() {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    this.isMobile = this.screenWidth < 768;
    this.isTablet = this.screenWidth >= 768 && this.screenWidth < 1024;
    this.isDesktop = this.screenWidth >= 1024;
    document.body.classList.toggle('screen-mobile', this.isMobile);
    document.body.classList.toggle('screen-tablet', this.isTablet);
    document.body.classList.toggle('screen-desktop', this.isDesktop);
  }

  getAdaptiveSize(baseWidth, baseHeight) {
    const maxWidth = Math.min(baseWidth, this.screenWidth - 40);
    const maxHeight = Math.min(baseHeight, this.screenHeight - 100);

    if (this.isMobile) {
      return {
        width: Math.min(maxWidth, this.screenWidth - 20),
        height: Math.min(maxHeight, this.screenHeight - 80)
      };
    } else if (this.isTablet) {
      return {
        width: Math.min(maxWidth, this.screenWidth * 0.9),
        height: Math.min(maxHeight, this.screenHeight * 0.85)
      };
    }
    return { width: maxWidth, height: maxHeight };
  }

  focusWindow(winEl) {
    if (!winEl) return;
    this.lastZ += 1;
    winEl.style.zIndex = String(this.lastZ);
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    winEl.classList.add('focused');

    const windowId = winEl.dataset.windowId;
    const windowData = this.windows.get(windowId);
    if (windowData) {
      this.updateTaskbarButtonState(windowData.appId, windowId, true);
    }
  }

  createWindow(appId, appRegistry) {
    if (!this.windowsRoot || !this.taskbarCenter) {
      console.error('WindowManager: windowsRoot or taskbarCenter is null');
      return null;
    }
    const app = appRegistry[appId];
    if (!app) return null;
    const id = `${appId}-${Math.random().toString(36).slice(2)}`;
    const baseWidth = app.size?.width || 800;
    const baseHeight = app.size?.height || 600;
    const adaptiveSize = this.getAdaptiveSize(baseWidth, baseHeight);

    const winEl = document.createElement('div');
    winEl.className = 'window focused';
    winEl.style.width = `${adaptiveSize.width}px`;
    winEl.style.height = `${adaptiveSize.height}px`;

    const left = Math.max(10, Math.round((this.screenWidth - adaptiveSize.width) / 2));
    const top = Math.max(10, Math.round((this.screenHeight - adaptiveSize.height) / 2));
    winEl.style.left = `${left}px`;
    winEl.style.top = `${top}px`;

    this.focusWindow(winEl);

    const titlebar = document.createElement('div');
    titlebar.className = 'window-titlebar';
    const title = document.createElement('div');
    title.className = 'window-title';
    title.innerHTML = `<img src="${app.icon}" alt="" width="16" height="16" /> <span>${app.title}</span>`;
    const controls = document.createElement('div');
    controls.className = 'window-controls';
    controls.innerHTML = `
            <button class="wc-btn minimize" title="Minimize">&#8722;</button>
            <button class="wc-btn maximize" title="Maximize">&#9723;</button>
            <button class="wc-btn close" title="Close">&#10005;</button>
        `;
    titlebar.appendChild(title);
    titlebar.appendChild(controls);

    const content = document.createElement('div');
    content.className = 'window-content';
    try {
      const node = app.content();
      if (node) content.appendChild(node);
    } catch (error) {
      console.error(`Error creating content for app ${appId}:`, error);
      content.textContent = 'Error loading application';
    }

    winEl.appendChild(titlebar);
    winEl.appendChild(content);
    this.windowsRoot.appendChild(winEl);

    winEl.dataset.windowId = id;
    winEl.dataset.appId = appId;

    this.createTaskbarIcon(appId, app, id, winEl);

    const closeBtn = controls.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        winEl.remove();
        this.windows.delete(id);

        this.updateTaskbarGroup(appId);
        const remaining = Array.from(this.windows.values()).filter(w => w.appId === appId);
        if (remaining.length === 0) {
          this.removeTaskbarIcon(appId);
        }
      });
    }

    const minimizeBtn = controls.querySelector('.minimize');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        winEl.style.display = 'none';
        this.updateTaskbarButtonState(appId, id, false);
      });
    }

    const maximizeBtn = controls.querySelector('.maximize');
    if (maximizeBtn) {
      maximizeBtn.addEventListener('click', () => {
        const maximized = winEl.dataset.maximized === '1';
        if (!maximized) {
          winEl.dataset.prev = JSON.stringify({
            left: winEl.style.left,
            top: winEl.style.top,
            width: winEl.style.width,
            height: winEl.style.height
          });
          const taskbarHeight = 48;
          winEl.style.left = '6px';
          winEl.style.top = '6px';
          winEl.style.width = `${window.innerWidth - 12}px`;
          winEl.style.height = `${window.innerHeight - taskbarHeight - 12}px`;
          winEl.dataset.maximized = '1';
        } else {
          try {
            const prev = JSON.parse(winEl.dataset.prev || '{}');
            winEl.style.left = prev.left || winEl.style.left;
            winEl.style.top = prev.top || winEl.style.top;
            winEl.style.width = prev.width || winEl.style.width;
            winEl.style.height = prev.height || winEl.style.height;
          } catch { }
          winEl.dataset.maximized = '0';
        }
        this.focusWindow(winEl);
      });
    }

    this.windows.set(id, {
      element: winEl,
      appId,
      minimized: false
    });

    return id;
  }

  createTaskbarIcon(appId, app, windowId, winEl) {
    let groupContainer = this.appGroups.get(appId);

    if (!groupContainer) {
      const iconButton = document.createElement('button');
      iconButton.className = 'taskbar-icon';
      iconButton.innerHTML = `<img src="${app.icon}" alt="${app.title}" width="16" height="16" />`;
      iconButton.title = app.title;

      iconButton.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            `;

      iconButton.addEventListener('click', () => {
        const windows = Array.from(this.windows.values()).filter(w => w.appId === appId);

        if (windows.length === 1) {
          const win = windows[0];
          if (win.element.style.display === 'none') {
            win.element.style.display = '';
            this.focusWindow(win.element);
            iconButton.classList.add('active');
          } else if (win.element === document.querySelector('.window.focused')) {
            win.element.style.display = 'none';
            iconButton.classList.remove('active');
          } else {
            this.focusWindow(win.element);
            iconButton.classList.add('active');
          }
        }
      });

      const clock = this.taskbarCenter.querySelector('.taskbar-clock');
      if (clock) {
        this.taskbarCenter.insertBefore(iconButton, clock);
      } else {
        this.taskbarCenter.appendChild(iconButton);
      }

      this.appGroups.set(appId, {
        button: iconButton,
        windows: new Map([[windowId, winEl]])
      });
    } else {
      const group = this.appGroups.get(appId);
      group.windows.set(windowId, winEl);

      this.updateTaskbarGroupBadge(appId);
    }

    return this.appGroups.get(appId)?.button;
  }

  updateTaskbarButtonState(appId, windowId, isActive) {
    const group = this.appGroups.get(appId);
    if (!group) return;

    const button = group.button;
    if (isActive) {
      button.classList.add('active');
      button.style.background = 'rgba(255, 255, 255, 0.2)';
    } else {
      button.classList.remove('active');
      button.style.background = 'rgba(255, 255, 255, 0.1)';
    }
  }

  updateTaskbarGroupBadge(appId) {
    const group = this.appGroups.get(appId);
    if (!group) return;

    const windowsCount = group.windows.size;

    let badge = group.button.querySelector('.taskbar-badge');
    if (badge) badge.remove();

    if (windowsCount > 1) {
      badge = document.createElement('div');
      badge.className = 'taskbar-badge';
      badge.textContent = windowsCount;
      badge.style.cssText = `
                position: absolute;
                top: -4px;
                right: -4px;
                background: rgba(100, 150, 255, 0.9);
                color: white;
                font-size: 10px;
                font-weight: bold;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid rgba(255, 255, 255, 0.3);
            `;

      group.button.style.position = 'relative';
      group.button.appendChild(badge);
    }
  }

  updateTaskbarGroup(appId) {
    const group = this.appGroups.get(appId);
    if (!group) return;
    this.updateTaskbarGroupBadge(appId);

    if (group.windows.size === 0) {
      group.button.remove();
      this.appGroups.delete(appId);
    }
  }

  removeTaskbarIcon(appId) {
    const group = this.appGroups.get(appId);
    if (group && group.button) {
      group.button.remove();
      this.appGroups.delete(appId);
    }
  }
}

class DesktopManager {
  constructor() {
    this.startMenu = document.getElementById('start-menu');
    this.taskbarClock = document.getElementById('taskbar-clock');
    if (this.taskbarClock) {
      this.initClock();
    }
  }

  initClock() {
    if (!this.taskbarClock) return;
    this.updateClock();
    setInterval(() => this.updateClock(), 30_000);
  }

  updateClock() {
    if (!this.taskbarClock) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    this.taskbarClock.textContent = time;
  }

  toggleStartMenu(force) {
    if (!this.startMenu) return;
    const willOpen = force ?? this.startMenu.classList.contains('hidden');
    if (willOpen) {
      this.startMenu.classList.remove('hidden');
      this.startMenu.setAttribute('aria-hidden', 'false');
    } else {
      this.startMenu.classList.add('hidden');
      this.startMenu.setAttribute('aria-hidden', 'true');
    }
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const windowsRoot = document.getElementById('windows-root');
  const startMenu = document.getElementById('start-menu');
  const menu = document.getElementById('menu');
  const taskbarCenter = document.getElementById('taskbar-center');
  const taskbarClock = document.getElementById('taskbar-clock');

  if (!windowsRoot || !startMenu || !taskbarCenter || !taskbarClock) {
    console.error('Required DOM elements not found. Check HTML structure.');
    return;
  }

  const settingsManager = new SettingsManager();
  const windowManager = new WindowManager(windowsRoot, taskbarCenter);
  if (!windowManager.windowsRoot) {
    console.error('WindowManager initialization failed');
    return;
  }
  const desktopManager = new DesktopManager();

  try {
    const taskbarEl = document.querySelector('.taskbar');
    if (taskbarEl) taskbarEl.classList.add('width-compact');

    const createScrollBtn = (dir) => {
      const btn = document.createElement('button');
      btn.className = `taskbar-scroll-btn taskbar-scroll-${dir} hidden`;
      btn.type = 'button';
      btn.setAttribute('aria-hidden', 'true');
      btn.innerHTML = dir === 'left' ? '&#9664;' : '&#9654;';
      btn.addEventListener('click', () => {
        const amount = Math.round(taskbarCenter.clientWidth * 0.5);
        taskbarCenter.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
      });
      return btn;
    };

    const scrollLeftBtn = createScrollBtn('left');
    const scrollRightBtn = createScrollBtn('right');

    try {
      const parent = taskbarCenter.parentElement || taskbarEl || document.querySelector('.taskbar');
      if (parent) {
        parent.insertBefore(scrollLeftBtn, taskbarCenter);
        parent.appendChild(scrollRightBtn);
      }
    } catch (e) {
      console.warn('Could not insert taskbar scroll buttons', e);
    }

    const updateTaskbarOverflow = () => {
      const canScroll = taskbarCenter.scrollWidth > taskbarCenter.clientWidth + 1;
      if (canScroll) {
        scrollLeftBtn.classList.remove('hidden');
        scrollRightBtn.classList.remove('hidden');
        taskbarCenter.classList.add('scrollable');
      } else {
        scrollLeftBtn.classList.add('hidden');
        scrollRightBtn.classList.add('hidden');
        taskbarCenter.classList.remove('scrollable');
        taskbarCenter.scrollLeft = 0;
      }
      const max = taskbarCenter.scrollWidth - taskbarCenter.clientWidth - 2;
      if (taskbarCenter.scrollLeft > 4) scrollLeftBtn.classList.remove('hidden');
      if (taskbarCenter.scrollLeft >= max) scrollRightBtn.classList.add('hidden');
    };

    const mo = new MutationObserver(() => setTimeout(updateTaskbarOverflow, 40));
    mo.observe(taskbarCenter, { childList: true });
    window.addEventListener('resize', () => setTimeout(updateTaskbarOverflow, 40));
    taskbarCenter.addEventListener('scroll', () => setTimeout(updateTaskbarOverflow, 20));
    setTimeout(updateTaskbarOverflow, 120);
  } catch (e) {
    console.warn('Taskbar compact/overflow init failed', e);
  }

  const defaultWallpapers = [
    '../wallpapers/wallpaper1.jpg',
    '../wallpapers/wallpaper2.jpg',
    '../wallpapers/wallpaper3.jpg',
    '../wallpapers/wallpaper4.jpg',
    '../wallpapers/wallpaper5.jpg',
    '../wallpapers/wallpaper6.jpg',
  ];

  const initialSettings = (() => {
    const s = settingsManager.loadSettings();
    if (!Array.isArray(s.wallpapers) || s.wallpapers.length === 0) {
      s.wallpapers = defaultWallpapers.slice();
      s.selectedWallpaperIndex = 0;
      localStorage.setItem(settingsManager.settingsKey, JSON.stringify(s));
    }
    return s;
  })();

  settingsManager.applyTheme(null);
  settingsManager.applyMenuStyle(initialSettings.menuStyle || 'center');
  settingsManager.applyWindowsVersion(initialSettings.windowsVersion || '11');
  if (initialSettings.wallpapers && typeof initialSettings.selectedWallpaperIndex === 'number') {
    const u = initialSettings.wallpapers[initialSettings.selectedWallpaperIndex];
    if (u) settingsManager.applyWallpaper(u);
  }

  const loadSettings = () => settingsManager.loadSettings();
  const saveSettings = (next) => settingsManager.saveSettings(next);
  const applyTheme = (theme) => settingsManager.applyTheme(theme);
  const applyMenuStyle = (style) => settingsManager.applyMenuStyle(style);
  const applyWallpaper = (url) => settingsManager.applyWallpaper(url);
  const applyWindowsVersion = (version) => settingsManager.applyWindowsVersion(version);

  if (!window.translate) {
    window.translate = function (key) {
      return (window.translations && window.translations[key]) || key;
    };
  }

  (() => {
    const extraClose = startMenu?.querySelector('.start-close');
    if (extraClose) extraClose.remove();
  })();

  const el = (tag, styles = {}, text = '') => {
    const e = document.createElement(tag);
    Object.assign(e.style, styles);
    if (text) e.textContent = text;
    return e;
  };
  const gameContainer = () => {
    const root = el('div', { display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', alignItems: 'center', justifyContent: 'center' });
    const info = el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' });
    const canvasWrap = el('div', { display: 'flex', justifyContent: 'center', alignItems: 'center', flex: '1', width: '100%' });
    return { root, info, canvasWrap };
  };
  const btn = (text, click) => {
    const b = el('button', {}, text);
    b.className = 'btn';
    if (click) b.addEventListener('click', click);
    return b;
  };
  const input = (type, placeholder, styles = {}) => {
    const i = el('input', { flex: '1', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.25)', color: '#e8e8ef', padding: '0 10px', ...styles });
    i.type = type;
    if (placeholder) i.placeholder = placeholder;
    return i;
  };
  const canvasEl = (width, height, styles = {}) => {
    const c = el('canvas', { width: `min(${width}px, 90vw)`, height: `min(${height}px, 85vh)`, borderRadius: '12px', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', outline: 'none', ...styles });
    c.tabIndex = 0;
    return c;
  };

  let isAdmin = false;
  try {
    const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('user_json'));
    if (userData && userData.name && userData.name.toLowerCase() === 'admin') {
      const activationKey = userData.activationKey || '';
      if (activationKey === '1234-5678-9101') {
        isAdmin = true;
      }
    }
  } catch (e) { }
  const appRegistry = {
    explorer: {
      title: 'File Explorer',
      icon: './static/icons/folder.svg',
      content: () => {
        const fsKey = 'filesystem_data';
        const setupKey = 'filesystem_setup_done';
        const mediaLibraryKey = 'media_library_data';

        const getFileSystem = () => {
          const data = localStorage.getItem(fsKey);
          return data ? JSON.parse(data) : null;
        };

        const saveFileSystem = (fs) => {
          localStorage.setItem(fsKey, JSON.stringify(fs));
        };

        const getMediaLibrary = () => {
          const data = localStorage.getItem(mediaLibraryKey);
          return data ? JSON.parse(data) : { images: [], texts: [], nextImageId: 1, nextTextId: 1 };
        };

        const saveMediaLibrary = (library) => {
          localStorage.setItem(mediaLibraryKey, JSON.stringify(library));
        };

        class FileStorageManager {
          constructor() {
            this.library = getMediaLibrary();
          }

          generateImageId() {
            const id = this.library.nextImageId;
            this.library.nextImageId++;
            saveMediaLibrary(this.library);
            return id;
          }

          generateTextId() {
            const id = this.library.nextTextId;
            this.library.nextTextId++;
            saveMediaLibrary(this.library);
            return id;
          }

          saveImage(name, data, type, description = '') {
            const id = this.generateImageId();
            const filename = `photo_${id}_${Date.now()}.${type.split('/')[1] || 'png'}`;
            const imageData = {
              id,
              filename,
              originalName: name,
              type,
              data,
              description: description || name,
              uploadDate: new Date().toISOString(),
              size: this.calculateSize(data)
            };

            this.library.images.push(imageData);
            saveMediaLibrary(this.library);
            return imageData;
          }

          saveText(name, data, type) {
            const id = this.generateTextId();
            const textData = {
              id,
              filename: `text_${id}_${Date.now()}.txt`,
              originalName: name,
              type: 'text/plain',
              data,
              uploadDate: new Date().toISOString(),
              size: new Blob([data]).size
            };

            this.library.texts.push(textData);
            saveMediaLibrary(this.library);
            return textData;
          }

          saveCode(name, data, language = 'javascript') {
            const id = this.generateTextId();
            const codeData = {
              id,
              filename: `code_${id}_${Date.now()}.${language}`,
              originalName: name,
              type: 'code',
              language,
              data,
              uploadDate: new Date().toISOString(),
              size: new Blob([data]).size
            };

            this.library.texts.push(codeData);
            saveMediaLibrary(this.library);
            return codeData;
          }

          saveToDrive(driveLetter, path, filename, data, type) {
            const fs = getFileSystem();
            if (!fs || !fs[driveLetter]) return;

            const drive = fs[driveLetter];
            const size = this.calculateSize(data);

            let current = drive;
            if (path !== driveLetter + ':') {
              const parts = path.split('\\').filter(p => p);
              for (const part of parts.slice(1)) {
                if (current.folders && current.folders[part]) {
                  current = current.folders[part];
                } else {
                  current.folders[part] = { folders: {}, files: {} };
                  current = current.folders[part];
                }
              }
            }

            current.files[filename] = size;
            drive.usedMemory += Math.ceil(size / 1024); 
            saveFileSystem(fs);
          }

          getImageById(id) {
            return this.library.images.find(img => img.id == id);
          }

          getTextById(id) {
            return this.library.texts.find(text => text.id == id);
          }

          getAllImages() {
            return this.library.images;
          }

          getAllTexts() {
            return this.library.texts;
          }

          getAllFiles() {
            return [...this.library.images, ...this.library.texts];
          }

          calculateSize(data) {
            if (data.startsWith('data:')) {
              const base64 = data.split(',')[1];
              return (base64.length * 3) / 4 - (data.indexOf('=') > 0 ? 2 : 0);
            }
            return new Blob([data]).size;
          }
        }

        const initializeFileSystem = (driveCount, driveMemories) => {
          const drives = {};
          let letters = ['C', 'D', 'E', 'F', 'G'];

          for (let i = 0; i < driveCount; i++) {
            const letter = letters[i];
            drives[letter] = {
              name: `${letter}:`,
              totalMemory: driveMemories[i],
              usedMemory: 0,
              folders: {},
              files: {}
            };

            if (letter === 'C') {
              drives[letter].folders['Windows'] = {
                folders: {
                  'System32': { folders: {}, files: { 'kernel.exe': 256, 'drivers.dll': 512, 'config.sys': 64 } },
                  'Temp': { folders: {}, files: {} }
                },
                files: { 'bootmgr': 128 }
              };
              drives[letter].folders['Program Files'] = {
                folders: {},
                files: { 'program.exe': 1024 }
              };
              drives[letter].usedMemory = 2048;
            }
          }

          localStorage.setItem(setupKey, 'true');
          saveFileSystem(drives);
          return drives;
        };

        const showDriveSetup = (callback) => {
          const container = el('div', {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(20, 20, 30, 0.98)',
            border: '2px solid rgba(100, 150, 255, 0.3)',
            borderRadius: '12px',
            padding: '30px',
            zIndex: '10000',
            minWidth: '400px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
          });

          const title = el('div', { fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#4bf' }, 'Setup Drives');

          const driveCountLabel = el('div', { marginBottom: '8px' }, 'Number of drives (1-5):');
          const driveCountInput = el('input');
          driveCountInput.type = 'number';
          driveCountInput.min = '1';
          driveCountInput.max = '5';
          driveCountInput.value = '1';
          Object.assign(driveCountInput.style, {
            width: '100%',
            padding: '8px',
            marginBottom: '20px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: '#fff'
          });

          const memoryInputs = el('div', { marginBottom: '20px' });
          const updateMemoryInputs = () => {
            memoryInputs.innerHTML = '';
            const count = Math.max(1, Math.min(5, parseInt(driveCountInput.value) || 1));
            for (let i = 0; i < count; i++) {
              const letter = 'CDEFG'[i];
              const row = el('div', { marginBottom: '12px' });
              const label = el('div', { fontSize: '12px', marginBottom: '4px' }, `Drive ${letter}: memory (MB)`);
              const input = el('input');
              input.type = 'number';
              input.min = '100';
              input.max = '10000';
              input.value = i === 0 ? '1024' : '512';
              input.className = `memory-input-${i}`;
              Object.assign(input.style, {
                width: '100%',
                padding: '8px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff'
              });
              row.append(label, input);
              memoryInputs.appendChild(row);
            }
          };

          driveCountInput.addEventListener('change', updateMemoryInputs);
          updateMemoryInputs();

          const btnContainer = el('div', { display: 'flex', gap: '10px' });
          const setupBtn = btn('Create', {
            flex: '1',
            padding: '10px',
            background: 'rgba(76, 175, 80, 0.8)',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer'
          });

          setupBtn.addEventListener('click', () => {
            const count = Math.max(1, Math.min(5, parseInt(driveCountInput.value) || 1));
            const memories = [];
            for (let i = 0; i < count; i++) {
              const input = memoryInputs.querySelector(`.memory-input-${i}`);
              memories.push(Math.max(100, parseInt(input.value) || 512));
            }
            container.remove();
            document.removeEventListener('keydown', escapeListener);
            callback(count, memories);
          });

          const escapeListener = (e) => {
            if (e.key === 'Escape') {
              container.remove();
              document.removeEventListener('keydown', escapeListener);
              callback(1, [1024]);
            }
          };

          document.addEventListener('keydown', escapeListener);
          btnContainer.appendChild(setupBtn);
          container.append(title, driveCountLabel, driveCountInput, memoryInputs, btnContainer);
          document.body.appendChild(container);
        };

        const root = el('div', { display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', height: '100%' });
        const sidebar = el('div', { background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '8px', overflow: 'auto' });
        const mainArea = el('div', { display: 'grid', gridTemplateRows: 'auto 1fr', gap: '8px' });

        const addressBar = el('div', { background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '8px', display: 'flex', gap: '8px', alignItems: 'center' });
        const pathInput = el('input');
        pathInput.type = 'text';
        pathInput.placeholder = 'C:\\';
        Object.assign(pathInput.style, {
          flex: '1',
          padding: '6px 8px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px',
          color: '#fff'
        });

        const searchInput = el('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
        Object.assign(searchInput.style, {
          width: '120px',
          padding: '6px 8px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px',
          color: '#fff'
        });

        addressBar.append(pathInput, searchInput);

        const contentArea = el('div', { background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '8px', overflow: 'auto' });

        let currentPath = ['C'];
        let fs = getFileSystem();

        const navigate = (pathArray) => {
          currentPath = pathArray;
          pathInput.value = pathArray.join('\\') + '\\';
          renderContent();
        };

        const renderContent = () => {
          contentArea.innerHTML = '';

          if (currentPath.length === 1) {
            const drive = fs[currentPath[0]];
            if (!drive) return;

            const items = [];
            for (const name in drive.folders) {
              items.push({ type: 'folder', name, path: [...currentPath, name] });
            }
            for (const name in drive.files) {
              items.push({ type: 'file', name, size: drive.files[name] });
            }

            items.forEach(item => {
              const itemEl = el('div', {
                padding: '8px',
                marginBottom: '4px',
                background: 'rgba(100, 150, 255, 0.1)',
                borderRadius: '4px',
                cursor: 'pointer',
                border: '1px solid rgba(100, 150, 255, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              });

              const nameEl = el('div', {}, item.type === 'folder' ? '📁 ' + item.name : '📄 ' + item.name);
              const sizeEl = el('div', { fontSize: '12px', opacity: '0.7' }, item.type === 'file' ? item.size + ' KB' : '');

              itemEl.append(nameEl, sizeEl);

              if (item.type === 'folder') {
                itemEl.addEventListener('click', () => navigate(item.path));
              }

              contentArea.appendChild(itemEl);
            });
          } else {
            let current = fs[currentPath[0]];
            for (let i = 1; i < currentPath.length; i++) {
              current = current.folders[currentPath[i]];
              if (!current) return;
            }

            const items = [];
            for (const name in current.folders) {
              items.push({ type: 'folder', name, path: [...currentPath, name] });
            }
            for (const name in current.files) {
              items.push({ type: 'file', name, size: current.files[name] });
            }

            items.forEach(item => {
              const itemEl = el('div', {
                padding: '8px',
                marginBottom: '4px',
                background: 'rgba(100, 150, 255, 0.1)',
                borderRadius: '4px',
                cursor: 'pointer',
                border: '1px solid rgba(100, 150, 255, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              });

              const nameEl = el('div', {}, item.type === 'folder' ? '📁 ' + item.name : '📄 ' + item.name);
              const sizeEl = el('div', { fontSize: '12px', opacity: '0.7' }, item.type === 'file' ? item.size + ' KB' : '');

              itemEl.append(nameEl, sizeEl);

              if (item.type === 'folder') {
                itemEl.addEventListener('click', () => navigate(item.path));
              }

              contentArea.appendChild(itemEl);
            });
          }

          const newFolderBtn = btn('+ New Folder', () => {
            showCreateFolderDialog();
          });
          Object.assign(newFolderBtn.style, { marginTop: '8px' });
          contentArea.appendChild(newFolderBtn);

          const fileStorage = new FileStorageManager();
          const uploadBtn = btn('📤 Upload File', () => {
            showUploadFileDialog();
          });
          Object.assign(uploadBtn.style, { marginTop: '8px', marginLeft: '8px', display: 'inline-block' });
          contentArea.appendChild(uploadBtn);

          const viewMediaBtn = btn('📚 Media Library', () => {
            showMediaLibraryDialog();
          });
          Object.assign(viewMediaBtn.style, { marginTop: '8px', marginLeft: '8px', display: 'inline-block' });
          contentArea.appendChild(viewMediaBtn);

          const showUploadFileDialog = () => {
            const overlay = el('div', {
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: '9999'
            });

            const dialog = el('div', {
              background: 'rgba(30, 30, 50, 0.98)',
              border: '2px solid rgba(100, 150, 255, 0.4)',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '400px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
            });

            const title = el('div', {
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#4bf'
            }, '📤 Upload File');

            const fileInput = el('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*,.txt,.json,.js,.html,.css,.py';
            Object.assign(fileInput.style, {
              width: '100%',
              padding: '10px',
              marginBottom: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(100, 150, 255, 0.3)',
              borderRadius: '6px',
              color: '#fff'
            });

            const descriptionInput = el('input');
            descriptionInput.type = 'text';
            descriptionInput.placeholder = 'Description (optional)';
            descriptionInput.style.display = 'none';
            Object.assign(descriptionInput.style, {
              width: '100%',
              padding: '10px',
              marginBottom: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(100, 150, 255, 0.3)',
              borderRadius: '6px',
              color: '#fff'
            });

            fileInput.addEventListener('change', () => {
              const file = fileInput.files[0];
              if (file && file.type.startsWith('image/')) {
                descriptionInput.style.display = 'block';
                descriptionInput.value = file.name.replace(/\.[^/.]+$/, "");
              } else {
                descriptionInput.style.display = 'none';
              }
            });

            const driveSelect = el('select');
            Object.assign(driveSelect.style, {
              width: '100%',
              padding: '10px',
              marginBottom: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(100, 150, 255, 0.3)',
              borderRadius: '6px',
              color: '#fff'
            });

            for (const letter in fs) {
              const option = el('option', {}, `${letter}:`);
              driveSelect.appendChild(option);
            }

            const btnContainer = el('div', { display: 'flex', gap: '10px' });
            const uploadBtn = el('button');
            uploadBtn.textContent = 'Upload';
            Object.assign(uploadBtn.style, {
              flex: '1',
              padding: '10px 16px',
              background: 'rgba(76, 175, 80, 0.8)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer'
            });

            const cancelBtn = el('button');
            cancelBtn.textContent = 'Cancel';
            Object.assign(cancelBtn.style, {
              flex: '1',
              padding: '10px 16px',
              background: 'rgba(220, 80, 80, 0.6)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer'
            });

            uploadBtn.addEventListener('click', () => {
              const file = fileInput.files[0];
              if (!file) {
                alert('Please select a file');
                return;
              }

              const reader = new FileReader();
              reader.onload = (e) => {
                const driveLetter = driveSelect.value[0];
                const fileData = e.target.result;
                const fileType = file.type || 'application/octet-stream';
                const description = descriptionInput.value.trim();

                if (file.type.startsWith('image/')) {
                  const imageData = fileStorage.saveImage(file.name, fileData, fileType, description);
                  console.log(`Image saved with ID: ${imageData.id}, filename: ${imageData.filename}`);
                } else if (file.type.startsWith('text/') || file.type === 'application/json') {
                  const textData = fileStorage.saveText(file.name, fileData, fileType);
                  console.log(`Text file saved with ID: ${textData.id}`);
                } else if (file.name.match(/\.(js|html|css|py)$/)) {
                  const codeData = fileStorage.saveCode(file.name, fileData, file.name.split('.').pop());
                  console.log(`Code file saved with ID: ${codeData.id}`);
                }

                const path = currentPath.join('\\');
                fileStorage.saveToDrive(driveLetter, path, file.name, fileData, fileType);

                alert(`File "${file.name}" saved to drive ${driveLetter}: with ID in library`);
                overlay.remove();
                renderContent();
              };

              if (file.type.startsWith('text/') || file.type === 'application/json' ||
                file.name.match(/\.(js|html|css|py)$/)) {
                reader.readAsText(file);
              } else {
                reader.readAsDataURL(file);
              }
            });

            cancelBtn.addEventListener('click', () => overlay.remove());
            btnContainer.append(uploadBtn, cancelBtn);
            dialog.append(
              title,
              el('div', { marginBottom: '8px' }, 'Select drive:'),
              driveSelect,
              el('div', { marginBottom: '8px' }, 'Select file:'),
              fileInput,
              descriptionInput,
              btnContainer
            );
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
          };

          const showMediaLibraryDialog = () => {
            const overlay = el('div', {
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: '9999'
            });

            const dialog = el('div', {
              background: 'rgba(30, 30, 50, 0.98)',
              border: '2px solid rgba(100, 150, 255, 0.4)',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '600px',
              maxWidth: '80vw',
              maxHeight: '80vh',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              overflow: 'auto'
            });

            const title = el('div', {
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#4bf',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            });

            title.innerHTML = '<span>📚 Media Library</span><span style="font-size: 14px; opacity: 0.7;">Data access: data.images[0], data.texts[0]</span>';

            const tabs = el('div', {
              display: 'flex',
              marginBottom: '16px',
              borderBottom: '1px solid rgba(100, 150, 255, 0.3)'
            });

            const tabImages = el('button', {
              padding: '8px 16px',
              background: 'rgba(100, 150, 255, 0.3)',
              border: 'none',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              color: '#fff',
              cursor: 'pointer'
            }, `Images (${fileStorage.library.images.length})`);

            const tabTexts = el('button', {
              padding: '8px 16px',
              background: 'rgba(150, 100, 255, 0.2)',
              border: 'none',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              color: '#fff',
              cursor: 'pointer'
            }, `Texts (${fileStorage.library.texts.length})`);

            const contentContainer = el('div', { minHeight: '300px' });

            const renderImagesTab = () => {
              contentContainer.innerHTML = '';
              tabImages.style.background = 'rgba(100, 150, 255, 0.5)';
              tabTexts.style.background = 'rgba(150, 100, 255, 0.2)';

              const images = fileStorage.getAllImages();

              if (images.length === 0) {
                contentContainer.appendChild(el('div', {
                  color: '#aaa',
                  padding: '40px',
                  textAlign: 'center'
                }, 'No images in library'));
                return;
              }

              const grid = el('div', {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px'
              });

              images.forEach(image => {
                const card = el('div', {
                  background: 'rgba(100, 150, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid rgba(100, 150, 255, 0.2)',
                  cursor: 'pointer',
                  transition: '0.2s'
                });

                card.addEventListener('mouseover', () => {
                  card.style.background = 'rgba(100, 150, 255, 0.2)';
                });

                card.addEventListener('mouseout', () => {
                  card.style.background = 'rgba(100, 150, 255, 0.1)';
                });

                const thumbnail = el('div', {
                  height: '100px',
                  background: `url(${image.data}) center/contain no-repeat`,
                  borderRadius: '4px',
                  marginBottom: '8px',
                  border: '1px solid rgba(255,255,255,0.1)'
                });

                const info = el('div');
                info.innerHTML = `
              <strong style="font-size: 12px;">ID: ${image.id} - ${image.originalName}</strong><br>
              <small style="color: #aaa; font-size: 10px;">${image.description}</small><br>
              <small style="color: #888; font-size: 9px;">${(image.size / 1024).toFixed(2)} KB</small>
            `;

                const actions = el('div', {
                  display: 'flex',
                  gap: '4px',
                  marginTop: '8px'
                });

                const viewBtn = btn('👁', {
                  flex: '1',
                  padding: '4px',
                  fontSize: '10px'
                });

                const copyBtn = btn('📋', {
                  flex: '1',
                  padding: '4px',
                  fontSize: '10px'
                });

                viewBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  showImagePreview(image);
                });

                copyBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const dataString = `data.images[${image.id - 1}]`;
                  navigator.clipboard.writeText(dataString);
                  alert(`Copied: ${dataString}`);
                });

                actions.append(viewBtn, copyBtn);
                card.append(thumbnail, info, actions);

                card.addEventListener('click', () => {
                  const code = `data.images[${image.id - 1}]`;
                  const data = fileStorage.getImageById(image.id);
                  showCodePreview(code, JSON.stringify(data, null, 2), 'Image Data');
                });

                grid.appendChild(card);
              });

              contentContainer.appendChild(grid);

              const exportBtn = btn('Export Images JSON', {
                marginTop: '16px',
                width: '100%',
                background: 'rgba(100, 150, 255, 0.3)'
              });

              exportBtn.addEventListener('click', () => {
                const json = JSON.stringify(fileStorage.library.images, null, 2);
                showCodePreview('data.images', json, 'All Images JSON');
              });

              contentContainer.appendChild(exportBtn);
            };

            const renderTextsTab = () => {
              contentContainer.innerHTML = '';
              tabImages.style.background = 'rgba(100, 150, 255, 0.2)';
              tabTexts.style.background = 'rgba(150, 100, 255, 0.5)';

              const texts = fileStorage.getAllTexts();

              if (texts.length === 0) {
                contentContainer.appendChild(el('div', {
                  color: '#aaa',
                  padding: '40px',
                  textAlign: 'center'
                }, 'No text files in library'));
                return;
              }

              const list = el('div', { display: 'flex', flexDirection: 'column', gap: '8px' });

              texts.forEach(text => {
                const item = el('div', {
                  padding: '12px',
                  background: 'rgba(150, 100, 255, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(150, 100, 255, 0.2)',
                  cursor: 'pointer',
                  transition: '0.2s'
                });

                item.addEventListener('mouseover', () => {
                  item.style.background = 'rgba(150, 100, 255, 0.2)';
                });

                item.addEventListener('mouseout', () => {
                  item.style.background = 'rgba(150, 100, 255, 0.1)';
                });

                const info = el('div');
                info.innerHTML = `
              <strong style="font-size: 12px;">ID: ${text.id} - ${text.originalName}</strong><br>
              <small style="color: #aaa; font-size: 10px;">Type: ${text.type} | ${text.language || ''}</small><br>
              <small style="color: #888; font-size: 9px;">${(text.size / 1024).toFixed(2)} KB | ${text.uploadDate.substring(0, 10)}</small>
            `;

                const actions = el('div', {
                  display: 'flex',
                  gap: '4px',
                  marginTop: '8px'
                });

                const viewBtn = btn('👁', {
                  flex: '1',
                  padding: '4px',
                  fontSize: '10px'
                });

                const copyBtn = btn('📋', {
                  flex: '1',
                  padding: '4px',
                  fontSize: '10px'
                });

                viewBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  showTextPreview(text);
                });

                copyBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const dataString = `data.texts[${text.id - 1}]`;
                  navigator.clipboard.writeText(dataString);
                  alert(`Copied: ${dataString}`);
                });

                actions.append(viewBtn, copyBtn);
                item.append(info, actions);

                item.addEventListener('click', () => {
                  const code = `data.texts[${text.id - 1}]`;
                  const data = fileStorage.getTextById(text.id);
                  showCodePreview(code, JSON.stringify(data, null, 2), 'Text Data');
                });

                list.appendChild(item);
              });

              contentContainer.appendChild(list);

              const exportBtn = btn('Export Texts JSON', {
                marginTop: '16px',
                width: '100%',
                background: 'rgba(150, 100, 255, 0.3)'
              });

              exportBtn.addEventListener('click', () => {
                const json = JSON.stringify(fileStorage.library.texts, null, 2);
                showCodePreview('data.texts', json, 'All Texts JSON');
              });

              contentContainer.appendChild(exportBtn);
            };

            const showImagePreview = (image) => {
              const previewOverlay = el('div', {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '10000'
              });

              const previewContent = el('div', {
                background: 'rgba(30, 30, 50, 0.95)',
                borderRadius: '12px',
                padding: '20px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto'
              });

              const img = el('img', {
                src: image.data,
                style: 'max-width: 800px; max-height: 600px; border-radius: 8px;'
              });

              const info = el('div', {
                marginTop: '16px',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'monospace'
              });

              info.innerHTML = `
            <strong>Image ID: ${image.id}</strong><br>
            <strong>Access in code: data.images[${image.id - 1}]</strong><br>
            Filename: ${image.filename}<br>
            Original: ${image.originalName}<br>
            Description: ${image.description}<br>
            Size: ${(image.size / 1024).toFixed(2)} KB<br>
            Type: ${image.type}<br>
            Uploaded: ${new Date(image.uploadDate).toLocaleString()}
          `;

              const closeBtn = btn('Close', {
                marginTop: '16px',
                width: '100%'
              });

              closeBtn.addEventListener('click', () => previewOverlay.remove());
              previewOverlay.addEventListener('click', (e) => {
                if (e.target === previewOverlay) previewOverlay.remove();
              });

              previewContent.append(img, info, closeBtn);
              previewOverlay.appendChild(previewContent);
              document.body.appendChild(previewOverlay);
            };

            const showTextPreview = (text) => {
              const previewOverlay = el('div', {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(30, 30, 50, 0.98)',
                border: '2px solid rgba(150, 100, 255, 0.4)',
                borderRadius: '12px',
                padding: '24px',
                width: '600px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                zIndex: '10000'
              });

              const title = el('div', {
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: '#c9f'
              }, `Text File: ${text.originalName} (ID: ${text.id})`);

              const textarea = el('textarea', {
                width: '100%',
                height: '300px',
                padding: '12px',
                background: 'rgba(0,0,0,0.8)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '12px',
                resize: 'vertical'
              });

              textarea.value = text.data;
              textarea.readOnly = true;

              const codeAccess = el('div', {
                marginTop: '12px',
                padding: '8px',
                background: 'rgba(150, 100, 255, 0.1)',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#c9f'
              }, `Access in code: data.texts[${text.id - 1}]`);

              const closeBtn = btn('Close', { marginTop: '16px', width: '100%' });
              closeBtn.addEventListener('click', () => previewOverlay.remove());

              previewOverlay.append(title, textarea, codeAccess, closeBtn);
              document.body.appendChild(previewOverlay);
            };

            const showCodePreview = (title, code, description) => {
              const previewOverlay = el('div', {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(30, 30, 50, 0.98)',
                border: '2px solid rgba(100, 200, 255, 0.4)',
                borderRadius: '12px',
                padding: '24px',
                width: '700px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                zIndex: '10000'
              });

              const titleEl = el('div', {
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#4bf'
              }, description);

              const codeAccess = el('div', {
                marginBottom: '12px',
                padding: '8px',
                background: 'rgba(100, 200, 255, 0.1)',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#4bf'
              }, title);

              const textarea = el('textarea', {
                width: '100%',
                height: '400px',
                padding: '12px',
                background: 'rgba(0,0,0,0.9)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '12px',
                resize: 'vertical'
              });

              textarea.value = code;
              textarea.readOnly = true;

              const copyBtn = btn('📋 Copy JSON', {
                marginTop: '12px',
                background: 'rgba(100, 150, 255, 0.8)'
              });

              const closeBtn = btn('Close', {
                marginTop: '12px',
                marginLeft: '8px',
                background: 'rgba(220, 80, 80, 0.6)'
              });

              copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(code);
                alert('JSON copied to clipboard!');
              });

              closeBtn.addEventListener('click', () => previewOverlay.remove());

              const btnContainer = el('div', { display: 'flex', gap: '8px' });
              btnContainer.append(copyBtn, closeBtn);

              previewOverlay.append(titleEl, codeAccess, textarea, btnContainer);
              document.body.appendChild(previewOverlay);
            };

            tabImages.addEventListener('click', renderImagesTab);
            tabTexts.addEventListener('click', renderTextsTab);

            tabs.append(tabImages, tabTexts);

            const closeBtn = btn('Close', {
              marginTop: '16px',
              width: '100%',
              background: 'rgba(220, 80, 80, 0.6)'
            });

            closeBtn.addEventListener('click', () => overlay.remove());

            dialog.append(title, tabs, contentContainer, closeBtn);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            renderImagesTab();
          };
        };

        const showCreateFolderDialog = () => {
          const overlay = el('div', {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '9999'
          });

          const dialog = el('div', {
            background: 'rgba(30, 30, 50, 0.98)',
            border: '2px solid rgba(100, 150, 255, 0.4)',
            borderRadius: '12px',
            padding: '24px',
            minWidth: '350px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
          });

          const title = el('div', {
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#4bf'
          }, '📁 New Folder');

          const label = el('div', {
            fontSize: '12px',
            marginBottom: '8px',
            color: '#aaa'
          }, 'Folder name:');

          const input = el('input');
          input.type = 'text';
          input.placeholder = 'Enter folder name...';
          Object.assign(input.style, {
            width: '100%',
            padding: '10px 12px',
            marginBottom: '16px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(100, 150, 255, 0.3)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
            boxSizing: 'border-box'
          });

          const btnContainer = el('div', {
            display: 'flex',
            gap: '10px'
          });

          const createBtn = el('button');
          createBtn.textContent = 'Create';
          Object.assign(createBtn.style, {
            flex: '1',
            padding: '10px 16px',
            background: 'rgba(76, 175, 80, 0.8)',
            border: '1px solid rgba(76, 175, 80, 0.5)',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: '0.2s'
          });

          createBtn.addEventListener('mouseover', () => {
            createBtn.style.background = 'rgba(76, 175, 80, 1)';
          });

          createBtn.addEventListener('mouseout', () => {
            createBtn.style.background = 'rgba(76, 175, 80, 0.8)';
          });

          const cancelBtn = el('button');
          cancelBtn.textContent = 'Cancel';
          Object.assign(cancelBtn.style, {
            flex: '1',
            padding: '10px 16px',
            background: 'rgba(220, 80, 80, 0.6)',
            border: '1px solid rgba(220, 80, 80, 0.3)',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: '0.2s'
          });

          cancelBtn.addEventListener('mouseover', () => {
            cancelBtn.style.background = 'rgba(220, 80, 80, 0.8)';
          });

          cancelBtn.addEventListener('mouseout', () => {
            cancelBtn.style.background = 'rgba(220, 80, 80, 0.6)';
          });

          const closeDialog = () => {
            overlay.remove();
          };

          createBtn.addEventListener('click', () => {
            const folderName = input.value.trim();
            if (!folderName) {
              alert('Please enter a folder name');
              return;
            }
            if (currentPath.length === 1) {
              fs[currentPath[0]].folders[folderName] = { folders: {}, files: {} };
            } else {
              let current = fs[currentPath[0]];
              for (let i = 1; i < currentPath.length; i++) {
                current = current.folders[currentPath[i]];
              }
              current.folders[folderName] = { folders: {}, files: {} };
            }
            saveFileSystem(fs);
            renderContent();
            closeDialog();
          });

          cancelBtn.addEventListener('click', closeDialog);
          input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') createBtn.click();
          });

          input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeDialog();
          });

          btnContainer.append(createBtn, cancelBtn);
          dialog.append(title, label, input, btnContainer);
          overlay.appendChild(dialog);
          document.body.appendChild(overlay);

          setTimeout(() => input.focus(), 100);
        };

        const renderSidebar = () => {
          sidebar.innerHTML = '';
          const title = el('div', { fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }, 'Drives');
          sidebar.appendChild(title);

          for (const letter in fs) {
            const drive = fs[letter];
            const driveBtn = el('div', {
              padding: '8px',
              marginBottom: '4px',
              background: currentPath[0] === letter ? 'rgba(100, 150, 255, 0.3)' : 'rgba(100, 150, 255, 0.1)',
              borderRadius: '4px',
              cursor: 'pointer',
              border: '1px solid rgba(100, 150, 255, 0.2)'
            });
            driveBtn.textContent = `💿 ${letter}: (${drive.usedMemory}/${drive.totalMemory} MB)`;
            driveBtn.addEventListener('click', () => navigate([letter]));
            sidebar.appendChild(driveBtn);
          }
        };

        if (!localStorage.getItem(setupKey)) {
          showDriveSetup((count, memories) => {
            fs = initializeFileSystem(count, memories);
            renderSidebar();
            renderContent();
          });
        } else {
          renderSidebar();
          renderContent();
        }

        mainArea.append(addressBar, contentArea);
        root.append(sidebar, mainArea);
        return root;
      },
      size: { width: 1000, height: 620 }
    },
    notepad: {
      title: 'Notepad',
      icon: './static/icons/note.svg',
      content: () => {
        const fileStorage = new FileStorageManager();
        let isAdmin = false;
        try {
          const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('user_json'));
          if (userData && userData.name && userData.name.toLowerCase() === 'admin') {
            const activationKey = userData.activationKey || '';
            if (activationKey === '1234-5678-9101') {
              isAdmin = true;
            }
          }
        } catch (e) { }

        const root = el('div', { display: 'grid', gridTemplateRows: 'auto 1fr', gap: '8px', height: '100%' });
        const toolbar = el('div', { display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' });

        const saveBtn = btn('Сохранить', { background: 'rgba(76, 175, 80, 0.8)', color: '#fff' });
        const loadBtn = btn('Открыть', { background: 'rgba(100, 150, 255, 0.8)', color: '#fff' });
        const fileNameInput = input('text', 'Имя файла...', { flex: '1', padding: '6px 8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' });

        const textarea = el('textarea', { width: '100%', height: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#eaeaf2', padding: '10px', resize: 'none' });
        textarea.value = 'Hello! This is an unusual Windows.';

        const charCount = el('div', {
          fontSize: '12px',
          color: '#aaa',
          padding: '4px 8px',
          textAlign: 'right'
        });

        const updateCharCount = () => {
          const count = textarea.value.length;
          const maxChars = isAdmin ? Infinity : 500;
          charCount.textContent = `${count}${!isAdmin ? ` / ${maxChars}` : ''} символов`;
          if (!isAdmin && count > maxChars) {
            charCount.style.color = '#ff6b6b';
            textarea.value = textarea.value.substring(0, maxChars);
          } else {
            charCount.style.color = '#aaa';
          }
        };

        textarea.addEventListener('input', updateCharCount);
        updateCharCount();

        saveBtn.addEventListener('click', () => {
          fileStorage.showSaveDialog(
            fileNameInput.value.trim() || 'document.txt',
            textarea.value,
            'text',
            (drive, path, fileName) => {
              alert(`Файл "${fileName}" сохранен на диск ${drive}: в папке ${path || 'корень'}`);
            }
          );
        });

        loadBtn.addEventListener('click', () => {
          const files = fileStorage.getAllFiles();
          if (files.length === 0) {
            alert('Нет сохраненных файлов');
            return;
          }
          const fileList = files.map((f, i) => `${i + 1}. ${f.name} (${f.type})`).join('\n');
          const index = prompt(`Выберите файл (1-${files.length}):\n${fileList}`);
          const fileIndex = parseInt(index) - 1;
          if (fileIndex >= 0 && fileIndex < files.length) {
            const file = files[fileIndex];
            textarea.value = file.data;
            fileNameInput.value = file.name;
            updateCharCount();
          }
        });

        toolbar.append(fileNameInput, saveBtn, loadBtn);
        root.append(toolbar, textarea, charCount);
        return root;
      },
      size: { width: 640, height: 420 }
    },
    calculator: {

      title: 'Calculator',
      icon: './static/icons/calculator.svg',
      size: { width: 360, height: 420 },
      content: () => {
        const wrap = el('div', {
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          gap: '8px',
          padding: '-5px'
        });

        const display = input('text', '', {
          width: '100%',
          height: '48px',
          fontSize: '22px',
          textAlign: 'right',
          borderRadius: '10px',
          border: 'none',
          padding: '0 8px',
          background: '#1a1a1a',
          color: '#fff'
        });
        display.readOnly = true;
        display.value = '0';

        const grid = el('div', { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' });
        const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', 'C', '=', '+'];

        let a = null, op = null, fresh = true;

        const setDisplay = v => display.value = String(v).slice(0, 18);

        const inputDigit = d => {
          setDisplay((fresh || display.value === '0') ? d : display.value + d);
          fresh = false;
        };

        const applyOp = () => {
          if (a === null || !op) return;
          const b = Number(display.value);
          switch (op) {
            case '+': a = a + b; break;
            case '-': a = a - b; break;
            case '*': a = a * b; break;
            case '/': a = b === 0 ? NaN : a / b; break;
          }
          setDisplay(a);
        };

        const press = k => {
          if (/^[0-9]$/.test(k)) { inputDigit(k); return; }
          if (k === 'C') { a = null; op = null; setDisplay(0); fresh = true; return; }
          if (k === '=') { if (op !== null) { applyOp(); op = null; fresh = true; } return; }
          if (op === null) { a = Number(display.value); op = k; fresh = true; }
          else { applyOp(); op = k; fresh = true; }
        };
        keys.forEach(k => {
          const b = btn(k, () => press(k));
          Object.assign(b.style, {
            height: '44px',
            background: '#4e4e4e',
            color: '#fff',
            fontSize: '1.1rem',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px #3a3a3a',
            transition: '0.2s'
          });
          b.onmouseenter = () => b.style.background = '#6e6e6e';
          b.onmouseleave = () => b.style.background = '#4e4e4e';
          b.onmousedown = () => { b.style.transform = 'translateY(2px)'; b.style.boxShadow = '0 2px #3a3a3a'; };
          b.onmouseup = () => { b.style.transform = 'translateY(0)'; b.style.boxShadow = '0 4px #3a3a3a'; };
          grid.appendChild(b);
        });

        wrap.appendChild(display);
        wrap.appendChild(grid);

        return wrap;
      }
    },
    paint: {
      title: 'Paint',
      icon: './static/icons/paint.svg',
      content: () => {
        const fileStorage = new FileStorageManager();
        const root = el('div', { display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: '8px' });
        const toolbar = el('div', { display: 'flex', gap: '8px', alignItems: 'center' });
        const fileToolbar = el('div', { display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' });

        const color = el('input'); color.type = 'color'; color.value = '#00b7ff';
        const size = el('input'); size.type = 'range'; size.min = '1'; size.max = '40'; size.value = '6';
        const clearBtn = btn('Clear');
        toolbar.append(color, size, clearBtn);

        const fileNameInput = input('text', 'Имя файла...', { flex: '1', padding: '6px 8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' });
        const saveBtn = btn('Сохранить', { background: 'rgba(76, 175, 80, 0.8)', color: '#fff' });
        const loadBtn = btn('Открыть', { background: 'rgba(100, 150, 255, 0.8)', color: '#fff' });
        fileToolbar.append(fileNameInput, saveBtn, loadBtn);

        const canvas = el('canvas', { width: '100%', height: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' });
        let ctx, drawing = false, lastX = 0, lastY = 0;
        const resize = () => { const rect = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; canvas.width = Math.floor(rect.width * dpr); canvas.height = Math.floor(rect.height * dpr); ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); };
        new ResizeObserver(resize).observe(canvas);
        const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
        canvas.addEventListener('pointerdown', e => { drawing = true; const p = pos(e); lastX = p.x; lastY = p.y; });
        canvas.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); ctx.strokeStyle = color.value; ctx.lineWidth = Number(size.value); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke(); lastX = p.x; lastY = p.y; });
        window.addEventListener('pointerup', () => { drawing = false; });
        clearBtn.addEventListener('click', () => { const r = canvas.getBoundingClientRect(); ctx.clearRect(0, 0, r.width, r.height); });

        saveBtn.addEventListener('click', () => {
          const fileName = fileNameInput.value.trim() || 'image.png';
          const dataUrl = canvas.toDataURL('image/png');
          const fileId = fileStorage.saveFile(fileName, dataUrl, 'image');
          alert(`Изображение "${fileName}" сохранено!`);
        });

        loadBtn.addEventListener('click', () => {
          const files = fileStorage.getAllFiles().filter(f => f.type === 'image');
          if (files.length === 0) {
            alert('Нет сохраненных изображений');
            return;
          }
          const fileList = files.map((f, i) => `${i + 1}. ${f.name}`).join('\n');
          const index = prompt(`Выберите изображение (1-${files.length}):\n${fileList}`);
          const fileIndex = parseInt(index) - 1;
          if (fileIndex >= 0 && fileIndex < files.length) {
            const file = files[fileIndex];
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
            };
            img.src = file.data;
            fileNameInput.value = file.name;
          }
        });

        root.append(toolbar, fileToolbar, canvas);
        return root;
      },
      size: { width: 820, height: 540 }
    },
    browser: {
      title: 'Browser',
      icon: './static/icons/browser.png',
      content: () => {
        const wrap = el('div', { display: 'grid', gridTemplateRows: 'auto 1fr', gap: '12px', height: '100%' });

        const bar = el('div', { display: 'flex', gap: '12px', alignItems: 'center' });
        const urlInput = input('text', 'Enter URL or search query', {
          height: '42px',
          flex: '1',
          padding: '10px 16px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.1)',
          color: '#fff'
        });
        urlInput.value = 'https://csszengarden.com/';

        const go = btn('Go', {
          height: '42px',
          padding: '10px 24px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
          background: 'rgba(42, 107, 255, 0.8)',
          border: '1px solid rgba(42, 107, 255, 0.3)',
          borderRadius: '8px',
          color: '#fff'
        });

        go.style.transition = 'all 0.2s';
        go.addEventListener('mouseenter', () => go.style.background = 'rgba(42, 107, 255, 1)');
        go.addEventListener('mouseleave', () => go.style.background = 'rgba(42, 107, 255, 0.8)');

        const frameContainer = el('div', {
          width: '100%',
          height: '100%',
          position: 'relative',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          overflow: 'hidden'
        });

        const frame = el('iframe', {
          width: '100%',
          height: '100%',
          border: 'none',
          background: 'transparent',
          referrerpolicy: 'no-referrer-when-downgrade'
        });

        let currentErrorMsg = null;
        let loadingTimeout = null;

        const toUrl = v => {
          v = v.trim();
          if (!v) return '';
          if (/^https?:\/\//i.test(v)) return v;
          if (v.includes('.') && !v.includes(' ')) return 'https://' + v;
          return 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(v);
        };

        const getAlternativeUrl = (originalUrl) => {
          const url = originalUrl.toLowerCase();

          if (url.includes('youtube.com')) {
            return `https://www.youtube-nocookie.com/embed/search?q=${encodeURIComponent('popular')}`;
          }
          if (url.includes('instagram.com')) {
            return 'https://imginn.com/';
          }
          if (url.includes('twitter.com') || url.includes('x.com')) {
            return 'https://nitter.net/';
          }
          if (url.includes('reddit.com')) {
            return 'https://libredd.it/';
          }
          return `https://web.archive.org/web/${originalUrl}`;
        };

        const showLoadingSpinner = () => {
          const spinner = el('div', {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            zIndex: '999'
          });

          if (!document.querySelector('#spinner-style')) {
            const style = el('style');
            style.id = 'spinner-style';
            style.textContent = '@keyframes spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }';
            document.head.appendChild(style);
          }

          frameContainer.appendChild(spinner);
          return spinner;
        };

        const showError = (msg, originalUrl) => {
          if (!currentErrorMsg) {
            currentErrorMsg = el('div', {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '30px',
              textAlign: 'center',
              color: '#ff6b6b',
              fontSize: '16px',
              background: 'rgba(0,0,0,0.9)',
              borderRadius: '12px',
              border: '1px solid rgba(255,107,107,0.3)',
              zIndex: '1000',
              maxWidth: '500px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            });

            const errorText = el('div', { marginBottom: '20px', lineHeight: '1.6' }, msg);
            const buttonContainer = el('div', { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' });

            const openButton = btn('Open Original', {
              padding: '12px 24px',
              cursor: 'pointer',
              background: 'rgba(42, 107, 255, 0.9)',
              border: '1px solid rgba(42, 107, 255, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500'
            });
            openButton.addEventListener('click', () => window.open(originalUrl, '_blank'));
            buttonContainer.appendChild(openButton);

            const altUrl = getAlternativeUrl(originalUrl);
            if (altUrl !== originalUrl) {
              const altButton = btn('Try Alternative', {
                padding: '12px 24px',
                cursor: 'pointer',
                background: 'rgba(34, 197, 94, 0.8)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500'
              });
              altButton.addEventListener('click', () => {
                if (currentErrorMsg) { currentErrorMsg.remove(); currentErrorMsg = null; }
                loadUrl(altUrl);
              });
              buttonContainer.appendChild(altButton);
            }

            const searchButton = btn('Search Instead', {
              padding: '12px 24px',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500'
            });
            searchButton.addEventListener('click', () => {
              const domain = originalUrl.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
              const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(domain)}`;
              if (currentErrorMsg) { currentErrorMsg.remove(); currentErrorMsg = null; }
              loadUrl(searchUrl);
            });
            buttonContainer.appendChild(searchButton);

            currentErrorMsg.append(errorText, buttonContainer);
            frameContainer.appendChild(currentErrorMsg);
          }
        };

        const clearError = () => {
          if (currentErrorMsg) {
            currentErrorMsg.remove();
            currentErrorMsg = null;
          }
        };

        const loadUrl = (url) => {
          if (!url) return;

          clearError();
          const spinner = showLoadingSpinner();

          if (loadingTimeout) clearTimeout(loadingTimeout);

          frame.style.opacity = '0.3';

          const handleLoad = () => {
            spinner.remove();
            frame.style.opacity = '1';
            if (loadingTimeout) clearTimeout(loadingTimeout);
          };

          const handleError = () => {
            spinner.remove();
            frame.style.opacity = '1';
            showError(`Cannot load "${url}". The site blocks embedding or is unavailable.`, url);
            if (loadingTimeout) clearTimeout(loadingTimeout);
          };

          frame.onload = handleLoad;
          frame.onerror = handleError;

          loadingTimeout = setTimeout(() => {
            spinner.remove();
            frame.style.opacity = '1';
            showError(`Loading timeout for "${url}". Site may be slow or blocking access.`, url);
          }, 10000);

          frame.src = url;
        };

        const navigate = () => {
          const url = toUrl(urlInput.value);
          loadUrl(url);
        };

        urlInput.addEventListener('keydown', e => {
          if (e.key === 'Enter') navigate();
        });
        go.addEventListener('click', navigate);

        bar.append(urlInput, go);
        frameContainer.appendChild(frame);
        wrap.append(bar, frameContainer);

        setTimeout(() => loadUrl('https://csszengarden.com/'), 100);

        return wrap;
      },
      size: { width: 1800, height: 1100 }
    },
    clash: {
      title: 'Clash Royale',
      icon: './static/icons/clash.png',
      content: () => {
        const CARDS = [
          { id: 1, name: 'Knight', cost: 3, damage: 75, health: 200, type: 'troop' },
          { id: 2, name: 'Archer', cost: 3, damage: 60, health: 100, type: 'troop' },
          { id: 3, name: 'Giant', cost: 5, damage: 100, health: 400, type: 'troop' },
          { id: 4, name: 'Fireball', cost: 4, damage: 150, health: 0, type: 'spell' },
          { id: 5, name: 'Goblin', cost: 2, damage: 40, health: 80, type: 'troop' },
          { id: 6, name: 'Mini PEKKA', cost: 4, damage: 120, health: 300, type: 'troop' },
          { id: 7, name: 'Wizard', cost: 5, damage: 90, health: 150, type: 'troop' },
          { id: 8, name: 'Lightning', cost: 6, damage: 200, health: 0, type: 'spell' },
        ];

        let elixir = 5;
        let playerTower = { health: 1000, maxHealth: 1000 };
        let enemyTower = { health: 1000, maxHealth: 1000 };
        let hand = [];
        let gameOver = false;
        let winner = null;
        let elixirInterval;
        const createIcon = (name) => {
          const icons = {
            swords: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
            shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
            zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
            heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`
          };
          const div = el('div');
          div.innerHTML = icons[name] || '';
          Object.assign(div.firstChild.style, {
            width: '100%',
            height: '100%',
            stroke: 'currentColor'
          });
          return div.firstChild;
        };

        const initGame = () => {
          const randomCards = [...CARDS].sort(() => Math.random() - 0.5).slice(0, 4);
          hand = randomCards;
          render();
          startElixir();
        };

        const startElixir = () => {
          if (elixirInterval) clearInterval(elixirInterval);
          elixirInterval = setInterval(() => {
            if (!gameOver) {
              elixir = Math.min(elixir + 1, 10);
              updateElixirDisplay();
            }
          }, 2000);
        };

        const updateElixirDisplay = () => {
          const elixirBar = document.querySelector('.elixir-bar');
          const elixirText = document.querySelector('.elixir-text');
          if (elixirBar) {
            elixirBar.style.width = `${(elixir / 10) * 100}%`;
          }
          if (elixirText) {
            elixirText.textContent = `Elixir: ${elixir}/10`;
          }
        };

        const updateHealthBars = () => {
          const playerBar = document.querySelector('.player-health-bar');
          const enemyBar = document.querySelector('.enemy-health-bar');
          const playerText = document.querySelector('.player-health-text');
          const enemyText = document.querySelector('.enemy-health-text');

          if (playerBar) {
            playerBar.style.width = `${(playerTower.health / playerTower.maxHealth) * 100}%`;
          }
          if (enemyBar) {
            enemyBar.style.width = `${(enemyTower.health / enemyTower.maxHealth) * 100}%`;
          }
          if (playerText) {
            playerText.textContent = playerTower.health;
          }
          if (enemyText) {
            enemyText.textContent = enemyTower.health;
          }
        };

        const playCard = (card) => {
          if (elixir >= card.cost && !gameOver) {
            elixir -= card.cost;
            updateElixirDisplay();

            if (card.type === 'spell') {
              enemyTower.health = Math.max(0, enemyTower.health - card.damage);
            } else {
              const damageDealt = Math.floor(card.damage * 0.8);
              enemyTower.health = Math.max(0, enemyTower.health - damageDealt);
            }
            updateHealthBars();

            setTimeout(() => {
              if (!gameOver) {
                const enemyDamage = Math.floor(Math.random() * 80) + 40;
                playerTower.health = Math.max(0, playerTower.health - enemyDamage);
                updateHealthBars();
                checkGameOver();
              }
            }, 1000);

            const newCard = CARDS[Math.floor(Math.random() * CARDS.length)];
            hand = hand.map(c => c.id === card.id ? newCard : c);
            renderCards();
          }
        };

        const checkGameOver = () => {
          if (playerTower.health <= 0) {
            gameOver = true;
            winner = 'enemy';
            showGameOver();
          } else if (enemyTower.health <= 0) {
            gameOver = true;
            winner = 'player';
            showGameOver();
          }
        };

        const resetGame = () => {
          elixir = 5;
          playerTower = { health: 1000, maxHealth: 1000 };
          enemyTower = { health: 1000, maxHealth: 1000 };
          gameOver = false;
          winner = null;
          initGame();
          const gameOverDiv = document.querySelector('.game-over-overlay');
          if (gameOverDiv) {
            gameOverDiv.remove();
          }
        };

        const showGameOver = () => {
          const overlay = el('div', {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10'
          }, '');
          overlay.className = 'game-over-overlay';

          const message = el('div', {
            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            padding: '24px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '4px solid rgba(253, 224, 71, 0.5)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            maxWidth: '80%'
          }, '');

          const title = el('h2', {
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '8px'
          }, winner === 'player' ? '🏆 Victory!' : '💀 Defeat');

          const desc = el('p', {
            color: '#fff',
            marginBottom: '16px',
            fontSize: '18px'
          }, winner === 'player' ? 'You destroyed the enemy tower!' : 'Your tower was destroyed!');

          const playAgainBtn = btn('Play Again', {
            background: '#fff',
            color: '#ea580c',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            transition: '0.2s'
          });

          playAgainBtn.addEventListener('mouseover', () => {
            playAgainBtn.style.background = '#f3f4f6';
          });

          playAgainBtn.addEventListener('mouseout', () => {
            playAgainBtn.style.background = '#fff';
          });

          playAgainBtn.addEventListener('click', resetGame);

          message.append(title, desc, playAgainBtn);
          overlay.appendChild(message);

          const arena = document.querySelector('.arena');
          if (arena) {
            arena.appendChild(overlay);
          }
        };

        const renderCards = () => {
          const cardsContainer = document.querySelector('.cards-grid');
          if (cardsContainer) {
            cardsContainer.innerHTML = '';

            hand.forEach(card => {
              const cardBtn = el('div', {
                background: `linear-gradient(135deg, ${elixir >= card.cost && !gameOver ? '#f97316' : '#9ca3af'} 0%, ${elixir >= card.cost && !gameOver ? '#ea580c' : '#6b7280'} 100%)`,
                padding: '12px',
                borderRadius: '8px',
                border: `2px solid ${elixir >= card.cost && !gameOver ? '#fdba74' : '#9ca3af'}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s',
                cursor: elixir >= card.cost && !gameOver ? 'pointer' : 'not-allowed',
                opacity: elixir >= card.cost && !gameOver ? '1' : '0.5',
                textAlign: 'center'
              });

              if (elixir >= card.cost && !gameOver) {
                cardBtn.addEventListener('mouseover', () => {
                  cardBtn.style.transform = 'scale(1.05)';
                  cardBtn.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)';
                });

                cardBtn.addEventListener('mouseout', () => {
                  cardBtn.style.transform = 'scale(1)';
                  cardBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                });

                cardBtn.addEventListener('click', () => playCard(card));
              }

              const cardName = el('div', {
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '8px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }, card.name);

              const elixirCost = el('div', {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                marginBottom: '8px'
              });

              const zapIcon = createIcon('zap');
              Object.assign(zapIcon.style, {
                width: '12px',
                height: '12px',
                color: '#c084fc'
              });

              const costText = el('span', {
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#fff'
              }, card.cost);

              elixirCost.append(zapIcon, costText);

              const stats = el('div', {
                fontSize: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              });

              const damageRow = el('div', {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: '#fff'
              });

              const swordIcon = createIcon('swords');
              Object.assign(swordIcon.style, {
                width: '10px',
                height: '10px',
                color: '#fff'
              });

              const damageText = el('span', {}, card.damage);
              damageRow.append(swordIcon, damageText);

              stats.appendChild(damageRow);

              if (card.health > 0) {
                const healthRow = el('div', {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  color: '#fff'
                });

                const heartIcon = createIcon('heart');
                Object.assign(heartIcon.style, {
                  width: '10px',
                  height: '10px',
                  color: '#fff'
                });

                const healthText = el('span', {}, card.health);
                healthRow.append(heartIcon, healthText);
                stats.appendChild(healthRow);
              }

              cardBtn.append(cardName, elixirCost, stats);
              cardsContainer.appendChild(cardBtn);
            });
          }
        };

        const render = () => {
          const root = el('div', {
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, #1e3a8a 0%, #1d4ed8 30%, #047857 100%)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          });

          const enemyTowerDiv = el('div', {
            background: 'rgba(220, 38, 38, 0.4)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            padding: '12px',
            border: '2px solid rgba(220, 38, 38, 0.5)',
            marginBottom: '8px'
          });

          const enemyHeader = el('div', {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          });

          const enemyTitle = el('div', {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          });

          const enemyShield = createIcon('shield');
          Object.assign(enemyShield.style, {
            width: '20px',
            height: '20px',
            color: '#f87171'
          });

          const enemyTitleText = el('span', {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px'
          }, 'Enemy Tower');

          enemyTitle.append(enemyShield, enemyTitleText);

          const enemyHealth = el('div', {
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          });

          const enemyHeart = createIcon('heart');
          Object.assign(enemyHeart.style, {
            width: '16px',
            height: '16px',
            color: '#f87171'
          });

          const enemyHealthText = el('span', {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px'
          }, enemyTower.health);
          enemyHealthText.className = 'enemy-health-text';

          enemyHealth.append(enemyHeart, enemyHealthText);

          enemyHeader.append(enemyTitle, enemyHealth);

          const enemyHealthBar = el('div', {
            width: '100%',
            background: '#374151',
            borderRadius: '9999px',
            height: '12px',
            overflow: 'hidden'
          });

          const enemyHealthFill = el('div', {
            height: '100%',
            background: '#ef4444',
            borderRadius: '9999px',
            transition: 'all 0.3s',
            width: `${(enemyTower.health / enemyTower.maxHealth) * 100}%`
          });
          enemyHealthFill.className = 'enemy-health-bar';

          enemyHealthBar.appendChild(enemyHealthFill);
          enemyTowerDiv.append(enemyHeader, enemyHealthBar);

          const arena = el('div', {
            flex: '1',
            background: 'rgba(22, 101, 52, 0.2)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            border: '2px solid rgba(202, 138, 4, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '8px'
          });
          arena.className = 'arena';

          const arenaBg = el('div', {
            position: 'absolute',
            inset: '0',
            background: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 70%)'
          });

          const arenaContent = el('div', {
            textAlign: 'center'
          });

          const swordsIcon = createIcon('swords');
          Object.assign(swordsIcon.style, {
            width: '64px',
            height: '64px',
            color: '#fbbf24',
            margin: '0 auto 8px'
          });

          const arenaText = el('p', {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '18px'
          }, 'Battle Arena');
          const arenaText2 = el('p', {
            color: '#ffffff22',
            fontWeight: 'bold',
            fontSize: '18px'
          }, 'игра сможет сломаться');

          arenaContent.append(swordsIcon, arenaText, arenaText2);
          arena.append(arenaBg, arenaContent);

          const playerTowerDiv = el('div', {
            background: 'rgba(37, 99, 235, 0.4)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            padding: '12px',
            border: '2px solid rgba(37, 99, 235, 0.5)',
            marginBottom: '8px'
          });

          const playerHeader = el('div', {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          });

          const playerTitle = el('div', {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          });

          const playerShield = createIcon('shield');
          Object.assign(playerShield.style, {
            width: '20px',
            height: '20px',
            color: '#60a5fa'
          });

          const playerTitleText = el('span', {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px'
          }, 'Your Tower');

          playerTitle.append(playerShield, playerTitleText);

          const playerHealth = el('div', {
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          });

          const playerHeart = createIcon('heart');
          Object.assign(playerHeart.style, {
            width: '16px',
            height: '16px',
            color: '#60a5fa'
          });

          const playerHealthText = el('span', {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px'
          }, playerTower.health);
          playerHealthText.className = 'player-health-text';

          playerHealth.append(playerHeart, playerHealthText);

          playerHeader.append(playerTitle, playerHealth);

          const playerHealthBar = el('div', {
            width: '100%',
            background: '#374151',
            borderRadius: '9999px',
            height: '12px',
            overflow: 'hidden'
          });

          const playerHealthFill = el('div', {
            height: '100%',
            background: '#3b82f6',
            borderRadius: '9999px',
            transition: 'all 0.3s',
            width: `${(playerTower.health / playerTower.maxHealth) * 100}%`
          });
          playerHealthFill.className = 'player-health-bar';

          playerHealthBar.appendChild(playerHealthFill);
          playerTowerDiv.append(playerHeader, playerHealthBar);

          const elixirDiv = el('div', {
            background: 'rgba(107, 33, 168, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            padding: '8px',
            border: '2px solid rgba(107, 33, 168, 0.5)',
            marginBottom: '12px'
          });

          const elixirHeader = el('div', {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px'
          });

          const elixirIcon = createIcon('zap');
          Object.assign(elixirIcon.style, {
            width: '20px',
            height: '20px',
            color: '#d8b4fe'
          });

          const elixirText = el('span', {
            color: '#fff',
            fontWeight: 'bold'
          }, `Elixir: ${elixir}/10`);
          elixirText.className = 'elixir-text';

          elixirHeader.append(elixirIcon, elixirText);

          const elixirBarContainer = el('div', {
            width: '100%',
            background: '#374151',
            borderRadius: '9999px',
            height: '8px',
            overflow: 'hidden'
          });

          const elixirBar = el('div', {
            height: '100%',
            background: 'linear-gradient(to right, #a855f7 0%, #ec4899 100%)',
            borderRadius: '9999px',
            transition: 'all 0.3s',
            width: `${(elixir / 10) * 100}%`
          });
          elixirBar.className = 'elixir-bar';

          elixirBarContainer.appendChild(elixirBar);
          elixirDiv.append(elixirHeader, elixirBarContainer);

          const cardsGrid = el('div', {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginTop: '12px'
          });
          cardsGrid.className = 'cards-grid';

          root.append(enemyTowerDiv, arena, playerTowerDiv, elixirDiv, cardsGrid);

          setTimeout(() => {
            renderCards();
          }, 0);

          return root;
        };

        setTimeout(initGame, 100);

        return render();
      },
      size: { width: 400, height: 700 }
    },
    vscode: {
      title: 'VS Code',
      icon: './static/icons/VsCode.png',
      content: () => {
        const wrap = el('div', { display: 'grid', gridTemplateRows: 'auto 1fr 180px', gap: '8px', height: '100%' });
        wrap.className = 'vscode-wrap';

        const toolbar = el('div', { display: 'flex', gap: '8px', alignItems: 'center' });
        toolbar.className = 'vscode-toolbar';

        const langSelect = el('select', { height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.25)', color: '#e8e8ef', padding: '0 8px' });
        langSelect.className = 'vscode-lang';

        langSelect.innerHTML = [
          { v: 'javascript', t: 'JavaScript' },
          { v: 'typescript', t: 'TypeScript' },
          { v: 'html', t: 'HTML' },
          { v: 'css', t: 'CSS' },
          { v: 'json', t: 'JSON' },
          { v: 'c', t: 'C' },
          { v: 'cpp', t: 'C++' },
          { v: 'python', t: 'Python' },
          { v: 'java', t: 'Java' },
          { v: 'csharp', t: 'C#' },
          { v: 'go', t: 'Go' },
          { v: 'rust', t: 'Rust' },
          { v: 'kotlin', t: 'Kotlin' },
          { v: 'swift', t: 'Swift' },
          { v: 'php', t: 'PHP' },
          { v: 'ruby', t: 'Ruby' },
          { v: 'scala', t: 'Scala' },
          { v: 'perl', t: 'Perl' },
          { v: 'haskell', t: 'Haskell' },
          { v: 'lua', t: 'Lua' },
          { v: 'r', t: 'R' },
          { v: 'dart', t: 'Dart' },
          { v: 'elixir', t: 'Elixir' },
          { v: 'clojure', t: 'Clojure' },
          { v: 'fsharp', t: 'F#' },
          { v: 'shell', t: 'Shell' },
          { v: 'objectivec', t: 'Objective-C' },
          { v: 'matlab', t: 'MATLAB' },
          { v: 'groovy', t: 'Groovy' },
          { v: 'fortran', t: 'Fortran' },
          { v: 'assembly', t: 'Assembly' },
          { v: 'vbnet', t: 'VB.NET' },
          { v: 'sql', t: 'SQL' },
          { v: 'prolog', t: 'Prolog' },
          { v: 'pascal', t: 'Pascal' },
          { v: 'smalltalk', t: 'Smalltalk' }
        ].map(o => `<option value="${o.v}">${o.t}</option>`).join('');

        langSelect.value = 'javascript';

        const fileStorage = new FileStorageManager();
        const runBtn = btn('Run');
        const clearBtn = btn('Clear Output');
        const saveBtn = btn('Сохранить', { background: 'rgba(76, 175, 80, 0.8)', color: '#fff' });
        const loadBtn = btn('Открыть', { background: 'rgba(100, 150, 255, 0.8)', color: '#fff' });
        const fileNameInput = input('text', 'Имя файла...', { width: '150px', padding: '6px 8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' });
        toolbar.append(langSelect, fileNameInput, saveBtn, loadBtn, runBtn, clearBtn);

        const host = el('div', { height: '100%', width: '100%', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' });
        host.className = 'monaco-host';

        const output = el('div', { background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '12px', color: '#e8e8ef', overflow: 'auto', whiteSpace: 'pre-wrap' });
        output.className = 'output-panel';

        wrap.append(toolbar, host, output);

        const writeOutput = (text, isError) => {
          const line = el('div', isError ? { color: '#ff6b6b' } : {}, String(text));
          output.appendChild(line);
          output.scrollTop = output.scrollHeight;
        };

        const clearOutput = () => output.innerHTML = '';

        const runJavascript = code => {
          clearOutput();
          const originalLog = console.log, originalError = console.error;
          try {
            console.log = (...args) => args.forEach(a => writeOutput(a));
            console.error = (...args) => args.forEach(a => writeOutput(a, true));
            let result;
            try { result = Function(code)(); } catch (e) { writeOutput(e?.stack || String(e), true); }
            if (result !== undefined) writeOutput(result);
          } finally { console.log = originalLog; console.error = originalError; }
        };

        const runHtml = code => {
          clearOutput();
          const iframe = el('iframe', { width: '100%', height: '100%', border: 'none' });
          iframe.className = 'output-iframe';
          output.appendChild(iframe);
          try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (doc) { doc.open(); doc.write(code); doc.close(); }
          } catch (e) { writeOutput(e?.stack || String(e), true); }
        };

        const runCode = (lang, code) => {
          if (lang === 'javascript') runJavascript(code);
          else if (lang === 'html') runHtml(code);
          else {
            clearOutput();
            writeOutput(`Running for language "${lang}" is not yet supported in the browser.`, true);
          }
        };

        const initMonaco = () => {
          if (!window.require) return;
          try {
            window.require(['vs/editor/editor.main'], function () {
              if (host._editor) return;
              const initialCode = 'console.log("Hello, World!");';
              const model = monaco.editor.createModel(initialCode, 'javascript');
              host._editor = monaco.editor.create(host, { model, theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false } });

              runBtn.addEventListener('click', () => runCode(langSelect.value, host._editor.getValue()));
              clearBtn.addEventListener('click', clearOutput);

              saveBtn.addEventListener('click', () => {
                const fileName = fileNameInput.value.trim() || `code.${langSelect.value}`;
                const code = host._editor.getValue();
                const fileId = fileStorage.saveFile(fileName, code, 'code');
                writeOutput(`Файл "${fileName}" сохранен!`);
              });

              loadBtn.addEventListener('click', () => {
                const files = fileStorage.getAllFiles().filter(f => f.type === 'code' || f.type === 'text');
                if (files.length === 0) {
                  writeOutput('Нет сохраненных файлов', true);
                  return;
                }
                const fileList = files.map((f, i) => `${i + 1}. ${f.name}`).join('\n');
                const index = prompt(`Выберите файл (1-${files.length}):\n${fileList}`);
                const fileIndex = parseInt(index) - 1;
                if (fileIndex >= 0 && fileIndex < files.length) {
                  const file = files[fileIndex];
                  host._editor.setValue(file.data);
                  fileNameInput.value = file.name;
                  const ext = file.name.split('.').pop();
                  const langMap = { 'js': 'javascript', 'ts': 'typescript', 'html': 'html', 'css': 'css', 'json': 'json', 'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c' };
                  if (langMap[ext]) langSelect.value = langMap[ext];
                  writeOutput(`Файл "${file.name}" загружен!`);
                }
              });

              langSelect.addEventListener('change', () => {
                const m = host._editor.getModel();
                if (m) monaco.editor.setModelLanguage(m, langSelect.value);
              });

              writeOutput('Output started. Press Run to execute.');
            });
          } catch { }
        };

        initMonaco();
        setTimeout(initMonaco, 0);

        return wrap;
      },
      size: { width: 980, height: 640 }
    },
    music: {
      title: 'Music',
      icon: './static/icons/music.svg',
      content: () => {
        const root = el('div', { display: 'grid', gridTemplateRows: 'auto 1fr', gap: '8px' });
        root.append(el('div', { opacity: '.85' }, 'Drag your audio file in mp3/mp4 format'));
        const audio = el('audio', { width: '100%', height: '40px' });
        audio.controls = true;
        root.appendChild(audio);
        root.addEventListener('dragover', e => e.preventDefault());
        root.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) { audio.src = URL.createObjectURL(f); audio.play().catch(() => { }); } });
        return root;
      },
      size: { width: 520, height: 220 }
    },
    settings: {
      title: 'Settings',
      icon: './static/icons/settings.svg',
      content: () => {
        const s = loadSettings();
        const root = el('div', { display: 'grid', gridTemplateRows: 'auto auto', gap: '14px' });

        try {
          const userDataStr = localStorage.getItem('user') || localStorage.getItem('user_json');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            if (userData && userData.name) {
              const welcomeTitle = el('div', { fontWeight: '600', fontSize: '18px', marginBottom: '8px', color: '#4CAF50' }, `Welcome ${userData.name}`);
              root.appendChild(welcomeTitle);
            }
          }
        } catch (e) {
          console.error('Error loading user data in settings:', e);
        }

        const menuTitle = el('div', { fontWeight: '600' }, 'Taskbar Position');
        const menuRow = el('div', { display: 'flex', gap: '8px' });
        const sel = el('select', { height: '34px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.25)', color: '#e8e8ef', padding: '0 8px' });
        sel.innerHTML = `<option value="center">Center</option><option value="left">Left</option><option value="right">Right</option>`;
        sel.value = s.menuStyle || 'center';
        sel.addEventListener('change', () => { applyMenuStyle(sel.value); saveSettings({ menuStyle: sel.value }); });
        menuRow.appendChild(sel);
        const builtinTitle = el('div', { fontWeight: '600' }, 'Built-in Wallpapers (6)');
        const builtinRow = el('div', { display: 'flex', flexWrap: 'wrap', gap: '8px' });
        const builtin = defaultWallpapers.slice();
        builtin.forEach((url, idx) => builtinRow.appendChild(btn(`Wallpaper ${idx + 1}`, () => { applyWallpaper(url); saveSettings({ wallpapers: (loadSettings().wallpapers || builtin), selectedWallpaperIndex: idx }); })));
        const wpTitle = el('div', { fontWeight: '600' }, 'Custom Wallpaper (URL from internet, 1)');
        const wpWrap = el('div', { display: 'grid', gridTemplateColumns: '1fr', gap: '8px' });
        const wallpapers = Array.isArray(s.wallpapers) ? s.wallpapers.slice(0, 1) : [];
        while (wallpapers.length < 1) wallpapers.push('');
        const renderWpRow = index => {
          const row = el('div', { display: 'flex', gap: '8px' });
          const inp = input('text', `Image URL #${index + 1}`);
          inp.value = wallpapers[index] || '';
          row.append(inp, btn('Save', () => { wallpapers[index] = inp.value.trim(); saveSettings({ wallpapers: wallpapers.slice(0, 1) }); }), btn('Apply', () => { const url = inp.value.trim(); if (url) { applyWallpaper(url); const ws = (loadSettings().wallpapers || wallpapers).slice(0, 1); ws[index] = url; saveSettings({ wallpapers: ws.slice(0, 1), selectedWallpaperIndex: index }); } }));
          return row;
        };
        for (let i = 0; i < 1; i++) wpWrap.appendChild(renderWpRow(i));
        root.append(menuTitle, menuRow, builtinTitle, builtinRow, wpTitle, wpWrap, btn('Reset Wallpaper', () => { applyWallpaper(null); saveSettings({ selectedWallpaperIndex: -1 }); }));
        return root;
      },
      size: { width: 520, height: 400 }
    },
    snake: {
      title: 'Snake',
      icon: './static/icons/game_icon_176683.png',
      content: () => {
        const { root, info, canvasWrap } = gameContainer();
        info.style.maxWidth = '500px';
        const score = el('div', { fontWeight: 'bold', fontSize: '14px' }, 'Score: 0 | Press arrows to start');
        const restartBtn = btn('New Game');
        info.append(score, restartBtn);
        const canvas = canvasEl(500, 500, { background: '#0a0a0a', height: 'min(500px, 90vw)' });
        let ctx, gridSize = 20, tileCount = 20, snake = [{ x: 10, y: 10 }], dx = 0, dy = 0, food = { x: 15, y: 15 }, gameRunning = false, gameLoop;
        const resize = () => { const size = Math.min(canvasWrap.clientWidth - 20, canvasWrap.clientHeight - 20, 500); canvas.width = canvas.height = size; ctx = canvas.getContext('2d'); gridSize = size / tileCount; draw(); };
        new ResizeObserver(resize).observe(canvasWrap);
        const draw = () => {
          if (!ctx) return;
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.lineWidth = 1;
          for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath(); ctx.moveTo(i * gridSize, 0); ctx.lineTo(i * gridSize, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * gridSize); ctx.lineTo(canvas.width, i * gridSize); ctx.stroke();
          }
          ctx.fillStyle = '#ff4444';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ff4444';
          ctx.beginPath();
          ctx.arc((food.x + 0.5) * gridSize, (food.y + 0.5) * gridSize, gridSize * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          snake.forEach((segment, i) => {
            ctx.fillStyle = i === 0 ? '#4caf50' : `rgba(76, 175, 80, ${1 - i * 0.05})`;
            if (i === 0) { ctx.shadowBlur = 8; ctx.shadowColor = '#4caf50'; }
            ctx.beginPath();
            ctx.arc((segment.x + 0.5) * gridSize, (segment.y + 0.5) * gridSize, gridSize * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          });
        };
        const move = () => {
          if (!gameRunning || dx === 0 && dy === 0) return;
          const head = { x: snake[0].x + dx, y: snake[0].y + dy };
          if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            gameRunning = false;
            clearInterval(gameLoop);
            const gameOverText = 'Game Over! Score:';
            const newGameText = ' | Press arrows for new game';
            score.textContent = gameOverText + ' ' + (snake.length - 1) + newGameText;
            return;
          }
          snake.unshift(head);
          if (head.x === food.x && head.y === food.y) {
            const scoreText = 'Score:';
            score.textContent = scoreText + ' ' + (snake.length - 1);
            do { food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) }; } while (snake.some(seg => seg.x === food.x && seg.y === food.y));
          } else snake.pop();
          draw();
        };
        const start = () => {
          snake = [{ x: 10, y: 10 }];
          dx = dy = 0;
          food = { x: 15, y: 15 };
          score.textContent = 'Score: 0 | Press arrows to start';
          gameRunning = false;
          clearInterval(gameLoop);
          draw();
        };
        const handleKey = e => {
          if (e.key.startsWith('Arrow')) {
            e.preventDefault();
            if (!gameRunning && dx === 0 && dy === 0) {
              if (e.key === 'ArrowUp') { dx = 0; dy = -1; }
              else if (e.key === 'ArrowDown') { dx = 0; dy = 1; }
              else if (e.key === 'ArrowLeft') { dx = -1; dy = 0; }
              else if (e.key === 'ArrowRight') { dx = 1; dy = 0; }
              gameRunning = true;
              clearInterval(gameLoop);
              gameLoop = setInterval(move, 120);
              score.textContent = 'Score: 0';
              return;
            }
            if (e.key === 'ArrowUp' && dy !== 1) { dx = 0; dy = -1; }
            else if (e.key === 'ArrowDown' && dy !== -1) { dx = 0; dy = 1; }
            else if (e.key === 'ArrowLeft' && dx !== 1) { dx = -1; dy = 0; }
            else if (e.key === 'ArrowRight' && dx !== -1) { dx = 1; dy = 0; }
          }
        };
        canvas.addEventListener('keydown', handleKey);
        canvas.addEventListener('click', () => canvas.focus());
        restartBtn.addEventListener('click', () => { start(); canvas.focus(); });
        root.append(info, canvasWrap);
        canvasWrap.appendChild(canvas);
        setTimeout(() => { resize(); canvas.focus(); }, 100);
        return root;
      },
      size: { width: 550, height: 600 }
    },
    chess: {
      title: 'Chess',
      icon: './static/icons/game_icon_176683.png',
      content: () => {
        const { root, info, canvasWrap } = gameContainer();
        info.style.maxWidth = '600px';
        const status = el('div', { fontWeight: 'bold', fontSize: '14px' }, 'Turn: White');
        const botBtn = btn('Toggle Bot');
        const restartBtn = btn('New Game');
        info.append(status, botBtn, restartBtn);
        const board = el('div', { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0', width: 'min(600px, 90vw)', height: 'min(600px, 90vw)', border: '3px solid #8b4513', borderRadius: '4px', background: '#8b4513' });
        const pieceMap = { 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙' };
        let boardState = [['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'], ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'], ['', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', ''], ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']];
        let selected = null, currentPlayer = 'white', botEnabled = false, cells = [];
        const getMoves = (row, col) => {
          const piece = boardState[row][col];
          if (!piece) return [];
          const isWhite = piece === piece.toUpperCase();
          const moves = [];
          switch (piece.toUpperCase()) {
            case 'P':
              const dir = isWhite ? -1 : 1, startRow = isWhite ? 6 : 1;
              if (row + dir >= 0 && row + dir < 8 && !boardState[row + dir][col]) {
                moves.push([row + dir, col]);
                if (row === startRow && !boardState[row + 2 * dir][col]) moves.push([row + 2 * dir, col]);
              }
              for (const dc of [-1, 1]) {
                if (col + dc >= 0 && col + dc < 8 && row + dir >= 0 && row + dir < 8) {
                  const target = boardState[row + dir][col + dc];
                  if (target && (target === target.toUpperCase()) !== isWhite) moves.push([row + dir, col + dc]);
                }
              }
              break;
            case 'R':
              for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                for (let i = 1; i < 8; i++) {
                  const nr = row + dr * i, nc = col + dc * i;
                  if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
                  if (!boardState[nr][nc]) moves.push([nr, nc]);
                  else { if ((boardState[nr][nc] === boardState[nr][nc].toUpperCase()) !== isWhite) moves.push([nr, nc]); break; }
                }
              }
              break;
            case 'B':
              for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                for (let i = 1; i < 8; i++) {
                  const nr = row + dr * i, nc = col + dc * i;
                  if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
                  if (!boardState[nr][nc]) moves.push([nr, nc]);
                  else { if ((boardState[nr][nc] === boardState[nr][nc].toUpperCase()) !== isWhite) moves.push([nr, nc]); break; }
                }
              }
              break;
            case 'N':
              for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && (!boardState[nr][nc] || (boardState[nr][nc] === boardState[nr][nc].toUpperCase()) !== isWhite)) moves.push([nr, nc]);
              }
              break;
            case 'Q':
              for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                for (let i = 1; i < 8; i++) {
                  const nr = row + dr * i, nc = col + dc * i;
                  if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
                  if (!boardState[nr][nc]) moves.push([nr, nc]);
                  else { if ((boardState[nr][nc] === boardState[nr][nc].toUpperCase()) !== isWhite) moves.push([nr, nc]); break; }
                }
              }
              break;
            case 'K':
              for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && (!boardState[nr][nc] || (boardState[nr][nc] === boardState[nr][nc].toUpperCase()) !== isWhite)) moves.push([nr, nc]);
              }
              break;
          }
          return moves;
        };
        const isInCheck = (player) => {
          const isWhite = player === 'white';
          let kingRow = -1, kingCol = -1;
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (boardState[r][c] === (isWhite ? 'K' : 'k')) {
                kingRow = r;
                kingCol = c;
                break;
              }
            }
            if (kingRow >= 0) break;
          }
          if (kingRow < 0) return false;

          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const piece = boardState[r][c];
              if (piece && (piece === piece.toUpperCase()) !== isWhite) {
                const moves = getMoves(r, c);
                if (moves.some(([mr, mc]) => mr === kingRow && mc === kingCol)) {
                  return true;
                }
              }
            }
          }
          return false;
        };

        const isCheckmate = (player) => {
          if (!isInCheck(player)) return false;
          const isWhite = player === 'white';
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const piece = boardState[r][c];
              if (piece && (piece === piece.toUpperCase()) === isWhite) {
                const moves = getMoves(r, c);
                for (const [mr, mc] of moves) {
                  const oldPiece = boardState[mr][mc];
                  boardState[mr][mc] = boardState[r][c];
                  boardState[r][c] = '';
                  const stillInCheck = isInCheck(player);
                  boardState[r][c] = boardState[mr][mc];
                  boardState[mr][mc] = oldPiece;
                  if (!stillInCheck) return false;
                }
              }
            }
          }
          return true;
        };

        const makeMove = (fromRow, fromCol, toRow, toCol) => {
          const oldPiece = boardState[toRow][toCol];
          boardState[toRow][toCol] = boardState[fromRow][fromCol];
          boardState[fromRow][fromCol] = '';

          if (isInCheck(currentPlayer)) {
            boardState[fromRow][fromCol] = boardState[toRow][toCol];
            boardState[toRow][toCol] = oldPiece;
            return false;
          }

          currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

          if (isCheckmate(currentPlayer)) {
            const winnerText = 'Winner:';
            const blackText = 'Black';
            const whiteText = 'White';
            status.textContent = winnerText + ' ' + (currentPlayer === 'white' ? blackText : whiteText);
            render();
            return true;
          } else if (isInCheck(currentPlayer)) {
            const whiteCheckText = 'Turn: White (CHECK!)';
            const blackCheckText = 'Turn: Black (CHECK!)';
            status.textContent = currentPlayer === 'white' ? whiteCheckText : blackCheckText;
          } else {
            const turnText = 'Turn:';
            const whiteText = 'White';
            const blackText = 'Black';
            status.textContent = turnText + ' ' + (currentPlayer === 'white' ? whiteText : blackText);
          }

          render();
          if (botEnabled && currentPlayer === 'black') setTimeout(() => botMove(), 500);
          return true;
        };
        const getDangerousSquares = () => {
          const dangerous = {};
          if (!botEnabled || currentPlayer !== 'white') return dangerous;
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (boardState[r][c] && boardState[r][c] === boardState[r][c].toLowerCase()) {
                getMoves(r, c).forEach(([mr, mc]) => {
                  const key = `${mr},${mc}`;
                  dangerous[key] = (dangerous[key] || 0) + (boardState[mr][mc] && boardState[mr][mc] === boardState[mr][mc].toUpperCase() ? 1 : 0.5);
                });
              }
            }
          }
          return dangerous;
        };
        const botMove = () => {
          const moves = [];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (boardState[r][c] && boardState[r][c] === boardState[r][c].toLowerCase()) {
                getMoves(r, c).forEach(m => moves.push([[r, c], m]));
              }
            }
          }
          if (moves.length > 0) {
            const move = moves[Math.floor(Math.random() * moves.length)];
            makeMove(move[0][0], move[0][1], move[1][0], move[1][1]);
          }
        };
        const render = () => {
          board.innerHTML = '';
          cells = [];
          const dangerous = getDangerousSquares();
          const selectedMoves = selected ? getMoves(selected[0], selected[1]) : [];
          for (let i = 0; i < 64; i++) {
            const row = Math.floor(i / 8), col = i % 8;
            const cell = el('div', { width: '100%', height: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(24px, 5vw, 48px)', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s', position: 'relative', background: (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863' });
            cell.dataset.row = row;
            cell.dataset.col = col;
            const piece = boardState[row][col];
            if (piece) {
              const pieceDiv = el('div', { color: piece === piece.toUpperCase() ? '#ffffff' : '#000000', textShadow: piece === piece.toUpperCase() ? '1px 1px 2px rgba(0,0,0,0.5)' : '1px 1px 2px rgba(255,255,255,0.5)', fontWeight: 'bold' }, pieceMap[piece] || '');
              cell.appendChild(pieceDiv);
            }
            const dangerKey = `${row},${col}`;
            if (dangerous[dangerKey] && !selected) {
              const dangerLevel = Math.min(dangerous[dangerKey], 2);
              cell.style.boxShadow = `inset 0 0 0 ${2 + dangerLevel}px rgba(255, 235, 59, ${0.3 + dangerLevel * 0.2})`;
            }
            if (selected && selected[0] === row && selected[1] === col) {
              cell.style.boxShadow = 'inset 0 0 0 3px #ffeb3b';
              cell.style.transform = 'scale(1.05)';
            }
            if (selected && selectedMoves.some(([mr, mc]) => mr === row && mc === col)) {
              cell.style.boxShadow = 'inset 0 0 0 3px #4caf50';
              cell.style.background = (row + col) % 2 === 0 ? '#d4edda' : '#c3e6cb';
            }
            cell.addEventListener('click', () => {
              if (botEnabled && currentPlayer === 'black') return;
              const r = parseInt(cell.dataset.row), c = parseInt(cell.dataset.col);
              if (selected) {
                const [sr, sc] = selected;
                const moves = getMoves(sr, sc);
                if (moves.some(([mr, mc]) => mr === r && mc === c)) {
                  if (makeMove(sr, sc, r, c)) {
                    selected = null;
                    render();
                  }
                } else {
                  selected = null;
                  render();
                  if (boardState[r][c] && (boardState[r][c] === boardState[r][c].toUpperCase()) === (currentPlayer === 'white')) {
                    selected = [r, c];
                    render();
                  }
                }
              } else {
                if (boardState[r][c] && (boardState[r][c] === boardState[r][c].toUpperCase()) === (currentPlayer === 'white')) {
                  selected = [r, c];
                  render();
                }
              }
            });
            cells.push(cell);
            board.appendChild(cell);
          }
        };
        botBtn.addEventListener('click', () => {
          botEnabled = !botEnabled;
          botBtn.textContent = botEnabled ? 'Выкл бот' : 'Вкл бот';
          if (botEnabled && currentPlayer === 'black') setTimeout(() => botMove(), 500);
        });
        restartBtn.addEventListener('click', () => {
          boardState = [['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'], ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'], ['', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', ''], ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']];
          selected = null;
          currentPlayer = 'white';
          status.textContent = 'Turn: White';
          render();
        });
        root.append(info, canvasWrap);
        canvasWrap.appendChild(board);
        render();
        return root;
      },
      size: { width: 700, height: 750 }
    },
    checkers: {
      title: 'Checkers',
      icon: './static/icons/game_icon_176683.png',
      content: () => {
        const root = document.createElement('div');
        root.style.display = 'flex';
        root.style.flexDirection = 'column';
        root.style.gap = '12px';
        root.style.height = '100%';
        root.style.alignItems = 'center';
        root.style.justifyContent = 'center';

        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.justifyContent = 'space-between';
        info.style.alignItems = 'center';
        info.style.width = '100%';
        info.style.maxWidth = '600px';
        const status = document.createElement('div');
        status.textContent = 'Ход: Синие';
        status.style.fontWeight = 'bold';
        status.style.fontSize = '14px';
        const botBtn = document.createElement('button');
        botBtn.className = 'btn';
        botBtn.textContent = 'Вкл/Выкл бот';
        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn';
        restartBtn.textContent = 'Новая игра';
        info.append(status, botBtn, restartBtn);

        const boardWrap = document.createElement('div');
        boardWrap.style.display = 'flex';
        boardWrap.style.justifyContent = 'center';
        boardWrap.style.alignItems = 'center';
        boardWrap.style.flex = '1';
        boardWrap.style.width = '100%';

        const board = document.createElement('div');
        board.style.display = 'grid';
        board.style.gridTemplateColumns = 'repeat(8, 1fr)';
        board.style.gap = '0';
        board.style.width = 'min(600px, 90vw)';
        board.style.height = 'min(600px, 90vw)';
        board.style.border = '3px solid #8b4513';
        board.style.borderRadius = '4px';
        board.style.background = '#8b4513';

        let boardState = Array(8).fill().map(() => Array(8).fill(null));
        let currentPlayer = 'blue';
        let selected = null;
        let botEnabled = false;
        let gameRunning = true;

        function initBoard() {
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if ((r + c) % 2 === 1) {
                if (r < 3) boardState[r][c] = 'red';
                else if (r > 4) boardState[r][c] = 'blue';
              }
            }
          }
        }

        function getMoves(row, col) {
          const piece = boardState[row][col];
          if (!piece) return [];
          const moves = [];
          const isBlue = piece === 'blue' || piece === 'king-blue';
          const isKing = piece === 'king-blue' || piece === 'king-red';
          const dir = isBlue ? -1 : 1;
          const directions = isKing ? [-1, 1] : [dir, -dir];

          for (const moveDir of directions) {
            for (const dc of [-1, 1]) {
              const nr = row + moveDir;
              const nc = col + dc;
              if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && (nr + nc) % 2 === 1) {
                if (!boardState[nr][nc]) {
                  if (isKing) {
                    let currentR = row, currentC = col;
                    while (true) {
                      currentR += moveDir;
                      currentC += dc;
                      if (currentR < 0 || currentR >= 8 || currentC < 0 || currentC >= 8 || (currentR + currentC) % 2 === 0) break;
                      if (!boardState[currentR][currentC]) {
                        moves.push([currentR, currentC]);
                      } else {
                        if (boardState[currentR][currentC] !== piece) {
                          const jumpR = currentR + moveDir;
                          const jumpC = currentC + dc;
                          if (jumpR >= 0 && jumpR < 8 && jumpC >= 0 && jumpC < 8 && (jumpR + jumpC) % 2 === 1 && !boardState[jumpR][jumpC]) {
                            moves.push([jumpR, jumpC]);
                          }
                        }
                        break;
                      }
                    }
                  } else {
                    if (moveDir === dir) {
                      moves.push([nr, nc]);
                    } else {
                      const backR = row - dir;
                      const backC = col + dc;
                      if (backR >= 0 && backR < 8 && backC >= 0 && backC < 8 && (backR + backC) % 2 === 1) {
                        const backPiece = boardState[backR][backC];
                        if (backPiece && backPiece !== piece) {
                          moves.push([nr, nc]);
                        }
                      }
                    }
                  }
                } else if (boardState[nr][nc] !== piece) {
                  const jumpR = nr + moveDir;
                  const jumpC = nc + dc;
                  if (jumpR >= 0 && jumpR < 8 && jumpC >= 0 && jumpC < 8 && (jumpR + jumpC) % 2 === 1 && !boardState[jumpR][jumpC]) {
                    moves.push([jumpR, jumpC]);
                  }
                }
              }
            }
          }
          return moves;
        }

        function checkVictory() {
          const bluePieces = [];
          const redPieces = [];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (boardState[r][c] === 'blue' || boardState[r][c] === 'king-blue') bluePieces.push([r, c]);
              if (boardState[r][c] === 'red' || boardState[r][c] === 'king-red') redPieces.push([r, c]);
            }
          }
          if (bluePieces.length === 0) return 'red';
          if (redPieces.length === 0) return 'blue';

          const currentPieces = currentPlayer === 'blue' ? bluePieces : redPieces;
          let hasMoves = false;
          for (const [r, c] of currentPieces) {
            if (getMoves(r, c).length > 0) {
              hasMoves = true;
              break;
            }
          }
          if (!hasMoves) {
            return currentPlayer === 'blue' ? 'red' : 'blue';
          }
          return null;
        }

        function makeMove(fromRow, fromCol, toRow, toCol, animate = true) {
          const fromCell = board.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
          const toCell = board.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
          const pieceDiv = fromCell?.querySelector('div');

          const jumped = Math.abs(fromRow - toRow) === 2;
          if (jumped) {
            const midR = (fromRow + toRow) / 2;
            const midC = (fromCol + toCol) / 2;
            const midCell = board.querySelector(`[data-row="${midR}"][data-col="${midC}"]`);
            const midPiece = midCell?.querySelector('div');
            if (midPiece && animate) {
              midPiece.style.transition = 'all 0.3s ease-out';
              midPiece.style.transform = 'scale(0)';
              midPiece.style.opacity = '0';
              setTimeout(() => {
                boardState[midR][midC] = null;
              }, 300);
            } else {
              boardState[midR][midC] = null;
            }
          }

          if (pieceDiv && animate) {
            pieceDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            pieceDiv.style.position = 'absolute';
            pieceDiv.style.zIndex = '1000';
            const fromRect = fromCell.getBoundingClientRect();
            const toRect = toCell.getBoundingClientRect();
            const boardRect = board.getBoundingClientRect();

            pieceDiv.style.left = (fromRect.left - boardRect.left + fromRect.width / 2) + 'px';
            pieceDiv.style.top = (fromRect.top - boardRect.top + fromRect.height / 2) + 'px';
            pieceDiv.style.transform = 'translate(-50%, -50%)';

            setTimeout(() => {
              pieceDiv.style.left = (toRect.left - boardRect.left + toRect.width / 2) + 'px';
              pieceDiv.style.top = (toRect.top - boardRect.top + toRect.height / 2) + 'px';
            }, 10);

            setTimeout(() => {
              boardState[toRow][toCol] = boardState[fromRow][fromCol];
              boardState[fromRow][fromCol] = null;

              if ((currentPlayer === 'blue' && toRow === 0) || (currentPlayer === 'red' && toRow === 7)) {
                boardState[toRow][toCol] = 'king-' + currentPlayer;
              }

              const winner = checkVictory();
              if (winner) {
                status.textContent = 'Победили: ' + (winner === 'blue' ? 'Синие' : 'Красные');
                gameRunning = false;
                render();
                return;
              }

              currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
              status.textContent = 'Ход: ' + (currentPlayer === 'blue' ? 'Синие' : 'Красные');
              selected = null;
              render();

              if (botEnabled && currentPlayer === 'red') {
                setTimeout(() => botMove(), 500);
              }
            }, 400);
          } else {
            boardState[toRow][toCol] = boardState[fromRow][fromCol];
            boardState[fromRow][fromCol] = null;

            if ((currentPlayer === 'blue' && toRow === 0) || (currentPlayer === 'red' && toRow === 7)) {
              boardState[toRow][toCol] = 'king-' + currentPlayer;
            }

            const winner = checkVictory();
            if (winner) {
              status.textContent = 'Победили: ' + (winner === 'blue' ? 'Синие' : 'Красные');
              gameRunning = false;
              render();
              return;
            }

            currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
            status.textContent = 'Ход: ' + (currentPlayer === 'blue' ? 'Синие' : 'Красные');
            selected = null;
            render();

            if (botEnabled && currentPlayer === 'red') {
              setTimeout(() => botMove(), 500);
            }
          }
        }

        function botMove() {
          const moves = [];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (boardState[r][c] && (boardState[r][c] === 'red' || boardState[r][c] === 'king-red')) {
                const pieceMoves = getMoves(r, c);
                pieceMoves.forEach(m => moves.push([[r, c], m]));
              }
            }
          }
          if (moves.length > 0) {
            const move = moves[Math.floor(Math.random() * moves.length)];
            makeMove(move[0][0], move[0][1], move[1][0], move[1][1], true);
          }
        }

        function render() {
          board.innerHTML = '';
          for (let i = 0; i < 64; i++) {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const cell = document.createElement('div');
            cell.style.width = '100%';
            cell.style.height = '100%';
            cell.style.aspectRatio = '1';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.cursor = 'pointer';
            cell.style.userSelect = 'none';
            cell.style.transition = 'all 0.2s';
            const isDark = (row + col) % 2 === 1;
            cell.style.background = isDark ? '#b58863' : '#f0d9b5';
            cell.dataset.row = row;
            cell.dataset.col = col;

            cell.style.position = 'relative';

            const piece = boardState[row][col];
            if (piece) {
              const pieceDiv = document.createElement('div');
              pieceDiv.style.width = '80%';
              pieceDiv.style.height = '80%';
              pieceDiv.style.borderRadius = '50%';
              pieceDiv.style.border = '3px solid';
              pieceDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
              pieceDiv.style.transition = 'transform 0.2s, box-shadow 0.2s';

              if (piece === 'blue' || piece === 'king-blue') {
                pieceDiv.style.background = 'linear-gradient(135deg, #42a5f5, #1976d2)';
                pieceDiv.style.borderColor = '#1565c0';
                if (piece === 'king-blue') {
                  pieceDiv.style.borderWidth = '4px';
                  pieceDiv.style.borderColor = '#FFD700';
                  pieceDiv.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.6), 0 2px 8px rgba(0,0,0,0.4)';
                }
              } else {
                pieceDiv.style.background = 'linear-gradient(135deg, #ef5350, #c62828)';
                pieceDiv.style.borderColor = '#b71c1c';
                if (piece === 'king-red') {
                  pieceDiv.style.borderWidth = '4px';
                  pieceDiv.style.borderColor = '#FFD700';
                  pieceDiv.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.6), 0 2px 8px rgba(0,0,0,0.4)';
                }
              }
              cell.appendChild(pieceDiv);
            }

            if (selected && selected[0] === row && selected[1] === col) {
              cell.style.boxShadow = 'inset 0 0 0 4px #ffeb3b';
            }

            const moves = selected ? getMoves(selected[0], selected[1]) : [];
            if (moves.some(([mr, mc]) => mr === row && mc === col)) {
              cell.style.boxShadow = 'inset 0 0 0 3px #4caf50';
            }

            cell.addEventListener('click', () => {
              if (!gameRunning || (botEnabled && currentPlayer === 'red')) return;
              const r = row, c = col;

              if (selected) {
                const [sr, sc] = selected;
                const moves = getMoves(sr, sc);
                if (moves.some(([mr, mc]) => mr === r && mc === c)) {
                  makeMove(sr, sc, r, c, true);
                } else {
                  selected = null;
                  render();
                  if (boardState[r][c] && (boardState[r][c] === 'blue' || boardState[r][c] === 'king-blue') === (currentPlayer === 'blue')) {
                    selected = [r, c];
                    render();
                  }
                }
              } else {
                if (boardState[r][c] && (boardState[r][c] === 'blue' || boardState[r][c] === 'king-blue') === (currentPlayer === 'blue')) {
                  selected = [r, c];
                  render();
                }
              }
            });

            board.appendChild(cell);
          }
        }

        botBtn.addEventListener('click', () => {
          botEnabled = !botEnabled;
          botBtn.textContent = botEnabled ? 'Выкл бот' : 'Вкл бот';
          if (botEnabled && currentPlayer === 'red') {
            setTimeout(() => botMove(), 500);
          }
        });

        restartBtn.addEventListener('click', () => {
          boardState = Array(8).fill().map(() => Array(8).fill(null));
          currentPlayer = 'blue';
          selected = null;
          gameRunning = true;
          status.textContent = 'Ход: Синие';
          initBoard();
          render();
        });

        root.append(info, boardWrap);
        boardWrap.appendChild(board);
        initBoard();
        render();
        return root;
      },
      size: { width: 700, height: 750 }
    },
    tetris: {
      title: 'Tetris',
      icon: './static/icons/game_icon_176683.png',
      content: () => {
        const root = document.createElement('div');
        root.style.display = 'flex';
        root.style.flexDirection = 'column';
        root.style.gap = '12px';
        root.style.height = '100%';
        root.style.alignItems = 'center';
        root.style.justifyContent = 'center';

        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.justifyContent = 'space-between';
        info.style.alignItems = 'center';
        info.style.width = '100%';
        info.style.maxWidth = '400px';
        const score = document.createElement('div');
        score.textContent = 'Счёт: 0';
        score.style.fontWeight = 'bold';
        score.style.fontSize = '14px';
        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn';
        restartBtn.textContent = 'Старт';
        info.append(score, restartBtn);

        const canvasWrap = document.createElement('div');
        canvasWrap.style.display = 'flex';
        canvasWrap.style.justifyContent = 'center';
        canvasWrap.style.alignItems = 'center';
        canvasWrap.style.flex = '1';
        canvasWrap.style.width = '100%';

        const canvas = document.createElement('canvas');
        canvas.style.width = 'min(300px, 40vw)';
        canvas.style.height = 'min(600px, 80vh)';
        canvas.style.background = '#1a1a2e';
        canvas.style.borderRadius = '12px';
        canvas.style.border = '2px solid rgba(255,255,255,0.2)';
        canvas.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        canvas.tabIndex = 0;
        canvas.style.outline = 'none';

        let ctx, grid = Array(20).fill().map(() => Array(10).fill(0));
        let piece = null, gameRunning = false, scoreVal = 0, gameLoop, dropCounter = 0;

        const shapes = [
          { shape: [[1, 1, 1, 1]], color: '#00f0f0' },
          { shape: [[1, 1], [1, 1]], color: '#f0f000' },
          { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' },
          { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' },
          { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' },
          { shape: [[1, 0, 0], [1, 1, 1]], color: '#f0a000' },
          { shape: [[0, 0, 1], [1, 1, 1]], color: '#0000f0' }
        ];

        function resize() {
          const w = Math.min(canvasWrap.clientWidth - 20, 300);
          const h = Math.min(canvasWrap.clientHeight - 20, 600);
          canvas.width = w;
          canvas.height = h;
          ctx = canvas.getContext('2d');
          draw();
        }
        new ResizeObserver(resize).observe(canvasWrap);

        function drawCell(x, y, color) {
          const cellSize = Math.min(canvas.width / 10, canvas.height / 20);
          const px = x * cellSize;
          const py = y * cellSize;

          ctx.fillStyle = color;
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(px + 1, py + 1, cellSize - 2, (cellSize - 2) / 3);

          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(px + 1, py + (cellSize - 2) * 2 / 3, cellSize - 2, (cellSize - 2) / 3);
        }

        function draw() {
          if (!ctx) return;
          const w = canvas.width;
          const h = canvas.height;

          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, w, h);

          const cellSize = Math.min(w / 10, h / 20);
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 1;
          for (let x = 0; x <= 10; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, h);
            ctx.stroke();
          }
          for (let y = 0; y <= 20; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(w, y * cellSize);
            ctx.stroke();
          }

          for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
              if (grid[y][x]) {
                drawCell(x, y, grid[y][x]);
              }
            }
          }

          if (piece) {
            piece.shape.forEach((row, y) => {
              row.forEach((cell, x) => {
                if (cell) {
                  drawCell(piece.x + x, piece.y + y, piece.color);
                }
              });
            });
          }
        }

        function rotate(p) {
          const rotated = [];
          for (let x = 0; x < p.shape[0].length; x++) {
            rotated[x] = [];
            for (let y = p.shape.length - 1; y >= 0; y--) {
              rotated[x][p.shape.length - 1 - y] = p.shape[y][x];
            }
          }
          return { shape: rotated, x: p.x, y: p.y, color: p.color };
        }

        function spawnPiece() {
          const template = shapes[Math.floor(Math.random() * shapes.length)];
          piece = { shape: template.shape.map(r => [...r]), x: 4, y: 0, color: template.color };
          if (collision()) {
            gameOver();
            return;
          }
        }

        function collision() {
          if (!piece) return false;
          for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
              if (piece.shape[y][x]) {
                const nx = piece.x + x;
                const ny = piece.y + y;
                if (nx < 0 || nx >= 10 || ny >= 20 || (ny >= 0 && grid[ny][nx])) {
                  return true;
                }
              }
            }
          }
          return false;
        }

        function lockPiece() {
          piece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
              if (cell && piece.y + y >= 0) {
                grid[piece.y + y][piece.x + x] = piece.color;
              }
            });
          });

          let linesCleared = 0;
          for (let y = 19; y >= 0; y--) {
            if (grid[y].every(cell => cell !== 0)) {
              grid.splice(y, 1);
              grid.unshift(Array(10).fill(0));
              linesCleared++;
              y++;
            }
          }
          if (linesCleared > 0) {
            scoreVal += linesCleared * 100 * linesCleared;
            score.textContent = 'Счёт: ' + scoreVal;
          }

          spawnPiece();
        }

        function update() {
          if (!gameRunning || !piece) return;
          dropCounter++;
          if (dropCounter > 30) {
            dropCounter = 0;
            piece.y++;
            if (collision()) {
              piece.y--;
              lockPiece();
            }
          }
          draw();
        }

        function gameOver() {
          gameRunning = false;
          clearInterval(gameLoop);
          score.textContent = 'Игра окончена! Счёт: ' + scoreVal;
        }

        function start() {
          grid = Array(20).fill().map(() => Array(10).fill(0));
          scoreVal = 0;
          dropCounter = 0;
          score.textContent = 'Счёт: 0';
          gameRunning = true;
          spawnPiece();
          clearInterval(gameLoop);
          gameLoop = setInterval(update, 16);
          draw();
        }

        function handleKey(e) {
          if (!piece || !gameRunning) {
            if (e.key.startsWith('Arrow') || e.key === ' ') {
              start();
            }
            return;
          }
          if (e.key === 'ArrowLeft') {
            piece.x--;
            if (collision()) piece.x++;
            draw();
          } else if (e.key === 'ArrowRight') {
            piece.x++;
            if (collision()) piece.x--;
            draw();
          } else if (e.key === 'ArrowDown') {
            piece.y++;
            if (collision()) {
              piece.y--;
              lockPiece();
            }
            draw();
          } else if (e.key === 'ArrowUp' || e.key === ' ') {
            const rotated = rotate(piece);
            const oldPiece = { ...piece };
            piece = rotated;
            if (collision()) {
              piece = oldPiece;
            }
            draw();
          }
        }

        canvas.addEventListener('keydown', handleKey);
        canvas.addEventListener('click', () => canvas.focus());
        restartBtn.addEventListener('click', () => {
          start();
          canvas.focus();
        });

        root.append(info, canvasWrap);
        canvasWrap.appendChild(canvas);
        setTimeout(() => {
          resize();
          canvas.focus();
        }, 100);
        return root;
      },
      size: { width: 350, height: 700 }
    },
    game2048: {
      title: '2048',
      icon: './static/icons/game_icon_176683.png',
      content: () => {
        const root = document.createElement('div');
        root.style.display = 'flex';
        root.style.flexDirection = 'column';
        root.style.gap = '12px';
        root.style.height = '100%';
        root.style.alignItems = 'center';
        root.style.justifyContent = 'center';

        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.justifyContent = 'space-between';
        info.style.alignItems = 'center';
        info.style.width = '100%';
        info.style.maxWidth = '450px';
        const score = document.createElement('div');
        score.textContent = 'Счёт: 0';
        score.style.fontWeight = 'bold';
        score.style.fontSize = '14px';
        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn';
        restartBtn.textContent = 'Новая игра';
        info.append(score, restartBtn);

        const boardWrap = document.createElement('div');
        boardWrap.style.display = 'flex';
        boardWrap.style.justifyContent = 'center';
        boardWrap.style.alignItems = 'center';
        boardWrap.style.flex = '1';
        boardWrap.style.width = '100%';

        const board = document.createElement('div');
        board.style.display = 'grid';
        board.style.gridTemplateColumns = 'repeat(4, 1fr)';
        board.style.gap = '8px';
        board.style.width = 'min(450px, 85vw)';
        board.style.height = 'min(450px, 85vw)';
        board.style.background = '#bbada0';
        board.style.padding = '8px';
        board.style.borderRadius = '8px';

        let cells = [];
        let scoreVal = 0;

        function init() {
          board.innerHTML = '';
          cells = Array(4).fill().map(() => Array(4).fill(0));
          scoreVal = 0;
          score.textContent = 'Счёт: 0';
          addRandom();
          addRandom();
          render();
        }

        function addRandom() {
          const empty = [];
          for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
              if (cells[y][x] === 0) empty.push({ x, y });
            }
          }
          if (empty.length > 0) {
            const { x, y } = empty[Math.floor(Math.random() * empty.length)];
            cells[y][x] = Math.random() < 0.9 ? 2 : 4;
          }
        }

        function render() {
          board.innerHTML = '';
          for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
              const cell = document.createElement('div');
              cell.style.width = '90px';
              cell.style.height = '90px';
              cell.style.display = 'flex';
              cell.style.alignItems = 'center';
              cell.style.justifyContent = 'center';
              cell.style.fontSize = '32px';
              cell.style.fontWeight = 'bold';
              cell.style.background = cells[y][x] === 0 ? '#cdc1b4' : '#eee4da';
              cell.style.color = cells[y][x] > 4 ? '#f9f6f2' : '#776e65';
              cell.textContent = cells[y][x] || '';
              board.appendChild(cell);
            }
          }
        }

        function move(dir) {
          let moved = false;
          const oldCells = cells.map(row => [...row]);

          if (dir === 'left' || dir === 'right') {
            cells.forEach(row => {
              const filtered = row.filter(c => c !== 0);
              const merged = [];
              for (let i = 0; i < filtered.length; i++) {
                if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
                  merged.push(filtered[i] * 2);
                  scoreVal += filtered[i] * 2;
                  i++;
                } else {
                  merged.push(filtered[i]);
                }
              }
              while (merged.length < 4) merged.push(0);
              if (dir === 'right') merged.reverse();
              row.splice(0, 4, ...merged);
            });
          } else {
            for (let x = 0; x < 4; x++) {
              const col = cells.map(row => row[x]);
              const filtered = col.filter(c => c !== 0);
              const merged = [];
              for (let i = 0; i < filtered.length; i++) {
                if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
                  merged.push(filtered[i] * 2);
                  scoreVal += filtered[i] * 2;
                  i++;
                } else {
                  merged.push(filtered[i]);
                }
              }
              while (merged.length < 4) merged.push(0);
              if (dir === 'down') merged.reverse();
              merged.forEach((val, y) => cells[y][x] = val);
            }
          }

          moved = JSON.stringify(oldCells) !== JSON.stringify(cells);
          if (moved) {
            addRandom();
            score.textContent = 'Счёт: ' + scoreVal;
            render();
          }
        }

        document.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft') move('left');
          else if (e.key === 'ArrowRight') move('right');
          else if (e.key === 'ArrowUp') move('up');
          else if (e.key === 'ArrowDown') move('down');
        });

        restartBtn.addEventListener('click', init);

        root.append(info, boardWrap);
        boardWrap.appendChild(board);
        init();
        return root;
      },
      size: { width: 500, height: 550 }
    },
    tictactoe: {
      title: 'Tic-Tac-Toe',
      icon: './static/icons/game_icon_176683.png',
      content: () => {
        const root = document.createElement('div');
        root.style.display = 'flex';
        root.style.flexDirection = 'column';
        root.style.gap = '12px';
        root.style.height = '100%';
        root.style.alignItems = 'center';
        root.style.justifyContent = 'center';

        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.justifyContent = 'space-between';
        info.style.alignItems = 'center';
        info.style.width = '100%';
        info.style.maxWidth = '400px';
        const status = document.createElement('div');
        status.textContent = 'Ход: X';
        status.style.fontWeight = 'bold';
        status.style.fontSize = '14px';
        const botBtn = document.createElement('button');
        botBtn.className = 'btn';
        botBtn.textContent = 'Вкл/Выкл бот';
        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn';
        restartBtn.textContent = 'Новая игра';
        info.append(status, botBtn, restartBtn);

        const boardWrap = document.createElement('div');
        boardWrap.style.display = 'flex';
        boardWrap.style.justifyContent = 'center';
        boardWrap.style.alignItems = 'center';
        boardWrap.style.flex = '1';
        boardWrap.style.width = '100%';

        const board = document.createElement('div');
        board.style.display = 'grid';
        board.style.gridTemplateColumns = 'repeat(3, 1fr)';
        board.style.gap = '6px';
        board.style.width = 'min(400px, 80vw)';
        board.style.height = 'min(400px, 80vw)';
        board.style.background = '#2c3e50';
        board.style.padding = '8px';
        board.style.borderRadius = '8px';

        let cells = Array(9).fill('');
        let currentPlayer = 'X';
        let gameOver = false;
        let botEnabled = false;

        function checkWin() {
          const win = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
          ];
          for (const line of win) {
            if (cells[line[0]] && cells[line[0]] === cells[line[1]] && cells[line[1]] === cells[line[2]]) {
              return cells[line[0]];
            }
          }
          return null;
        }

        function botMove() {
          const winLines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
          ];

          for (const line of winLines) {
            const [a, b, c] = line;
            if (cells[a] === 'O' && cells[b] === 'O' && !cells[c]) return c;
            if (cells[a] === 'O' && !cells[b] && cells[c] === 'O') return b;
            if (!cells[a] && cells[b] === 'O' && cells[c] === 'O') return a;
          }

          for (const line of winLines) {
            const [a, b, c] = line;
            if (cells[a] === 'X' && cells[b] === 'X' && !cells[c]) return c;
            if (cells[a] === 'X' && !cells[b] && cells[c] === 'X') return b;
            if (!cells[a] && cells[b] === 'X' && cells[c] === 'X') return a;
          }

          if (!cells[4]) return 4;
          const corners = [0, 2, 6, 8];
          const emptyCorners = corners.filter(i => !cells[i]);
          if (emptyCorners.length > 0) return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];

          const empty = [];
          for (let i = 0; i < 9; i++) if (!cells[i]) empty.push(i);
          return empty[Math.floor(Math.random() * empty.length)];
        }

        function makeMove(index) {
          if (gameOver || cells[index]) return;
          cells[index] = currentPlayer;

          const winner = checkWin();
          if (winner) {
            status.textContent = 'Победил: ' + winner;
            gameOver = true;
            render();
          } else if (cells.every(c => c)) {
            status.textContent = 'Ничья!';
            gameOver = true;
            render();
          } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            status.textContent = 'Ход: ' + currentPlayer;
            render();

            if (botEnabled && currentPlayer === 'O' && !gameOver) {
              setTimeout(() => {
                const move = botMove();
                makeMove(move);
              }, 300);
            }
          }
        }

        function render() {
          board.innerHTML = '';
          cells.forEach((cell, i) => {
            const btn = document.createElement('button');
            btn.style.width = '100%';
            btn.style.height = '100%';
            btn.style.aspectRatio = '1';
            btn.style.fontSize = 'clamp(32px, 8vw, 64px)';
            btn.style.fontWeight = 'bold';
            btn.style.border = 'none';
            btn.style.borderRadius = '6px';
            btn.style.background = cell ? '#34495e' : '#ecf0f1';
            btn.style.color = cell === 'X' ? '#e74c3c' : '#3498db';
            btn.style.cursor = gameOver || cell ? 'default' : 'pointer';
            btn.style.transition = 'all 0.2s';
            btn.textContent = cell;
            btn.addEventListener('click', () => {
              if (!botEnabled || currentPlayer === 'X') {
                makeMove(i);
              }
            });
            board.appendChild(btn);
          });
        }

        botBtn.addEventListener('click', () => {
          botEnabled = !botEnabled;
          botBtn.textContent = botEnabled ? 'Выкл бот' : 'Вкл бот';
          if (botEnabled && currentPlayer === 'O' && !gameOver) {
            setTimeout(() => {
              const move = botMove();
              makeMove(move);
            }, 300);
          }
        });

        restartBtn.addEventListener('click', () => {
          cells = Array(9).fill('');
          currentPlayer = 'X';
          gameOver = false;
          status.textContent = 'Ход: X';
          render();
        });

        root.append(info, boardWrap);
        boardWrap.appendChild(board);
        render();
        return root;
      },
      size: { width: 450, height: 500 }
    },
    minesweeper: {
      title: 'Minesweeper',
      icon: './static/icons/game_icon_176683.png',
      content: () => {
        const root = document.createElement('div');
        root.style.display = 'flex';
        root.style.flexDirection = 'column';
        root.style.gap = '12px';
        root.style.height = '100%';
        root.style.alignItems = 'center';
        root.style.justifyContent = 'center';

        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.justifyContent = 'space-between';
        info.style.alignItems = 'center';
        info.style.width = '100%';
        info.style.maxWidth = '400px';
        const status = document.createElement('div');
        status.textContent = 'Сапёр';
        status.style.fontWeight = 'bold';
        status.style.fontSize = '14px';
        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn';
        restartBtn.textContent = 'Новая игра';
        info.append(status, restartBtn);

        const boardWrap = document.createElement('div');
        boardWrap.style.display = 'flex';
        boardWrap.style.justifyContent = 'center';
        boardWrap.style.alignItems = 'center';
        boardWrap.style.flex = '1';
        boardWrap.style.width = '100%';

        const board = document.createElement('div');
        board.style.display = 'grid';
        board.style.gridTemplateColumns = 'repeat(10, 1fr)';
        board.style.gap = '2px';
        board.style.width = 'min(400px, 90vw)';
        board.style.height = 'min(400px, 90vw)';

        let grid = [];
        let revealed = [];
        let gameOver = false;

        function init() {
          grid = Array(10).fill().map(() => Array(10).fill(0));
          revealed = Array(10).fill().map(() => Array(10).fill(false));
          gameOver = false;
          status.textContent = 'Сапёр';

          for (let i = 0; i < 15; i++) {
            let x, y;
            do {
              x = Math.floor(Math.random() * 10);
              y = Math.floor(Math.random() * 10);
            } while (grid[y][x] === -1);
            grid[y][x] = -1;
          }

          for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
              if (grid[y][x] !== -1) {
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -1; dx <= 1; dx++) {
                    if (y + dy >= 0 && y + dy < 10 && x + dx >= 0 && x + dx < 10) {
                      if (grid[y + dy][x + dx] === -1) count++;
                    }
                  }
                }
                grid[y][x] = count;
              }
            }
          }

          render();
        }

        function reveal(x, y) {
          if (gameOver || revealed[y][x]) return;
          revealed[y][x] = true;

          if (grid[y][x] === -1) {
            gameOver = true;
            status.textContent = 'Игра окончена!';
            render();
            return;
          }

          if (grid[y][x] === 0) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (y + dy >= 0 && y + dy < 10 && x + dx >= 0 && x + dx < 10) {
                  if (!revealed[y + dy][x + dx]) reveal(x + dx, y + dy);
                }
              }
            }
          }

          render();
        }

        function render() {
          board.innerHTML = '';
          for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
              const cell = document.createElement('div');
              cell.style.width = '28px';
              cell.style.height = '28px';
              cell.style.display = 'flex';
              cell.style.alignItems = 'center';
              cell.style.justifyContent = 'center';
              cell.style.fontSize = '12px';
              cell.style.fontWeight = 'bold';
              cell.style.cursor = 'pointer';

              if (revealed[y][x] || gameOver) {
                if (grid[y][x] === -1) {
                  cell.style.background = '#f00';
                  cell.textContent = '💣';
                } else {
                  cell.style.background = '#ddd';
                  cell.textContent = grid[y][x] || '';
                  cell.style.color = grid[y][x] === 1 ? '#00f' : grid[y][x] === 2 ? '#0a0' : '#f00';
                }
              } else {
                cell.style.background = '#888';
                cell.addEventListener('click', () => reveal(x, y));
              }

              board.appendChild(cell);
            }
          }
        }

        restartBtn.addEventListener('click', init);

        root.append(info, boardWrap);
        boardWrap.appendChild(board);
        init();
        return root;
      },
      size: { width: 450, height: 500 }
    },
    pong: {
      title: 'Pong',
      icon: './static/icons/game_icon_176683.png',
      content: () => {
        const root = document.createElement('div');
        root.style.display = 'grid';
        root.style.gridTemplateRows = 'auto 1fr';
        root.style.gap = '8px';

        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.justifyContent = 'space-between';
        info.style.alignItems = 'center';
        info.style.width = '100%';
        info.style.maxWidth = '700px';
        const score = document.createElement('div');
        score.textContent = 'Игрок: 0 | Компьютер: 0 | Стрелки вверх/вниз или мышь';
        score.style.fontWeight = 'bold';
        score.style.fontSize = '14px';
        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn';
        restartBtn.textContent = 'Старт';
        info.append(score, restartBtn);

        const canvasWrap = document.createElement('div');
        canvasWrap.style.display = 'flex';
        canvasWrap.style.justifyContent = 'center';
        canvasWrap.style.alignItems = 'center';
        canvasWrap.style.flex = '1';
        canvasWrap.style.width = '100%';

        const canvas = document.createElement('canvas');
        canvas.style.width = 'min(700px, 95vw)';
        canvas.style.height = 'min(500px, 70vh)';
        canvas.style.background = '#000';
        canvas.style.borderRadius = '12px';
        canvas.style.border = '2px solid rgba(255,255,255,0.2)';
        canvas.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        canvas.tabIndex = 0;
        canvas.style.outline = 'none';

        let ctx, player = { y: 200, h: 100, speed: 7 }, ai = { y: 200, h: 100 };
        let ball = { x: 350, y: 250, vx: 5, vy: 3, size: 10 };
        let playerScore = 0, aiScore = 0;
        let gameRunning = false, gameLoop;
        let keys = { ArrowUp: false, ArrowDown: false };

        function resize() {
          const w = Math.min(canvasWrap.clientWidth - 20, 700);
          const h = Math.min(canvasWrap.clientHeight - 20, 500);
          canvas.width = w;
          canvas.height = h;
          ctx = canvas.getContext('2d');
          if (!gameRunning) {
            player.y = h / 2 - player.h / 2;
            ai.y = h / 2 - ai.h / 2;
            ball.x = w / 2;
            ball.y = h / 2;
          }
          draw();
        }
        new ResizeObserver(resize).observe(canvasWrap);

        function draw() {
          if (!ctx) return;
          const w = canvas.width;
          const h = canvas.height;

          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, w, h);

          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.setLineDash([10, 10]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(w / 2, 0);
          ctx.lineTo(w / 2, h);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#4CAF50';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#4CAF50';
          ctx.fillRect(15, player.y, 12, player.h);

          ctx.fillStyle = '#F44336';
          ctx.shadowColor = '#F44336';
          ctx.fillRect(w - 27, ai.y, 12, ai.h);

          ctx.fillStyle = '#FFF';
          ctx.shadowColor = '#FFF';
          ctx.shadowBlur = 5;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
        }

        function update() {
          if (!gameRunning) return;

          if (keys.ArrowUp && player.y > 0) {
            player.y -= player.speed;
          }
          if (keys.ArrowDown && player.y + player.h < canvas.height) {
            player.y += player.speed;
          }

          ball.x += ball.vx;
          ball.y += ball.vy;

          if (ball.y <= ball.size || ball.y >= canvas.height - ball.size) {
            ball.vy *= -1;
            ball.y = Math.max(ball.size, Math.min(canvas.height - ball.size, ball.y));
          }

          if (ball.x - ball.size <= 27 && ball.y >= player.y && ball.y <= player.y + player.h) {
            const hitPos = (ball.y - player.y) / player.h;
            ball.vx = Math.abs(ball.vx) * 1.05;
            ball.vy = (hitPos - 0.5) * 8;
            ball.x = 27 + ball.size;
          }

          if (ball.x + ball.size >= canvas.width - 27 && ball.y >= ai.y && ball.y <= ai.y + ai.h) {
            const hitPos = (ball.y - ai.y) / ai.h;
            ball.vx = -Math.abs(ball.vx) * 1.05;
            ball.vy = (hitPos - 0.5) * 8;
            ball.x = canvas.width - 27 - ball.size;
          }

          const aiCenter = ai.y + ai.h / 2;
          const targetY = ball.y - ai.h / 2;
          if (aiCenter < targetY - 5) {
            ai.y = Math.min(targetY, canvas.height - ai.h);
          } else if (aiCenter > targetY + 5) {
            ai.y = Math.max(targetY, 0);
          }

          if (ball.x < 0) {
            aiScore++;
            reset();
          } else if (ball.x > canvas.width) {
            playerScore++;
            reset();
          }

          score.textContent = `Игрок: ${playerScore} | Компьютер: ${aiScore} | Стрелки вверх/вниз или мышь`;
          draw();
        }

        function reset() {
          ball.x = canvas.width / 2;
          ball.y = canvas.height / 2;
          ball.vx = (Math.random() < 0.5 ? -1 : 1) * 5;
          ball.vy = (Math.random() - 0.5) * 4;
        }

        function start() {
          playerScore = 0;
          aiScore = 0;
          score.textContent = 'Игрок: 0 | Компьютер: 0 | Стрелки вверх/вниз или мышь';
          player.y = canvas.height / 2 - player.h / 2;
          ai.y = canvas.height / 2 - ai.h / 2;
          reset();
          gameRunning = true;
          clearInterval(gameLoop);
          gameLoop = setInterval(update, 16);
          draw();
        }

        function handleKeyDown(e) {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            keys[e.key] = true;
          }
        }

        function handleKeyUp(e) {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            keys[e.key] = false;
          }
        }

        canvas.addEventListener('keydown', handleKeyDown);
        canvas.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('mousemove', (e) => {
          const rect = canvas.getBoundingClientRect();
          player.y = e.clientY - rect.top - player.h / 2;
          if (player.y < 0) player.y = 0;
          if (player.y + player.h > canvas.height) player.y = canvas.height - player.h;
        });
        canvas.addEventListener('click', () => canvas.focus());
        restartBtn.addEventListener('click', () => {
          start();
          canvas.focus();
        });

        root.append(info, canvasWrap);
        canvasWrap.appendChild(canvas);
        setTimeout(() => {
          resize();
          canvas.focus();
        }, 100);
        return root;
      },
      size: { width: 800, height: 500 }
    },
    labyrinth: {
      title: 'Labyrinth',
      icon: './static/icons/game_icon_176683.png',
      content: () => {
        const { root, info, canvasWrap } = gameContainer();

        const timer = document.createElement('div');
        timer.textContent = 'Время: 0';
        timer.style.fontWeight = 'bold';
        timer.style.fontSize = '16px';
        timer.style.color = '#fff';

        const status = document.createElement('div');
        status.textContent = 'Используйте стрелки или WASD для движения';
        status.style.fontSize = '14px';
        status.style.color = '#fff';

        const restartBtn = btn('Новая игра', () => {
          init();
          canvas.focus();
        });

        info.appendChild(timer);
        info.appendChild(status);
        info.appendChild(restartBtn);

        const canvas = canvasEl(600, 600, {
          background: '#1a1a2e',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        });

        let ctx, maze = [], cellSize = 0, cols = 0, rows = 0;
        let player = { x: 0, y: 0 };
        let exit = { x: 0, y: 0 };
        let timeLeft = 0;
        let gameRunning = false;
        let gameTimer = null;
        let gameLoop = null;

        function resize() {
          const w = Math.min(canvasWrap.clientWidth - 20, 600);
          const h = Math.min(canvasWrap.clientHeight - 20, 600);
          canvas.width = w;
          canvas.height = h;
          ctx = canvas.getContext('2d');
          cols = Math.floor(w / 30);
          rows = Math.floor(h / 30);
          cellSize = Math.min(w / cols, h / rows);
          if (maze.length > 0) draw();
        }
        new ResizeObserver(resize).observe(canvasWrap);

        function generateMaze() {
          maze = Array(rows).fill().map(() => Array(cols).fill(1));
          const visited = Array(rows).fill().map(() => Array(cols).fill(false));

          function carve(x, y) {
            visited[y][x] = true;
            maze[y][x] = 0;

            const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]];
            directions.sort(() => Math.random() - 0.5);

            for (const [dx, dy] of directions) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited[ny][nx]) {
                maze[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
              }
            }
          }

          carve(1, 1);

          player.x = 1;
          player.y = 1;
          exit.x = cols - 2;
          exit.y = rows - 2;
          maze[exit.y][exit.x] = 0;

          const queue = [[player.x, player.y]];
          const reachable = Array(rows).fill().map(() => Array(cols).fill(false));
          reachable[player.y][player.x] = true;

          while (queue.length > 0) {
            const [x, y] = queue.shift();
            for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < cols && ny >= 0 && ny < rows &&
                maze[ny][nx] === 0 && !reachable[ny][nx]) {
                reachable[ny][nx] = true;
                queue.push([nx, ny]);
              }
            }
          }

          if (!reachable[exit.y][exit.x]) {
            for (let y = rows - 3; y >= rows - 5; y--) {
              for (let x = cols - 3; x >= cols - 5; x--) {
                if (maze[y][x] === 0 && reachable[y][x]) {
                  exit.x = x;
                  exit.y = y;
                  break;
                }
              }
              if (reachable[exit.y][exit.x]) break;
            }
          }
        }

        function checkDeadEnd() {
          if (player.x === 1 && player.y === 1) return false;

          let moves = 0;
          for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
            const nx = player.x + dx;
            const ny = player.y + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] === 0) {
              moves++;
            }
          }
          return moves === 1 && (player.x !== exit.x || player.y !== exit.y);
        }

        function showScreamer() {
          gameRunning = false;
          clearInterval(gameTimer);
          clearInterval(gameLoop);

          const screamer = document.createElement('div');
          screamer.style.position = 'fixed';
          screamer.style.top = '0';
          screamer.style.left = '0';
          screamer.style.width = '100vw';
          screamer.style.height = '100vh';
          screamer.style.zIndex = '99999';
          screamer.style.background = '#000';
          screamer.style.display = 'flex';
          screamer.style.alignItems = 'center';
          screamer.style.justifyContent = 'center';

          const img = document.createElement('img');
          img.src = screamerPath;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          img.style.objectFit = 'contain';
          img.onerror = () => {
            screamer.innerHTML = '<div style="color: #fff; font-size: 48px; text-align: center;">СКРИМЕР!<br>Путь к изображению: ' + screamerPath + '</div>';
          };

          screamer.appendChild(img);
          document.body.appendChild(screamer);

          setTimeout(() => {
            document.body.removeChild(screamer);
            status.textContent = 'Игра окончена! Нажмите "Новая игра"';
          }, 3000);
        }

        function draw() {
          if (!ctx) return;
          const w = canvas.width;
          const h = canvas.height;

          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, w, h);

          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              if (maze[y][x] === 1) {
                ctx.fillStyle = '#16213e';
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
              }
            }
          }
          ctx.fillStyle = '#4caf50';
          ctx.fillRect(exit.x * cellSize + 2, exit.y * cellSize + 2, cellSize - 4, cellSize - 4);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('В', exit.x * cellSize + cellSize / 2, exit.y * cellSize + cellSize / 2);

          ctx.fillStyle = '#f44336';
          ctx.beginPath();
          ctx.arc(player.x * cellSize + cellSize / 2, player.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        function update() {
          if (!gameRunning) return;

          if (player.x === exit.x && player.y === exit.y) {
            gameRunning = false;
            clearInterval(gameTimer);
            clearInterval(gameLoop);
            status.textContent = 'Победа! Вы прошли лабиринт!';
            status.textContent = alert('Победа! Вы прошли лабиринт!');
            return;
          }

          if (checkDeadEnd()) {
            showScreamer();
            return;
          }

          draw();
        }

        function init() {
          resize();
          generateMaze();
          timeLeft = Math.floor(Math.random() * 41) + 20;
          gameRunning = true;
          status.textContent = 'Используйте стрелки или WASD для движения';

          clearInterval(gameTimer);
          clearInterval(gameLoop);

          gameTimer = setInterval(() => {
            timeLeft--;
            timer.textContent = 'Время: ' + timeLeft;
            if (timeLeft <= 0) {
              showScreamer();
            }
          }, 1000);

          gameLoop = setInterval(update, 16);
          draw();
        }

        canvas.addEventListener('keydown', (e) => {
          if (!gameRunning) return;

          let newX = player.x;
          let newY = player.y;

          if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            newY--;
          } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            newY++;
          } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            newX--;
          } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            newX++;
          } else {
            return;
          }

          if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && maze[newY][newX] === 0) {
            player.x = newX;
            player.y = newY;
            update();
          }
        });

        canvas.addEventListener('click', () => canvas.focus());

        root.append(info, canvasWrap);
        canvasWrap.appendChild(canvas);
        setTimeout(() => {
          init();
          canvas.focus();
        }, 100);
        return root;
      },
      size: { width: 650, height: 700 }
    },
    games: {
      title: 'Games',
      icon: './static/icons/game_icon_176683.png',
      content: () => {
        const root = document.createElement('div');
        root.style.display = 'flex';
        root.style.flexDirection = 'column';
        root.style.gap = '16px';
        root.style.height = '100%';
        root.style.padding = '16px';
        root.style.overflow = 'auto';

        const header = document.createElement('div');
        header.style.fontSize = '24px';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '8px';
        header.textContent = 'Игры';

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '16px';
        grid.style.width = '100%';
        grid.style.maxWidth = '800px';

        const games = [
          { id: 'snake', title: 'Snake' },
          { id: 'chess', title: 'Chess' },
          { id: 'checkers', title: 'Checkers' },
          { id: 'tetris', title: 'Tetris' },
          { id: 'game2048', title: '2048' },
          { id: 'tictactoe', title: 'Tic-Tac-Toe' },
          { id: 'minesweeper', title: 'Minesweeper' },
          { id: 'pong', title: 'Pong' },
          { id: 'labyrinth', title: 'Labyrinth' }
        ];

        games.forEach(game => {
          const card = document.createElement('div');
          card.style.display = 'flex';
          card.style.flexDirection = 'column';
          card.style.alignItems = 'center';
          card.style.justifyContent = 'center';
          card.style.padding = '24px';
          card.style.background = 'rgba(255, 255, 255, 0.05)';
          card.style.border = '1px solid rgba(255, 255, 255, 0.1)';
          card.style.borderRadius = '12px';
          card.style.cursor = 'pointer';
          card.style.transition = 'all 0.2s';
          card.style.minHeight = '140px';

          card.addEventListener('mouseenter', () => {
            card.style.background = 'rgba(255, 255, 255, 0.1)';
            card.style.transform = 'translateY(-2px)';
          });

          card.addEventListener('mouseleave', () => {
            card.style.background = 'rgba(255, 255, 255, 0.05)';
            card.style.transform = 'translateY(0)';
          });

          const icon = document.createElement('img');
          icon.src = './static/icons/game_icon_176683.png';
          icon.style.width = '64px';
          icon.style.height = '64px';
          icon.style.marginBottom = '12px';

          const title = document.createElement('div');
          title.textContent = game.title;
          title.style.fontSize = '16px';
          title.style.fontWeight = '600';
          title.style.textAlign = 'center';

          card.appendChild(icon);
          card.appendChild(title);

          card.addEventListener('click', () => {
            const event = new CustomEvent('launch-game', { detail: { gameId: game.id } });
            window.dispatchEvent(event);
          });

          grid.appendChild(card);
        });

        root.appendChild(header);
        root.appendChild(grid);
        return root;
      },
      size: { width: 900, height: 700 }
    },
    editor: {
      title: 'Photo Editor',
      icon: './static/icons/slice.jpg',
      size: { width: 900, height: 620 },
      content: () => {
        function el(tag, styles = {}) {
          const e = document.createElement(tag);
          Object.assign(e.style, styles);
          return e;
        }
        function btn(text) {
          const b = document.createElement('button');
          b.textContent = text;
          return b;
        }
        function txt(content) {
          const span = document.createElement('span');
          span.textContent = content;
          return span;
        }

        const root = el('div', { display: 'grid', gridTemplateRows: 'auto 1fr', gap: '8px', width: '100%', height: '100%' });

        const toolbar = el('div', { display: 'flex', gap: '8px', alignItems: 'center' });
        const loadBtn = btn('Загрузить');
        const saveBtn = btn('Сохранить');
        const resetBtn = btn('Сброс');
        const rotateBtn = btn('↻ 90°');
        const cropBtn = btn('Вырезать');

        const brightness = el('input'); brightness.type = 'range'; brightness.min = '50'; brightness.max = '150'; brightness.value = '100';
        const contrast = el('input'); contrast.type = 'range'; contrast.min = '50'; contrast.max = '150'; contrast.value = '100';
        const saturate = el('input'); saturate.type = 'range'; saturate.min = '0'; saturate.max = '200'; saturate.value = '100';

        const fileInput = el('input'); fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';

        toolbar.append(loadBtn, saveBtn, resetBtn, rotateBtn, cropBtn,
          txt('B'), brightness,
          txt('C'), contrast,
          txt('S'), saturate,
          fileInput
        );

        const canvas = el('canvas', { background: 'rgba(0,0,0,0.15)', borderRadius: '8px', width: '100%', height: '100%' });
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        let ctx, img = null, rotation = 0;
        const filters = { brightness: 100, contrast: 100, saturate: 100 };

        let isCropping = false;
        let cropStart = null;
        let cropEnd = null;

        const resize = () => {
          const rect = canvas.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          canvas.width = Math.floor(rect.width * dpr);
          canvas.height = Math.floor(rect.height * dpr);
          ctx = canvas.getContext('2d');
          ctx.scale(dpr, dpr);
          draw();
        };
        new ResizeObserver(resize).observe(canvas);

        const draw = () => {
          if (!ctx) return;
          const r = canvas.getBoundingClientRect();
          ctx.clearRect(0, 0, r.width, r.height);
          if (!img) return;

          ctx.save();
          ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`;
          ctx.translate(r.width / 2, r.height / 2);
          ctx.rotate(rotation * Math.PI / 180);
          const scale = Math.min(r.width / img.width, r.height / img.height);
          ctx.scale(scale, scale);
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          ctx.restore();

          if (cropStart && cropEnd && isCropping) {
            ctx.save();
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6]);
            ctx.strokeRect(cropStart.x, cropStart.y, cropEnd.x - cropStart.x, cropEnd.y - cropStart.y);
            ctx.restore();
          }
        };

        loadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', e => {
          const file = e.target.files[0];
          if (!file) return;
          const fr = new FileReader();
          fr.onload = ev => {
            img = new Image();
            img.onload = draw;
            img.src = ev.target.result;
          };
          fr.readAsDataURL(file);
        });

        saveBtn.addEventListener('click', () => {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');

          const wasCropping = isCropping;
          isCropping = false;
          draw();
          tempCtx.drawImage(canvas, 0, 0);
          isCropping = wasCropping;

          const link = document.createElement('a');
          link.download = '.png';
          link.href = tempCanvas.toDataURL('image/png');
          link.click();
        });

        resetBtn.addEventListener('click', () => {
          filters.brightness = 100;
          filters.contrast = 100;
          filters.saturate = 100;
          rotation = 0;
          brightness.value = 100;
          contrast.value = 100;
          saturate.value = 100;
          cropStart = null;
          cropEnd = null;
          isCropping = false;
          draw();
        });

        rotateBtn.addEventListener('click', () => {
          rotation = (rotation + 90) % 360;
          draw();
        });

        brightness.addEventListener('input', e => { filters.brightness = e.target.value; draw(); });
        contrast.addEventListener('input', e => { filters.contrast = e.target.value; draw(); });
        saturate.addEventListener('input', e => { filters.saturate = e.target.value; draw(); });

        cropBtn.addEventListener('click', () => {
          isCropping = !isCropping;
          if (!isCropping) {
            cropStart = null;
            cropEnd = null;
            draw();
          }
        });

        canvas.addEventListener('mousedown', e => {
          if (!isCropping) return;
          const rect = canvas.getBoundingClientRect();
          cropStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          cropEnd = null;
        });

        canvas.addEventListener('mousemove', e => {
          if (!isCropping || !cropStart) return;
          const rect = canvas.getBoundingClientRect();
          cropEnd = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          draw();
        });

        canvas.addEventListener('mouseup', e => {
          if (!isCropping || !cropStart || !cropEnd) return;
          const rect = canvas.getBoundingClientRect();
          const x = Math.min(cropStart.x, cropEnd.x);
          const y = Math.min(cropStart.y, cropEnd.y);
          const w = Math.abs(cropEnd.x - cropStart.x);
          const h = Math.abs(cropEnd.y - cropStart.y);

          if (w < 10 || h < 10) {
            cropStart = null;
            cropEnd = null;
            draw();
            return;
          }
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = w;
          tempCanvas.height = h;
          const tempCtx = tempCanvas.getContext('2d');

          const wasCropping = isCropping;
          isCropping = false;
          draw();
          tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
          isCropping = wasCropping;

          img = new Image();
          img.onload = () => {
            cropStart = null;
            cropEnd = null;
            isCropping = false;
            draw();
          };
          img.src = tempCanvas.toDataURL('image/png');
        });

        root.append(toolbar, canvas);
        return root;
      }
    }

  };

  const startSearchInput = startMenu?.querySelector('.start-search input');
  if (startSearchInput) {
    startSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const apps = startMenu.querySelectorAll('.start-app');
      apps.forEach(app => {
        const title = app.querySelector('span')?.textContent.toLowerCase() || '';
        const appId = app.getAttribute('data-launch') || '';
        if (query === '' || title.includes(query) || appId.includes(query)) {
          app.style.display = '';
        } else {
          app.style.display = 'none';
        }
      });
    });
  }

  const startRecent = document.createElement('div');
  startRecent.id = 'start-recent';
  startRecent.className = 'start-recent';
  if (startMenu) {
    startMenu.appendChild(startRecent);
  }

  const getRecent = () => {
    const s = loadSettings();
    return Array.isArray(s.recentApps) ? s.recentApps.slice(0, 2) : [];
  };

  const setRecent = (list) => {
    saveSettings({ recentApps: list.slice(0, 2) });
  };

  const renderRecent = () => {
    if (!startRecent) return;
    startRecent.innerHTML = '';
    const ids = getRecent();
    ids.forEach((id) => {
      const app = appRegistry[id];
      if (!app) return;
      const btn = document.createElement('button');
      btn.className = 'start-app';
      btn.setAttribute('data-launch', id);
      btn.innerHTML = `<img src="${app.icon}" alt="${app.title}" /><span>${app.title}</span>`;
      btn.addEventListener('click', () => launch(id));
      startRecent.appendChild(btn);
    });
  };
  renderRecent();

  const recentAppsKey = 'recent_apps';
  const getRecentApps = () => {
    const data = localStorage.getItem(recentAppsKey);
    return data ? JSON.parse(data) : [];
  };

  const addRecentApp = (appId) => {
    let recent = getRecentApps();
    recent = recent.filter(id => id !== appId);
    recent.unshift(appId);
    recent = recent.slice(0, 8);
    localStorage.setItem(recentAppsKey, JSON.stringify(recent));
    renderRecentApps();
  };

  const renderRecentApps = () => {
    const recentContainer = document.getElementById('taskbar-recent');
    if (!recentContainer) return;

    recentContainer.innerHTML = '';
    const recent = getRecentApps();

    if (recent.length === 0) return;

    const recentTitle = el('div', {
      fontSize: '11px',
      fontWeight: 'bold',
      marginBottom: '6px',
      color: '#aaa',
      paddingLeft: '8px'
    }, 'Recently opened');

    recentContainer.appendChild(recentTitle);

    recent.forEach(appId => {
      const app = appRegistry[appId];
      if (!app) return;

      const btn = el('div', {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        marginBottom: '4px',
        background: 'rgba(100, 150, 255, 0.1)',
        borderRadius: '4px',
        cursor: 'pointer',
        border: '1px solid rgba(100, 150, 255, 0.2)',
        transition: '0.2s'
      });

      btn.addEventListener('mouseover', () => {
        btn.style.background = 'rgba(100, 150, 255, 0.2)';
      });

      btn.addEventListener('mouseout', () => {
        btn.style.background = 'rgba(100, 150, 255, 0.1)';
      });

      btn.addEventListener('click', () => {
        launch(appId);
      });

      const icon = el('img');
      icon.src = app.icon;
      icon.style.width = '20px';
      icon.style.height = '20px';
      icon.style.borderRadius = '3px';

      const label = el('div', { fontSize: '12px', flex: '1' }, app.title);

      btn.append(icon, label);
      recentContainer.appendChild(btn);
    });
  };

  function launch(appId) {
    if (!appId) {
      console.warn('Launch: appId is missing');
      return;
    }
    if (!appRegistry[appId]) {
      console.warn(`Launch: app "${appId}" not found in appRegistry`);
      return;
    }
    desktopManager.toggleStartMenu(false);
    addRecentApp(appId);
    const windowId = windowManager.createWindow(appId, appRegistry);
    if (!windowId) {
      console.warn(`Launch: failed to create window for "${appId}"`);
    }
  }

  window.addEventListener('launch-game', (e) => {
    const gameId = e.detail.gameId;
    launch(gameId);
  });

  const windowsLogo = document.querySelector('.windows_logo');
  if (windowsLogo) {
    windowsLogo.addEventListener('click', (e) => {
      e.stopPropagation();
      desktopManager.toggleStartMenu();
    });
  }

  taskbarCenter.addEventListener('click', (e) => {
    if (e.target.closest('.taskbar-clock') || e.target.closest('.taskbar-icon')) {
      return;
    }
    if (e.target === taskbarCenter || e.target.closest('.taskbar-center')) {
      desktopManager.toggleStartMenu();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Meta' || (e.key.toLowerCase() === 'r' && (e.ctrlKey || e.metaKey))) {
      return;
    }
    if (e.key === 'Escape') desktopManager.toggleStartMenu(false);
    if (e.key === 'Meta' || e.key === 'Super') {
      desktopManager.toggleStartMenu();
    }
    if (e.key.toLowerCase() === 'w' && (e.ctrlKey || e.metaKey)) {
      const focused = document.querySelector('.window.focused');
      if (focused) focused.querySelector('.wc-btn.close')?.click();
    }
  });

  document.addEventListener('click', (e) => {
    const path = e.composedPath?.() || [];
    const clickedStartMenu = path.includes(startMenu);

    if (!clickedStartMenu) {
      desktopManager.toggleStartMenu(false);
    }
  });
  document.addEventListener('click', (e) => {
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
      return;
    }
    const btn = e.target.closest('[data-launch]');
    if (!btn) return;

    const appId = btn.getAttribute('data-launch');
    if (!appId) return;

    if (btn.closest('#start-menu')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      launch(appId);
      return;
    }
  }, true);

  document.addEventListener('click', (e) => {
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
      return;
    }
    const btn = e.target.closest('[data-launch]');
    if (!btn) return;
    const appId = btn.getAttribute('data-launch');
    if (!appId) return;

    if (!btn.closest('#start-menu') && btn.closest('.desktop-icons')) {
      e.preventDefault();
      e.stopPropagation();
      try { btn.dataset._lastLaunched = String(Date.now()); } catch { }
      launch(appId);
    }
  });
  document.addEventListener('dblclick', (e) => {
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
      return;
    }

    const btn = e.target.closest('[data-launch]');
    if (!btn) return;

    const appId = btn.getAttribute('data-launch');
    if (!appId) return;

    if (!btn.closest('#start-menu')) {
      const last = parseInt(btn.dataset._lastLaunched || '0', 10);
      if (Date.now() - last < 600) return;
      e.preventDefault();
      e.stopPropagation();
      launch(appId);
    }
  });

  let welcomeStep = 1;
  let userName = '';
  let userLanguage = 'ru';

  function getUserData() {
    try {
      const userData = localStorage.getItem('user');
      const jsonData = localStorage.getItem('user_json');
      if (userData) {
        return JSON.parse(userData);
      }
      if (jsonData) {
        return JSON.parse(jsonData);
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
    return null;
  }

  function saveUserData(name, language) {
    const userData = {
      name: name,
      language: language,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('user_json', JSON.stringify(userData));
    return userData;
  }

  function showWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.classList.remove('hidden');
    }
  }

  function hideWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.classList.add('hidden');
      welcomeScreen.style.display = 'none';
      welcomeScreen.style.pointerEvents = 'none';
      welcomeScreen.style.visibility = 'hidden';
    }
  }

  function showStep(stepNum) {
    for (let i = 1; i <= 3; i++) {
      const step = document.getElementById(`welcome-step-${i}`);
      if (step) {
        if (i === stepNum) {
          step.classList.remove('hidden');
        } else {
          step.classList.add('hidden');
        }
      }
    }
  }

  window.welcomeNext = function () {
    if (welcomeStep === 1) {
      const nameInput = document.getElementById('welcome-name-input');
      if (nameInput && nameInput.value.trim()) {
        userName = nameInput.value.trim();
        welcomeStep = 2;
        showStep(2);
        const greeting = document.getElementById('welcome-greeting');
        if (greeting) {
          greeting.textContent = `hello, ${userName}`;
        }
      } else {
        alert('Please enter your name');
      }
    }
  };

  window.selectLanguage = function (lang) {
    userLanguage = lang;
    const ruBtn = document.getElementById('welcome-lang-ru');
    const engBtn = document.getElementById('welcome-lang-eng');
    if (ruBtn && engBtn) {
      if (lang === 'ru') {
        ruBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        ruBtn.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        engBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        engBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      } else {
        engBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        engBtn.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        ruBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        ruBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }
    }
    setTimeout(() => {
      welcomeStep = 3;
      showStep(3);
    }, 300);
  };

  window.welcomeFinish = function () {
    saveUserData(userName, userLanguage);
    if (userLanguage === 'eng') {
      const script = document.createElement('script');
      script.src = './static/lang-eng.js';
      script.onload = () => {
        if (window.loadEnglishTranslations) {
          window.loadEnglishTranslations();
        }
      };
      document.head.appendChild(script);
    }
    hideWelcomeScreen();
    updateWelcomeText();
  };

  function updateWelcomeText() {
    const userData = getUserData();
    if (userData && userData.name) {
      const welcomeTextEl = document.getElementById('welcome-user-text');
      if (welcomeTextEl) {
        welcomeTextEl.textContent = `Welcome ${userData.name}`;
      }
    }
  }
  window.getUserData = getUserData;
  function loadUserLanguage() {
    const existingUserData = getUserData();
    if (existingUserData && existingUserData.language === 'eng') {
      if (!document.querySelector('script[src="./static/lang-eng.js"]')) {
        const script = document.createElement('script');
        script.src = './static/lang-eng.js';
        script.onload = () => {
          if (window.loadEnglishTranslations) {
            window.loadEnglishTranslations();
          }
        };
        document.head.appendChild(script);
      } else if (window.loadEnglishTranslations) {
        window.loadEnglishTranslations();
      }
    }
  }

  const existingUserData = getUserData();
  if (existingUserData && existingUserData.name) {
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.classList.add('hidden');
      welcomeScreen.style.display = 'none';
      welcomeScreen.style.pointerEvents = 'none';
      welcomeScreen.style.visibility = 'hidden';
    }
    loadUserLanguage();
    updateWelcomeText();
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          showWelcomeScreen();
          showStep(1);
        }, 100);
      });
    } else {
      setTimeout(() => {
        showWelcomeScreen();
        showStep(1);
      }, 100);
    }
  }
});

function startLoadingAnimation() {
  const loadingScreen = document.getElementById('loading-screen');
  const loadingText = document.getElementById('loadingText');
  const loadingDetails = document.getElementById('loadingDetails');
  const loadingProgress = document.getElementById('loadingProgress');

  if (!loadingScreen) {
    console.error('Элемент loading-screen не найден!');
    return;
  }

  let percentElement = document.getElementById('loading-percent');
  if (!percentElement) {
    percentElement = document.createElement('div');
    percentElement.id = 'loading-percent';
    percentElement.style.cssText = `
            font-size: 32px;
            font-weight: 300;
            margin: 30px 0;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
            font-family: 'Segoe UI', Arial, sans-serif;
            color: white;
        `;
    loadingScreen.appendChild(percentElement);
  }
  const windows8Loader = document.querySelector('.windows8') || createWindows8Loader();
  windows8Loader.style.display = 'block';

  let currentPhase = 0;
  let dotsInterval;
  let currentPercent = 0;
  const totalTime = 33000;

  const phases = [
    {
      duration: 25000,
      startPercent: 0,
      endPercent: 70,
      title: "Загрузка",
      messages: [
        "Настройка основного js ...",
        "Загрузка кода ...",
        "Настройка основного css ...",
        "Проверка на наличие ошибок ...",
        "Загрузка библиотек...",
        "Добавление имени в Базу данных",
        "подготовка app.js к проверке",
        "Подготовка пользовательского интерфейса...",
        "проверка на человека",
        ""
      ],
      detail: "Подготовка к работе"
    },
    {
      duration: 8000,
      startPercent: 70,
      endPercent: 90,
      title: "Читаем код app.js и appRegistry",
      messages: [
        "Проверка explorer...",
        "Проверка notepad ...",
        "Проверка сalculator ...",
        "Проверка paint...",
        "Проверка browser ...",
        "Проверка clash...",
        "Проверка vscode...",
        "Проверка music ...",
        "Проверка settings ...",
        "Проверка snake ...",
        "Проверка chess ...",
        "Проверка checkers ...",
        "Проверка tetris ...",
        "Проверка game2048...",
        "Проверка tictactoe...",
        "Проверка minesweeper ...",
        "Проверка pong ...",
        "Проверка labyrinth ...",
        "Проверка games ...",
        "Проверка editor...",
      ],
      detail: "Обработка исходных файлов"
    },
    {
      duration: 5000,
      startPercent: 90,
      endPercent: 100,
      title: "Запускаем приложения",
      messages: [
        "",
        `Проверка на наличие глистов у данила`,
        "глист не был найден",
        "Запуск полного глиста...",
        `у данила есть глисты🥳`
      ],
      detail: "Запуск системных компонентов"
    }
  ];

  function createWindows8Loader() {
    const loaderContainer = document.createElement('div');
    loaderContainer.className = 'windows8-loader-container';
    loaderContainer.style.cssText = `
            margin-bottom: 40px;
        `;

    loaderContainer.innerHTML = `
            <div class="windows8">
                <div class="wBall" id="wBall_1">
                    <div class="wInnerBall"></div>
                </div>
                <div class="wBall" id="wBall_2">
                    <div class="wInnerBall"></div>
                </div>
                <div class="wBall" id="wBall_3">
                    <div class="wInnerBall"></div>
                </div>
                <div class="wBall" id="wBall_4">
                    <div class="wInnerBall"></div>
                </div>
                <div class="wBall" id="wBall_5">
                    <div class="wInnerBall"></div>
                </div>
            </div>
        `;

    loadingScreen.appendChild(loaderContainer);
    return loaderContainer;
  }
  function updatePercent(percent) {
    currentPercent = percent;
    if (percentElement) {
      percentElement.textContent = `${Math.round(percent)}%`;
    }
    if (loadingProgress) {
      loadingProgress.style.width = `${percent}%`;
    }
  }

  function startDotsAnimation() {
    let dotCount = 0;
    clearInterval(dotsInterval);

    dotsInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      const dots = '.'.repeat(dotCount);
      if (loadingText) {
        const phase = phases[currentPhase];
        loadingText.textContent = phase.title + dots;
      }
    }, 500);
  }

  function rotateDetailMessages(phase, phaseStartTime, startPercent, endPercent) {
    if (!loadingDetails) return;

    let messageIndex = 0;
    const messageInterval = phase.duration / phase.messages.length;
    let lastUpdateTime = Date.now();

    function updateDetails() {
      const now = Date.now();
      const elapsed = now - phaseStartTime;
      const progressInPhase = Math.min(1, elapsed / phase.duration);

      const currentPhasePercent = startPercent + (endPercent - startPercent) * progressInPhase;
      updatePercent(currentPhasePercent);

      if (loadingDetails) {
        if (now - lastUpdateTime >= messageInterval) {
          loadingDetails.textContent = phase.messages[messageIndex];
          messageIndex = (messageIndex + 1) % phase.messages.length;
          lastUpdateTime = now;
        }
      }

      if (elapsed < phase.duration) {
        requestAnimationFrame(updateDetails);
      }
    }
    requestAnimationFrame(updateDetails);
  }

  function startPhase(phaseIndex) {
    currentPhase = phaseIndex;
    const phase = phases[phaseIndex];
    const phaseStartTime = Date.now();

    if (loadingText) {
      loadingText.textContent = phase.title;
      startDotsAnimation();
    }
    if (loadingDetails) {
      loadingDetails.textContent = phase.messages[0];
    }

    updatePercent(phase.startPercent);

    rotateDetailMessages(phase, phaseStartTime, phase.startPercent, phase.endPercent);

    setTimeout(() => {
      if (phaseIndex < phases.length - 1) {
        startPhase(phaseIndex + 1);
      } else {
        completeLoading();
      }
    }, phase.duration);
  }

  function animateLoaderCompletion() {
    const balls = document.querySelectorAll('.wBall');
    balls.forEach((ball, index) => {
      setTimeout(() => {
        ball.style.animation = 'none';
        ball.style.opacity = '0.3';
        ball.style.transform = 'scale(0.5)';
        ball.style.transition = 'all 0.5s ease';
      }, index * 100);
    });

    setTimeout(() => {
      balls.forEach(ball => {
        ball.style.opacity = '0';
        ball.style.transform = 'scale(0)';
      });
    }, 500);
  }

  function completeLoading() {
    clearInterval(dotsInterval);
    updatePercent(100);
    animateLoaderCompletion();

    if (loadingText) {
      loadingText.textContent = "Готово!";
    }

    if (loadingDetails) {
      loadingDetails.textContent = "Система успешно загружена";
    }

    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 1s ease';

      setTimeout(() => {
        loadingScreen.style.display = 'none';
        showMainContent();
        showUserWelcome();
      }, 1000);
    }, 1500);
  }

  function showMainContent() {
    const mainContent = document.querySelector('.main-content') || document.body;
    mainContent.style.opacity = '0';
    mainContent.style.display = 'block';

    setTimeout(() => {
      mainContent.style.transition = 'opacity 0.5s ease';
      mainContent.style.opacity = '1';
    }, 100);
  }

  function showUserWelcome() {
    const userData = JSON.parse(localStorage.getItem('userData')) || {
      fname: "",
      language: "ru",
      activationKey: ""
    };

    const userName = userData.fname || "Пользователь";

    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    welcomeDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; padding: 5px;">
                <div style="font-size: 28px; flex-shrink: 0;">🚀</div>
                <div style="flex-grow: 1;">
                    <div style="font-weight: bold; font-size: 16px; line-height: 1.2;">Добро пожаловать, ${userName}!</div>
                    <div style="font-size: 13px; opacity: 0.8; line-height: 1.2;">Система загружена и готова к работе</div>
                </div>
                <div style="flex-shrink: 0; cursor: pointer; font-size: 22px; opacity: 0.7; padding: 0 5px; line-height: 1;" 
                     onclick="this.closest('.welcome-message').style.display='none'">&times;</div>
            </div>
        `;

    welcomeDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 350px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            transform: translateX(120%) scale(0.9);
            transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;

    document.body.appendChild(welcomeDiv);

    setTimeout(() => {
      welcomeDiv.style.transform = 'translateX(0) scale(1)';
    }, 200);

    setTimeout(() => {
      if (welcomeDiv.parentNode) {
        welcomeDiv.style.transform = 'translateX(120%) scale(0.9)';
        setTimeout(() => {
          if (welcomeDiv.parentNode) {
            welcomeDiv.parentNode.removeChild(welcomeDiv);
          }
        }, 600);
      }
    }, 5000);
  }

  startPhase(0);
}

function addWindows8Styles() {
  if (!document.querySelector('#windows8-styles')) {
    const styles = document.createElement('style');
    styles.id = 'windows8-styles';
    styles.textContent = `
            .loading-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #000000ff 0%, #444444ff 50%, #808080ff 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-family: 'Segoe UI', 'Arial', sans-serif;
                overflow: hidden;
            }
            
            .loading-text-container {
                text-align: center;
                margin-top: 20px;
            }
            
            .loading-text {
                font-size: 28px;
                font-weight: 300;
                margin-bottom: 15px;
                min-height: 40px;
                letter-spacing: 1px;
                text-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            
            .loading-details {
                font-size: 16px;
                opacity: 0.9;
                min-height: 24px;
                font-weight: 300;
                max-width: 500px;
                margin: 0 auto;
                line-height: 1.4;
                margin-bottom: 20px;
            }
            
            #loading-percent {
                font-size: 42px;
                font-weight: 200;
                margin: 20px 0;
                text-shadow: 0 2px 15px rgba(0,0,0,0.4);
                letter-spacing: 2px;
                font-family: 'Segoe UI Light', 'Arial Narrow', sans-serif;
            }
            
            .loading-progress {
            display: none;
                width: 400px;
                height: 6px;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                overflow: hidden;
                margin-top: 20px;
                position: relative;
            }
            
            .loading-progress::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                background: linear-gradient(90deg, #ffffff, #cccccc);
                width: 0%;
                transition: width 0.3s ease-out;
                border-radius: 3px;
            }
            
            .windows8 {
                position: relative;
                width: 88px;
                height: 88px;
                margin: 0 auto 30px;
            }
            
            .windows8 .wBall {
                position: absolute;
                width: 82px;
                height: 82px;
                opacity: 0;
                transform: rotate(225deg);
                animation: orbit 6.96s infinite;
            }
            
            .windows8 .wBall .wInnerBall {
                position: absolute;
                width: 12px;
                height: 12px;
                background: linear-gradient(45deg, #ffffffff, #ffffffff);
                left: 0px;
                top: 0px;
                border-radius: 12px;
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.7);
            }
            
            .windows8 #wBall_1 {
                animation-delay: 1.52s;
            }
            
            .windows8 #wBall_2 {
                animation-delay: 0.3s;
            }
            
            .windows8 #wBall_3 {
                animation-delay: 0.61s;
            }
            
            .windows8 #wBall_4 {
                animation-delay: 0.91s;
            }
            
            .windows8 #wBall_5 {
                animation-delay: 1.22s;
            }
            
            @keyframes orbit {
                0% {
                    opacity: 1;
                    z-index: 99;
                    transform: rotate(180deg);
                    animation-timing-function: ease-out;
                }
                
                7% {
                    opacity: 1;
                    transform: rotate(300deg);
                    animation-timing-function: linear;
                }
                
                30% {
                    opacity: 1;
                    transform: rotate(410deg);
                    animation-timing-function: ease-in-out;
                }
                
                39% {
                    opacity: 1;
                    transform: rotate(645deg);
                    animation-timing-function: linear;
                }
                
                70% {
                    opacity: 1;
                    transform: rotate(770deg);
                    animation-timing-function: ease-out;
                }
                
                75% {
                    opacity: 1;
                    transform: rotate(900deg);
                    animation-timing-function: ease-out;
                }
                
                76% {
                    opacity: 0;
                    transform: rotate(900deg);
                }
                
                100% {
                    opacity: 0;
                    transform: rotate(900deg);
                }
            }
            
            @keyframes pulsePercent {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.8;
                    transform: scale(1.05);
                }
            }
            
            #loading-percent {
                animation: pulsePercent 2s ease-in-out infinite;
            }
            
            .loading-screen::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
                    radial-gradient(circle at 80% 70%, rgba(200, 200, 200, 0.05) 0%, transparent 50%);
                animation: pulseBackground 10s ease-in-out infinite alternate;
            }
            
            @keyframes pulseBackground {
                0% { opacity: 0.1; }
                100% { opacity: 0.3; }
            }
            
            @-webkit-keyframes orbit {
                0% { opacity: 1; -webkit-transform: rotate(180deg); }
                100% { opacity: 0; -webkit-transform: rotate(900deg); }
            }
            
            @-moz-keyframes orbit {
                0% { opacity: 1; -moz-transform: rotate(180deg); }
                100% { opacity: 0; -moz-transform: rotate(900deg); }
            }
            
            @-o-keyframes orbit {
                0% { opacity: 1; -o-transform: rotate(180deg); }
                100% { opacity: 0; -o-transform: rotate(900deg); }
            }
            
            @-ms-keyframes orbit {
                0% { opacity: 1; -ms-transform: rotate(180deg); }
                100% { opacity: 0; -ms-transform: rotate(900deg); }
            }
        `;
    document.head.appendChild(styles);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  addWindows8Styles();

  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.opacity = '0';
    mainContent.style.display = 'none';
  }

  setTimeout(() => {
    startLoadingAnimation();
  }, 500);
});

window.restartLoading = startLoadingAnimation;

document.querySelector("form").onsubmit = (e) => {
  e.preventDefault();
  document.querySelector("section").style.transform = `translateY(-100%)`;
};

function loadUserName() {
  try {
    const userData = JSON.parse(localStorage.getItem('user') || localStorage.getItem('user_json') || '{}');
    const userName = userData.name || userData.fname || 'Feri Irawan';
    const user2Name = document.getElementById('user2-name');
    if (user2Name && userName !== 'Feri Irawan') {
      user2Name.textContent = userName;
      const user2Btn = document.querySelector('[data-username=""]');
      if (user2Btn) {
        user2Btn.dataset.username = userName;
        user2Btn.dataset.password = '1234';
      }
    }

    return userName;
  } catch (e) {
    console.error('Ошибка загрузки имени пользователя:', e);
    return 'Feri Irawan';
  }
}

function loadWallpaper() {
  try {
    const settings = JSON.parse(localStorage.getItem('w12_settings') || '{}');

    const defaultWallpapers = [
      "./wallpapers/wallpaper1.jpg",
      "./wallpapers/wallpaper2.jpg",
      "./wallpapers/wallpaper3.jpg",
      "./wallpapers/wallpaper4.jpg",
      "./wallpapers/wallpaper5.jpg",
      "./wallpapers/wallpaper6.jpg"
    ];

    const wallpapers = Array.isArray(settings.wallpapers) && settings.wallpapers.length > 0
      ? settings.wallpapers
      : defaultWallpapers;

    const selectedIndex = typeof settings.selectedWallpaperIndex === 'number'
      ? settings.selectedWallpaperIndex
      : 0;

    let wallpaperUrl = wallpapers[selectedIndex] || defaultWallpapers[0];

    if (!wallpaperUrl.startsWith('http') && !wallpaperUrl.startsWith('data:')) {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', wallpaperUrl, false);
      try {
        xhr.send();
        if (xhr.status === 404) {
          wallpaperUrl = defaultWallpapers[0];
        }
      } catch (e) {
        wallpaperUrl = defaultWallpapers[0];
      }
    }

    console.log('Загружены обои:', wallpaperUrl);

    document.documentElement.style.setProperty('--wallpaper', `url("${wallpaperUrl}")`);

    const desktopWallpaper = document.querySelector('.desktop-wallpaper');
    if (desktopWallpaper) {
      desktopWallpaper.style.backgroundImage = `url("${wallpaperUrl}")`;
    }

    return wallpaperUrl;
  } catch (e) {
    console.error('Ошибка загрузки обоев:', e);
    const defaultWallpaper = "./wallpapers/wallpaper1.jpg";
    document.documentElement.style.setProperty('--wallpaper', `url("${defaultWallpaper}")`);

    const desktopWallpaper = document.querySelector('.desktop-wallpaper');
    if (desktopWallpaper) {
      desktopWallpaper.style.backgroundImage = `url("${defaultWallpaper}")`;
    }

    return defaultWallpaper;
  }
}
function initClock() {
  const clockElement = document.getElementById('taskbar-clock');
  if (!clockElement) return;

  function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}`;
  }

  updateClock();
  setInterval(updateClock, 1000); 
}

function handleLogin(password, username) {
  const errorMessage = document.getElementById('error-message');

  if (password === '1234') {
    document.getElementById('login-screen').classList.add('hidden');

    loadWallpaper();

    document.getElementById('desktop').classList.add('active');

    initClock();
    setTimeout(() => {
      if (typeof initializeVirtualPC === 'function') {
        initializeVirtualPC();
      }

      if (window.appRegistry) {
        console.log('Доступны приложения:', Object.keys(window.appRegistry));
      }
    }, 500);

    console.log(`Пользователь "${username}" успешно вошел в систему!`);

  } else {
    errorMessage.style.display = 'block';
    document.getElementById('password-input').style.borderColor = '#ff6b6b';

    setTimeout(() => {
      errorMessage.style.display = 'none';
      document.getElementById('password-input').style.borderColor = '';
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const userName = loadUserName();
  loadWallpaper();

  document.getElementById('password-input').value = '1234';
  document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    const password = document.getElementById('password-input').value;
    const username = document.getElementById('current-username').textContent;
    handleLogin(password, username);
  };

  document.getElementById('password-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('login-form').onsubmit(e);
    }
  });

  document.querySelectorAll('.user.btn').forEach(userBtn => {
    userBtn.addEventListener('click', () => {
      const username = userBtn.dataset.username;
      const password = userBtn.dataset.password;

      if (username) {
        document.getElementById('current-username').textContent = username;
        document.getElementById('password-input').value = password || '';
        document.getElementById('password-input').focus();
      }
    });
  });
  document.querySelectorAll('.desktop-icon[data-launch]').forEach(icon => {
    icon.addEventListener('click', function () {
      const appId = this.dataset.launch;
      console.log(`Запуск приложения: ${appId}`);

      if (window.appRegistry && window.appRegistry[appId]) {
        launchApp(appId);
      } else {
        console.warn(`Приложение ${appId} не найдено в appRegistry`);
      }
    });
  });

  const windowsLogo = document.querySelector('.windows_logo');
  if (windowsLogo) {
    windowsLogo.addEventListener('click', () => {
      const startMenu = document.getElementById('start-menu');
      if (startMenu) {
        startMenu.classList.toggle('hidden');
        startMenu.setAttribute('aria-hidden', startMenu.classList.contains('hidden'));
      }
    });
  }

  document.addEventListener('click', (e) => {
    const startMenu = document.getElementById('start-menu');
    if (startMenu && !startMenu.contains(e.target) && !e.target.closest('.windows_logo')) {
      startMenu.classList.add('hidden');
      startMenu.setAttribute('aria-hidden', 'true');
    }
  });
  document.querySelectorAll('.start-app[data-launch]').forEach(app => {
    app.addEventListener('click', function () {
      const appId = this.dataset.launch;
      console.log(`Запуск приложения из меню Пуск: ${appId}`);
      const startMenu = document.getElementById('start-menu');
      if (startMenu) {
        startMenu.classList.add('hidden');
        startMenu.setAttribute('aria-hidden', 'true');
      }
      launchApp(appId);
    });
  });
});

function launchApp(appId) {
  if (window.appRegistry && window.appRegistry[appId]) {
    console.log(`Запускаем приложение: ${appId}`);

    createAppWindow(appId);
  } else {
    console.error(`Приложение ${appId} не найдено`);
    alert(`Приложение "${appId}" не доступно в данный момент.`);
  }
}

function createAppWindow(appId) {
  const app = window.appRegistry[appId];
  if (!app) return;

  const windowsRoot = document.getElementById('windows-root');
  if (!windowsRoot) {
    console.error('Не найден контейнер для окон');
    return;
  }

  const windowId = 'window-' + Date.now();
  const windowEl = document.createElement('div');
  windowEl.className = 'window focused';
  windowEl.id = windowId;
  windowEl.style.cssText = `
        position: absolute;
        top: 100px;
        left: 100px;
        width: 600px;
        height: 400px;
        background: rgba(30, 30, 50, 0.95);
        border-radius: 8px;
        border: 1px solid rgba(100, 150, 255, 0.3);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
  const titlebar = document.createElement('div');
  titlebar.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background: rgba(0, 0, 0, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: move;
        user-select: none;
    `;

  const title = document.createElement('div');
  title.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
        font-weight: bold;
    `;

  const icon = document.createElement('img');
  icon.src = app.icon;
  icon.style.cssText = 'width: 16px; height: 16px;';

  const titleText = document.createElement('span');
  titleText.textContent = app.title;

  title.appendChild(icon);
  title.appendChild(titleText);

  const controls = document.createElement('div');
  controls.style.cssText = `
        display: flex;
        gap: 5px;
    `;

  const minimizeBtn = document.createElement('button');
  minimizeBtn.textContent = '─';
  minimizeBtn.style.cssText = `
        width: 30px;
        height: 25px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        font-size: 16px;
    `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
        width: 30px;
        height: 25px;
        background: rgba(255, 100, 100, 0.3);
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        font-size: 16px;
    `;

  closeBtn.addEventListener('click', () => {
    windowEl.remove();
  });

  minimizeBtn.addEventListener('click', () => {
    windowEl.style.display = 'none';
  });

  controls.appendChild(minimizeBtn);
  controls.appendChild(closeBtn);

  titlebar.appendChild(title);
  titlebar.appendChild(controls);

  const content = document.createElement('div');
  content.style.cssText = `
        flex: 1;
        overflow: auto;
        padding: 15px;
    `;

  try {
    if (typeof app.content === 'function') {
      const appContent = app.content();
      if (appContent) {
        content.appendChild(appContent);
      } else {
        content.innerHTML = `<div style="color: white; padding: 20px; text-align: center;">Приложение "${app.title}" загружается...</div>`;
      }
    } else {
      content.innerHTML = `<div style="color: white; padding: 20px; text-align: center;">Приложение "${app.title}" доступно</div>`;
    }
  } catch (e) {
    console.error(`Ошибка загрузки приложения ${appId}:`, e);
    content.innerHTML = `<div style="color: #ff6b6b; padding: 20px;">
            <strong>Ошибка загрузки приложения</strong><br>
            ${e.message}
        </div>`;
  }

  windowEl.appendChild(titlebar);
  windowEl.appendChild(content);
  windowsRoot.appendChild(windowEl);

  makeDraggable(windowEl, titlebar);

  bringToFront(windowEl);

  windowEl.addEventListener('click', () => {
    bringToFront(windowEl);
  });

  return windowEl;
}

function makeDraggable(element, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  handle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    bringToFront(element);
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function bringToFront(element) {
  const allWindows = document.querySelectorAll('.window');

  allWindows.forEach(win => {
    win.style.zIndex = '1000';
    win.classList.remove('focused');
  });

  element.style.zIndex = '10000';
  element.classList.add('focused');
}

window.loadWallpaper = loadWallpaper;
window.handleLogin = handleLogin;
window.launchApp = launchApp;
window.createAppWindow = createAppWindow;

console.log('Система входа загружена и готова к работе!');
