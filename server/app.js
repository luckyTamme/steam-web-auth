'use strict';
var express = require('express');
var app = express();
var steamTotp = require('steam-totp');
var steamUser = require('steam-user');
var steamTradeOfferManager = require('steam-tradeoffer-manager');
var steamCommunity = require('steamcommunity');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var readLine = require('readline-sync');

if (!fs.existsSync('settings.json')) {
    var settings = {};
    settings.steamUser = readLine.question('Steam username: ');
    settings.steamPassword = readLine.question('Steam Password: ');
    settings.shared_secret = readLine.question('shared_secret: ');
    settings.identity_secret = readLine.question('identity_secret: ');
    settings.port = readLine.question('port: ');
    fs.writeFileSync('settings.json', JSON.stringify(settings));
}

var settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));

var secret = settings.shared_secret;
var identity = settings.identity_secret;

var startTimer = setInterval(function () {
    if (new Date().getSeconds() === 0) {
        var codeTimer = setInterval(function () {
            io.emit('newCode', steamTotp.generateAuthCode(secret));
        }, 30000);
        clearInterval(startTimer);
    }
}, 100);

var logOnOptions = {
    "accountName": settings.steamUser,
    "password": settings.steamPassword,
    "twoFactorCode": steamTotp.getAuthCode(secret)
};

var client = new steamUser();
var community = new steamCommunity();

var manager = new steamTradeOfferManager({
    'steam': client,
    'domain': 'localhost',
    'language': 'en'
});

client.logOn(logOnOptions);

client.on('webSession', function (sessionID, cookies) {
    community.setCookies(cookies);
    manager.setCookies(cookies);
    server.listen(settings.port);
    console.log('Running on port ' + settings.port);
    /*var pollingTimer = setInterval(function () {
        if (Object.keys(io.sockets.sockets).length > 0) {
            sendConfirmations();
        }
    }, 2500);*/
});

app.use(express.static('files', {
    etag: true
}));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function (socket) {
    socket.on('requestCode', function () {
        socket.emit('newCode', steamTotp.generateAuthCode(secret));
        sendConfirmations();
    });
    socket.on('confirmationDetails', (creator) => {
        manager.getOffer(creator, (err, offer) => {
            var give = [];
            var receive = [];
            if (err)
                console.log(err);
            else {
                offer.itemsToGive.forEach((item) => {
                    give.push({ name: item.market_hash_name, image: item.getImageURL() });
                });
                offer.itemsToReceive.forEach((item) => {
                    receive.push({ name: item.market_hash_name, image: item.getImageURL() });
                });
            }
            community.getSteamUser(offer.partner, (err, user) => {
                if (err) {
                    console.log(err);
                    socket.emit('notify', { message: err.message, type: 'danger' });
                }
                socket.emit('items', { toGive: give, toReceive: receive, creator: creator, partner: { name: user.name, url: user.customURL }, message: offer.message });
            });
        });
    });
    socket.on('actOnTrade', (data) => {
        var time = getTime();
        if (data.accept)
            var confKey = steamTotp.getConfirmationKey(identity, time, 'allow');
        else
            var confKey = steamTotp.getConfirmationKey(identity, time, 'cancel');
        community.respondToConfirmation(data.info.id, data.info.key, time, confKey, data.accept, (err) => {
            if (err) {
                console.log(err);
                socket.emit('notify', { message: err.message, type: 'danger' });
            }
            else {
                if (data.accept)
                    socket.emit('notify', { message: 'Trade accepted!', type: 'success' });
                else
                    socket.emit('notify', { message: 'Trade declined!', type: 'info' });
            }
        });
        setTimeout(function () { sendConfirmations(true) }, 750);
    });
    socket.on('sell', (data) => {
        var time = getTime();
        if (data.accept)
            var confKey = steamTotp.getConfirmationKey(identity, time, 'allow');
        else
            var confKey = steamTotp.getConfirmationKey(identity, time, 'cancel');
        community.respondToConfirmation(data.id, data.key, time, confKey, data.accept, (err) => {
            if (err) {
                console.log(err);
                socket.emit('notify', { message: err.message, type: 'danger' });
            }
            else {
                if (data.accept)
                    socket.emit('notify', { message: 'Listings confirmed!', type: 'success' });
                else
                    socket.emit('notify', { message: 'Listings declined!', type: 'info' });
            }
        });
        setTimeout(function () { sendConfirmations(true) }, 750);
    });
});

function sendConfirmations(closeModal = false) {
    var time = getTime();
    var confKey = steamTotp.getConfirmationKey(identity, time, 'conf');
    community.getConfirmations(time, confKey, function (err, confirmations) {
        io.emit('confirmations', { confirmations: confirmations, closeModal: closeModal });
    });
}

function getTime() {
    return Math.floor(Date.now() / 1000);
}