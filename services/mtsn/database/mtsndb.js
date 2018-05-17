let db = module.exports;

const neo4j = require('neo4j-driver').v1;

db.driver = function (port) {
    return neo4j.driver(`bolt://localhost:${port}`, neo4j.auth.basic('neo4j', '123'));
};

const Docker = require('dockerode');

const docker = new Docker({ //NOT WORKING SSL !!!
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

db.docker = docker;

db.findContainer = async function ({name}) {
    let containers = await docker.listContainers({all: true});

    return containers.find((container) => {
        let found = container.Names.find(tag => {
            tag = tag.replace('/', '');
            return tag === name;
        });

        return !!found;
    });
};

db.findImage = async function ({name}) {
    let images = await docker.listImages({all: true});

    return images.find((image) => {
        let found = image.RepoTags.find(tag => {
            return tag === name;
        });

        return !!found;
    });
};

db.pull = async function ({image, options}) {

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

db.CQL = async function ({driver, query, params, try_count = 20, timeout = 500}) {

    let execute = async function (query, params) {
        try {
            return await session.run(query, params);
        }
        catch (err) {
            if(try_count) {

                try_count--;

                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(execute(query, params));
                    }, timeout);
                });
            }
            else throw err;
        }
    };

    let session = driver.session();

    let respond = await execute(query, params);

    console.log('CQL EXECUTE TRIES:', try_count);

    session.close();

    return respond.records;
};