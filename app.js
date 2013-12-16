
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var expressWinston = require('express-winston'),
    winston = require('winston'), // for transports.Console
    app = express();

var commands = require("./js/commands.js");

// all environments
app.set('port', process.env.PORT || 8888);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
// npm install express-winston
 app.use(expressWinston.errorLogger({
      transports: [
        new winston.transports.Console({
          json: true,
          colorize: true
        })
      ]
    }));

// send common headers to all responses
app.use(function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:9999");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(req.data));
});

app.use(express.static(path.join(__dirname, 'public')));

//error function
app.use(function(err, req, res, next){
    console.error(err.stack);
    var error = {}; //code: 1, message: err.message};
    error.code = err.code ? err.code : "1";
    error.message = err.message ? err.message : "Unknown error";
    console.log("~~~~~~~~~~~~~~", JSON.stringify(err))
    error.details = JSON.stringify(err);
    res.send(500, error);
    next(err);
});


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/api/:entityName', commands.getEntityList);
app.get('/api/:entityName', commands.getEntityList);
app.get('/api/:entityName/:id', commands.getEntityElement);

app.get('/admin/User/login', commands.User.login);
app.post('/admin/User/login', commands.User.login);

// crud
app.post('/admin/:entityName/list', commands.getEntityList);
app.get('/admin/:entityName/list', commands.getEntityList);
app.post('/admin/:entityName/simple_list', commands.getSimpleList);
app.get('/admin/:entityName/simple_list', commands.getSimpleList);
app.get('/admin/:entityName/count', commands.getEntityCount);
app.post('/admin/:entityName/count', commands.getEntityCount);
app.get('/admin/:entityName/update', commands.updateItem);
app.post('/admin/:entityName/update', commands.updateItem);
app.get('/admin/:entityName/insert', commands.insertItem);
app.post('/admin/:entityName/insert', commands.insertItem);
app.get('/admin/:entityName/delete', commands.deleteItem);
app.post('/admin/:entityName/delete', commands.deleteItem);

// l2l
app.post('/admin/:entityName/list_linked', commands.getListLinked);
app.get('/admin/:entityName/list_linked', commands.getListLinked);
app.post('/admin/:entityName/add_linked', commands.addLinked);
app.get('/admin/:entityName/add_linked', commands.addLinked);
app.post('/admin/:entityName/delete_linked', commands.deleteLinked);
app.get('/admin/:entityName/delete_linked', commands.deleteLinked);



http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
