"use strict";

var fs = require("fs"),
    path = require("path");

var _ = require("lodash"),
    Etcd = require("node-etcd"),
    Promise = require("promise");

var discoveryTLS = ["52.69.207.18:22379"],
    eCli = null;

module.exports.init = function() {
    function LoadCert(fp) {
        return {
            key: fs.readFileSync(path.join(fp, "/key.pem")),
            cert: fs.readFileSync(path.join(fp, "/cert.pem")),
            ca: [fs.readFileSync(path.join(fp, "/ca.pem"))]
        };
    }
    if (eCli === null) {
        eCli = new Etcd(discoveryTLS, LoadCert(path.join(__dirname, "tls")));
    }
};

module.exports.Get = function(key) {
    function doGet(ok, grr) {
        eCli.get(key, function(err, data, meta) {
            if (err !== null) {
                grr(err)
            } else if (data.node == null) {
                grr(data)
            } else {
                ok(JSON.parse(data.node.value));
            }
        });
    }
    return new Promise(doGet);
};

module.exports.List = function(key) {
    function doList(ok, grr) {
        eCli.get(key, {recursive: true}, function(err, data, meta) {
            if (err !== null) {
                grr(err)
            } else if (data.node == null) {
                grr(data)
            } else {
                var nodes = data.node.nodes,
                    candidates = [];
                for (var idx = 0; idx < nodes.length; idx++) {
                    candidates.push(data.node.nodes[idx].key);
                }
                ok(candidates);
            }
        });
    }
    return new Promise(doList);
};
