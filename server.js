const express = require("express");
const http = require('http')
var app = express()
var port = 5050

app.use(express.static(__dirname + '/views'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/home.html');
})

app.get('/settings', function (req, res) {
    res.sendFile(__dirname + '/views/settings.html');
})

app.get('/profiles', function (req, res) {
    res.sendFile(__dirname + '/views/profiles.html');
})

app.get('/task', function (req, res) {
    res.sendFile(__dirname + '/views/task.html');
})

app.get('*', function (req, res) {
    res.sendFile(__dirname + '/views/home.html');
})

http.createServer(app).listen(port, () => {
    console.log(`Express server listening on port ${port}`);
});