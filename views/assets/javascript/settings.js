const { ipcRenderer, app } = require('electron')
const openUrl = require('open')

window.openUrl = openUrl

window.saveSettings = () => {
    const checkoutDelay = Number($('#checkoutDelay').val())
    const storeScreenshot = $('#storeScreenshot').is(":checked")
    const atcDelay = Number($('#atcDelay').val())
    const highestQuantity = $('#highestQuantity').is(":checked")
    const discordWebhook = $('#discordWebhook').val()
    const discordNotifications = $('#discordNotifications').is(":checked")
    const executablePath = $('#executablePath').val()
    const region = $('#region').val()

    ipcRenderer.send('saveSettings', {
        checkoutDelay: checkoutDelay,
        storeScreenshot: storeScreenshot,
        atcDelay: atcDelay,
        highestQuantity: highestQuantity,
        discordWebhook: discordWebhook,
        discordNotifications: discordNotifications,
        region: region,
        executablePath: executablePath
    })
    alert('Saved!', 'success', 'Your settings have been saved.')
}

window.addEventListener("load", async () => {
    ipcRenderer.send('loadSettings')
    ipcRenderer.on('settings', async (event, data) => {
        //alert(JSON.stringify(data))
        console.log(data)
        $('#checkoutDelay').val(data['checkoutDelay'])
        $('#storeScreenshot').prop('checked', data['storeScreenshot'])
        $('#atcDelay').val(data['atcDelay'])
        $('#highestQuantity').prop('checked', data['highestQuantity'])
        $('#discordWebhook').val(data['discordWebhook'])
        $('#discordNotifications').prop('checked', data['discordNotifications'])
        $('#region').val(data['region'])
        $('#executablePath').val(data['executablePath'])
    })
})

ipcRenderer.on('alert', async (event, title, type, message) => {
    console.log(title, type, message)
    alert(title, type, message)
})

function alert(title, type, message) {
    Swal.fire({
        title: title,
        text: message,
        icon: type,
        confirmButtonText: 'close',
        timer: 15000
    })
}