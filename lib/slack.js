"use strict";

var url = require("url");

module.exports = function(slack_url) {
    var slack_req_opts = url.parse(slack_url);
    slack_req_opts.method = "POST";
    slack_req_opts.headers = {"Content-Type": "application/json"};
    return slack_req_opts;
}
