var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
//var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//app.set('view options', { layout: false});


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// set router
//// Router ////
app.use('/', routes);
//app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
/*app.use(function(err, req, res, next) {                           // = development error handler, print stack trace
  console.log('Error Handeler -', req.url);
  var errorCode = err.status || 500;
  res.status(errorCode);
  req.bag.error = {msg:err.stack, status:errorCode};
  if(req.bag.error.status == 404) req.bag.error.msg = 'Sorry, I cannot locate that file';
  res.render('views/error', {bag:req.bag});
});*/
// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log('Error dev -', req.url);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log('Error production -', req.url);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
