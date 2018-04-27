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
                sender ? sender !== child && child.send(message) : child.send(message);
            }
            catch (err) {
                delete children[child.id];
            }
        })
    }

    function listen(child) {
        if(cluster.isMaster) {
            children[child.id] = child;

            child.on('message', msg => {
                let {event, args} = msg;
                if (event.toUpperCase() === 'BROADCAST') {
                    _broadcast(child, msg._event, ...args);
                }
                else emitter.emit(event, ...args, child);
            });
        }
        else {
            child.on('message', (msg) => {
                let {event, args} = msg;
                emitter.$emit(event, ...args);
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
            process.send(message);
        }
        else _broadcast(void 0, event, ...args);
    }
}

module.exports = MessageBus;