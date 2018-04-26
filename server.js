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

let workers = {};
let cpuCount = require('os').cpus().length;
let proxy_modules = [];

const EventEmitter = require('events');

class MasterMessageBus extends EventEmitter {
    constructor(process) {
        super();

        this.process = process;
        this.children = [];
        
        process.$bus = this;

        this._broadcast = function(sender, event, ...args) {
            let message = {event, args};
    
            this.children.forEach(child => {
                sender ? sender !== child && child.send(message) : child.send(message);
                //child.send(message);
            })
        }
    
    }

    push(child) {
        this.children.push(child);

        child.on('message', msg => {
            let {event, args} = msg;
            if(event.toUpperCase() === 'BROADCAST') {
                this._broadcast(child, msg._event, ...args);
            }
            else this.emit(event, ...args, child);
        });
    };

    broadcast(event, ...args) {
        this._broadcast(void 0, event, ...args);
    }
}

if(cluster.isMaster) {
    new MasterMessageBus(process);
    
    process.$bus.on('event', (...args) => {
      //console.log('EVENT:', args);
    });
    
    process.$bus.on('known', (pid, type, worker) => {
        //console.log('KNOWN:', pid, type, worker.id);
    });

    process.$bus.emit('event');

    for (let i = 0; i < cpuCount; i++) {
        let worker = cluster.fork();

        process.$bus.push(worker);
    }

    process.$bus.broadcast('init', new Date());
}

if(cluster.isWorker) {
    class WorkerMessageBus extends EventEmitter {
        constructor(process) {
            super();

            this.process = process;

            process.on('message', (msg) => {
                let {event, args} = msg;
                this.emit(event, ...args, process);
            });

            process.$bus = this;
        }

        send(event, ...args) {
            let message = {event, args};
            process.send(message);
        }

        broadcast(event, ...args) {
            let message = {event: 'broadcast', _event: event, args};
            process.send(message);
        }
    }
    
    new WorkerMessageBus(process);

    process.$bus.send('event', {data: 'asdasdas'}, 'string');

    process.$bus.on('init', (date) => {
        //console.log('INIT IN SERVER:', date);
    });
    
    process.$bus.on('hello', (text, pid) => {
        console.log('HELLO:', process.pid, text, pid);
    });


    //process.send('event', {data: 'asdasdas'}, 'string');



    let router_module = require(`./router`);

    app.use(`/schema/`, router_module.router);
    
    httpsServer.listen(httpsListenPort);

    console.log(`https server linten on ${httpsListenPort} port.`);
}

process.on('unhandledRejection', err => {
    //throw err;
    console.log('unhandledRejection => ', err)
});

    
/*     app.all('*', function(req, res, next) {
        next();
    }); */
