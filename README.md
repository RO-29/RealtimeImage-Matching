Problem Statement
==================================
Problem 
Create an ESP game for Matching images. e.g. Artigo is an esp game that is used for tagging.

Problem Description/Rules
You need atleast two players paired to play this game at a time. 

Each player may not know whom they are paired with.

During the game play each paired player is shown the same question.

Each question would have a primary image and a set of secondary images to match to the primary image

Both paired players can move to the next question only when they choose the same set of secondary images


DEMO
=====================
https://esptag.herokuapp.com

Note**When you press to next level, it might take some time to load the images of that level


Running Instructions (onlocal machine)
===============================
npm install 

node server_esp.js

http://localhost:7000/init

*http://localhost:7000/init run this only for first time!

*change db settings in server_esp.js

*make sure port 7000 is free

*open console in browser to see whats going under the hood



Trivia & WHY
====================================

database used is postgres, it's schema is defined in server_esp.js in knex creatatable

knex.js is ORM for javascript for sql

socket.io is used for dual communication

/static/engine.js contains the client side logic ,server_esp.js is the server logic

NodeJs and socket.io were used because nodejs got a real good support of websocket by having a abstraction library built over websockets namely socket.io.

socket.io handles server to client ,client to server,client to client in really non fussy manner
this was the basic requirement of problme given here

Also look at the comments in code to know more about the basic functions used

databse is used to get total levels of game
/static/images is organised in such a way that it caters to the game logic, for ex game having name "game_1" is stored as /static/images/game_1/level_n,where level_n contains the the base_image and option images of that level
