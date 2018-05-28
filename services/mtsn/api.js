'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const normalizer = require('normalizr');
const cheerio = require('cheerio');
const axios = require('axios');

const stat = util.promisify(fs.stat);
const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const database = require('./database/db');
const oauth = require('./oauth');
const mtsndb = require('./database/mtsndb');

const nanoid = require('nanoid');
const generate = require('nanoid/generate');

const crypto = require('crypto');
const randomBytes = require('bluebird').promisify(crypto.randomBytes);

let generateRandomToken = async function(bytes) {
    const buffer = await randomBytes(bytes || 24);
    const password = buffer.toString('base64');
    return password;
};

let generateRandomID = async function(bytes) {
    return randomBytes(bytes || 24).then(function(buffer) {
        return crypto
            .createHash('sha1')
            .update(buffer)
            .digest('hex');
    });
};

class CustomError extends Error {
    constructor(...args) {
        let [code, message] = args;
        super(message);
        this.code = code;
    }
}

function getDestination (req, file, cb) {
    let destination = __dirname;
    if(req.user)
        destination = path.join(__dirname, 'users', req.user.id, 'files', req.body.avatar);

    cb(null, destination)
}

function MyCustomStorage (opts) {
    this.getDestination = (opts.destination || getDestination)
}

MyCustomStorage.prototype._handleFile = function _handleFile (req, file, cb) {
    this.getDestination(req, file, function (err, path) {
        if (err) return cb(err);

        let outStream = fs.createWriteStream(path);

        file.stream.pipe(outStream);
        outStream.on('error', cb);
        outStream.on('finish', function () {
            cb(null, {
                path: path,
                size: outStream.bytesWritten
            })
        })
    })
};

MyCustomStorage.prototype._removeFile = function _removeFile (req, file, cb) {
    fs.unlink(file.path, cb)
};

const multer  = require('multer');
const avatar_upload = multer({
    storage: new MyCustomStorage({}),
    limits: {
        fileSize: 1024 * 200
    }
});


class Base {
    constructor(params) {

        let {access, scope, user, client, id, bus, name, socket, req, res} = params || {};
        this.req = req;
        this.res = res;

        this.id = id;
        this.$bus = bus;
        this.$name = name;
        this.$socket = socket;

        this.access = access || [];
        this.scope = scope || [];
        this.user = user;
        this.client = client;

        this.status = 0;
        this.reload = false;

        this.$request = axios;

        //if(scope.length)
        //    console.log('sdsd');

        let self = this;

        let trace = function(key, context, value, args) {

            let matrix = self.access.reduce((memo, item) => {
                item === '*' && (item = '*:*');

                let [method, rule] = item.split(':');
                method = method === '*' ? key : method;
                rule = rule === '*' ? !!self.user : !self.user ? false : self.user.group === rule ? true : 'denied';

                memo[method] = rule;
                return memo;
            }, {});

            let need_auth = !!self.access.length;
            if(need_auth) {
                matrix[key] = typeof matrix[key] === 'undefined' ? true : matrix[key];

                let access = matrix[key];

                switch (access) {
                    case true:
                        return value.apply(context, args);
                    case false:
                        self.reload = true;
                        if(key === 'sfc')
                            return self.sfc(__dirname, 'unauthenticate');

                        if(key === 'get') return {};

                        throw new CustomError(404, `unauthenticate access: ${self.name}.${key}`);
                    case 'denied':
                        self.reload = true;
                        if(key === 'sfc')
                            return self.sfc(__dirname, 'accessdenied');

                        if(key === 'get') return {};

                        throw new CustomError(404, `access denied: ${self.name}.${key}`);
                }
            }

            return value.apply(context, args);

        };

        return new Proxy(self, {
            get(target, key, receiver) {
                const value = target[key];
                if (typeof value === 'function') {
                    return function (...args) {

                        return trace(key, this, value, args);
                        //return value.apply(this, args); // (A)
                    }
                } else {
                    return value;
                }
            }
        });
    }

    get name() {
        return this.$name || this.__proto__.constructor.name;
    }

    get data() {
        return {
            title: this.name
        }
    }

    sendMessage(name, ...args) {
        let socket_id = this.req.headers['socket'];
        socket_id && (process.$socket === socket_id ? process.$socket.emit(name, ...args) : process.$bus.emit('socket', socket_id, name, ...args));
        //process.$socket && process.$socket.emit(name, ...args);
        //console.log('SEND TO SOCKET:', socket_id);
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

        get() {
            return {hello: 'world'};
        }

    }
}

