const {
    app,
    BrowserWindow,
    ipcMain,
    ipcRenderer
} = require('electron');
const {
    getRandomInt,
    rndString,
    sleep,
    getUserAgent,
    findProduct,
    isStopped,
    notify
} = require('./fileUtils');
const server = require('./server');
const Store = require('electron-store');
const open = require('open');
const store = new Store();

const log = require('electron-log');

log.catchErrors()

var Cookie = require('request-cookies').Cookie;

const puppeteer = require("puppeteer-extra");
const stealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(stealth());

const EventEmitter = require('events')
class MyEmitter extends EventEmitter {};
const myEmitter = new MyEmitter();
myEmitter.setMaxListeners(450);

let mainWindow
let harvesterWindow
var isCurrentlySolving = false
var harvesterisReady = false

var captchaBank = {
    required: 0,
    tokens: []
}

if (process.platform.includes('win')) app.setAppUserModelId(process.execPath)

setInterval(async () => {
    if (harvesterWindow) {
        //console.log(captchaBank['required'], isCurrentlySolving, harvesterisReady)
        if (captchaBank['required'] > 0 && !isCurrentlySolving && harvesterisReady) {
            console.log('triggerCaptcha')
            harvesterWindow.webContents.send('triggerCaptcha')
            isCurrentlySolving = true
        }
    } else if (captchaBank['tokens'].length >= 1) {
        for (var a in captchaBank['tokens']) {
            if (new Date().getTime() > captchaBank['tokens']['expiration']) captchaBank['tokens'].splice(a, 1)
        }
    }
}, 50);

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        hasShadow: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        },
        height: 800,
        minHeight: 800,
        width: 1300,
        minWidth: 1300,
        title: 'BOEHLER IO DESKTOP',
        icon: __dirname + '/images/logo.png'
    })

    mainWindow.loadURL('http://localhost:5050/')
    mainWindow.webContents.openDevTools()
    mainWindow.on('page-title-updated', (evt) => {
        evt.preventDefault();
    });

    mainWindow.on('close', async () => {
        var tasks = await store.get('tasks')
        for (var a in tasks) {
            tasks[a]['status'] = 'stopped'
        }
        store.set('tasks', tasks)
    });
})

ipcMain.on('saveSettings', async (event, data) => {
    store.set('settings', data)
    console.log(await store.get('settings'))
    notify('Saved!', 'Your settings have been saved!')
})

ipcMain.on('saveProfile', async (event, data) => {
    store.set('profile', data)
    console.log(data)
    notify('Saved!', 'Your profile has been saved!')
})

ipcMain.on('loadProfile', async (event, data) => {
    mainWindow.webContents.send('profile', await store.get('profile'))
})

ipcMain.on('saveTask', async (event, data) => {
    log.info('Saving task')
    log.info(JSON.stringify(data, null, 2))
    var tasks = await store.get('tasks')
    if (!tasks || !Array.isArray(tasks)) tasks = []
    for (var a = 0; a < data['taskAmount']; a++) {
        data['id'] = await rndString()
        data['status'] = 'stopped'
        tasks.push(data)
    }
    store.set('tasks', tasks)
    mainWindow.loadURL('http://localhost:5050/')
    console.log(JSON.stringify(tasks, null, 2))
})

ipcMain.on('deleteTask', async (event, data) => {
    var tasks = await store.get('tasks')
    const index = tasks.findIndex(item => item['id'] === data)
    if (index !== -1) tasks.splice(index, 1)
    store.set('tasks', tasks)
    mainWindow.webContents.send('tasks', await store.get('tasks'))
})

ipcMain.on('stopTask', async (event, id) => {
    var tasks = await store.get('tasks')
    const index = tasks.findIndex(item => item['id'] === id)
    var task = tasks[index]
    if (task['status'] === 'stopped') {
        console.log('task is already stopped')
        return
    }
    task['status'] = 'stopped'
    tasks[index] = task
    store.set('tasks', tasks)
    mainWindow.webContents.send('tasks', await store.get('tasks'))
})

ipcMain.on('loadTasks', async (event, data) => {
    mainWindow.webContents.send('tasks', await store.get('tasks'))
})

ipcMain.on('loadSettings', async (event, data) => {
    mainWindow.webContents.send('settings', await store.get('settings'))
})

ipcMain.on('startTask', async (event, id) => {
    var tasks = await store.get('tasks')
    var data = (tasks.filter(item => item['id'] === id))[0]
    if (data['status'] !== 'stopped') {
        console.log('task is already running')
        return
    }
    changeTaskStatus(id, 'searching')
    await sleep(250)
    myEmitter.emit('task', id)
})

