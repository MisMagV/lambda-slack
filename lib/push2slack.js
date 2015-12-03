"use strict";

var https = require("https"),
    Mustache = require("mustache"),
    Promise = require("promise");

module.exports = function(opts, tmpl, channel, msg) {
    function doPush2Slack(ok, grr) {
        var req = https.request(opts, function(res){
            res.setEncoding('utf8');
            res.on("data", function(chunk) {
                // NOOP
            })
            res.on("end", function() {
                ok("done");
            });
        });
        req.on("error", function(e) {
            grr(e.message);
        });

        var message = JSON.parse(msg);

        // FIXME: special handling for transcode event
        if (message.userMetadata) {
            var decodedSrc = new Buffer(message.userMetadata.src, "base64");
            message.userMetadata.src = decodedSrc;
        }

        try {
            var output = {
                text: Mustache.render(tmpl, message),
                channel: channel
            };

            req.write(JSON.stringify(output));
            req.end();

        } catch (err) {
            grr(err)
        }
    }
    return new Promise(doPush2Slack);
}