function UI(SuperClass) {

    return class UI extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        async sfc(root, name) {
            let content = '';

            name = name || this.name;

            try {
                content = await readFile(path.join(root, 'components', `${name}.vue`))
            }
            catch (err) {
                content = await readFile(path.join(root, 'components', 'notfound.vue'));
            }

            return cheerio.load(content).html();
        }

        model(data) {
            data.api = data.api || 'v1';

            let schema = normalizer.schema;

            const _profile = new schema.Entity('profile', {});
/*
            const _profile = new schema.Entity('profile', {}, {
                idAttribute: 'user' // to use not standard ID
            });
*/

            const _phone = new schema.Entity('phone', {});
            const _post = new schema.Entity('post', {});

            const _feed = new schema.Entity('feed', {
                posts: [_post]
            });

            const _message = new schema.Entity('message', {});

            const _chat = new schema.Entity('chat', {
                messages: [_message],
            });

            const _user = new schema.Entity('user', {
                phones: [_phone],
                profile: _profile,
                chats: [_chat]
            });

            const _scope = new schema.Entity('scope', {});

            const _client = new schema.Entity('client', {
                users: [_user],
                scopes: [_scope]
            });

            _user.define({applications: [_client]});
            _user.define({friends: [_user]});

            _chat.define({users: [_user]});
            _chat.define({owner: _user});

            const _create = new schema.Entity('create', {
                user: _user,
                scope: _scope,
                client: _client
            });

            const _node = new schema.Entity('node', {});
            const _edge = new schema.Entity('edge', {});

            const db = new schema.Entity('database', {
                clients: [_client],
                users: [_user],
                scopes: [_scope],
                create: _create,
                found: [_user],
                feed: [_feed],
                auth: _user,


                nodes: [_node],
                edges: [_edge]
            }, {
                idAttribute: 'api'
            });

            let normalized = normalizer.normalize(data, db);
            normalized = {...normalized, entry: 'database'};

            return normalized;
        };

    }
}

function Layout(SuperClass) {

    return class Layout extends SuperClass {
        constructor(...args) {
            super(...args);

/*  НЕЛЬЗЯ БЕХ ОБНУЛЕНИЯ ВЕШАТЬ СОБЫТИЯ
            this.$bus.on('signedin', () => {
                this.name === 'Layout' && console.log('WHY SIGN IN:', process.pid, this.name);
            });
*/

        }

        get data() {
            console.log('LAYOUT DATA:', process.pid, this.name, this.socket);

            let tabs = [];

            tabs.push({
                name: 'О проекте',
                to: 'about'
            });

            tabs.push({
                name: 'about1',
            });

            tabs.push({
                name: 'Работа',
                to: 'work'
            });

            if(this.user) {
                tabs.push({
                    name: 'PRIVATE:' + this.user.id,
                    to: 'friends'
                });
            }

            tabs.push({
                name: '',
                icon: 'fas fa-chevron-right',
                invisible: true,
                active: true
            });

            return {
                header: 'MTSN',
                icon: 'fas fa-users',
                tabs,
                ...super.data
            };

        }

        async get(req, res) {
            this.sendMessage('message');

            return this.model({auth: req.user});
        }

        async initialization(req, res) {
            let users_path = path.join(__dirname, 'users');
            try {
                await stat(users_path);
            }
            catch (err) {
                await mkdir(users_path);
                await mkdir(path.join(users_path, 'common'));

                ['dbms', 'conf', 'plugins', 'databases', 'files'].forEach(async folder => {
                    folder = path.join(users_path, 'common', folder);
                    await mkdir(folder);
                });
            }

            let user_path = path.join(__dirname, 'users', req.user.id);
            try {
                await stat(user_path);
            }
            catch (err) {
                await mkdir(user_path);

                ['databases', 'files'].forEach(async folder => {
                    folder = path.join(user_path, folder);
                    await mkdir(folder);
                });
            }

            let common_port = await mtsndb.startContainer({users_path});
            let user_port = req.user && await mtsndb.startContainer({container_name: req.user.id, users_path});

            req.token.secret.common_port = common_port;
            req.token.secret.user_port = user_port;

            const driver = mtsndb.driver(common_port);
            let records = await mtsndb.CQL({driver, query: 'MERGE (james:Person {name : {nameParam} }) RETURN james.name AS name', params: {nameParam: 'James'}});

            records.forEach(function (record) {
                console.log(record.get('name'));
            });


        }
        update(req, res) {
            let component_data = {status: 4};
            component_data[this.name.toLowerCase()] = this.data;
            return component_data;
            //return this.data
        }

    }
}


