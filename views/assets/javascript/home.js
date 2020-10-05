const { ipcRenderer } = require('electron')
const { stat } = require('fs')

ipcRenderer.send('test', {
    action: document.location.href
})

window.addEventListener("load", async () => {
    //loadProfiles
    ipcRenderer.send('loadTasks')
    ipcRenderer.on('tasks', async (event, data) => {
        $('#taskTable').empty()
        console.log(data)
        for (var a in data) {
            var status = data[a]['status'] || 'stopped'
            var color = data[a]['color']
            if (!color || color.length <= 1) color = 'ANY'
            var profile = data[a]['profile']
            if (!profile) profile = 'personal'
            $('#taskTable').append(`<tr id="${data[a]['id']}">
            <td>
                <span class="indicator" id="${data[a]['id']}-circle">
                    
                </span>
            </td>
            <td>
                <span>
                    ${profile}
                </span>
            </td>
            <td>
                <span>
                    ${data[a]['keywords']}
                </span>
            </td>
            <td>
                <a>
                    ${color}
                </a>
            </td>
            <td>
                <a class="btn btn-status for-submit" href="javascript:void(0)" id="${data[a]['id']}-status">
                    ${status.toUpperCase()}
                </a>
            </td>
            <td>
                <a class="btn btn-action for-play" href="#" onclick="startTask('${data[a]['id']}')">
                    <i class="fas fa-play"></i>
                </a>
                <a class="btn btn-action for-pause" href="#" onclick="stopTask('${data[a]['id']}')">
                    <i class="fas fa-pause"></i>
                </a>
                <a class="btn btn-action for-pause" href="#" onclick="deleteTask('${data[a]['id']}')">
                    <i class="fas fa-trash-alt"></i>
                </a>
            </td>
        </tr>`)

            //if (status === 'paypal' || status === 'paid') $(`#${id}-circle`).css('border-color', '#51f396')
        }
    })

    window.deleteTask = (id) => {
        ipcRenderer.send('deleteTask', id)
    }

    window.startTask = (id) => {
        ipcRenderer.send('startTask', id)
    }

    window.stopTask = (id) => {
        ipcRenderer.send('stopTask', id)
    }

    ipcRenderer.on('statusChange', (event, data, success) => {
        console.log(data)
        const id = data['id']
        const status = data['status']
        $(`#${id}-status`).text(status.toUpperCase())
        $(`#${id}-circle`).css('border-color', '#ffb273')
        if (success) $(`#${id}-circle`).css('border-color', '#51f396')
        else if (success === false) $(`#${id}-circle`).css('border-color', '#fe9890')
    })
})