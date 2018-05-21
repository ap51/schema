
Date.prototype.toJSON = function() {
    return `$$date:${this * 1}`;
};

RegExp.prototype.toJSON = function () {
    let regex = this;
    let flags = regex.flags;
    regex = regex.toString();
    regex = regex.replace(`/${flags}`, '').replace(/\//gi, '');
    return `$$regex:${regex}:${flags}`;
};

let parseOrigin = JSON.parse;

let parse = function (text) {
    let reviver = function(key, value) {
        if (typeof value === "string" && value.indexOf('$$date:') === 0) {
            value = value.replace('$$date:', '');
            return new Date(parseInt(value));
        }

        if (typeof value === "string" && value.indexOf('$$regex:') === 0) {
            value = value.replace('$$regex:', '');
            let [expr, flags] = value.split(':');
            try {
                return new RegExp(expr, flags);
            }
            catch (err) {
                return expr;
            }
        }

        return value;
    };

    return parseOrigin(text, reviver);
};

//JSON.parse = parse;

module.exports = parse;
