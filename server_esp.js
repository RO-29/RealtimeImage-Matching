//io.sockets.in.... every socket in room
//socket.broadcast.to ... every socket except itself
(function(){
	
	var express = require('express');
	var app = express();
	var http = require('http').Server(app);
	var io = require('socket.io').listen(http);
	var url = require('url');
	var port = Number(process.env.PORT || 7000),
  moment = require('moment'),
	sys = require('sys'),
	cors = require('cors'),
  path = require('path'),
	fs = require('fs');
	var knex = require('knex')({
  		client: 'pg',
  		connection: {
    		host     : 'localhost',
    		user     :'postgres',
    		password : 'rohit',
    		database : 'ESP'
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

  app.get('/admin_panel',function(req,res){
    res.sendfile(__dirname+'/admin_panel.html')
  })
  app.get('/stat_details',function(req,res){

    res.json(global.round_wins)
  })

    app.get('/stat_points',function(req,res){

    res.json(global.round_wins_points)
  })


  //init the database, Only One time call
  app.get('/init',function(req,res){
    knex.schema.createTable('game', function (table) {
       table.string('Name');
       table.integer('levels');
       }).exec();

    knex('game').insert({Name: 'game_1',levels:5}).exec();
    res.send('Done');

  });

 app.get('/leader', function(req, res) {
    res.sendfile(__dirname+'/leaderboard.html');
  });


  app.get('/:game_name', function(req, res) {
    console.log('request for room: ' + req.params.game_name);
    res.send('Invalid Request');
  });
  //Route to serve the game
	app.get('/:game_name/:uname', function(req, res) {
    console.log('request for room: ' + req.params.game_name);
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

  function findOtherPlayer(socket){
    if(socket.name_obj == global.room_users[socket.urlRoom][0])
        return(global.room_users[socket.urlRoom][1]);
    else
        return(global.room_users[socket.urlRoom][0]);
  }

  function createOrJoin(socket, room,uname) {
    var numClients = io.sockets.clients(room).length;
  
        if (numClients == 0) {
          socket.join(room);
          global.room_users[room]=[]
          global.room_users[room].push(uname+'_1')
          socket.name_obj = uname+'_1';
          socket.emit('created', room);
        }
        else if (numClients < 2 ) {
          socket.join(room);
          global.room_users[room].push(uname+'_2')
          socket.name_obj = uname+'_2';
          socket.broadcast.to(room).emit('join', room);
          socket.emit('joined', room);
      	}
        else
          	socket.emit('full', room);

        return room;
}

  global.responses = {}
  global.room_users ={}
  global.round_wins = {}
  global.create_time = {}
  global.answer_time ={}
  global.round_win_number ={}
  global.round_wins_points ={}
  io.sockets.on('connection', function(socket) {

  		//Called on creation of game _room
  		socket.on('create or join', function(room,uname) {

        var numClients = io.sockets.clients(room).length;
        socket.game_name = room;
        socket.name = uname;
        socket.time_answers = {}
        socket.time_creations = {}


    //If a game already has 2 opponents and a new opponent joins in,we create a room+_n for that new opponents
        if(numClients ==2){
            i=2
            while(1){
                    room_temp = room + '_room'+i;
                    len = io.sockets.clients(room_temp).length;
                    if(len<2){
                      room = room_temp;
                      break;
                    }

                    i+=1;
                  }
            }

         if(typeof(global.responses[room]) == 'undefined'){
          global.responses[room]={};
         }

         if(typeof(global.round_wins[room]) == 'undefined'){
          global.round_wins[room]={};
          global.round_win_number[room]={};
          global.round_wins_points[room] = {}

         }

         if(typeof(global.create_time[room]) == 'undefined'){
              global.create_time[room]={}
              global.answer_time[room]={}

         }
     		
        console.log('room: ' + room);

        socket.cur_level = 1;
        socket.cur_round = 1;
      	socket.urlRoom = room;
        createOrJoin(socket, room,socket.name);
      	
       

        knex('game').select().where({
		        Name: socket.game_name
		     }).exec(function(err, results) {
		        if (err)
		            socket.emit('Recieve','db_err')
		        else
		            socket.rounds = results[0]['levels'];
		    });
      	
        global.responses[socket.urlRoom][socket.name_obj]={}
      	global.responses[socket.urlRoom][socket.name_obj][socket.cur_round+'_'+socket.cur_level]=[];
        global.round_wins[room][socket.name_obj] =[]
        global.round_wins_points[room][socket.name_obj] = 0 


        socket.time_creations['Round_'+socket.cur_round] = []
        socket.time_answers['Round_'+socket.cur_round] = []

        
        //Push this when other user joins, change!!
        socket.time_creations['Round_'+socket.cur_round].push(moment())

        global.create_time[socket.urlRoom][socket.name_obj] = socket.time_creations

        global.round_win_number[room][socket.name_obj] = 0

    	});

  		//When you disconnect midway, abort the game 
  		socket.on('disconnect', function() {
  			socket.broadcast.to(socket.urlRoom).emit('Recieve','abort')
  			console.log('Abort game')
  		    })

  		//Called on Client behalf, when he presses any checkbox 
  		socket.on('RecieveClientMessage',function(message,operation){
  			if(operation=='push'){
          socket.time_answers['Round_'+socket.cur_round][socket.cur_level-1] = moment()
          global.answer_time[socket.urlRoom][socket.name_obj] = socket.time_answers
  				
          global.responses[socket.urlRoom][socket.name_obj][socket.cur_round+'_'+socket.cur_level].push(message);
  				global.responses[socket.urlRoom][socket.name_obj][socket.cur_round+'_'+socket.cur_level].sort(compareNumbers);
  				}
  			else
  				global.responses[socket.urlRoom][socket.name_obj][socket.cur_round+'_'+socket.cur_level].pop(message);
  			
  			console.log('Recieved messgae from client! '+operation);
  		})

  		//When one client gets correct next level than the other client, the other client has to init it's level of same round
  		socket.on('LevelInit',function(level){
        console.log('Level Increase of '+socket.name+' '+level)
  			socket.cur_level=level;
  			global.responses[socket.urlRoom][socket.name_obj][socket.cur_round+'_'+socket.cur_level]=[];
        console.log('Next level ->'+ socket.cur_round+'_'+socket.cur_level);
        socket.time_creations['Round_'+socket.cur_round].push(moment())
        global.create_time[socket.urlRoom][socket.name_obj] = socket.time_creations


  		});

      //When one client proceeds to next round than the other client first, the other client has to init it's roundand level of same round
      socket.on('RoundInit',function(round){
        console.log('Round Increase of '+socket.name+' '+round)
        socket.cur_round=round;
        socket.cur_level = 1;
        global.responses[socket.urlRoom][socket.name_obj][socket.cur_round+'_'+socket.cur_level]=[];
        console.log('Next Round ->'+ socket.cur_round+'_'+socket.cur_level);
        socket.time_creations['Round_'+socket.cur_round] = []
        socket.time_answers['Round_'+socket.cur_round] = []
        socket.time_creations['Round_'+socket.cur_round].push(moment())
        global.create_time[socket.urlRoom][socket.name_obj] = socket.time_creations


      });

  		//When Client press next level button
  		socket.on('ProceedToNextlevel_Round',function(){
  			console.log('Recieved messgae from client to proceed to next Round/level');
        var numClients = io.sockets.clients(socket.urlRoom).length;
        if(numClients==1)
          socket.emit('Recieve','no player')

        else {
      			
            other_player = findOtherPlayer(socket)

      			if(global.responses[socket.urlRoom][socket.name_obj][socket.cur_round+'_'+socket.cur_level].equals(global.responses[socket.urlRoom][other_player][socket.cur_round+'_'+socket.cur_level])){

                //For incrementing to next level of same round 
                if(socket.cur_level<3){
      
                  socket.cur_level+=1;
                  socket.time_creations['Round_'+socket.cur_round].push(moment())
                  global.create_time[socket.urlRoom][socket.name_obj] = socket.time_creations
                  console.log('Level Increase of player'+socket.name_obj+'_'+socket.cur_level);
                  global.responses[socket.urlRoom][socket.name_obj][socket.cur_round+'_'+socket.cur_level]=[];
                  socket.emit('RecieveLevel_Round',socket.cur_level,socket.cur_round,2);
                  socket.broadcast.to(socket.urlRoom).emit('RecieveLevel_Round',socket.cur_level,socket.cur_round,2);  
                  socket.broadcast.to(socket.urlRoom).emit('Recieve','next_level');
                }

                //For incrementing to next round!
                else{
      	  				
                    var other_player = findOtherPlayer(socket)
                    var time_c_1 = global.create_time[socket.urlRoom][other_player]
                    var time_a_1 = global.answer_time[socket.urlRoom][other_player]

                    total_time_player_1 =0
                    for(i=0;i<3;i++){
                      
                      time = socket.time_creations['Round_'+socket.cur_round][i].diff(socket.time_answers['Round_'+socket.cur_round][i],'seconds')
                      
                      if(time < 0)
                        time*=-1
                      
                      total_time_player_1 +=time
                    
                    }

                    total_time_player_2 =0
                    for(i=0;i<3;i++){
                      
                      time = time_c_1['Round_'+socket.cur_round][i].diff(time_a_1['Round_'+socket.cur_round][i],'seconds')
                      
                      if(time < 0)
                        time*=-1
                      
                      total_time_player_2 +=time
                    
                    }

                  console.log('player1_time in Round_->',total_time_player_1)
                  console.log('player2_time->',total_time_player_2)

                  var flag_win = 0
                  if(total_time_player_1 < total_time_player_2){
                    console.log(global.round_wins)
                    console.log(global.round_wins[socket.urlRoom][other_player])
                    global.round_wins[socket.urlRoom][socket.name_obj].push(1)
                    global.round_wins_points[socket.urlRoom][socket.name_obj]+=2
                    global.round_wins[socket.urlRoom][other_player].push(0)
                    flag_win = 1
                    global.round_win_number[socket.urlRoom][socket.name_obj]+=1
                 }
                 else{
                      console.log(global.round_wins)
                      console.log(global.round_wins[socket.urlRoom][other_player])

                      global.round_wins[socket.urlRoom][other_player].push(1)
                      global.round_wins_points[socket.urlRoom][other_player]+=2
                      global.round_wins[socket.urlRoom][socket.name_obj].push(0)

                      global.round_win_number[socket.urlRoom][other_player]+=1

                 }

                  p1_win = global.round_win_number[socket.urlRoom][socket.name_obj]

                  console.log(socket.name+'->'+total_time_player_1) 
                  
                  p2_win = global.round_win_number[socket.urlRoom][other_player] 

                  if((socket.cur_round+1)<=socket.rounds && (p1_win<3 && p2_win<3 )){  

                    socket.cur_level=1
                    socket.cur_round+=1
                    socket.time_creations['Round_'+socket.cur_round] = []
                    socket.time_answers['Round_'+socket.cur_round] = []
                    socket.time_creations['Round_'+socket.cur_round].push(moment())
                    global.create_time[socket.urlRoom][socket.name_obj] = socket.time_creations

                    console.log('Round Increase of player'+socket.name_obj+'_'+socket.cur_round);
      			  			global.responses[socket.urlRoom][socket.name_obj][socket.cur_round+'_'+socket.cur_level]=[];
      			  			socket.emit('RecieveLevel_Round',socket.cur_level,socket.cur_round,flag_win);

                    socket.broadcast.to(socket.urlRoom).emit('RecieveLevel_Round',socket.cur_level,socket.cur_round,!flag_win); 
      			  			socket.broadcast.to(socket.urlRoom).emit('Recieve','next_round');
      		  			}
      		  			else{
                    flag_round = 0
                    if(p1_win>p2_win){
                      flag_round = 1
                      global.round_wins_points[socket.urlRoom][socket.name_obj]+=10
                    }
                    else{
                      global.round_wins_points[socket.urlRoom][other_player]+=10
                    }
                   
                   	socket.emit('finish',flag_win,flag_round);
      			  			socket.broadcast.to(socket.urlRoom).emit('finish',!flag_win,!flag_round);
      		  			}

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