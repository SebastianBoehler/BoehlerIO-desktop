const DiscordRPC = require('discord-rpc');
const fetch = require('node-fetch');
var HttpsProxyAgent = require('https-proxy-agent');
var Cookie = require('request-cookies').Cookie;
const {
    Notification
} = require('electron');
const Store = require('electron-store');
const store = new Store({
    encryptionKey: 'AS-asd-654'
});

const Discord = require('discord.js');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

String.prototype.replaceAll = function (searchStr, replaceStr) {
    var str = this;

    // escape regexp special characters in search string
    searchStr = searchStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    return str.replace(new RegExp(searchStr, 'gi'), replaceStr);
}


module.exports = {

    rndString: rndString,

    sleep: sleep,

    findProduct: findProduct,

    getUserAgent: getUserAgent,

    formatCookie: formatCookies,

    isStopped: isStopped,

    notify: notify,

    discordMessage: discordMessage
}

function rndString() {
    return new Promise((resolve, reject) => {
        var tokens = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            chars = 5,
            segments = 4,
            keyString = "";

        for (var i = 0; i < segments; i++) {
            var segment = "";

            for (var j = 0; j < chars; j++) {
                var k = getRandomInt(0, 35);
                segment += tokens[k];
            }

            keyString += segment;

            if (i < (segments - 1)) {
                keyString += "-";
            }
        }

        resolve(keyString)
    })

}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function findProduct(task) {
    return new Promise(async (resolve, reject) => {

        const {
            data: mobileStock,
            cookieString
        } = await fetch(`https://www.supremenewyork.com/mobile_stock.json?rnd=${await rndString()}`, {
                "headers": {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "accept-language": "de",
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "none",
                    "upgrade-insecure-requests": "1",
                    "user-agent": task['userAgent']
                },
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "omit",
                "timeout": 1500
            })
            .then(async resp => {
                let cookieString = resp.headers.get('set-cookie')
                const data = await resp.json()
                //console.log('mobile stock', data)
                return {
                    data,
                    cookieString
                }
            })
            .catch(e => {
                console.log('mobile stock error',e)
                return undefined
            })

        const categoryData = mobileStock['products_and_categories'][task['category']]
        //console.log(categoryData)
        const keywords = task['keywords'].replaceAll(' ', '').split(',')

        var product = {}
        for (var a in categoryData) {
            console.log(categoryData[a]['name'])
            const match = await checkKeywords(categoryData[a]['name'], keywords)
            if (match) {
                console.log('match!')
                product = categoryData[a]
                break
            }
        }

        if (!product) {
            resolve(undefined)
            return
        }

        await sleep(150)

        console.log(product['id'])

        const productStock = await fetch(`https://www.supremenewyork.com/shop/${product['id']}.json?rnd=${await rndString()}`, {
                "headers": {
                    "user-agent": task['userAgent'],
                    "cookie": cookieString
                },
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "omit",
                timeout: 2500
            })
            .then(async resp => {
                //console.log(await resp.text())
                const data = await resp.json()
                console.log(data)
                return data
            })
            .catch(e => {
                console.log('product endpoint',e)
                return undefined
            })

        if (!productStock) {
            resolve(undefined)
            return
        }

        var isOneSizeItem = false
        var style = await findStyle(productStock)

        const size = await findSize(task['size'], style)

        if (!style || !size) {
            resolve(undefined)
            return
        }

        resolve({
            size: size,
            style: style,
            id: product['id'],
            item: product,
            isOneSizeItem: isOneSizeItem
        })


        async function findSize(size, style2) {
            size = size.toUpperCase()
            if (!Array.isArray(style2)) {
                const sizes = (productStock['styles'].filter(item => item['id'] === style2))[0]['sizes']
                if (sizes.length === 1) isOneSizeItem = true
                for (var a in sizes) {
                    const name = sizes[a]['name'].toUpperCase()
                    //console.log(size, name, sizes[a]['stock_level'])
                    if ((size === 'ANY' || size === 'RANDOM' || size === '') && sizes[a]['stock_level'] === 1) {
                        product['size'] = sizes[a]['name']
                        return sizes[a]['id']
                    } else if (name.includes(size) && sizes[a]['stock_level'] === 1 && size !== '') {
                        product['size'] = sizes[a]['name']
                        return sizes[a]['id']
                    }
                }
            } else {
                console.log('style', style2)
                for (var b in style2) {
                    const sizes = (productStock['styles'].filter(item => item['id'] === style2[b]))[0]['sizes']
                    if (sizes.length === 1) isOneSizeItem = true
                    for (var a in sizes) {
                        const name = sizes[a]['name'].toUpperCase()
                        //console.log(size, name, sizes[a]['stock_level'])
                        if ((size === 'ANY' || size === 'RANDOM' || size === '') && sizes[a]['stock_level'] === 1) {
                            style = style[b]
                            product['size'] = sizes[a]['name']
                            product['style'] = (productStock['styles'].filter(item => item['id'] === style2[b]))[0]['name']
                            return sizes[a]['id']
                        } else if (name.includes(size) && sizes[a]['stock_level'] === 1 && size !== '') {
                            style = style[b]
                            product['size'] = sizes[a]['name']
                            product['style'] = (productStock['styles'].filter(item => item['id'] === style2[b]))[0]['name']
                            return sizes[a]['id']
                        }
                    }
                }
            }
        }

        async function findStyle(productStock) {
            var style = task['color'].toUpperCase()
            if (style === 'ANY' || style === 'RANDOM' || style === '') {
                return productStock['styles'].map(item => item['id'])
            }
            var styleID = undefined
            for (var a in productStock['styles']) {
                const name = productStock['styles'][a]['name'].toUpperCase()
                if (name.includes(style)) {
                    product['style'] = productStock['styles'][a]['name']
                    styleID = productStock['styles'][a]['id']
                    break
                }
            }
            return styleID
        }

        async function checkKeywords(string, keywords) {
            string = string.toUpperCase()
            var count = 0
            for (var b in keywords) {
                const keyword = keywords[b].toUpperCase()
                if (string.includes(keyword)) count++
            }
            if (count >= keywords.length * 0.75) return true
            else false
        }

    })
}

