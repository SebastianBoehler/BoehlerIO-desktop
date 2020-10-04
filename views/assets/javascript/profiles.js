const { ipcRenderer } = require('electron')

ipcRenderer.send('test', {
    action: document.location.href
})