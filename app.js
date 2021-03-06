var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


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


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

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
/*========================================================================
	launch server
=========================================================================*/


var debug = require('debug')('Bien:server');
var http = require('http');
														
/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3010');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.timeout = 240000;																							// Ta-da.
console.log('------------------------------------------ Server Up ------------------------------------------');
server.on('error', onError);
server.on('listening', onListening);

	
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

/*========================================================================
                 work area
=========================================================================*/
var bien = require('./utils/bien_cc');
var Ibc = require('ibm-blockchain-js');														//rest based SDK for ibm blockchain
var ibc = new Ibc();
var ws = require('ws');																			//websocket mod
var wss = {};
var rest = require('./utils/rest.js');


try{
	var manual = JSON.parse(fs.readFileSync('biencreds.json', 'utf8'));
	var peers = manual.credentials.peers;
	console.log('loading hardcoded peers');
	var users = null;																			//users are only found if security is on
	if(manual.credentials.users) users = manual.credentials.users;
	console.log('loading hardcoded users');
}
catch(e){
	console.log('Error - could not find hardcoded peers/users');
}


//=================================deploy chaincode does not through ibm-blockchain-js sdk===================
//
//options = {path: '/chaincode'};
//
//body = 	{
//			jsonrpc: '2.0',
//			method: 'deploy',
//			params: {
//				type: 1,
//				chaincodeID:{
//					path: ibc.chaincode.details.git_url
//				},
//				ctorMsg: {
//					function: func,
//					args: args
//				},
//				secureContext: enrollId
//			},
//			id: Date.now()
//		};
//
//rest.post(options, '', body);
//==================================
//configure options for ibm-blockchain-js sdk
//==================================
var options = 	{
					network:{
						peers: [peers[0]],																	//lets only use the first peer! since we really don't need any more than 1
						users: users,																		//dump the whole thing, sdk will parse for a good one
						options: {
									quiet: true, 															//detailed debug messages on/off true/false
									tls: false, 																//should app to peer communication use tls?
									maxRetry: 1																//how many times should we retry register before giving up
								}
					},
					chaincode:{
						zip_url: 'https://github.com/celeC/Bien-Chaincode/archive/master.zip',
						unzip_dir: 'Bien-Chaincode-master/chaincode-back',							//subdirectroy name of chaincode after unzipped
						git_url: 'https://github.com/celeC/Bien-Chaincode/chaincode-back',		//GO get http url
					
					}
				};

//---- Fire off SDK ---- //
var chaincode = null;																		//sdk will populate this var in time, lets give it high scope by creating it here
ibc.load(options, function (err, cc){														//parse/load chaincode, response has chaincode functions!
	if(err != null){
		console.log('! looks like an error loading the chaincode or network, app will fail\n', err);
		if(!process.error) process.error = {type: 'load', msg: err.details};				//if it already exist, keep the last error
	}
	else{
		chaincode = cc;									
		bien.setup(ibc, cc);																//pass the cc obj to bien node code

		console.log(cc.details.deployed_name);
		//cc.details.deployed_name = "1e10ef2c8f2ca28059404954fda575afd8b1f1fe300e8e7fc44364cca13c0140a5429fec09fe538055293945cd04175a2602e69db8ef4b39c061b034b854b8e4";
		// ---- To Deploy or Not to Deploy ---- //
		if(!cc.details.deployed_name || cc.details.deployed_name === ''){					//yes, go deploy
			cc.deploy('init', ['99'], {save_path: './cc_summaries',delay_ms: 5000},users[0].enrollId, function(e){ //delay_ms is milliseconds to wait after deploy for conatiner to start, 50sec recommended
				check_if_deployed(e, 1);
			});
		}
		else{																				//no, already deployed
			console.log('chaincode summary file indicates chaincode has been previously deployed');
			check_if_deployed(null, 1);
		}
	}
	check_if_deployed(null, 1);
});

