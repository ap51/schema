const fs = require('fs');
const path = require('path');
const util = require('util');
const normalizer = require('normalizr');
const cheerio = require('cheerio');

const stat = util.promisify(fs.stat);
const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const database = require('./database/db');
const OAUTH = require('./oauth');

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
        destination = path.join(__dirname, 'public', req.user.id, req.body.avatar);

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
const upload = multer({ storage: new MyCustomStorage({}) });


class Base {
    constructor(params) {

        let {access, scope, user, client, id, bus, name, socket} = params || {};
        this.id = id;
        this.$bus = bus;
        this.$name = name;
        this.socket = socket;

        this.access = access || [];
        this.scope = scope || [];
        this.user = user;
        this.client = client;

        this.status = 0;
        this.reload = false;


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

            const _profile = new schema.Entity('profile', {}, {
                idAttribute: 'user' // to use not standard ID
            });

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
                header: 'ГУОВ',
                icon: 'fas fa-globe',
                signin: false,
                signout: false,
                account: false,
                tabs,
                ...super.data
            };

        }

        get(req, res) {
            return this.model({auth: req.user});
        }

        update(req, res) {
            let component_data = {status: 4};
            component_data[this.name.toLowerCase()] = this.data;
            return component_data;
        }

    }
}

const neo4j = require('neo4j-driver').v1;

const Docker = require('dockerode');

let docker = new Docker({ //NOT WORKING SSL !!!
    socketPath: '//./pipe/docker_engine', //check is win or linux !!!
    /*
    host: '127.0.0.1',
    protocol: 'https',
    ca: fs.readFileSync(path.join(__dirname , 'docker', 'ca.pem')),
    cert: fs.readFileSync(path.join(__dirname , 'docker', 'cert.pem')),
    key: fs.readFileSync(path.join(__dirname , 'docker', 'key.pem')),
    port: 2375
    */
});

let findContainer = async function ({name}) {
    let containers = await docker.listContainers({all: true});

    return containers.find((container) => {
        let found = container.Names.find(tag => {
            tag = tag.replace('/', '');
            return tag === name;
        });

        return !!found;
    });
};

let findImage = async function ({name}) {
    let images = await docker.listImages({all: true});

    return images.find((image) => {
        let found = image.RepoTags.find(tag => {
            return tag === name;
        });

        return !!found;
    });
};

let pull = async function ({image, options}) {

    const stream = await docker.pull(image, options || {});

    return await new Promise(function (resolve, reject) {
        stream.on('error', (err) => {
            reject(err);
        });


        stream.on('data', (chunk) => {
            //DO NOT REMOVE !!! DOESNT FIRE END EVENT WITHOUT THIS
            console.log(chunk.length);
        });


        stream.on('end', async () => {
            let downloaded = await findImage({name: image});
            resolve(downloaded);
        });
    });

};

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

        async submit(req, res) {
            try {
                //VALIDATE REQ.BODY WITH JOI THROUGH PROXY !!! !!!
                let {client_id, client_secret, scope} = await database.findOne('client', {client_id: 'authenticate'});

                req.body.username = req.body.email;
                req.body.client_id = client_id;
                req.body.client_secret = client_secret;
                req.body.grant_type = 'password';
                req.body.scope = scope.join(',');

                let token = await OAUTH.tokenHandler({})(req, res);

                let {accessToken, accessTokenExpiresAt, refreshToken, user, client} = token;

                req.token.secret = {
                    access_token: accessToken,
                    expired: accessTokenExpiresAt,
                    user,
                    client
                };

                req.user = user;
                req.client = client;

                let users_path = path.join(__dirname, 'users');
                try {
                    await stat(users_path);
                }
                catch (err) {
                    await mkdir(users_path);
                    await mkdir(path.join(users_path, 'common'));

                    ['dbms', 'conf', 'plugins'].forEach(async folder => {
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

                let image_name = 'neo4j';
                let tag = 'latest';

                let container = await findContainer({name: req.user.id});

                if (!container) {
                    let found = !!await findImage({name: `${image_name}:${tag}`});

                    if (!found) {
                        let image = await pull({image: `${image_name}:${tag}`});
                        console.log(image);
                    }

                    let common_path = path.join(users_path, 'common');

                    container = await docker.createContainer({
                        image: `${image_name}:${tag}`,
                        name: req.user.id,
                        HostConfig: {
                            PublishAllPorts: true,
                            Binds: [
                                `${path.join(common_path, 'dbms')}:/data/dbms`,
                                `${path.join(common_path, 'conf')}:/conf`,
                                `${path.join(common_path, 'plugins')}:/plugins`,

                                `${path.join(user_path , 'databases')}:/data/databases`,
                                `${path.join(user_path , 'files')}:/import`
                            ]
                        }
                    });

                }
                else container = await docker.getContainer(container.Id);

                let info = await container.inspect();

                !info.State.Running && await container.start();
                info = await container.inspect();

                let bolt_port = info.NetworkSettings.Ports['7687/tcp'];
                bolt_port = bolt_port.length && bolt_port[0].HostPort;

                const driver = neo4j.driver(`bolt://localhost:${bolt_port}`, neo4j.auth.basic('neo4j', 'UserPassword'));

                let session = driver.session();

                let respond = await session.run('MERGE (james:Person {name : {nameParam} }) RETURN james.name AS name', {nameParam: 'James'});

                respond.records.forEach(function (record) {
                    console.log(record.get('name'));
                });

                session.close();

                driver.close();

                //req.token.data[req.user.id] = req.token.data[req.user.id] + 1 || 1;

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
            await database.remove('token', {accessToken: req.token.secret.access_token}, {allow_empty: true});

            //req.token.data[req.user.id] = req.token.data[req.user.id] - 1;

/*
            if(!req.token.data[req.user.id]) {
                let container = await findContainer({name: req.user.id});
                container && (container = await docker.getContainer(container.Id));
                let info = container && await container.inspect();
                info && info.State.Running && await container.stop();
            }
*/

            let container = await findContainer({name: req.user.id});
            container && (container = await docker.getContainer(container.Id));

            let info = container && await container.inspect();
            info && info.State.Running && await container.stop();

            req.token.secret = void 0;

            req.user = void 0;
            req.client = void 0;


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

        get() {

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
            return {};
        }

        get() {

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

        async get(req, res) {
            if(req.user) {
                let profile = await database.findOne('profile', {user: req.user.id});

                let file = path.join(__dirname, 'public', req.user.id, profile.avatar);

                try {
                    profile.image = await readFile(file);
                }
                catch (err) {
                    file = path.join(__dirname, 'public', 'ava.png');
                    profile.image = await readFile(file);
                    profile.mimeType = 'image/png';
                }

                return this.model({
                    users: [
                        {
                            id: req.user.id,
                            profile
                        }
                    ]
                });
            }
        }

        async save(req, res) {
            let avatar = upload.single('image');
            avatar(req, res, async function (err) {

                if(err) throw err;
                delete req.body.image;
                await database.update('profile', {_id: req.body.id}, req.body);

/*
                let file = path.join(__dirname, 'public', req.user.id, req.body.file_name);


                let raw = new Buffer(req.file.buffer.toString(), 'base64');

                fs.writeFile(file, raw, function (err) {
                    if (err) throw err;
                    console.log('saved');
                });
*/
            })
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
                        access: ['sfc:*', 'get:admins'], //'method:access_group'
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

const ignore = ['location', 'loader', 'picture-input'];

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

module.exports = {
    Classes
};