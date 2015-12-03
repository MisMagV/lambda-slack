"use strict";

var path = require("path");

var Etcd = require("./etcd.v2");

var Config = {};

module.exports.Obtain = function(topic) {
    Etcd.init();
    return Etcd.Get(path.join("/app-config/slack/", topic))
        .then(function(data) {
            Config[topic] = data;
            return Config[topic];
        });
};

module.exports.Config = Config;
