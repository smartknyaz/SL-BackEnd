var config = require("../config.js"),
    mysql = require('mysql');

function getOpenDbConnection() {
    var connection = mysql.createConnection(config.config.dbConnection);
    connection.connect();
    return connection;
}

exports.getOpenDbConnection = getOpenDbConnection;