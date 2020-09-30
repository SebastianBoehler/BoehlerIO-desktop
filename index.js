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
        title: 'Tasks'
    })

    mainWindow.loadURL('http://localhost:5050')
})