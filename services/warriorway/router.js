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

let patterns = ['/:section/:component\::id\.:action', '/:section/:component\.:action', '/:section/:component\::id', '/:section/:component'];

let api_patterns = ['/:section/:component\::id\.:action', '/:section/:component\.:action'];
let ui_patterns = ['/:section/:component\::id', '/:section/:component'];


class Base {
    constructor(id) {
        this.id = id;
    }

    get name() {
        return this.__proto__.constructor.name;
    }

    model(data) {

    }

}

function API(SuperClass) {

    return class API extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        model(data) {
            data.__wrapped__ = 'api';
            return data
        }

    }
}

function UI(SuperClass) {

    return class UI extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        model(data) {
            data.__wrapped__ = 'ui';
            return data
        }

    }
}

function About(SuperClass) {
    
    return class About extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        uiFunction() {
            return super.uiFunction();
        }

        aboutFunction() {
            
        }
    }
}

    
let matrix = [
    {
        component: UI,
        access: [],
        children: [
            {
                component: About,
                access: ['*']
            }
        ]
    },
    {
        component: API,
        access: [],
        children: [
            {
                component: About,
                access: ['*']
            }
        ]
    }
]

/* const Factory = (Base = Component) => class ComponentClass extends Base {
    
};

let cc = Factory(Component);
 */

function Access(matrix) {

    let entries = transform(matrix);

    let about = new entries.About(1000);
    
    let model = about.model({name: 'asas'});

    return entries;

    function transform(entries, ParentClass) {
        return entries.reduce((memo, entry) => {
            
            let ComponentClass = entry.component(ParentClass || Base);
            let name = ComponentClass.name;



            if(entry.children) {
                let children = transform(entry.children, ComponentClass);
                Object.assign(memo, children);
            }

            memo[name] = ComponentClass;
            return memo;
        }, {});
    }
}

let access_matrix = Access(matrix);

router.all(patterns, function(req, res, next) {
    //JWT ЗДЕСЬ
    console.log(req.params.component);
    next();
});

router.all(api_patterns, async function (req, res, next) {
    let data = {};
    //ЗДЕСЬ АВТОРИЗАЦИЯ И ДОСТУП
    
    //1. проверка доступа для запрашиваемого компонента
    //2. проверка токена или вывод ошибки
    //3. подключение шаблона и получение данных для компонента
    //4. модификация данных по модели (только при вызове действия)
    //5. проверка родительских параметров доступа, если не переопределено
    //6. вызов родительских действий (наследование в классе по таблице доступа)
    //7. общий класс для компонента и общий класс по таблице доступа
    //8. ...
    switch(req.params.component) {
        case 'warrior-way':
                switch(req.params.action) {
                    case 'get':
                        

                        let query = await Promise.all([
                            database.find('node', {}, {not_clear_result: true}),
                            database.find('edge', {}, {not_clear_result: true})
                        ]);

                        let [nodes, edges] = query;
                        
                        data = {
                            nodes,
                            edges
                        };

                        break;
                }
                break;
    }

    res.status(202).json(data);
    res.end();
});

router.all(ui_patterns, async function (req, res, next) {
    let content = '';
    
    try {
        content = await readFile(path.join(__dirname, 'components', `${req.params.component}.vue`))
    }
    catch (err) {
        content = await readFile(path.join(__dirname, 'components', 'not-found.vue'));
    }

    let response = {
        sfc: cheerio.load(content).html()
    };

    res.status(201).json(response);
    res.end();
});

module.exports = {
    router
};

