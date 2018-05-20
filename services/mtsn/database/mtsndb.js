const path = require('path');
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

db.startContainer = async function({image_name = 'neo4j', tag = 'latest', container_name = 'common', users_path}) {

    let container = await db.findContainer({name: container_name});

    if (!container) {
        let found = !!await db.findImage({name: `${image_name}:${tag}`});

        if (!found) {
            let image = await db.pull({image: `${image_name}:${tag}`});
            console.log(image);
        }

        let common_path = path.join(users_path, 'common');

        let Binds = [];
        if(container_name === 'common') {
            Binds = [
                `${path.join(common_path, 'dbms')}:/data/dbms`,
                `${path.join(common_path, 'conf')}:/conf`,
                `${path.join(common_path, 'plugins')}:/plugins`,
                `${path.join(common_path, 'databases')}:/data/databases`,
                `${path.join(common_path, 'files')}:/import`
            ]
        }
        else {
            let user_path = path.join(users_path, container_name);

            Binds = [
                `${path.join(common_path, 'dbms')}:/data/dbms`,
                `${path.join(common_path, 'conf')}:/conf`,
                `${path.join(common_path, 'plugins')}:/plugins`,

                `${path.join(user_path, 'databases')}:/data/databases`,
                `${path.join(user_path, 'files')}:/import`
            ]
        }

        container = await db.docker.createContainer({
            image: `${image_name}:${tag}`,
            name: container_name,
            //name: req.user.id,
            HostConfig: {
                PublishAllPorts: true,
                Binds
            }
        });

    }
    else container = await db.docker.getContainer(container.Id);

    let info = await container.inspect();

    !info.State.Running && await container.start();
    info = await container.inspect();

    let bolt_port = info.NetworkSettings.Ports['7687/tcp'];
    bolt_port = bolt_port.length && bolt_port[0].HostPort;

/*
    const driver = db.driver(bolt_port);
    let records = await db.CQL({driver, query: 'MERGE (james:Person {name : {nameParam} }) RETURN james.name AS name', params: {nameParam: 'James'}});

    records.forEach(function (record) {
        console.log(record.get('name'));
    });

*/
    return bolt_port;
};

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
/*          THIS IN modem.js buildRsponse >>>>
            if (!context.hijack && !context.openStdin && (!(typeof data === "string" || Buffer.isBuffer(data)) || data === undefined)) {
                req.end();
            }
*/

            console.log(chunk.length);
        });

        stream.on('end', async () => {
            let downloaded = await db.findImage({name: image});
            resolve(downloaded);
        });
    });

};

db.CQL = async function ({driver, query, params, try_count = 40, timeout = 500}) {

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