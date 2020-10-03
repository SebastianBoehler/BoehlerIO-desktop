const { app, BrowserWindow, ipcMain } = require('electron')
const fileUtls = require('./fileUtils')
const server = require('./server')

let mainWindow

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        hasShadow: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        },
        height: 800,
        width: 1300,
        title: 'BOEHLER IO DESKTOP'
    })

    mainWindow.loadURL('http://localhost:5050')
    mainWindow.webContents.openDevTools()
    mainWindow.on('page-title-updated', (evt) => {
        evt.preventDefault();
      });
})