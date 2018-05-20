'use strict';

const cluster = require('cluster');
const EventEmitter = require('events');

function MessageBus() {
    let emitter = new EventEmitter();

    const children = {};

    emitter.listen = listen;
    emitter.broadcast = broadcast;
    emitter.mute = mute;
    if(cluster.isWorker) {
        emitter.$emit = emitter.emit;
        emitter.emit = emit;
    }

    cluster.on('exit', function(worker, code, signal) {
        mute(worker);

        worker = cluster.fork();
        listen(worker);
    });

    return emitter;

    function _broadcast (sender, event, ...args) {
        let message = {event, args};

        let _children = Object.entries(children);

        _children.forEach(item => {
            let [id, child] = item;

            try {

                sender ? sender !== child && child.send(event, ...args) : child.send(event, ...args);
                //console.log('MESSAGE SENT:', message);
            }
            catch (err) {
                console.log('BROADCAST EXCEPTION:', event, err);

                delete children[child.id];
            }
        })
    }

    function listen(child) {
        if(cluster.isMaster) {
            children[child.id] = child;

            child.$send = child.send;

            child.send = function (event, ...args) {
                let message = {event, args};
                child.$send(message); //send to worker
            };

            child.on('message', msg => {
                let {event, args} = msg;

                //console.log('ON MESSAGE:', event, args);

                if (event.toUpperCase() === 'BROADCAST') {
                    _broadcast(child, msg._event, ...args);
                }
                else emitter.emit(event, ...args, child); //self master trigger on
            });
        }
        else {
            child.on('message', (msg) => {
                let {event, args} = msg;
                try {
                    emitter.$emit(event, ...args); //self worker trigger on
                    //console.log('EMITED:', event);
                }
                catch (err) {
                    console.log('emitter:', emitter);
                }
            });
        }
    }

    function mute(child) {
        delete children[child.id];
    }

    function emit(event, ...args) {
        let message = {event, args};
        process.send(message); //send to master
    }

    function broadcast(event, ...args) {
        if(cluster.isWorker) {
            let message = {event: 'broadcast', _event: event, args};
            process.send(message); //send to master to broadcast
        }
        else _broadcast(void 0, event, ...args);
    }
}

module.exports = MessageBus;
