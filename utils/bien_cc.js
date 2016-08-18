// ==================================
// bien_cc - incoming messages, look for type
// ==================================
var ibc = {};
var chaincode = {};
var async = require('async');

module.exports.setup = function(sdk, cc){
	console.log("init cc");
	ibc = sdk;
	chaincode = cc;
	console.log("what is chaincode?"+chaincode.Invoke);
};

module.exports.process_msg = function(ws, data){
																					//only look at messages for part 2
		if(data.type == 'add'){
			console.log(data);
			if(data.name && data.owner && data.state && data.price && data.postage){
				
				chaincode.invoke.add_goods([data.name, data.owner, data.state, data.price,data.postage], cb_invoked);	//create a new marble
			}
		}
		else if(data.type == 'view'){
			console.log('get goods&order msg');
			chaincode.Query.read(['_orderindex'], cb_got_index);
		}
		else if(data.type == 'buy'){
			console.log('buyer buy goods');
//			if(data.name && data.user){
				//chaincode.Invoke.set_user([data.name, data.owner]);
//			}
		}
		else if(data.type == 'distribute'){
			console.log('distribute  goods');
//			if(data.name){
//				chaincode.invoke.delete([data.name]);
//			}
		}
		else if(data.type == 'confirm'){
			console.log('confirm  goods');
//			if(data.name){
//				chaincode.invoke.delete([data.name]);
//			}
		}
		else if(data.type == 'signOff'){
			console.log('signOff  goods');
//			if(data.name){
//				chaincode.invoke.delete([data.name]);
//			}
		}
		else if(data.type == 'chainstats'){
			console.log('chainstats msg');
			//ibc.chain_stats(cb_chainstats);
		}
		else if(data.type == 'open_trade'){
			console.log('open_trade msg');
			if(!data.willing || data.willing.length < 0){
				console.log('error, "willing" is empty');
			}
			else if(!data.want){
				console.log('error, "want" is empty');
			}
			else{
				var args = [data.user, data.want.color, data.want.size];
				for(var i in data.willing){
					args.push(data.willing[i].color);
					args.push(data.willing[i].size);
				}
				chaincode.invoke.open_trade(args);
			}
		}
		else if(data.type == 'get_open_trades'){
			console.log('get open trades msg');
			chaincode.query.read(['_opentrades'], cb_got_trades);
		}
		else if(data.type == 'perform_trade'){
			console.log('perform trade msg');
			chaincode.invoke.perform_trade([data.id, data.closer.user, data.closer.name, data.opener.user, data.opener.color, data.opener.size]);
		}
		else if(data.type == 'remove_trade'){
			console.log('remove trade msg');
			chaincode.invoke.remove_trade([data.id]);
		}
	
	
	
	//got the marble index, lets get each marble
	function cb_got_index(e, index){
		if(e != null) console.log('[ws error] did not get bien index:', e);
		else{
			try{
				var json = JSON.parse(index);
				for(var i in json){
					console.log('!', i, json[i]);
					//chaincode.query.read([json[i]], cb_got_marble);												//iter over each, read their values
				}
			}
			catch(e){
				console.log('[ws error] could not parse response', e);
			}
		}
	}
	
	//call back for getting a marble, lets send a message
	function cb_got_marble(e, marble){
		if(e != null) console.log('[ws error] did not get marble:', e);
		else {
			try{
				sendMsg({msg: 'marbles', marble: JSON.parse(marble)});
			}
			catch(e){}
		}
	}
	
	function cb_invoked(e, a){
		console.log('hello response ');
		console.log('response: ', e, a);
	}
	
	//call back for getting the blockchain stats, lets get the block stats now
	function cb_chainstats(e, chain_stats){
		if(chain_stats && chain_stats.height){
			chain_stats.height = chain_stats.height - 1;								//its 1 higher than actual height
			var list = [];
			for(var i = chain_stats.height; i >= 1; i--){								//create a list of heights we need
				list.push(i);
				if(list.length >= 8) break;
			}
			list.reverse();																//flip it so order is correct in UI
			async.eachLimit(list, 1, function(block_height, cb) {						//iter through each one, and send it
				ibc.block_stats(block_height, function(e, stats){
					if(e == null){
						stats.height = block_height;
						sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
					}
					cb(null);
				});
			}, function() {
			});
		}
	}
	
	//call back for getting open trades, lets send the trades
	function cb_got_trades(e, trades){
		if(e != null) console.log('[ws error] did not get open trades:', e);
		else {
			try{
				trades = JSON.parse(trades);
				if(trades && trades.open_trades){
					sendMsg({msg: 'open_trades', open_trades: trades.open_trades});
				}
			}
			catch(e){}
		}
	}

	//send a message, socket might be closed...
	function sendMsg(json){
		if(ws){
			try{
				ws.send(JSON.stringify(json));
			}
			catch(e){
				console.log('[ws error] could not send msg', e);
			}
		}
	}
};
