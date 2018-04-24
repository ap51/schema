//process.execArgv[0] = process.execArgv[0].replace('-brk', '');
"use strict";

const https = require('https');
const path = require('path');

const express = require('express');

const staticFileMiddleware = express.static('public', {});
const history = require('connect-history-api-fallback');

const fs = require('fs');
const key  = fs.readFileSync('ssl/key.pem', 'utf8');
const cert = fs.readFileSync('ssl/cert.pem', 'utf8');
const credentials = {key, cert};

const httpsListenPort = 8000;

const app = express();

app.use('/:service', staticFileMiddleware);

app.use('/:service', history({
    disableDotRule: true,
    verbose: false
}));

app.use('/:service', staticFileMiddleware);

let httpsServer = https.createServer(credentials, app);

let router_module = require(`./router`);

app.use(`/schema/`, router_module.router);

app.all('*', function(req, res, next) {
    next();
});


httpsServer.listen(httpsListenPort);

console.log(`https server linten on ${httpsListenPort} port.`);

process.on('unhandledRejection', err => {
    //throw err;
    console.log('unhandledRejection => ', err)
});