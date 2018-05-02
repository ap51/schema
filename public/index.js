
let cache = {};
let service = window.location.pathname.split('/')[1];

Vue.prototype.$socket = io(`/${service}`, {
    path: `/${service}/_socket_`,
    transports: ['websocket', 'polling']
});

Vue.prototype.$state = {
    locationToggle: false,
    auth: void 0,
    api: void 0,
    entry: void 0,
    token: localStorage.getItem('token'),
    location: '',
    layouts: {
        root: []
    },
    entities: {}
};

let router = new VueRouter(
    {
        base: `/${service}/ui/`,
        mode: 'history',
        routes: [
            {
                path: '/',
                redirect: 'about'
            },
            {
                path: '/*',
                components: {
                },
                props: {
                },
                children: [
                    {
                        path: '/:name',
                    }
                ]

            }
        ],
    }
);

Vue.prototype.$bus = new Vue({});

axios.interceptors.request.use(
    function (config) {
        Vue.prototype.$bus.$emit('loading', true);

        return config;
    },
    function (error) {
        Vue.prototype.$bus.$emit('loading', false);

        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    function (response) {
        Vue.prototype.$bus.$emit('loading', false);

        if(response.data.error)
            return Promise.reject(response.data.error);
        return response;
    },
    function (error) {
        Vue.prototype.$bus.$emit('loading', false);

        error.message = (error.response && error.response.data) || error.message;
        error.code = error.response.status || error.code;
        return Promise.reject(error);
    }
);

axios.defaults.headers['post'] = {};

let request_queue = {};
let component_data = {};

Vue.prototype.$request = async function(url, data, options) {

    url = url.replace('/index.vue', '').replace(/_/gi, ':').replace(`/${service}/ui/`, '');
    url = `/${service}/ui/` + url;

    let path = parse(url);

    if(request_queue[url])
        return request_queue[url];

    let {method, callback, encode, config, no_headers, on_merge} = options || {};

    let response = !data && !path.action && cache[path.component];
    if(response)
        return response;

    let conf = {
        url,
        method: data ? method || 'post' : 'get',
        headers: {
            'content-type': encode ? 'application/x-www-form-urlencoded' : 'application/json',
        },
        transformRequest: function(obj) {
            let transformed = encode ? Qs.stringify(obj) : JSON.stringify(obj);
            return transformed;
        }
    };

    Vue.prototype.$state.token && (conf.headers.token = Vue.prototype.$state.token);
    Vue.prototype.$socket.id && (conf.headers.socket = Vue.prototype.$socket.id);

    no_headers && (delete conf.headers);

    config = Object.assign(conf, config || {});
    
    data && (config.data = data);

    request_queue[url] = axios(config)
        .then(function(res) {
            request_queue[res.config.url] = false;

            if(res.data.status) {
                Vue.prototype.$state.token = res.data.token;
                localStorage.setItem('token', res.data.token);
                Vue.prototype.$state.auth = res.data.auth;
            }

            callback && callback(res);

            switch(res.data.status) {
                case 1: //template & initial data

                    cache[path.component] = res.data.sfc || cache[path.component];

                    let layouts = res.data.location.split('.');

                    for(let i = 0; i < layouts.length; i++) {
                        !cache[layouts[i]] && httpVueLoader.register(Vue, layouts[i]);
                    }

                    component_data[path.component] = res.data.data;
                    component_data[path.component].reload = res.data.reload;

                    layouts = ('root.' + res.data.location).split('.');
                    layouts = layouts.reduce((memo, layout, inx, arr) => {
                        inx !== arr.length - 1 && (memo[layout] = arr[inx + 1]);

                        return memo;
                    }, {});

                    component_data[path.component].layouts = layouts;

                    //Vue.prototype.$state.location = layouts;

                    return cache[path.component];

                    break;
                case 2: //entities

                    let api = res.data.result || '';
                    let entry = res.data.entry || '';

                    let merge = deepmerge(Vue.prototype.$state.entities, res.data.entities || {}, {
                        arrayMerge: function (destination, source, options) {
                            //ALL ARRAYS MUST BE SIMPLE IDs HOLDER AFTER NORMALIZE
                            if(res.config.method.toUpperCase() === 'DELETE') {
                                if(destination.length) {
                                    return destination.filter(id => source.indexOf(id) === -1);
                                }
                                else {
                                    return source;
                                }
                            }

                            let a = new Set(destination);
                            let b = new Set(source);
                            let union = Array.from(new Set([...a, ...b]));

                            return union;
                        }
                    });

                    Vue.set(Vue.prototype.$state, 'api', api);
                    Vue.set(Vue.prototype.$state, 'entry', entry);

                    Vue.set(Vue.prototype.$state, 'entities', merge);

                    break;
                case 3: //error

                    break;
                case 4: //update components data
                    let entries = Object.entries(res.data);
                    entries.forEach((entry) => {
                        let [name, data] = entry;

                        if(component_data[name]) {
                            component_data[name] = data;
                            Vue.prototype.$bus.$emit(`data:${name}`, data);
                        }
                    });
                    break;
                default: //not server request

                    break;
            }

        })
        .catch(function(err) {
            Vue.prototype.$bus.$emit('snackbar', `ERROR: ${err.message} ${err.code ? 'CODE: ' + err.code + '.': ''}`);
            delete request_queue[url];
            return '';// Promise.reject(err);
        });

    return request_queue[url];
};

httpVueLoader.httpRequest = Vue.prototype.$request;

let parse = function (path) {
    path = path.split('/').pop();

    let [route, action] = path.split('.');
    let [name, id] = route.split(':');

    return {
        name,
        id,
        action,
        ident: route,
        url: `${name}${id ? ':' + id : ''}${action ? '.' + action : ''}`,
        component: `${name}${id ? '_' + id : ''}`
    };
};

router.beforeEach(async function (to, from, next) {
    let path = to.params.name || to.path;

    next();

    path = parse(path);

    !cache[path.component] && await Vue.prototype.$request(path.component);

    //vm && !vm.$options.components[path.component] && httpVueLoader.register(Vue, path.component);
    if(vm && !vm.$options.components[path.component]) {
        httpVueLoader.register(Vue, path.component);
    }

    Vue.prototype.$state.locationToggle = !Vue.prototype.$state.locationToggle;
    component_data[path.component] && (Vue.prototype.$state.location = component_data[path.component].layouts);
});


const theme = {
    primary: '#1976D2',
    secondary: '#b0bec5',
    accent: '#388E3C',
    error: '#b71c1c'
};

////////////////////////////////////////////////////////
Vue.config.devtools = true;
////////////////////////////////////////////////////////

let component = {
    data() {
        let self = this;

        let data = {
            state: this.$state,
        };

        if(this.$parent) {
            data.name = this.$options.name || this.$options._componentTag;

            let assigned_data = component_data[data.name] || {};

            Object.assign(data, assigned_data);

            this.$bus.$on(`data:${data.name}`, function (data) {
                Object.assign(self.$data, data);
            });
        }

        return data;
    },
    created() {
        this.name !== 'root' && this.$request(`${this.name}.get`);
    },
    mounted(){
        //console.log(this);
    },
    computed: {
        address() {
            this.state.locationToggle && void 0; //ensure this will update computed value
            let path = window.location.pathname;
            return parse(path);
        },
        entities() {
            return this.state.entities;
        },
        database() {
            return (this.$state.entities[this.$state.entry] && this.$state.entities[this.$state.entry][this.$state.api]) || {};
        },
        auth() {
            //return (this.database.auth && this.entities.user[this.database.auth]) || {};
            return this.state.auth || {};
        },
        location() {
            return typeof this.state.location && this.state.location[this.name];
        }
    },
    methods: {
        update() {
            //cache = {};
            let entries = Object.entries(component_data);
            let current = parse(window.location.pathname);
            entries.forEach(async (entry) => {
                let [name, data] = entry;

                delete cache[name];
                httpVueLoader.register(Vue, name);

                if(current.component === name) {
                    Vue.prototype.$state.location = {root: 'layout'}; //make dynamic check

                    vm.$nextTick(function () {
                        Vue.prototype.$state.location = component_data[name].layouts;
                    });
                }
            });

        }
    }
};

window.vm = new Vue({
    el: '#app',
    extends: component,
    router: router,
    data() {
        return {
            name: 'root',
            layouts: [],

            snackbar: {
                timeout: 4000,
                color: 'red darken-2',
                multiline: false,
                vertical: false,
                visible: false,
                message: ''
            }
        };

    },
    components: {
        'location': httpVueLoader('location'),
        'loader': httpVueLoader('loader')
    },
    created() {
        let self = this;
        this.$vuetify.theme = theme;

        this.$bus.$on('snackbar', function (message) {
            self.snackbar.message = message;
            self.snackbar.visible = true;
        });

        this.$socket.on('connect', () => {
            console.log(this.$socket.id); // 'G5p5...'
        });
    },
    computed: {
    }
});