//loop here, check if chaincode is up and running or not
function check_if_deployed(e, attempt){
	if(e){
		cb_deployed(e);																		//looks like an error pass it along
	}
	else if(attempt >= 15){																	//tried many times, lets give up and pass an err msg
		console.log('[preflight check]', attempt, ': failed too many times, giving up');
		var msg = 'chaincode is taking an unusually long time to start. this sounds like a network error, check peer logs';
		if(!process.error) process.error = {type: 'deploy', msg: msg};
		cb_deployed(msg);
	}
	else{
		console.log('[preflight check]', attempt, ': testing if chaincode is ready');
		chaincode.query.read(['_orderindex'],function(err, resp){
			var cc_deployed = false;
			try{
				if(err == null){															//no errors is good, but can't trust that alone
					if(resp === 'null') cc_deployed = true;									//looks alright, brand new, no marbles yet
					else{
						var json = JSON.parse(resp);
						console.log(json);
						if(json.constructor === Array) cc_deployed = true;					//looks alright, we have marbles
					}
				}
			}
			catch(e){
				
			}																		//anything nasty goes here

			// ---- Are We Ready? ---- //
			if(!cc_deployed){
				console.log('[preflight check]', attempt, ': failed, trying again');
				setTimeout(function(){
					check_if_deployed(null, ++attempt);										//no, try again later
				}, 10000);
			}
			else{
				console.log('[preflight check]', attempt, ': success');
				cb_deployed(null);															//yes, lets go!
			}
		});
	}
}

// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function cb_deployed(e){
	if(e != null){
		//look at tutorial_part1.md in the trouble shooting section for help
		console.log('! looks like a deploy error, holding off on the starting the socket\n', e);
		if(!process.error) process.error = {type: 'deploy', msg: e.details};
	}
	else{
		console.log('------------------------------------------ Websocket Up ------------------------------------------');
		
		wss = new ws.Server({server: server});												//start the websocket now
		wss.on('connection', function connection(ws) {
			ws.on('message', function incoming(message) {
				console.log('received ws msg:', message);
				try{
					var data = JSON.parse(message);
					bien.process_msg(ws, data);											//pass the websocket msg to bien processing
					
				}
				catch(e){
					console.log('ws message error', e);
				}
			});
			
			ws.on('error', function(e){console.log('ws error', e);});
			ws.on('close', function(){console.log('ws closed');});
		});
		
		wss.broadcast = function broadcast(data) {											//send to all connections
			wss.clients.forEach(function each(client) {
				try{
					client.send(JSON.stringify(data));
				}
				catch(e){
					console.log('error broadcast ws', e);
				}
			});
		};
		
		// ========================================================
		// Monitor the height of the blockchain
		// ========================================================
		ibc.monitor_blockheight(function(chain_stats){										//there is a new block, lets refresh everything that has a state
			
			console.log("[jacey] blockheight");
			if(chain_stats && chain_stats.height){
				console.log('hey new block, lets refresh and broadcast to all', chain_stats.height-1);
				ibc.block_stats(chain_stats.height - 1, cb_blockstats);
				wss.broadcast({msg: 'reset'});
				chaincode.query.read(['_orderindex'], cb_got_index);
			}
			
			//got the block's stats, lets send the statistics
			function cb_blockstats(e, stats){
				if(e != null) console.log('blockstats error:', e);
				else {
					chain_stats.height = chain_stats.height - 1;							//its 1 higher than actual height
					stats.height = chain_stats.height;										//copy
					wss.broadcast({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
				}
			}
			
			//got the goods index, lets get each goods block
			function cb_got_index(e, index){
				if(e != null) console.log('bien index error:', e);
				else{
					try{
						var json = JSON.parse(index);
						for(var i in json){
							console.log('!', i, json[i]);
							chaincode.query.read([json[i]], cb_got_order);					//iter over each, read their values
						}
					}
					catch(e){
						console.log('marbles index msg error:', e);
					}
				}
			}
			
			//call back for getting a order, lets send a message
			function cb_got_order(e, bien){
				console.log(JSON.parse(bien));
				if(e != null) console.log('order error:', e);
				
				else {
					try{
						wss.broadcast({msg: 'bien', bien: JSON.parse(bien)});
					}
					catch(e){
						console.log('bien msg error', e);
					}
				}
			}
			
			//call back for getting open trades, lets send the trades
			function cb_got_trades(e, trades){
				if(e != null) console.log('trade error:', e);
				else {
					try{
						trades = JSON.parse(trades);
						if(trades && trades.open_trades){
							wss.broadcast({msg: 'open_trades', open_trades: trades.open_trades});
						}
					}
					catch(e){
						console.log('trade msg error', e);
					}
				}
			}
		});
	}
}

//module.exports = app;