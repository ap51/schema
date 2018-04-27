//process.execArgv[0] = process.execArgv[0].replace('-brk', '');
"use strict";

const https = require('https');
const path = require('path');
const cluster = require('cluster');

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

let cpuCount = require('os').cpus().length;

const MessageBus = require('./ipcemitter');

if(cluster.isMaster) {

    process.$bus = MessageBus();

    for (let i = 0; i < cpuCount; i++) {
        let worker = cluster.fork();

        process.$bus.listen(worker);
    }

    process.$bus.on('proxyme', (module, worker) => {
        console.log('PROXY:', module);
        process.$bus.broadcast('proxyme', {kdkd:''})
    });

    process.$bus.on('execute', async (module, eid, ...args) => {
        let worker = args.pop();

        let $module = require(module);
        let [method, ...params] = args;
        let result = await $module[method](...params);

        worker.send(`executed:${eid}`, null, result);
    });

    /////////////////////////////////////////////////////////////////
/*
    process.$bus.on('event', (...args) => {
        console.log('EVENT:', args[0], args[1]);
    });

    process.$bus.on('known', (pid, type, worker) => {
        console.log('KNOWN:', pid, type, worker.id);
    });

    process.$bus.emit('event', 'from master'); //только для себя вызов переделать по идее на broadcast

    process.$bus.broadcast('init', new Date());
*/
}

let name_spaces = {};
let name_spaces_sockets = [];

if(cluster.isWorker) {

    process.$bus = MessageBus();
    process.$bus.listen(process);

/*
    process.$bus.emit('event', {data: 'asdasdas'}, 'from worker');

    process.$bus.on('init', (date) => {
        console.log('INIT IN SERVER:', date);
    });
    
    process.$bus.on('hello', (text, pid) => {
        console.log('HELLO:', process.pid, text, pid);
    });
*/



////////////////////////////
    fs.readdir('./services/', (err, dirs) => {
        dirs.forEach(async dir => {
            console.log(dir);
            try {
                const io = require('socket.io')(httpsServer, {
                    path: `/${dir}/_socket_`
                });

                name_spaces[`${dir}:${cluster.worker.id}`] = io.of(`/${dir}`);

                name_spaces[`${dir}:${cluster.worker.id}`].on('connection', function(client){
                    name_spaces_sockets[`${dir}:${cluster.worker.id}:${client.id}`] = client;

                    client.on('disconnect', function(){
                        delete name_spaces_sockets[`${dir}:${cluster.worker.id}:${client.id}`];
                    });

                });


                app.use(`/${dir}/`, (req, res, next) => {
                    req.io = name_spaces[`${dir}:${cluster.worker.id}`];
                    next();
                });

                app.use(`/${dir}/`, require(`./services/${dir}/router`).router);
            }
            catch (err) {
                console.log(err);
            }
        });

        httpsServer.listen(httpsListenPort);

        console.log(`https server linten on ${httpsListenPort} port.`);
    });

}

process.on('unhandledRejection', err => {
    //throw err;
    console.log('unhandledRejection => ', err)
});

    
app.all('*', function(req, res, next) {
    next();
});