ipcMain.on('startAllTasks', async (event) => {
    const tasks = await store.get('tasks')
    for (var a in tasks) {
        changeTaskStatus(tasks[a]['id'], 'searching')
        await sleep(250)
        myEmitter.emit('task', tasks[a]['id'])
        await sleep(50)
    }
})

ipcMain.on('harvesterIsReady', async (event, data) => {
    harvesterisReady = true
    isCurrentlySolving = false
    console.log('harvesterIsReady', harvesterisReady)
})

ipcMain.on('captcha-done', async (event, token) => {
    var expiration = new Date()
    expiration.setSeconds(expiration.getSeconds() + 110)
    captchaBank['tokens'].push({
        token: token,
        timestamp: new Date().getTime(),
        expiration: expiration.getTime()
    })
    captchaBank['required']--
    isCurrentlySolving = false
    harvesterisReady = false
})

ipcMain.on('captcha-error', async (event, error) => {
    console.log(error)
    isCurrentlySolving = false
    //harvesterisReady = false

})

ipcMain.on('test', (event, data) => {
    console.log(data)
})

ipcMain.on('TriggeredCheck', (event, data) => {
    console.log('triggeredCheck', data)
    if (!data) isCurrentlySolving = false
})
async function changeTaskStatus(id, status, success) {
    var tasks = await store.get('tasks')
    var task = (tasks.filter(item => item['id'] === id))[0]
    var index = tasks.findIndex(item => item['id'] === id)
    task['status'] = status
    mainWindow.webContents.send('statusChange', {
        id: id,
        status: task['status']
    }, success)
    tasks[index] = task
    await store.set('tasks', tasks)
}

function startHarvester() {
    harvesterWindow = ''
    harvesterWindow = new BrowserWindow({
        width: 440, // 400
        height: 610,
        resizable: true,
        //frame: false,
        autoHideMenuBar: true,
        parent: mainWindow,
        show: true,
        webPreferences: {
            preload: __dirname + '\\harvester\\harvester.js',
            nodeIntegration: true,
            webSecurity: false
        },
        title: 'Captcha Harvester',
        icon: __dirname + '/images/logo.png'
    });

    //harvesterWindow.webContents.openDevTools()

    harvesterWindow.on('page-title-updated', (evt) => {
        evt.preventDefault();
    });
    harvesterWindow.loadURL('https://www.supremenewyork.com/index', {
        userAgent: 'Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Mobile Safari/537.36'
    })

    harvesterWindow.on("close", () => {
        harvesterWindow = undefined
        isCurrentlySolvingCaptcha = false
        harvesterisReady = false
    });
}

