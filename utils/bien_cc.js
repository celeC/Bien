// ==================================
// bien_cc - incoming messages, look for type
// ==================================
var ibc = {};
var chaincode = {};
var async = require('async');

module.exports.setup = function(sdk, cc){

	ibc = sdk;
	chaincode = cc;
	
};

module.exports.process_msg = function(ws, data){
	if(data.v === 1){																					//only look at messages for part 2
		if(data.type == 'add'){
			if(data.name && data.owner && data.state && data.price && data.postage){			
				chaincode.invoke.add_goods([data.name, data.owner, data.state, data.price,data.postage], cb_invoked);	//create a new marble
			}
		}
		else if(data.type == 'view'){
			console.log('get goods&order msg');
			chaincode.query.read(['_orderindex'], cb_got_index);
		}
		else if(data.type == 'buy'||data.type == 'outbound'||data.type == 'distribute'||data.type == 'signOff'){
		console.log("[jacey]"+data);
			if(data.state&&data.id){
				
				chaincode.invoke.change_state([data.id,data.state]);
			
			}
		}
	
		else if(data.type == 'confirm'){
			console.log('confirm  goods');
			if(data.state&&data.id&&data.owner){
				chaincode.invoke.set_owner([data.id,data.owner]);
				chaincode.invoke.change_state([data.id,data.state]);
			}
		}
	
		else if(data.type == 'chainstats'){
			console.log('recived chainstats msg');
			//ibc.chain_stats(cb_chainstats);
			chaincode.query.read(['_orderindex'], cb_got_index);
		}
	}
		

	
	
	//got the bien index, lets get each marble
	function cb_got_index(e, index){
		console.log("[jacey] cb_got_index")
		console.log(JSON.parse(index))
		if(e != null) console.log('[ws error] did not get bien index:', e);
		else{
			try{
				var json = JSON.parse(index);
				for(var i in json){
					console.log('!', i, json[i]);
					chaincode.query.read([json[i]], cb_got_bien);	
					//iter over each, read their values
					console.log("=======================");
					console.log(json[i]);
				}
			}
			catch(e){
				console.log('[ws error] could not parse response', e);
			}
		}
	}
	
	//call back for getting a bien, lets send a message
	function cb_got_bien(e, bien){
		console.log("[jacey] bien:");
		console.log(JSON.parse(bien));
		if(e != null) console.log('[ws error] did not get bien:', e);
		else {
			try{
				sendMsg({msg: 'bien', bien: JSON.parse(bien)});
				
			}
			catch(e){
				console.log('jacey:', e);
			}
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
	

	//send a message, socket might be closed...
	function sendMsg(json){
		console.log("[jacey sendMsg]"+json.msg);
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