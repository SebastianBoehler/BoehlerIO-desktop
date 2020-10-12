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

        if (!keywords) {
            alert(undefined, 'error', 'Please input keywords.')
            return
        } else if (!category) {
            alert(undefined, 'error', 'Please select a category.')
            return
        }

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
        //alert('Saved!', 'success', 'Your task has been created.')
    }
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