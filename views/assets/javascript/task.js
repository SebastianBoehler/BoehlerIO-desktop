const {
    ipcRenderer
} = require('electron')

window.addEventListener("load", async () => {
    window.saveTask = async () => {
        const keywords = $('#keywords').val()
        const mode = $('#mode').val()
        const size = $('#size').val()
        const color = $('#color').val()
        const checkoutDelay = $('#checkoutDelay').val()
        const category = $('#category').val()
        const taskAmount = Number($('#taskAmount').val())
        const profile = $('#profile').val()
        const proxy = $('#proxy').val()

        var options = {
            keywords: keywords,
            mode: mode,
            size: size,
            color: color,
            checkoutDelay: checkoutDelay,
            category: category,
            taskAmount: taskAmount,
            profile: profile
        }

        if (proxy.length > 5) options['proxy'] = proxy

        ipcRenderer.send('saveTask', options)
    }
})