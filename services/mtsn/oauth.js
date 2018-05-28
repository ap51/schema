const OAuth2Server = require('oauth2-server');
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;

let oauth = new OAuth2Server({
    model: require('./model')
});

let tokenHandler = function(options) {
    return async function(req, res, next) {
        let request = new Request(req);
        let response = new Response(res);

        let token = await oauth.token(request, response, options);

        return token;

        //next && next();
    }
};

module.exports = {
    tokenHandler
};