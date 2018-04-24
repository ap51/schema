'use strict';

const database = require('./database/db');

const express = require('express');
const bodyParser = require('body-parser');

let router = express.Router();


router.all('*', function(req, res, next) {
    next();
});

module.exports = {
    router
};


router.all('*', function (req, res, next) {
    next(); 
    res.status(200).end('response');
});
