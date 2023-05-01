const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Menu, ipcMain: ipc } = require('electron');
const isDev = require('electron-is-dev');
const { channels } = require('../shared/constants');
const cachePath = path.join(__dirname,'assets','cache');

let win;
function createWindow() {
    win = new BrowserWindow({
        width: 550,
        height: 705,
        frame: false,
        resizable: false,
        icon: path.join(__dirname, '../public/assets/icon_32.ico'),
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        },
    });

    const name = app.getName();
    Menu.setApplicationMenu(Menu.buildFromTemplate([]));
    win.loadURL(
        isDev
        ? 'http://localhost:3010'
        : `file://${path.join(__dirname, '../build/index.html')}`
    );
    if (isDev) {
        win.webContents.openDevTools({ mode: 'detach' });
    }
}

const getCache = (type) => {
    const cache = fs.readdirSync(cachePath).filter(file => !fs.statSync(`${cachePath}/${file}`).isDirectory()).reduce((obj, file) => {
        if (!file.includes('.json')) return obj;
        return { ...obj, [file.split('.').shift()]: JSON.parse(fs.readFileSync(`${cachePath}/${file}`, 'utf8')) }
    }, {});

    return cache[type] || cache;
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipc.on(channels.WIN_CLOSE, _ => {
    win.close();
});

ipc.on(channels.WIN_MIN, _ => {
    win.minimize();
});

ipc.on(channels.GET_CACHE, (e) => {
    e.sender.send(channels.GET_CACHE, getCache());
});
