let collections = ['node', 'edge'];

const path = require('path');
const Datastore = require('nedb');
const nanoid = require('nanoid');

class NotFoundError extends Error {
    constructor(collection) {
        super(`Nothing has been found in "${collection}".`);
        this.code = 404;
    }
}

process.$bus.send('known', process.pid, __filename);
process.$bus.broadcast('hello', 'broadcast from module', process.pid);

process.$bus.on('init', (date) => {
    //console.log('INIT IN MODULE:', date);
})


let db = module.exports;

for(let inx in collections) {
    let conn = collections[inx];
    db[conn] = new Datastore({filename: path.join(__dirname, `_${conn}.db`), autoload: true});
}

db.find = function(collection, query, options) {
    let {not_clear_result, allow_empty} = options || {};

    return new Promise(function (resolve, reject) {
        db[collection].find(query).sort({created: 1}).exec(function (err, results) {
            if(!results || err) {
                reject(err || new NotFoundError(collection));
            }
            else {
                results && results.length && resolve(results.map(record => {
                    if(!not_clear_result) {
                        record.id = record._id;
                        let {_id, ...clean} = record;
                        return clean;
                    }
                    return record;
                }));

                results && !results.length && (!allow_empty ? reject(new NotFoundError(collection)) : resolve(results));

                !results && reject(new NotFoundError(collection));
            }
        })
    });
};

db.findOne = function(collection, query, options) {
    return new Promise(async function (resolve, reject) {
        try {
            let results = await db.find(collection, query, options);
            resolve(results[0]);
        }
        catch (err) {
            reject(err);
        }
    });
};

db.remove = function(collection, query, options) {
    let {allow_empty} = options || {};

    return new Promise(function (resolve, reject) {
        db[collection].remove(query, {multi: true}, function (err, results) {
            //console.log(results);
            if(!results || err) {
                reject(err || (!allow_empty ? reject(new NotFoundError(collection)) : resolve(results)));
            }
            else {
                results && resolve(results);
            }
        });

    });
};

db.update = function(collection, query, body) {
    return new Promise(async function (resolve, reject) {

        body.created = body.created || new Date() / 1;
        body.updated = new Date() / 1;

        let object = await db.findOne(collection, query, {allow_empty: true});
        object && (body = {...object, ...body});
        body && (delete body.id);
        
        db[collection].update(query, body, { upsert: true }, async function (err, results, upsert) {
            if(!results || err) {
                reject(err || new NotFoundError(collection));
            }
            else {
                results = upsert ? await db.find(collection, {_id: upsert._id}) : await db.find(collection, query);
                results && resolve(results);
                //reject(err || new NotFoundError(collection));
            }
        });

    });
};

db.insert = function(collection, data) {
    return new Promise(async function (resolve, reject) {
        
        db[collection].insert(data, function (err, inserted) {
            err ? reject(err) : resolve(inserted);
        });

    });
};

