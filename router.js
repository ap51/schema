'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const database = require('./database/db');

const express = require('express');
const bodyParser = require('body-parser');

let router = express.Router();

let readFile = function(path){
    return new Promise(function (resolve, reject) {
        fs.readFile(path, function (err, content){
            err ? reject(err) : resolve(content);
        });
    });
};

router.all('/:component', function(req, res, next) {
    console.log(req.params.component);
    next();
});


router.all('/:component', async function (req, res, next) {
    let content = '';
    
    try {
        content = await readFile(path.join(__dirname, 'components', `${req.params.component}.vue`))
    }
    catch (err) {
        content = await readFile(path.join(__dirname, 'components', 'not-found.vue'));
    }

    let response = {
        sfc: cheerio.load(content).html()
    }

    res.json(response);
    res.status(200).end();
});

module.exports = {
    router
};

