const express = require("express");
const http = require('http')
var app = express()
var port = 5050

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/home.html');
})

http.createServer(app).listen(port, () => {
    console.log(`Express server listening on port ${port}`);
});