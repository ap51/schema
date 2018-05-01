const fs = require('fs');
const path = require('path');
const util = require('util');
const normalizer = require('normalizr');
const cheerio = require('cheerio');

const readFile = util.promisify(fs.readFile);
const database = require('./database/db');
const OAUTH = require('./oauth');

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

            let need_auth = !!self.access.length;
            console.log('CALL', self.name, key, self.access, 'need auth:', need_auth);

            if(need_auth) {
                switch (key) {
                    case 'sfc':
                        let [root, name] = args;

                        if(!self.user)
                            self.reload = true;
                            return self.sfc(root, 'unauthenticate');
                        break;
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
                content = await readFile(path.join(root, 'components', 'not-found.vue'));
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
                    to: 'private'
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
                //await router.authenticateHandler({force: true})(req, res);
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

                //this.$bus.emit('signedin');

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
                        access: []
                    },
                    {
                        component: Work,
                        access: ['sfc:*'], //'method:access_group'
                        scope: ['web'],
                        children: [
                            {
                                component: Step,
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

const ignore = ['location', 'loader'];

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