function SignIn(SuperClass) {

    return class SignIn extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return {
                email: 'ap@gmail.com',
                password: 123
            };
        }

        async get() {
            let users_path = path.join(__dirname, 'users');
            try {
                await mtsndb.startContainer({users_path});
                console.log('CONTAINER STARTED');
            }
            catch (err){
                console.log('ERROR START CONTAINER');
                throw new CustomError(err.code, err.message);
            }
        }

        async submit(req, res) {
            try {
                //VALIDATE REQ.BODY WITH JOI THROUGH PROXY !!! !!!
                this.sendMessage('message', 'signin', 'stage:1');

                let {client_id, client_secret, scope} = await database.findOne('client', {client_id: 'authenticate'});

                req.body.username = req.body.email;
                req.body.client_id = client_id;
                req.body.client_secret = client_secret;
                req.body.grant_type = 'password';
                req.body.scope = scope.join(',');

                let token = await oauth.tokenHandler({accessTokenLifetime: 10})(req, res);

                let {accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, user, client} = token;

                req.token.secret = {
                    access_token: accessToken,
                    expires: accessTokenExpiresAt,
                    refresh_expires: refreshTokenExpiresAt,
                    user,
                    client
                };

                req.user = user;
                req.client = client;

                this.sendMessage('message', 'signin', 'stage:2');

                await this.initialization(req, res);

                return this.model({auth: user});

            }
            catch(err) {
                res.status(err.code || 400).end(err.message);
            }

        }

    }
}

function SignOut(SuperClass) {

    return class SignOut extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return {};
        }

        async submit(req, res) {
            if(req.token.secret) {
                await database.remove('token', {accessToken: req.token.secret.access_token}, {allow_empty: true});

                let container = await mtsndb.findContainer({name: req.user.id});
                container && (container = await mtsndb.docker.getContainer(container.Id));

                let info = container && await container.inspect();
                info && info.State.Running && await container.stop();

                req.token.secret = void 0;

                req.user = void 0;
                req.client = void 0;
            }

            return this.model({auth: void 0});
        }

    }
}

function NotFound(SuperClass) {

    return class NotFound extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return {};
        }

    }
}

function About(SuperClass) {

    return class About extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return {};
        }

    }
}

function Work(SuperClass) {

    return class Work extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return {};
        }

        async get() {
            console.log(this.name, 'WORK:GET');

            let query = await Promise.all([
                database.find('node', {}, {not_clear_result: true}),
                database.find('edge', {}, {not_clear_result: false})
            ]);

            let [nodes, edges] = query;

            return this.model({
                nodes,
                edges
            });
        }
    }
}

function Step(SuperClass) {

    return class Step extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return {};
        }

        get() {

        }

    }
}

function Private(SuperClass) {

    return class Private extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            let tabs = [];

            tabs.push({
                name: 'Друзья',
                to: 'friends'
            });

            tabs.push({
                name: 'Беседы',
                to: 'chats'
            });

            tabs.push({
                name: 'Приложения',
                to: 'applications'
            });

            return {
                tabs
            };
        }

        async get(req, res) {
            let ProfileClass = new Profile(UI(Base));
            let profile = new ProfileClass({req, res});

            let data = await profile.get(req, res);

            return data;

/*
            let user_id = this.req.user && this.req.user.id;
            let profile = await database.findOne('profile', {user: user_id}, {allow_empty: true});

            if(profile)
                return this.model({
                    users: [
                        {
                            id: user_id,
                            profile
                        }
                    ]
                })
*/
        }

    }
}

