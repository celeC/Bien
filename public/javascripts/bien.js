var ws = {};
// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$("#addNewGoods").click(function(){
		var obj = 	{
				type: 'add',
				name: $('input[name="name"]').val().replace(' ', ''),
				owner: 'store',
				state: 'new',
				price: $('input[name="price"]').val(),
				postage: $('input[name="postage"]').val()
			};

	console.log('add new goods, sending', obj);
	ws.send(JSON.stringify(obj));

	});
	
	$('.buy').click(function(){
		var obj = 	{
						type: 'buy',
						order_id:'1'
					};
		console.log("hello");
		
	});
	
	
	$(document).on('click', '.confirmTrade', function(){
		console.log('trading...');
		var i = $(this).attr('trade_pos');
		var x = $(this).attr('willing_pos');
		var msg = 	{
						type: 'perform_trade',
						v: 2,
						id: bag.trades[i].timestamp.toString(),
						opener:{											//marble he is giving up
							user: bag.trades[i].user,
							color: bag.trades[i].willing[x].color,
							size: bag.trades[i].willing[x].size.toString(),
						},
						closer:{											//marble hs ig giving up
							user: user.username,							//guy who is logged in
							name: $(this).attr('name'),
							color: '',										//dsh to do, add these and remove above
							size: ''
						}
					};
		ws.send(JSON.stringify(msg));
		$('#notificationPanel').animate({width:'toggle'});
	});
	
	$(document).on('click', '.willingWrap .colorOption', function(){
		set_my_size_options(user.username, this);
	});

	
	$(document).on('click', '.removeTrade', function(){
		var trade = find_trade($(this).attr('trade_timestamp'));
		$(this).parent().parent().addClass('invalid');
		console.log('trade', trade);
		var msg = 	{
						type: 'remove_trade',
						v: 2,
						id: trade.timestamp.toString(),
					};
		ws.send(JSON.stringify(msg));
	});
});

//=================================================================================
//Socket Stuff
//=================================================================================
function connect_to_server(){
	var connected = false;
	connect();
		
	function connect(){
		var wsUri = 'ws://' + document.location.hostname + ':' + document.location.port;
		console.log('Connectiong to websocket', wsUri);
		
		ws = new WebSocket(wsUri);
		ws.onopen = function(evt) { onOpen(evt); };
		ws.onclose = function(evt) { onClose(evt); };
		ws.onmessage = function(evt) { onMessage(evt); };
		ws.onerror = function(evt) { onError(evt); };
	}
	
	function onOpen(evt){
		console.log('WS CONNECTED');
		connected = true;
		clear_blocks();
		//$('#errorNotificationPanel').fadeOut();
//		ws.send(JSON.stringify({type: 'chainstats', v:2}));
//		ws.send(JSON.stringify({type: 'get_open_trades', v: 2}));
//		ws.send(JSON.stringify({type: 'get', v:2}));
	}

	function onClose(evt){
		console.log('WS DISCONNECTED', evt);
		connected = false;
		setTimeout(function(){ connect(); }, 5000);					//try again one more time, server restarts are quick
	}

	function onMessage(msg){
		try{
			var msgObj = JSON.parse(msg.data);
//			if(msgObj.marble){
//				console.log('rec', msgObj.msg, msgObj);
//				build_ball(msgObj.marble);
//				set_my_color_options(user.username);
//			}
//			else if(msgObj.msg === 'chainstats'){
//				console.log('rec', msgObj.msg, ': ledger blockheight', msgObj.chainstats.height, 'block', msgObj.blockstats.height);
//				var e = formatDate(msgObj.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
//				$('#blockdate').html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
//				var temp = { 
//								id: msgObj.blockstats.height, 
//								blockstats: msgObj.blockstats
//							};
//				new_block(temp);									//send to blockchain.js
//			}
//			else if(msgObj.msg === 'reset'){							//clear marble knowledge, prepare of incoming marble states
//				console.log('rec', msgObj.msg, msgObj);
//				$('#user2wrap').html('');
//				$('#user1wrap').html('');
//			}
//			else if(msgObj.msg === 'open_trades'){
//				console.log('rec', msgObj.msg, msgObj);
//				build_trades(msgObj.open_trades);
//			}
//			else console.log('rec', msgObj.msg, msgObj);
		}
		catch(e){
			console.log('ERROR', e);
			//ws.close();
		}
	}

	function onError(evt){
		console.log('ERROR ', evt);
		if(!connected == null){											//don't overwrite an error message
			console.log('Waiting on the node server to open up so we can talk to the blockchain.');
			
		}
	}
}