async function getUserAgent() {
    const UAs = [
        'Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 7.0; SM-G892A Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/60.0.3112.107 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 7.0; SM-G930VC Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/58.0.3029.83 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 6.0.1; SM-G935S Build/MMB29K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/55.0.2883.91 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 6.0.1; SM-G920V Build/MMB29K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.98 Mobile Safari/537.36',
    ]
    const UA = UAs[Math.floor(Math.random() * (UAs.length - 0)) + 0]
    return UA
}

async function formatCookies(oldCookieString, newCookieString) {
    oldCookieString = oldCookieString.replaceAll(' ', '').split(';')
    var oldCookies = oldCookieString.map(item => {
        return {
            name: new Cookie(item).key,
            value: new Cookie(item).value
        }
    })

    var oldCookiesObject = {}

    //console.log('oldCookies',oldCookies)
    for (var a in oldCookies) {
        if (!oldCookies[a]) {
            oldCookies.splice(a, 1);
            a--
        } else if (oldCookies[a]['name'].length <= 1) {
            oldCookies.splice(a, 1);
            a--
        } else oldCookiesObject[oldCookies[a]['name']] = oldCookies[a]['value']
    }

    //console.log('oldCookiesObject', oldCookiesObject)

    newCookieString = newCookieString.replaceAll(' ', '').split(';')
    var newCookies = newCookieString.map(item => {
        if (!item.includes('path') && item) {
            return {
                name: new Cookie(item).key,
                value: new Cookie(item).value
            }
        }
    })

    //console.log('newCookies', newCookies)

    for (var a in newCookies) {
        if (!newCookies[a]) {
            newCookies.splice(a, 1);
            a--
        } else {
            //console.log('setting new value')
            oldCookiesObject[newCookies[a]['name']] = newCookies[a]['value']
        }
    }

    var string = ''
    for (var c in oldCookiesObject) {
        string += `${c}=${oldCookiesObject[c]}; `
    }
    //console.log('formatted cookies', string)
    return string
}

async function isStopped(task) {
    if (task['status'] === 'stopped') return true
    else false
}

async function notify(title, message, url, image) {
    var options = {}

    if (message) options['body'] = message
    if (image) options['icon'] = image

    console.log(options)

    //const myNotification = new Notification(title, options)
    //myNotification.show()
}

async function discordMessage(data) {
    const settings = store.get('settings')
    const webhook = settings['discordWebhook'].split('/')
    if (webhook.length >= 5 && discordNotifications) {
        const webhookClient = new Discord.WebhookClient(webhook[webhook.length - 2], webhook[webhook.length - 1]);
        var embed = new Discord.MessageEmbed()
        embed.setAuthor('BOEHLER IO DESKTOP')
        embed.setDescription(data['message'])
        if (data['productImage']) embed.setThumbnail(`http:${data['productImage']}`)
        embed.addFields({
            name: 'Item',
            value: `${data['item']} [${data['style']}/${data['size']}]`
        })
        if (data['orderID']) embed.addField('Order No', data['orderID'])
        if (data['image']) {
            const attachment = new Discord.MessageAttachment(data['image'], 'taskSuccess.png')
            embed.setImage('attachment://taskSuccess.png')
        }
        if (data['paypal']) embed.addField('PayPal', `[checkout now](${data['paypal']})`)
        webhookClient.send(embed)
    }
}