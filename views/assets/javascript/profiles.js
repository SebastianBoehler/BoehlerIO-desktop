const {
    ipcRenderer
} = require('electron')

window.saveProfile = () => {
    const profileName = $('#profileName').val()
    const name = $('#name').val()
    const email = $('#email').val()
    const phone = $('#phone').val()
    const address = $('#address').val()
    const address2 = $('#address2').val()
    const address3 = $('#address3').val()
    const unit = $('#unit').val()
    const country = $('#country').val()
    const state = $('#state').val()
    const city = $('#city').val()
    const zip = $('#zip').val()
    const ccnumber = $('#ccnumber').val() || ''
    const cvv = $('#cvv').val()
    const month = $('#month').val()
    const year = $('#year').val()

    const cardNumberFirst = ccnumber.charAt(0) || undefined
    var cardType

    if (cardNumberFirst === "4") {
        cardType = "visa";
    } else if (cardNumberFirst === "3") {
        let nextCardNumber = ccnumber.charAt(1);
        if (nextCardNumber === "5") {
            cardType = "jcb";
        } else {
            cardType = "american_express";
        }
    } else if (cardNumberFirst === "5") {
        cardType = "master";
    } else if (cardNumberFirst === "6") {
        cardType = "solo";
    } else if (!cardNumberFirst) cardType = 'paypal'

    console.log(cardType)

    ipcRenderer.send('saveProfile', {
        profileName: profileName,
        name: name,
        email: email,
        phone: phone,
        address: address,
        address2: address2,
        address3: address3,
        unit: unit,
        country: country,
        state: state,
        city: city,
        zip: zip,
        type: cardType,
        ccnumber: ccnumber,
        cvv: cvv,
        month: month,
        year: year
    })
    alert('Saved!', 'success', 'Your profile has been saved.')
}

window.addEventListener("load", async () => {
    ipcRenderer.send('loadProfile')
    ipcRenderer.on('profile', async (event, data) => {
        console.log(data)
        $('#profileName').val(data['profileName'])
        $('#name').val(data['name'])
        $('#email').val(data['email'])
        $('#phone').val(data['phone'])
        $('#address').val(data['address'])
        $('#address2').val(data['address2'])
        $('#address3').val(data['address3'])
        $('#unit').val(data['unit'])
        $('#country').val(data['country'])
        $('#state').val(data['state'])
        $('#city').val(data['city'])
        $('#zip').val(data['zip'])
        $('#ccnumber').val(data['ccnumber'])
        $('#cvv').val(data['cvv'])
        $('#month').val(data['month'])
        $('#year').val(data['year'])
    })
})

function alert(title, type, message) {
    Swal.fire({
        title: title,
        text: message,
        icon: type,
        confirmButtonText: 'close',
        timer: 10000
    })
}