function Friends(SuperClass) {

    return class Friends extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return {};
        }

        async get(req, res) {
            if(req.user) {
                let friends = await database.find('friend', {user: req.user.id}, {allow_empty: true});
                friends = friends.map(record => record.friend);

                let users = await database.find('user', {_id: {$in: friends}}, {allow_empty: true});
                let profiles = await database.find('profile', {user: {$in: friends}}, {allow_empty: true});

                users = users.map(function (user) {
                    let profile = profiles.find(record => record.user === user.id);
                    user.public_id = profile.public_id;
                    return user;
                });

                return this.model({
                    users: [
                        {
                            id: req.user.id,
                            friends: users
                        }
                    ]
                });
            }
        }

    }
}

function Chats(SuperClass) {

    return class Chats extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return {};
        }

        get() {

        }

    }
}

function Applications(SuperClass) {

    return class Applications extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return {};
        }

        get() {

        }

    }
}

function Account(SuperClass) {

    return class Account extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            console.log();
            return {};
        }

        get(req, res) {
            console.log();
            return {};
        }

        async save(req, res) {
            //JOI TO VALIDATE BODY


            /*
                        let model = this.model({
                            users: [
                                req.body
                            ]
                        });

                        let users = Object.keys(model.entities.user);

                        if(users.length > 1) {
                            throw new CustomError(400, 'Trying to update multiply accounts');
                        }
            */

            if (req.user) {
                let {id, name, email, password, group = 'users'} = req.body;

                //model.entities.profile

                let user = await database.findOne('user', {email}, {allow_empty: true});

                if (user && user.id !== req.user.id) {
                    throw new CustomError(403, 'EMail is invalid');
                }

                if (!user && !password) {
                    throw new CustomError(403, 'Password cannot be empty');
                }

                let updates = await database.update('user', {_id: id}, {name, email, password, group});
                user = updates[0];

                req.user = {id: user.id, name, group, email};
                req.token.secret.user = req.user;

                return this.model({auth: req.user});
            }
            else throw new CustomError(404, 'User not signed in');
        }

    }
}

function Profile(SuperClass) {

    return class Profile extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            return {};
        }

        base64_encode(file, mime_type) {
            // read binary data
            let bitmap = fs.readFileSync(file);
            // convert binary data to base64 encoded string
            return `data:${mime_type};base64,${new Buffer(bitmap).toString('base64')}`;
        }

// function to create file from base64 encoded string
        base64_decode(base64str, file) {
            // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
            let bitmap = new Buffer(base64str, 'base64');
            // write buffer to file
            fs.writeFileSync(file, bitmap);
            console.log('******** File created from base64 encoded string ********');
        }

/*
// convert image to base64 encoded string
        var base64str = base64_encode('kitten.jpg');
        console.log(base64str);
// convert base64 string back to image
        base64_decode(base64str, 'copy.jpg');
*/

        async get(req, res) {
            let profile = void 0;

            req.user && (profile = await database.findOne('profile', {user: req.user.id}, {allow_empty: true}));

            if(!profile) {
                let api_res = await this.$request({url: 'https://randomuser.me/api', method: 'get'});

                let generated = api_res.data.results[0];

                profile = {
                    id: '0',
                    user: (req.user && req.user.id) || '0',
                    avatar: 'ava.png',
                    public_id: generated.login.username,
                    status: generated.phone
                };

            }

            this.sendMessage('message', 'profile', 'created');

            if(profile) {
                let {id, mime_type, user, public_id, status, avatar} = profile;

                let file = path.join(__dirname, 'users', user, 'files', avatar || 'ava.png');

                try {
                    profile.image_data = this.base64_encode(file, mime_type);
                }
                catch (err) {
                    file = path.join(__dirname, 'public', 'ava.png');

                    profile.mime_type = 'image/png';
                    profile.image_data = this.base64_encode(file, 'image/png');
                }

                let {image_data} = profile;

                return this.model({
                    users: [
                        {
                            id: user,
                            profile: {id, image_data, mime_type, user, public_id, status, avatar}
                        }
                    ]
                });
            }

        }

        async save(req, res) {
            let self = this;
            let avatar = avatar_upload.single('image');
            return new Promise(function (resolve, reject) {
                avatar(req, res, async function (err) {

                    if(!err) {
                        let {id, user, public_id, status, avatar, mime_type} = req.body;

                        await database.update('profile', {_id: id}, {id, user, public_id, status, avatar, mime_type});

                        resolve(await self.get(req, res));
                    }
                    else reject(err);

                })
            });
        }

    }
}

