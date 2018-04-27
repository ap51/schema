
let cache = {};
let service = window.location.pathname.split('/')[1];

Vue.prototype.$socket = io(`/${service}`, {
    path: `/${service}/_socket_`,
    transports: ['websocket', 'polling']
});

Vue.prototype.$state = {
    location: '',
    entities: {}
};

let router = new VueRouter(
    {
        base: `/${service}/`,
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

axios.interceptors.request.use(
    function (config) {
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    function (response) {
        if(response.data.error)
            return Promise.reject(response.data.error);
        return response;
    },
    function (error) {
        error.message = (error.response && error.response.data) || error.message;
        error.code = error.response.status || error.code;
        return Promise.reject(error);
    }
);

Vue.prototype.$bus = new Vue({});

axios.defaults.headers['post'] = {};

let request_queue = {};

Vue.prototype.$request = async function(url, data, options) {
    url = url.replace('/index.vue', '').replace(/_/gi, ':');

    if(request_queue[url])
        return request_queue[url];

    let {method, callback, encode, config, no_headers, on_merge} = options || {};

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

    no_headers && (delete conf.headers);

    config = Object.assign(conf, config || {});
    
    data && (config.data = data);

    request_queue[url] = axios(config)
        .then(function(res) {
            request_queue[res.config.url] = false;
            
            callback && callback(res);
                    
            
            switch(res.status) {
                case 201:
                    cache[Vue.prototype.$state.location] = res.data.sfc || cache[Vue.prototype.$state.location];
                    
                    Vue.prototype.$request(`${Vue.prototype.$state.location}.get`);

                    return cache[Vue.prototype.$state.location];
                    break;
                case 202:
                    console.log(res.data);
                    Vue.set(Vue.prototype.$state, 'entities', res.data);
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

router.beforeEach(async function (to, from, next) {
    let path = to.params.name || to.path;

    next();

    !cache[path] && httpVueLoader.register(Vue, path);
    Vue.prototype.$state.location = path;

    //Vue.prototype.$request(path);
});


const theme = {
    primary: '#1976D2',
    secondary: '#b0bec5',
    accent: '#388E3C',
    error: '#b71c1c'
};

Vue.config.devtools = true;

let component = {
    data() {
        return {
            state: this.$state,
        }
    },
    computed: {
        entities() {
            return this.state.entities;
        },
        location() {
            return this.state.location;
        }
    }
};

window.vm = new Vue({
    el: '#app',
    extends: component,
    router: router,
    data() {
        return {
            
        }
    },
    components: {
    },
    created() {
        let self = this;
        this.$vuetify.theme = theme;

    },
    computed: {
    }
});