myEmitter.on('task', async (id) => {
    setImmediate(async () => {
        log.info(`Starting task ${id}`)
        if (!harvesterWindow) startHarvester()
        const settings = await store.get('settings')
        const region = settings['region']
        var tasks = await store.get('tasks')
        var data = (tasks.filter(item => item['id'] === id))[0]
        var success = false
        var isStatusEndpoint = false
        console.log(id, new Date().getTime())
        if (data['status'] === 'stopped') {
            log.info(`Stopped task ${id}`)
            console.log('stopped')
            return
        }

        const userAgent = await getUserAgent()
        data['userAgent'] = userAgent

        const product = await findProduct(data)

        if (!product) {
            log.info('No product data!')
            myEmitter.emit('task', id)
            return
        }

        console.log(product)

        changeTaskStatus(id, 'start browser')
        //myEmitter.setMaxListeners(Math.max(myEmitter.getMaxListeners() - 1, 0))
        var browser = undefined
        try {
            var browserOptions = {
                headless: true,
                args: [
                    `--window-size=${400},${600}`,
                    '--no-sandbox',
                    "--disable-gpu",
                    "--start-maximized",
                    "--disable-infobars",
                    '--disable-extensions'
                ],
                ignoreHTTPSErrors: true,
                executablePath: settings['executablePath'] ||"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
            }
            if (data['proxy']) {
                console.log(`Task using proxy: ${data['proxy']}`)
                log.info(`Task using proxy: ${data['proxy']}`)
            }
            browser = await puppeteer.launch(browserOptions)

            log.info('Started Browser')

            const taskStatus = setInterval(checkTaskStatus, 1000);

            async function checkTaskStatus() {
                var tasks = await store.get('tasks')
                var data = (tasks.filter(item => item['id'] === id))[0]
                if (data['status'] === 'stopped') {
                    await browser.close()
                    return
                } else if (!browser || success) {
                    clearInterval(taskStatus)
                    return
                }
            }

            const pages = await browser.pages() || []
            if (pages.length >= 1) await pages[0].close()

            var page = await browser.newPage()
            await page.setRequestInterception(true);
            await page.setViewport({
                width: 400,
                height: 800,
                isMobile: true,
                hasTouch: false
            })
            await page.setUserAgent(userAgent);
            page.setDefaultTimeout(4000);
            page.setDefaultNavigationTimeout(10000);

            page.on('request', async interceptedRequest => {
                var requestURL = interceptedRequest.url()
                //console.log('intercepted', requestURL)
                if (requestURL.includes('paypal') && requestURL.includes('checkout')) {
                    success = true
                    changeTaskStatus(id, 'paypal', true)
                    await open(requestURL);
                    log.info('PayPal redirect ' + requestURL)
                    notify('PayPal redirect', `You've been redirected to PayPal`, requestURL)
                    await page.close();
                    await browser.close();
                    page = undefined
                    browser = undefined
                } else if (requestURL.endsWith('.jpg')) {
                    interceptedRequest.abort();
                } else if (requestURL.includes('status.json')) {
                    console.log(requestURL)
                    log.info('Requesting status endpoint')
                    isStatusEndpoint = true
                    checkStatus(requestURL)
                    interceptedRequest.continue();
                } else {
                    interceptedRequest.continue();
                }
            })

            const productURL = `https://www.supremenewyork.com/mobile/#products/${product['id']}/${product['style']}`

            await page.goto(productURL)

            changeTaskStatus(id, 'add to cart')

            await page.waitForSelector('#main #size-options', {
                visible: true
            });

            await page.select('#main #size-options', product['size'] + '');

            await page.waitForSelector('div > #product-widgets > #widgets-container > #cart-update > .cart-button', {
                visible: true
            });

            const atcTimestamp = new Date().getTime()
            await page.click('div > #product-widgets > #widgets-container > #cart-update > .cart-button');

            await page.waitForSelector('#container > header > #cart-link > #checkout-now > span', {
                visible: true,
            });

            var cookies = (await page.evaluate(() => document.cookie)).split(';')

            var cartValid = false

            for (var a in cookies) {
                const cookie = new Cookie(cookies[a])
                if (cookie['key'] === 'pure_cart') {
                    const value = decodeURIComponent(cookie['value'])
                    //console.log(typeof value, value.includes(product['size']))
                    if (value.includes(product['size'])) cartValid = true
                }
            }
            if (!cartValid) {
                changeTaskStatus(id, 'ATC failed')
                log.info('Cart is invalid')
                await browser.close()
                myEmitter.emit('task', id)
                return
            } else console.log('cart is valid!')
            await sleep(200);
            await page.click('#container > header > #cart-link > #checkout-now > span');

            if (region === 'eu') {
                await page.waitForSelector('#billing-info #order_billing_name', {
                    visible: true
                })
            } else {
                await page.waitForSelector('#billing-info #order_bn', {
                    visible: true
                })
            }
            captchaBank['required']++

            changeTaskStatus(id, 'Fill out data')

            log.info('Fill out data')

            const form = await formParser().catch(e => {
                console.log(e)
            })

            var billingProfile = await getBillingProfile(data['profile'])
            if (region === 'us' && billingProfile['type'] !== 'paypal') billingProfile['type'] = 'credit_card'

            const dataEU = {
                'order[billing_name]': 'name',
                'order[email]': 'email',
                'order[tel]': 'phone',
                'order[billing_address]': 'address',
                'order[billing_address_2]': 'address2',
                'order[billing_address_3]': 'address3',
                'order[billing_city]': 'city',
                'order[billing_zip]': 'zip',
                'order[billing_country]': 'country',
                'credit_card[type]': 'type',
                'credit_card[cnb]': 'ccnumber',
                'credit_card[month]': 'month',
                'credit_card[year]': 'year',
                'credit_card[ovv]': 'cvv'
            }

            for (var a in dataEU) {
                const field = (form.filter(item => item['name'] === a))[0]
                await page.evaluate(async (field, data) => {
                    console.log(field['id'], data, field)
                    $(`#${field['id']}`).val(data)
                }, field, billingProfile[dataEU[a]])
                if (billingProfile[dataEU[a]] === 'paypal') break
            }

            await page.evaluate(() => document.querySelector('#order_terms').click())

            var location = await page.evaluate(() => document.location.href)
            if (location === productURL) {
                await browser.close()
                myEmitter.emit('task', id)
                return
            }

            const pageLoad = new Date().getTime()
            changeTaskStatus(id, 'captcha required')
            const captchaInterval = setInterval(waitforToken, 200);

            async function formParser() {
                return new Promise(async (resolve, reject) => {
                    if (!page) {
                        reject('page has been closed [form parser]')
                        return
                    }
                    var objects = await page.evaluate(async () => {
                        var inputs = $('input,select')
                        var IDs = []
                        for (var a in inputs) {
                            if (inputs[a]['id']) IDs.push({
                                id: inputs[a]['id'],
                                type: $(`#${inputs[a]['id']}`).prop('nodeName'),
                                placeholder: $(`#${inputs[a]['id']}`).attr('placeholder') || undefined,
                                name: $(`#${inputs[a]['id']}`).attr('name')
                            })
                        }
                        return IDs
                    })

                    resolve(objects)
                })
            }

            async function getBillingProfile(profileName) {
                return (await store.get('profile'))
            }

            async function waitforToken() {
                //console.log(captchaBank['tokens'])
                for (var a in captchaBank['tokens']) {
                    if (captchaBank['tokens'][a]['timestamp'] > atcTimestamp) {
                        const token = captchaBank['tokens'][a]['token']
                        captchaBank['tokens'].splice(a, 1)
                        proceedCheckout(token)
                        clearInterval(captchaInterval)
                    }
                }
            }

            async function proceedCheckout(token) {
                const secondDate = new Date().getTime()
                await sleep(data['checkoutDelay'] - (secondDate - pageLoad) * 1000)
                changeTaskStatus(id, 'submitting')
                await page.evaluate(async (token) => {
                    $('#g-recaptcha-response').val(token)
                    //document.getElementById("mobile_checkout_form").setAttribute("data-verified", "done")
                }, token)
                await page.click('#checkout-form > .checkout-section-container > #checkout-buttons > #submit_button > span')
                await sleep(3000)
                if (!success && page !== undefined) {
                    const siteChecker = setInterval(checkSite, 500);
                    async function checkSite() {
                        location = await page.evaluate(() => document.location.href)
                        if (location.includes('checkout.json')) {
                            clearInterval(siteChecker)
                            changeTaskStatus(id, 'failed', false)
                            await browser.close()
                            await sleep(500)
                            myEmitter.emit('task', id)
                            return
                        }
                        var orderNo = await page.evaluate(() => {
                            return $('#order-id').val()
                        })
                        if (isStatusEndpoint) {
                            clearInterval(siteChecker)
                            return
                        } else if (location.includes('chargeError')) {
                            clearInterval(siteChecker)
                            changeTaskStatus(id, 'failed', false)
                            await browser.close()
                            await sleep(500)
                            myEmitter.emit('task', id)
                            return
                        } else if (orderNo) {
                            clearInterval(siteChecker)
                            changeTaskStatus(id, orderNo, true)
                            log.info(`Task ${id} is paid! ${orderNo}`)
                            await page.screenshot({
                                path: app.getPath('desktop') + `/BOEHLERIO_${id}.png`
                            })
                            await browser.close()
                            return
                        } else if (location.includes('dup')) {
                            clearInterval(siteChecker)
                            changeTaskStatus(id, 'dupicate', false)
                            await browser.close()
                            await sleep(500)
                            return
                        }
                    }
                }
            }

            async function checkStatus(url) {
                var orderData = await fetch(url)
                    .then(async resp => {
                        return (await resp.json())
                    })
                    .catch(e => {
                        console.log(e)
                    })
                console.log(JSON.stringify(orderData, null, 2))
                log.info(`Task ${id} order status: ${orderData['status']}`)
                if (orderData['status'] !== 'paid' || orderData['status'] !== 'failed') {
                    if (orderData['status'] === 'cca') changeTaskStatus(id, '3DS authentication required')
                    await sleep(250)
                    checkStatus(url)
                } else if (orderData['status'] === 'paid') {
                    changeTaskStatus(id, `#${orderData['id'] || 'NaN'}`, true)
                    log.info(`Task ${id} is paid! ${orderData['id']}`)
                    await sleep(250)
                    await page.screenshot({
                        path: app.getPath('desktop') + `/BOEHLERIO_${data['id']}.png`
                    })
                    await page.close()
                    await browser.close()
                    return
                } else if (orderData['status'] === 'failed') {
                    changeTaskStatus(id, 'failed', false)
                    await page.close()
                    await browser.close()
                    myEmitter.emit('task', id)
                    return
                }
            }
        } catch (error) {
            console.log('Browser mode error', error, typeof browser)
            log.error('Browser Mode error')
            log.error(error)
            if (browser) await browser.close()
            myEmitter.emit('task', id)
        }
    })

})