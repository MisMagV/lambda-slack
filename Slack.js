"use strict";

var Promise = require("promise");

var setting = require("./lib/config.v3"),
    Config = setting.Config;

var makeSlackReq = require("./lib/slack"),
    push2slack = require("./lib/push2slack");

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
        console.log(err)
        context && context.fail(err)
    });
};
