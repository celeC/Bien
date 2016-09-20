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
				owner: 'no',
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
		ws.send(JSON.stringify({type: 'view',v:1}));
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
			}		
		if(msgObj.msg === 'chainstats'){
				//console.log('rec', msgObj.msg, ': ledger blockheight', msgObj.chainstats.height, 'block', msgObj.blockstats.height);
				var e = formatDate(msgObj.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
				$('#blockdate').html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
				var temp = { 
								id: msgObj.blockstats.height, 
								blockstats: msgObj.blockstats
							};

				new_block(temp);									//send to blockchain.js
			}
			else if(msgObj.msg === 'reset'){							//clear marble knowledge, prepare of incoming marble states
				console.log('rec', msgObj.msg, msgObj);
				$('#goodsShow').html('');
				$('#goodsShow_store').html('');
				$('#goodsShow_courier').html('');
			}
			
			else console.log('rec', msgObj.msg, msgObj);
		}
		catch(e){
			console.log('ERROR', e);
			ws.close();
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
	var html_courier='';
	var html_store='';
	console.log("============[jacey] show goods======"); 
	console.log(data);
	switch(data.state){
	
	case "new":		
		html += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="buy" onclick="buyAction('+data.orderId+')"><span>BUY</span></button></td ></tr>';
        $('#goodsShow').append(html);
        html_store+= '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="distribute" disabled="true"><span>OUTBOUND</span></button></td ></tr>';
        $('#goodsShow_store').append(html_store);
		break;
	case "confirmed":		
		html += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td >Owner:'+ data.owner +'</td ></tr>';
        $('#goodsShow').append(html);
        html_courier += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td >Owner:'+ data.owner +'</td ></tr>';
        $('#goodsShow_courier').append(html_courier);
	
		html_store += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
			'<td >'+ data.state + '</td >'+
			'<td >'+ data.price + '</td >'+
			'<td >'+ data.postage + '</td >'+
			'<td >Owner:'+ data.owner +'</td ></tr>';
	        $('#goodsShow_store').append(html_store);
			break;
	case "arrived":		
		html += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="confirm" onclick="confirmAction('+data.orderId+')"><span>CONFIRM</span></button></td ></tr>';
        $('#goodsShow').append(html);
        html_courier += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="signOff" disabled="true"><span>Sign-Off</span></button></td ></tr>';
        $('#goodsShow_courier').append(html_courier);
        html_store += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="distribute"disabled="true"><span>OUTBOUND</span></button></td ></tr>';
        $('#goodsShow_store').append(html_store);
		break;
	case "IN-Warehouse":		
		html_store += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="distribute" onclick="outboundAction('+data.orderId+')"><span>OUTBOUND</span></button></td ></tr>';
        $('#goodsShow_store').append(html_store);
        html += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="buy" disabled="true" ><span>BUY</span></button></td ></tr>';
        $('#goodsShow').append(html);
		break;
	case "Outbound":		
		html += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="distribute"disabled="true"><span>OUTBOUND</span></button></td ></tr>';
        $('#goodsShow_store').append(html);
        html_courier += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="signOff" onclick="distributeAction('+data.orderId+')"><span>DISTRIBUTE</span></button></td ></tr>';
        $('#goodsShow_courier').append(html_courier);
		break;
	case "distribute":		
		
        html_courier += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="signOff" onclick="signOffAction('+data.orderId+')"><span>Sign-Off</span></button></td ></tr>';
        $('#goodsShow_courier').append(html_courier);
        html_store += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="signOff" disabled="true"><span>OUTBOUND</span></button></td ></tr>';
        $('#goodsShow_store').append(html_store);
        html += '<tr id ="'+data.orderId+'"><td >'+ data.name + '</td >'+
		'<td >'+ data.state + '</td >'+
		'<td >'+ data.price + '</td >'+
		'<td >'+ data.postage + '</td >'+
		'<td ><button class="signOff" disabled="true"><span>BUY</span></button></td ></tr>';
        $('#goodsShow').append(html);
		break;
	case "confirmed":		
		
		break;
	default:
		break;
	
	}	

}
function buyAction(bien_id){
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
			state:'confirmed',//need changed state
			id:id,
			owner:'buyer',
			v: 1
		};
console.log("confirm");
ws.send(JSON.stringify(obj));
}
function outboundAction(bien_id){
	var id = bien_id.toString();
	var obj = 	{
			type: 'outbound',
			id:id,
			state:"Outbound",
			v: 1
		};
console.log("distribute");
ws.send(JSON.stringify(obj));
}
function distributeAction(bien_id){
	var id = bien_id.toString();
	var obj = 	{
			type: 'distribute',
			id:id,
			state:"distribute",
			v: 1
		
		};
console.log("distribute");
ws.send(JSON.stringify(obj));
}
function signOffAction(bien_id){
	var id = bien_id.toString();
	var obj = 	{
			type: 'signOff',
			id:id,
			state:"arrived",
			v: 1
		};
console.log("signOff");
ws.send(JSON.stringify(obj));
}