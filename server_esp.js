//io.sockets.in.... every socket in room
//socketbroadcast.to ... every socket except itself
(function(){
	
	var express = require('express');
	var app = express();
	var http = require('http').Server(app);
	var io = require('socket.io').listen(http);
	var url = require('url');
	var port = Number(process.env.PORT || 7000),
	sys = require('sys'),
	cors = require('cors'),
	fs = require('fs');

	var knex = require('knex')({
  		client: 'pg',
  		connection: {
    		host     : YOUR_HOST,
    		user     :USER,
    		password : PASS,
    		database : DB_NAME
  		}
	});
	
  //make sure port 7000 is free, when running on local
	http.listen(port,function(){
		console.log('Listening on *:' + port);
	})

  //Static direcrory to serveour files from 
	app.use('/static', express.static(__dirname + '/static'));
	
	app.get('/', function (req, res) {
  	   res.sendfile(__dirname+'/rules.html');
	});

  //init the database
  app.get('/init',function(req,res){
    knex.schema.createTable('game', function (table) {
       table.string('Name');
       table.integer('levels');
       }).exec();

    knex('game').insert({Name: 'game_1',levels:5}).exec();
    res.send('Done');

  });

  //TO gte some db info
	app.get('/info', function(req, res) {

	    knex('game').select().where({
	        Name: 'game_1'
	    }).exec(function(err, results) {
	        if (err)
	            res.send(err + " --->1");
	        else{
	            res.send(results[0]);
	            console.log(results[0]['levels'])
	        }
	    });
	});
	
  //Route to serve the game
	app.get('/:game_name', function(req, res) {
    console.log('request for room: ' + req.params.game_name);
    // if (req.params.stanza) {
    //   urlRoom = req.params.stanza;
    // }
    res.sendfile(__dirname+'/game_template.html');
  });

	//To Allow Cross-Origin AJax request
	app.use(cors());
	app.use(function(req, res, next) {
	    res.setHeader('Access-Control-Allow-origin', '*');
	    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With', 'content-type');
	    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	    next();
	});

	app.use(function() { 
   	 app.use(express.static(__dirname + '/'));
  });

  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.send(500, 'Internal server error');
  });

  io.configure(function() {
    io.enable('browser client minification'); 
    io.enable('browser client etag'); 
    io.enable('browser client gzip'); 
    io.set('transports', ['websocket']);
  });
  io.set('log level', 1);


//For Comparing 2 arrays
  Array.prototype.equals = function (array) {
    if (!array)
        return false;
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            return false;   
        }           
    }       
    return true;
	}   
 
 	//For sorting the array!
	function compareNumbers(a, b){
    return a - b;
	}

  function createOrJoin(socket, room) {
    var numClients = io.sockets.clients(room).length;

    if (numClients == 0) {
      socket.join(room);
      socket.name ='O_1';
      socket.emit('created', room,socket.name);
    }
    else if (numClients < 2 ) {
      socket.join(room);
      socket.name ='O_2';
      socket.broadcast.to(room).emit('join', room);
      socket.emit('joined', room,socket.name);
  	}
    else
      	socket.emit('full', room);
    }


  global.responses = {}

  io.sockets.on('connection', function(socket) {

  		//Called on creation of game _room
  		socket.on('create or join', function(room) {
  			 if(typeof(global.responses[room]) == 'undefined'){
  			 	global.responses[room]={};
  			 }
     		 socket.urlRoom = room;
     		 socket.cur_level = 1;
      		 createOrJoin(socket, socket.urlRoom);
      		 knex('game').select().where({
		        Name: socket.urlRoom
		     }).exec(function(err, results) {
		        if (err)
		            socket.emit('Recieve','db_err')
		        else
		            socket.levels = results[0]['levels'];
		    });
      		 global.responses[socket.urlRoom][socket.name]={}
      		 global.responses[socket.urlRoom][socket.name][socket.cur_level]=[];
      		 console.log(global.responses);
    	});

  		//When you disconnect midway, abort the game 
  		socket.on('disconnect', function() {
  			socket.broadcast.to(socket.urlRoom).emit('Recieve','abort')
  			console.log('Abort game')
  		    })

  		//Called on Client behalf, when he presses any checkbox 
  		socket.on('RecieveClientMessage',function(message,operation){
  			if(operation=='push'){
  				global.responses[socket.urlRoom][socket.name][socket.cur_level].push(message);
  				global.responses[socket.urlRoom][socket.name][socket.cur_level].sort(compareNumbers);
  				}
  			else
  				global.responses[socket.urlRoom][socket.name][socket.cur_level].pop(message);
  			
  			console.log('Recieved messgae from client! '+operation);
  			console.log(global.responses[socket.urlRoom]);
  		})

  		//When other client prresses next level than the current client, the current client has to init it's level
  		socket.on('LevelInit',function(level){
  			socket.cur_level=level;
  			global.responses[socket.urlRoom][socket.name][socket.cur_level]=[];
  			console.log(global.responses);

  		});

  		//When Client press next level button
  		socket.on('ProceedToNextlevel',function(){
  			console.log('Recieved messgae from client! to proceed to next level');
  			var other_player;
  			if(socket.name =='O_1')
  				other_player = 'O_2';
  			else
  				other_player = 'O_1';
  			var numClients = io.sockets.clients(socket.urlRoom).length;
  			
  			if(numClients==1)
  				socket.emit('Recieve','no player')

  			else{
  				if(global.responses[socket.urlRoom][socket.name][socket.cur_level].equals(global.responses[socket.urlRoom][other_player][socket.cur_level])){

	  				if((socket.cur_level+1)<=socket.levels){
			  			socket.cur_level+=1
			  			global.responses[socket.urlRoom][socket.name][socket.cur_level]=[];
			  			socket.emit('RecieveLevel',socket.cur_level);
			  			socket.broadcast.to(socket.urlRoom).emit('Recieve','next');
			  			socket.broadcast.to(socket.urlRoom).emit('RecieveLevel',socket.cur_level);	
		  			}
		  			else{
		  				socket.emit('Recieve','finish');
			  			socket.broadcast.to(socket.urlRoom).emit('Recieve','fin_next');
		  			}
	  			}

	  			else{
		  			console.log('No match yet!')
		  			socket.emit('Recieve','no match')
	  				}
	  	   }
  			
  		})
   
  });
 

})();