'use strict';

let service = __dirname.split(/\/|\\/g);
service = service.pop();

const fs = require('fs');
const path = require('path');

const JSON5 = require('json5');
const crypto = require('crypto2');
const jwt = require('jsonwebtoken');


const express = require('express');
const bodyParser = require('body-parser');

let router = express.Router();

//const favicon = require('serve-favicon');
//router.use(favicon(path.join(service_path, 'favicon.ico')));

//const multer = require('multer');
//router.upload = multer();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: false}));


let patterns = ['/:section/:component\::id\.:action', '/:section/:component\.:action', '/:section/:component\::id', '/:section/:component'];

let api_patterns = ['/:section/:component\::id\.:action', '/:section/:component\.:action'];
let ui_patterns = ['/:section/:component\::id', '/:section/:component'];

let cache = {};

class CustomError extends Error {
    constructor(params) {
        let {code, message} = params;
        super(message);
        this.code = code;
    }
}

let api = require('./api');

let classes = api.Classes();
let ignore = classes.ignore;

let getKeys = async function (service) {
    //let file_path = path.join(__dirname, 'services', service);

    try {
        let privateKey = fs.readFileSync(path.join(__dirname, 'private.pem'), 'utf8');
        let publicKey = fs.readFileSync(path.join(__dirname, 'public.pem'), 'utf8');
        return (privateKey && publicKey) ? {privateKey, publicKey} : void 0;
    }
    catch (err) {
        let {privateKey, publicKey} = await crypto.createKeyPair();

        fs.writeFileSync(path.join(__dirname, 'private.pem'), privateKey, 'utf-8');
        fs.writeFileSync(path.join(__dirname, 'public.pem'), publicKey, 'utf-8');
    }
};

let keys = getKeys(service); //ERROR MAY OCCURE ASYNC CALL

let encryptRSA = async function(data, publicKey) {
    let buffer = new Buffer(data);
    let encrypted = await crypto.encrypt.rsa(data, publicKey);
    return encrypted;
};

let decryptRSA = async function(data, privateKey) {
    let decrypted = await crypto.decrypt.rsa(data, privateKey);
    return decrypted;
};

let encode = async function (token) {
    keys = await keys;

    token[service].verified = true;

    token[service].data = token[service].data || {session: await crypto.createPassword()};

    token[service].secret && (token[service].secret = await encryptRSA(JSON5.stringify(token[service].secret), token.public || keys.publicKey));

    let encoded = jwt.sign(token, keys.privateKey);
    return encoded;
};

let decode = async function (token) {
    keys = await keys;

    let decoded = {};

    decoded[service] = {};
    let verified = true;

    try {
        decoded = token ? jwt.verify(token, keys.privateKey) : decoded;
    }
    catch (err) {
        decoded = jwt.decode(token);
        verified = false;
    }

    decoded.verified = verified;
    decoded[service] = decoded[service] || {};

    decoded[service].secret && (decoded[service].secret = JSON5.parse(await decryptRSA(decoded[service].secret, keys.privateKey)));
    decoded[service].count = decoded[service].count + 1 || 1;
    return decoded;
};


let jwtHandler = function(options) {

/*
    return async function (req, res, next) {
        next();
    }
*/

    return async function (req, res, next) {
        //console.log('ORIGIN:', req.originalUrl);

        let token = req.headers['token'] || '';

        req.$token = token;

        req.$token = await decode(req.$token);

        if(!req.$token.verified)
            throw new CustomError(401, 'Invalid signature');

        req.token = req.$token[service];

        let access_token = (req.token.secret && req.token.secret.access_token) || req.query.access_token;
        req.query.access_token = void 0;


        req.user = req.token && req.token.secret && req.token.secret.user;
        req.client = req.token && req.token.secret && req.token.secret.client;


        req.headers['authorization'] = access_token && `Bearer ${access_token}`;

        next();
    }
};

let end = function(options) {

    /*
        return async function (req, res, next) {
            next();
        }
    */

    return async function (req, res, next) {

        req.$token[service] = req.token;
        req.$token = await encode(req.$token);

        req.$component = void 0;

        req.$response.token = req.$token;
        req.$response.auth = req.user;

        res.status(200).json(req.$response);
        res.end();
    }
};

router.all(patterns, [jwtHandler(), async function(req, res, next) {
    //JWT ЗДЕСЬ

    //classes = await classes;
    //ignore = await ignore;

    req.$params = req.params;
    req.$params.location = `${req.params.section}.${req.params.component}`;
    req.$params.ident = `${req.$params.component}${req.$params.id ? `_${req.$params.id}` : ''}`;

    let is_ignored = ignore.find(component => component === req.$params.component);

    let name = is_ignored ? req.$params.component : req.$params.location;

    let Class = is_ignored ? classes[req.params.section] : classes[name];
    !Class && (Class = classes[`${req.params.section}.notfound`]); //двойной вызов sfc потому что клиент запрашивал одно, а получил не найдено и будет пытаться его зарегистрировать! (оставить так пока что, не критично ведь)) )

    try {
        let {access, scope} = Class || {};
        let {user, client} = req;

        let params = {access, scope, user, client};
        params.id = req.$params.id;

        is_ignored && (params.name = name);

        req.$component = new Class(params);
        req.$component.location = is_ignored ? name : Class.location.replace(req.$params.section + '.', '').replace(req.$params.component, req.$params.ident);

    }
    catch (err) {
        let error = {
            error: err.code || 400,
            message: err.message
        };

        req.$response = {...error};
    }

    next();

}]);

router.all(patterns, [async function (req, res, next) {
    //ЗДЕСЬ АВТОРИЗАЦИЯ И ДОСТУП

    //1. проверка доступа для запрашиваемого компонента
    //2. проверка токена или вывод ошибки
    //3. подключение шаблона и получение данных для компонента
    //4. модификация данных по модели (только при вызове действия)
    //5. проверка родительских параметров доступа, если не переопределено
    //6. вызов родительских действий (наследование в классе по таблице доступа)
    //7. общий класс для компонента и общий класс по таблице доступа
    //8. ...

    if(!req.$response) {
        try {
            if (req.$params.action) {
                let data = req.$component[req.$params.action] ? await req.$component[req.$params.action](req, res) : {entities: {}};

                req.$response = {
                    status: 2,
                    ...data,
                };
            }
            else {
                req.$response = {
                    sfc: await req.$component.sfc(__dirname),
                    data: await req.$component.data,
                    reload: req.$component.reload,
                    location: req.$component.location,
                    status: 1,
                };
            }
        }
        catch (err) {
            let error = {
                error: err.code || 400,
                message: err.message
            };

            req.$response = {...error};
        }
    }

    next();

}, end()]);

/*
router.all(api_patterns, [async function (req, res, next) {
    let data = req.$component[req.$params.action] ? await req.$component[req.$params.action](req, res) : {entities: {}};

    req.$response = {
        status: 2,
        ...data,
    };

    next();
}, end()]);

router.all(patterns, end());
*/

module.exports = {
    router
};

