const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

// 版本號
const VERSION = "v1.8.0";

let mainWindow;
let inputWindow;
let isFramelessMode = false;

// 默認 URL
const defaultURL = '';

function createInputWindow() {
  inputWindow = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  inputWindow.loadFile('input.html');

  inputWindow.on('closed', () => {
    inputWindow = null;
  });
}

function createMainWindow(url, options = {}) {
  const newWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: !isFramelessMode,
    transparent: isFramelessMode,
    ...options,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    }
  });

  newWindow.loadURL(url);
  newWindow.setAlwaysOnTop(true, 'screen-saver');

  if (isFramelessMode) {
    newWindow.setIgnoreMouseEvents(true, { forward: true });
    newWindow.setFocusable(false);
    newWindow.setResizable(false);
    newWindow.setMovable(false);
    newWindow.setMinimizable(false);
    newWindow.setMaximizable(false);
    newWindow.setFullScreenable(false);
    newWindow.setSkipTaskbar(true);
    newWindow.setBackgroundColor('#00000000');  // 透明背景
  } else {
    newWindow.setIgnoreMouseEvents(false);
    newWindow.setFocusable(true);
    newWindow.setResizable(true);
    newWindow.setMovable(true);
    newWindow.setMinimizable(true);
    newWindow.setMaximizable(true);
    newWindow.setFullScreenable(true);
    newWindow.setSkipTaskbar(false);
    newWindow.setBackgroundColor('#FFFFFF');  // 恢復背景色
  }

  newWindow.on('closed', () => {
    if (newWindow === mainWindow) {
      mainWindow = null;
    }
  });

  return newWindow;
}

function toggleFramelessMode() {
  isFramelessMode = !isFramelessMode;
  
  let windowOptions = {};
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    // 獲取當前視窗的位置和大小
    const [x, y] = mainWindow.getPosition();
    const [width, height] = mainWindow.getSize();
    windowOptions = { x, y, width, height };
    
    // 關閉當前視窗
    mainWindow.close();
  }

  // 創建新的視窗，根據當前模式設置 frame 和透明模式
  const newWindow = createMainWindow(defaultURL, windowOptions);

  // 確保舊窗口被銷毀後再賦值給 mainWindow
  if (mainWindow) {
    mainWindow.on('closed', () => {
      mainWindow = newWindow;
    });
  } else {
    mainWindow = newWindow;
  }

  // 防止拖動時出現疊影
  if (isFramelessMode) {
    newWindow.setHasShadow(false);
  } else {
    newWindow.setHasShadow(true);
  }
}

function registerShortcuts() {
  // 切換模式
  globalShortcut.register('Ctrl+Alt+O', toggleFramelessMode);

  // 退出應用
  globalShortcut.register('Ctrl+Alt+P', () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  createInputWindow();
  registerShortcuts();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createInputWindow();
  }
});

ipcMain.on('submit-url', (event, url) => {
  if (inputWindow) {
    inputWindow.close();
  }
  mainWindow = createMainWindow(url || defaultURL);
});

ipcMain.on('get-version', (event) => {
  event.returnValue = VERSION;
});

console.log(`應用程序版本: ${VERSION}`);