function SignUp(SuperClass) {

    return class SignUp extends SuperClass {
        constructor(...args) {
            super(...args);
        }

        get data() {
            console.log();
            return {};
        }

        async get(req, res) {
            let config = {
                url: 'https://randomuser.me/api',
                method: 'get',
            };

            let api_res = await this.$request(config);

            let generated = api_res.data.results[0];

            return this.model({
                users: [
                    {
                        id: 0,
                        name: `${generated.name.title}. ${generated.name.first} ${generated.name.last}`,
                        email: generated.email,
                        password: generated.login.password,
/*
                        profile: {
                            id: 0,
                            user: 0,
                            avatar: 'ava.png',
                            public_id: generated.login.username, //generate('0123456789abcdefghijklmnopqrstuvwxyz', 5),
                            status: generated.phone
                        }
*/
                    }
                ]
            });
        }

        async save(req, res) {
            //JOI TO VALIDATE BODY

            let {id, name, email, password, group = 'users'} =  req.body;

            let user = await database.findOne('user', {email}, {allow_empty: true});

            if(user) {
                throw new CustomError(403, 'User already exists. Sign in, please');
            }

            if(!password) {
                throw new CustomError(403, 'Password cannot be empty');
            }

            let updates = await database.update('user', {_id: id}, {name, email, password, group});
            user = updates[0];

            req.user = {id: user.id, name, group, email};
            req.token.secret = {user: req.user};

            await this.initialization(req, res);

            const driver = mtsndb.driver(req.token.secret.common_port);
            let records = await mtsndb.CQL({driver, query: 'MERGE (james:Person {name : {nameParam} }) RETURN james.name AS name', params: {nameParam: req.user.id}});

            records.forEach(function (record) {
                console.log(record.get('name'));
            });

            return this.model({auth: req.user});
        }

    }
}


let matrix = [
    {
        component: UI,
        access: [],
        scope: ['web'],
        children: [
            {
                component: Layout,
                access: [],
                children: [
                    {
                        component: Account,
                        children: [
                            {
                                component: Profile
                            }
                        ]
                    },
                    {
                        component: NotFound,
                    },
                    {
                        component: SignIn,
                        children: [
                            {
                                component: SignUp,
                                children: [
                                    {
                                        component: Profile
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        component: SignOut,
                    },
                    {
                        component: About,
                        access: ['*:users']
                    },
                    {
                        component: Work,
                        access: ['sfc:*', 'get:admins'], //'method:access_group'
                        scope: ['web'],
                        children: [
                            {
                                component: Step,
                            },
                        ]
                    },
                    {
                        component: Private,
                        access: ['sfc:*', 'get:*'], //'method:access_group'
                        scope: ['web'],
                        children: [
                            {
                                component: Friends,
                            },
                            {
                                component: Chats,
                            },
                            {
                                component: Applications,
                            },
                        ]
                    }
                ]
            }
        ]
    },
    {
        component: API,
        access: [],
        children: [
            {
                component: About,
                //access: ['*']
            }
        ]
    }
];

const ignore = ['location', 'loader', 'picture-input', 'account-card'];

function Classes() {

    let entries = transform(matrix);
    entries.ignore = ignore;
    entries.base = Base;

    return entries;

    function transform(entries, ParentClass) {
        return entries.reduce((memo, entry) => {

            ParentClass = ParentClass || Base;

            let ComponentClass = entry.component(ParentClass);

            ComponentClass.$name = ParentClass.$name ? ParentClass.$name + '.' + ComponentClass.name.toLowerCase() : ComponentClass.name.toLowerCase();
            ComponentClass.location = ComponentClass.$name;
            ComponentClass.access = entry.access || [];
            ComponentClass.scope = entry.scope || [];

            ParentClass === Base ? ComponentClass.root = ComponentClass.$name : ComponentClass.root = ParentClass.root;


            if(entry.children) {
                let children = transform(entry.children, ComponentClass);
                Object.assign(memo, children);
            }
            //else ComponentClass.$name = ComponentClass.root + '.' + ComponentClass.name.toLowerCase();

            //memo[ComponentClass.$name] = ComponentClass;
            memo[ComponentClass.root + '.' + ComponentClass.name.toLowerCase()] = ComponentClass;
            return memo;
        }, {});
    }
}

/*
(async function () {
    let users_path = path.join(__dirname, 'users');
    await mtsndb.startContainer({users_path});
})();
*/

module.exports = {
    Classes
};