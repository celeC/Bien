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
				postage: $('input[name="postage"]').val(),
				v: 1
			};

	console.log('add new goods,', obj);
	ws.send(JSON.stringify(obj));

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

		ws.send(JSON.stringify({type: 'chainstats', v:1}));
		ws.send(JSON.stringify({type: 'get_open_trades', v: 2}));
		ws.send(JSON.stringify({type: 'view'}));
	}

	function onClose(evt){
		console.log('WS DISCONNECTED', evt);
		connected = false;
		setTimeout(function(){ connect(); }, 5000);					//try again one more time, server restarts are quick
	}

	function onMessage(msg){
		console.log(msg);
		try{
			var msgObj = JSON.parse(msg.data);
			//console.log(msgObj);
			if(msgObj.bien){
				console.log('bien object', msgObj.msg, msgObj);
				show_goods(msgObj.bien);
				//console.log(msgObj.bien);
				//set_my_color_options(user.username);
			}		
		if(msgObj.msg === 'chainstats'){
				//console.log('rec', msgObj.msg, ': ledger blockheight', msgObj.chainstats.height, 'block', msgObj.blockstats.height);
				var e = formatDate(msgObj.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
				$('#blockdate').html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
				var temp = { 
								id: msgObj.blockstats.height, 
								blockstats: msgObj.blockstats
							};
				//console.log(msgObj.blockstats);
				new_block(temp);									//send to blockchain.js
			}
			else if(msgObj.msg === 'reset'){							//clear marble knowledge, prepare of incoming marble states
				console.log('rec', msgObj.msg, msgObj);
				$('#goodsShow').html('');
				$('#goodsShow_store').html('');
				$('#goodsShow_courier').html('');
			}
			else if(msgObj.msg === 'open_trades'){
				console.log('rec', msgObj.msg, msgObj);
				//build_trades(msgObj.open_trades);
			}
			else console.log('rec', msgObj.msg, msgObj);
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
//=========================================================================================
//                           UI BUILDING
//=========================================================================================

function show_goods(data){
	var html = '';
	console.log("============[jacey] show goods======"); 
	console.log(data);
	switch(data.state){
	
	case "new":		
		html += '<tr id ="'+data.id+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="buy" onclick="buyAction('+data.id+')"><span>BUY</span></button></td ></tr>';
        $('#goodsShow').append(html);
		break;
	case "confirmed":		
		html += '<tr id ="'+data.id+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td >'+ data.owner +'</td ></tr>';
        $('#goodsShow').append(html);
		break;
	case "arrived":		
		html += '<tr id ="'+data.id+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="confirm" onclick="confirmAction('+data.id+')"><span>CONFIRM</span></button></td ></tr>';
        $('#goodsShow').append(html);
		break;
	case "IN-Warehouse":		
		html += '<tr id ="'+data.id+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="distribute" onclick="distributeAction('+data.id+')"><span>DISTRIBUTE</span></button></td ></tr>';
        $('#goodsShow_store').append(html);
		break;
	case "distribute":		
		html += '<tr id ="'+data.id+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td >'+ data.owner +'</td ></tr>';
        $('#goodsShow_store').append(html);
		break;
	case "distribute":		
		html += '<tr id ="'+data.id+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="signOff" onclick="signOffAction('+data.id+')"><span>Sign-off</span></button></td ></tr>';
        $('#goodsShow_courier').append(html);
		break;
	case "confirmed":		
		html += '<tr id ="'+data.id+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td >'+ data.owner +'</td ></tr>';
        $('#goodsShow_courier').append(html);
		break;
	default:
		break;
	
	}	

}
function buyAction(bien_id){
	//var bien_id = $("#bienID_"+).attr("id");
	var id = bien_id.toString();
	console.log(id);
	console.log("buy action");
	var obj = 	{
			type: 'buy',
			state:'IN-Warehouse',//need changed state
			id:id,		
			v: 1
		};
	console.log("[jacey] hello buyer");
	ws.send(JSON.stringify(obj));
}

function confirmAction(bien_id){
	var id = bien_id.toString();
	
	var obj = 	{
			type: 'confirm',
			state:'IN-Warehouse',//need changed state
			id:id,
			owner:'buyer',
			v: 1
			//order_id:'1'
		};
console.log("confirm");
ws.send(JSON.stringify(obj));
}
function distributeAction(bien_id){
	var id = bien_id.toString();
	var obj = 	{
			type: 'distribute',
			id:id,
			v: 1
			//order_id:'1'
		};
console.log("distribute");
ws.send(JSON.stringify(obj));
}
function signOffAction(bien_id){
	var id = bien_id.toString();
	var obj = 	{
			type: 'signOff',
			id:id,
			v: 1
			//order_id:'1'
		};
console.log("signOff");
ws.send(JSON.stringify(obj));
}