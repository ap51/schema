'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const util = require('util');
const readFile = util.promisify(fs.readFile);

const database = require('./database/db');

const express = require('express');
const bodyParser = require('body-parser');

let router = express.Router();

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
//{access, user, client, id}

class Base {
    constructor(params) {
        let {access, user, client, id, bus, name} = params || {};
        this.id = id;
        this.$bus = bus;
        this.$name = name;

        this.cheerio = require('cheerio');
    }

    get name() {
        return this.$name || this.__proto__.constructor.name;
    }

    get data() {
        return {
            title: this.name
        }
    }

    async sfc(root) {
        let content = '';

        try {
            content = await readFile(path.join(root, 'components', `${this.name}.vue`))
        }
        catch (err) {
            content = await readFile(path.join(root, 'components', 'not-found.vue'));
        }

        return this.cheerio.load(content).html();
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

function Layout(SuperClass) {

    return class Layout extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return {
                owner: this.name,
                ...super.data
            };
        }

    }
}

function About(SuperClass) {
    
    return class About extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return super.data;
        }

    }
}

function WarriorWay(SuperClass) {

    return class WarriorWay extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return super.data;
        }

    }
}

let matrix = [
    {
        component: UI,
        access: [],
        children: [
            {
                component: Layout,
                access: [],
                children: [
                    {
                        component: About,
                        access: ['*']
                    },
                    {
                        component: WarriorWay,
                        access: ['*']
                    }
                ]
            },
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
];

const ignore = ['location', 'step'];

function Classes(matrix) {

    let entries = transform(matrix);
    entries.ignore = ignore;

    return entries;

    function transform(entries, ParentClass) {
        return entries.reduce((memo, entry) => {

            ParentClass = ParentClass || Base;

            let ComponentClass = entry.component(ParentClass);

            ComponentClass.$name = ParentClass.$name ? ParentClass.$name + '.' + ComponentClass.name.toLowerCase() : ComponentClass.name.toLowerCase();
            ComponentClass.location = ComponentClass.$name;

            ParentClass === Base ? ComponentClass.root = ComponentClass.$name : ComponentClass.root = ParentClass.root;


            if(entry.children) {
                let children = transform(entry.children, ComponentClass);
                Object.assign(memo, children);
            }
            else ComponentClass.$name = ComponentClass.root + '.' + ComponentClass.name.toLowerCase();

            memo[ComponentClass.$name] = ComponentClass;
            return memo;
        }, {});
    }
}

let classes = Classes(matrix);

router.all(patterns, function(req, res, next) {
    //JWT ЗДЕСЬ

    req.$params = req.params;
    req.$params.location = req.params.section + '.' + req.params.component;

    let is_ignored = classes.ignore.find(component => component === req.$params.component);
    let name = is_ignored ? req.$params.component : req.$params.location;

    try {
        req.$component = cache[name] || (is_ignored ? new Base({name}) : new classes[name]());
        cache[name] = req.$component;
    }
    catch (err) {
        req.$component = new Base({name: 'not-found'})
    }

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
/*
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
*/
    res.status(202).json(data);
    res.end();
});

router.all(ui_patterns, async function (req, res, next) {
    let component = req.$component;

    let response = {
        sfc: await component.sfc(__dirname),
        data: await component.data
    };

    res.status(201).json(response);
    res.end();
});

module.exports = {
    router
};

