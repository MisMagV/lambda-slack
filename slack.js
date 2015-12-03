"use strict";

var https = require("https"),
    Mustache = require("mustache"),
    Promise = require("promise"),
    url = require("url");

var setting = require("./lib/config.v3"),
    Config = setting.Config;

function push2slack(opts, tmpl, channel, msg) {
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

function makeSlackReq(slack_url) {
    var slack_req_opts = url.parse(slack_url);
    slack_req_opts.method = "POST";
    slack_req_opts.headers = {"Content-Type": "application/json"};
    return slack_req_opts;
}

exports.push = function(event, context) {
    var candidate = [];

    (event.Records || []).forEach(function (rec) {
        if (!rec.Sns) {
            return // not an SNS message
        }

        var topic = rec.Sns.TopicArn,
            msg = rec.Sns.Message,
            job = null;

        if (topic in Config) {
            var slack_url = Config[topic].slack_url,
                  tmpl = Config[topic].tmpl,
                  channel = Config[topic].channel;
            job = push2slack(makeSlackReq(slack_url), tmpl, channel, msg);
        } else {
            job = setting.Obtain(topic).then(function() {
                var slack_url = Config[topic].slack_url,
                      tmpl = Config[topic].tmpl,
                      channel = Config[topic].channel;
                return push2slack(makeSlackReq(slack_url), tmpl, channel, msg)
            });
        }

        job && candidate.push(job);
    });

    Promise.all(candidate).then(function() {
        context && context.succeed("All messages posted to slack");
    })
    .catch(function(err) {
        context && context.fail(err)
    });
};
