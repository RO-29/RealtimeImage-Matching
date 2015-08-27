
function join_room(name){
    room_vars.$startRoom(name);
    room = room_vars.$room;
    room_vars.$finish = 0
}

var room_vars = new Room_vars();
var url = 'http://localhost:7000/';

function Room_vars() {
  this.$socket;
  this.$room;
  this.$name;
  this.$cur_level;
  this.$finish;
}

Room_vars.prototype.$connection = function(url, opt) {
  var opt = opt || '';
  this.$socket = io.connect(url, opt);
};

Room_vars.prototype.$startRoom = function($room) {    
    this.$room = $room;
    this.$socket.emit('create or join', this.$room);
};

room_vars.$connection(url);
var socket = room_vars.$socket;

//When Room is created first time
socket.on('created', function(room,name) {
  console.log('Created game-> ' + room);
  room_vars.$name = name;
  room_vars.$cur_level =1;
  console.log('You have joined game-> ' + room);
});

//When new player other than the creator of room joins, this event catches it
socket.on('join', function(room) {
  alert('Other Player joined,now you can play further')
  console.log('Another Opponent made a request to join game-> ' + room);
  console.log('You are the initiator of game-> ' + room + '!');
});

//Game Room joined event 
socket.on('joined', function(room,name) {
	room_vars.$name = name;
	room_vars.$cur_level =1;
  	console.log('You have joined game-> ' + room);
});

//When room already have 2 existing players, full event is fired and this is the catching event
socket.on('full', function(room) {
  alert('Game-> ' + room + ' is full,Try again after some-time ');
  document.location = url;
});


//When the client sends message that needs to be recieved by both sending and recieving client
socket.on('Recieve', function(response) {
	console.log('General Message Recieved In room->'+response)

	if(response=='db_err'){
		alert('Some Internal Error occurred,Pls try again later')
		document.location=url
	}
	if(response=='next'){
		alert('Other player pressed proceed to next level and yours and other players checked image(s) matched,proceding to next level ')
		socket.emit('LevelInit',room_vars.$cur_level+1);
	}
	if(response=='no match'){
		alert("Sorry,Can't Proceed, Your Responses don't match with other player yet ")
	}
	if(response=='finish'){
    room_vars.$finish = 1
		alert('Congrats! you manged to tag all the images correctly with other opponent');
		document.location = url;
	}

	if(response=='fin_next'){
    room_vars.$finish = 1
		alert('Other player pressed proceed to next level and yours and other players checked image(s) matched,....Congrats! you manged to tag all the images correctly with other opponent' )
		document.location = url;
	}
	if(response=='no player'){
		alert('Please wait , let other player join the game before moving further')
	}
	if(response=='abort' && room_vars.$finish == 0){
		alert('Other Player Disconnected/Aborted, your game is being aborted too')
		document.location = url;
	}
});

//Change In level
socket.on('RecieveLevel', function(level) {
  room_vars.$cur_level = level;
  console.log('Change Of level--->'+ level);

  $('#level_text').html('Welcome To '+room_vars.$room+'-Level'+room_vars.$cur_level);
  $("#base_image").attr("src","/static/images/"+room+"/level_"+room_vars.$cur_level+"/0.jpg");
  $("#src1").attr("src","/static/images/"+room_vars.$room+"/level_"+room_vars.$cur_level+"/1.jpg");
  $('#o1').attr('checked', false); 
  $("#src2").attr("src","/static/images/"+room_vars.$room+"/level_"+room_vars.$cur_level+"/2.jpg");
  $('#o2').attr('checked', false); 
  $("#src3").attr("src","/static/images/"+room_vars.$room+"/level_"+room_vars.$cur_level+"/3.jpg");
  $('#o3').attr('checked', false); 
  $("#src4").attr("src","/static/images/"+room_vars.$room+"/level_"+room_vars.$cur_level+"/4.jpg");
  $('#o4').attr('checked', false); 
});

function checkbox_check(){
	var form = document.getElementById('main');
	var inputs = form.getElementsByTagName('input');
	var is_checked = false;
	for(var x = 0; x < inputs.length; x++) {
	    if(inputs[x].type == 'checkbox') {
	        is_checked = inputs[x].checked;
	        if(is_checked) break;
	    }
	}
	return is_checked;
}

$('#o1').change(function() {
        if($(this).is(":checked"))
        	socket.emit('RecieveClientMessage',1,'push')
        else
        	socket.emit('RecieveClientMessage',1,'pop')
    });


$('#o2').change(function() {
        if($(this).is(":checked"))
        	socket.emit('RecieveClientMessage',2,'push')
        else
        	socket.emit('RecieveClientMessage',2,'pop')
    });

$('#o3').change(function() {
        if($(this).is(":checked"))
        	socket.emit('RecieveClientMessage',3,'push')
        else
        	socket.emit('RecieveClientMessage',3,'pop')
    });

$('#o4').change(function() {
        if($(this).is(":checked"))
        	socket.emit('RecieveClientMessage',4,'push')
        else
        	socket.emit('RecieveClientMessage',4,'pop')
    });

$('#next').click(function(){

	if(checkbox_check())
		socket.emit('ProceedToNextlevel')
	else
		alert('Please Select atleast 1 option to proceed further!')
})