"use strict";

var https = require("https"),
    Mustache = require("mustache"),
    Promise = require("promise");

module.exports = function(opts, tmpl, channel, msg) {
    function doPush2Slack(ok, grr) {
        var req = https.request(opts);
        req.on("end", function() {
            ok();
        });
        req.on("error", function(e) {
            grr(e.message);
        });

        var message = JSON.parse(msg),
            decodedSrc = new Buffer(message.userMetadata.src, "base64");

        message.userMetadata.src = decodedSrc;
        var output = {
            text: Mustache.render(tmpl, message),
            channel: channel,
        };

        req.write(JSON.stringify(output));
        req.end();
    }
    return new Promise(doPush2Slack);
}
