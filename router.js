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

router.all('/:component\.:action', async function (req, res, next) {
    let data = {};

    switch(req.params.component) {
        case 'warrior-way':
                switch(req.params.action) {
                    case 'get':
                        data = {
                            nodes: [],
                            edges: []
                        }

                        for (var i = 0; i < 22; i++) {
                            data.nodes.push({
                                id: i, 
                                label: String(i), 
                                title: 'THIS IS TITLE',
                                icon: {
                                    face: 'FontAwesome',
                                    code: '\uf2bc',
                                    size: 50,
                                    color: '#1976D2'
                                }
                            });
                        }
            
                        data.edges.push({from: 0, to: 1});
                        data.edges.push({from: 0, to: 6});
                        data.edges.push({from: 0, to: 13});
                        data.edges.push({from: 0, to: 11});
                        data.edges.push({from: 1, to: 10});
                        data.edges.push({from: 1, to: 7});
                        data.edges.push({from: 1, to: 12});
                        data.edges.push({from: 1, to: 2});
                        data.edges.push({from: 2, to: 3});
                        data.edges.push({from: 2, to: 4});
                        data.edges.push({from: 3, to: 5});
                        data.edges.push({from: 2, to: 8});
                        data.edges.push({from: 2, to: 9});
                        data.edges.push({from: 3, to: 14});
                        data.edges.push({from: 6, to: 10});
                        data.edges.push({from: 16, to: 15});
                        data.edges.push({from: 15, to: 17});
                        data.edges.push({from: 18, to: 17});
                        data.edges.push({from: 19, to: 20});
                        data.edges.push({from: 19, to: 21});
            
            
                        break;
                }
                break;
    }

    res.status(202).json(data);
    res.end();
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

    res.status(201).json(response);
    res.end();
});

module.exports = {
    router
};

