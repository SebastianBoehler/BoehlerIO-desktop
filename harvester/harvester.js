const {
    ipcRenderer
} = require('electron')

//log.catchErrors(options = {}) // catch and log unhandled errors
var CaptchaHasBeenTriggered = false
window.addEventListener("load", async (e) => {
  //alert(JSON.stringify($('body')))
  if (location.href.includes('chrome-error')) {
    setTimeout(() => {
      location.href = 'https://supremenewyork.com/index'
      ipcRenderer.send('captcha-error', 'chrome-error')
    }, 250);
  }
  else if (location.host.includes('supremenewyork')) {
    //alert('on supreme site')
    $("body").html("")
    $("body").css('background-color', '#f0f5f9')

    //with youtube redirect
    const gLogin = 'https://accounts.google.com/signin/v2/identifier?hl=en&service=youtube&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Ffeature%3Dsign_in_button%26hl%3Den%26app%3Ddesktop%26next%3D%252F%26action_handle_signin%3Dtrue&passive=true&uilel=3&flowName=GlifWebSignIn&flowEntry=ServiceLogin'

    //$("body").append(`<button onclick="window.location.href='https://accounts.google.com/servicelogin'">Google Login</button>`)

    //code must be in `` otherwise it results in issues
    $("body").append('<div id="loginBtn" style="padding: 10px 25% 0 25%; width: 50%;"></div>')
    $("#loginBtn").append(`<button onclick="window.location.href='${gLogin}'" style="position: absolute; z-index: 50000; margin: auto; width: 50%; padding: 5px; font-family: Open Sans, sans-serif">Google Login</button>`)
    
    //$("body").append(`<div id='gc' data-size='invisible' data-error-callback='captchaError'></div>`)
    $("body").append(`<div id='gc' data-error-callback='captchaError'></div>`)

    $("#gc").css({
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      "justify-content": "left",
      "align-items": "center",
      "z-index": 99,
    })

    ipcRenderer.send('harvesterIsReady')

    window.callback = async (token) => {
      ipcRenderer.send('captcha-done', token)
      CaptchaHasBeenTriggered = false
      ipcRenderer.send('TriggeredCheck', CaptchaHasBeenTriggered)
      //check captcha score
      location.reload()
    }

    window.captchaError = async (error) => {
      ipcRenderer.send('captcha-error', error)
      console.log(error)
      CaptchaHasBeenTriggered = false
      ipcRenderer.send('TriggeredCheck', CaptchaHasBeenTriggered)
      location.reload()
    }

    window.onerror = () => {
     location.reload()
    }

    ipcRenderer.on("triggerCaptcha", async () => {
      CaptchaHasBeenTriggered = true
      const captchaID = window.grecaptcha.render("gc", {
        theme: "dark",
        sitekey: "6LeWwRkUAAAAAOBsau7KpuC9AV-6J8mhw4AjC3Xz",
        callback: "callback",
      })
      //window.grecaptcha.execute(captchaID) //for invisible captcha
    })

    ipcRenderer.on('checkIfTriggered', async () => {
      ipcRenderer.send('TriggeredCheck', CaptchaHasBeenTriggered)
    })
  }

})