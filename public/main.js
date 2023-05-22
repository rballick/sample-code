const { app, BrowserWindow, Menu, ipcMain: ipc, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const { channels } = require('../shared/constants');
const offline = require('../shared/offline');

let win;
function createWindow() {
    win = new BrowserWindow({
        width: 550,
        height: 643,
        frame: false,
        resizable: false,
        icon: path.join(__dirname, '../public/assets/icon_32.ico'),
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        },
    });
    Menu.setApplicationMenu(Menu.buildFromTemplate([]))
    win.loadURL(
        isDev
        ? 'http://localhost:3010'
        : `file://${path.join(__dirname, '../build/index.html')}`
    );
    if (isDev) {
        win.webContents.openDevTools({ mode: 'detach' });
    }
}

const getFiles = (dir, recursive) => {
    const files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (fs.statSync(`${dir}/${file}`).isDirectory()) {
            if (recursive) getFiles(`${dir}/${file}`, true);
        } else if (/\.mp3$/.test(file)) {
            offline.addFile(`${dir}/${file}`);
        }
    }
    return offline.getFiles();
}

const importFiles = async (directory) => {
    const options = {
        title: directory ? 'Choose directory' : 'Choose files',
        properties: [ directory ? 'openDirectory' : 'openFile' ]
    }
    if (!directory) {
        options.filters = [{name: 'Audio Files', extensions: ['mp3']}];
        options.properties.push('multiSelections');
    }
    const result = await dialog.showOpenDialog(options);
    let recursive = false;
    if (!result.canceled && directory) {
        const results = await dialog.showMessageBox({
            buttons: ['Yes', 'No'],
            message: `Import music files?`,
            detail: `Files will be imported from ${result.filePaths[0]}`,
            defaultId: 0,
            title: 'Import files',
            type: 'none',
            checkboxLabel: 'Include subdirectories',
            cancelId: 1,
            icon: path.join(__dirname,'assets','music_sm.ico')
        });
        result.canceled = results.response === 1;
        recursive = results.checkboxChecked;
    }
    if (result.canceled) return false;
    if (directory) {
        result.filePaths = getFiles(result.filePaths[0], recursive);
        offline.clearFiles();
    }
    return result.filePaths;
}

app.whenReady()
.then(() => {
    globalShortcut.register('Shift+CommandOrControl+F', () => {
        importFiles();
    });
    globalShortcut.register('Shift+CommandOrControl+D', () => {
        importFiles(true);
    })
    globalShortcut.register('CommandOrControl+D', () => {
        importFiles(true, true);
    })
})
.then(createWindow);

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

ipc.on(channels.IMPORT_FILES, async (e, directory, replace) => {
    const files = await importFiles(directory, replace);
    if (!files) replace = undefined;
    e.sender.send(channels.IMPORT_FILES, files || [], replace);
});

ipc.on(channels.GET_FILE, (e, filepath) => {
    e.sender.send(channels.GET_FILE, fs.readFileSync(filepath));
})
