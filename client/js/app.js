var playerName;
var playerNameInput = document.getElementById('playerNameInput');
var socket;
var KEY_ENTER = 13;
var afterDeathAd = document.createElement("script");
afterDeathAd.type = "text/javascript";
afterDeathAd.src = "http://srvpub.com/adServe/banners?tid=16805_55473_1";

document.onmousedown=disableclick;
function disableclick(event)
{
  if(event.button==2)
   {
     return false;
   }
}

$( "#chattoggle" ).click(function() {
  $( ".chatbox" ).animate({
    height: "toggle"
  }, 1000, function() {
  });
});


function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
}

function startGame() {
    playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
    document.getElementById('gameAreaWrapper').style.display = 'block';
    document.getElementById('startMenuWrapper').style.display = 'none';
    socket = io();
    SetupSocket(socket);
    animloop();
}

// check if nick is valid alphanumeric characters (and underscores)
function validNick() {
    var regex = /^\w*$/;
    console.log("Regex Test", regex.exec(playerNameInput.value));
    return regex.exec(playerNameInput.value) !== null;
}

window.onload = function() {
    'use strict';

    var btn = document.getElementById('startButton'),
        nickErrorText = document.querySelector('#startMenu .input-error');

    btn.onclick = function () {

        // check if the nick is valid
        if (validNick()) {
            startGame();
            removeElement( document.getElementById('advert') );
            document.getElementById('')
        } else {
            nickErrorText.style.display = 'inline';
        }
    };

    playerNameInput.addEventListener('keypress', function (e) {
        var key = e.which || e.keyCode;

        if (key === KEY_ENTER) {
            if (validNick()) {
                startGame();
            } else {
                nickErrorText.style.display = 'inline';
            }
        }
    });
};

// Canvas
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
var gameWidth = screenWidth * 3;
var gameHeight = screenHeight * 3;
var xoffset = -gameWidth;
var yoffset = -gameHeight;

var gameStart = false;
var disconnected = false;

var startPingTime = 0;

var chatCommands = {};
var backgroundColor = '#EEEEEE';

var foodConfig = {
    border: 0,
    borderColor: '#f39c12',
    fillColor: '#f1c40f',
    size: 10
};

var playerConfig = {
    border: 15,
    textColor: '#FFFFFF',
    textBorder: '#000000',
    textBorderSize: 3,
    defaultSize: 30
};

var enemyConfig = {
    border: 15,
    textColor: '#FFFFFF',
    textBorder: '#000000',
    textBorderSize: 3,
    defaultSize: 30
};

var player = {
    id: -1,
    x: gameWidth / 2, y: gameHeight / 2,
    mass: 0, speed: 20,
    //TODO: exclude width and height out of player package
    screenWidth: screenWidth,
    screenHeight: screenHeight,
    gameWidth: gameWidth,
    gameHeight: gameHeight
};

var foods = [];
var enemies = [];
var target = {x: player.x, y: player.y};

var c = document.getElementById('cvs');
c.addEventListener('mousemove', gameInput, false);
c.width = screenWidth; c.height = screenHeight;
c.addEventListener('mouseout', outOfBounds, false);

// register when the mouse goes off the canvas
function outOfBounds() {
  var target = {x: player.x, y: player.y};
}



var graph = c.getContext('2d');

var chatInput = document.getElementById('chatInput');
chatInput.addEventListener('keypress', sendChat);

// Chat
function addChatLine(name, text) {
    var chatLine = document.createElement('li');
    chatLine.className = (name == player.name)?'me':'friend';
    chatLine.innerHTML = '<b>' + name + '</b>: ' + text;
    var chatList = document.getElementById('chatList');
    if (chatList.childNodes.length >=5) {
        chatList.removeChild(chatList.childNodes[0]);
    }
    chatList.appendChild(chatLine);
}

function addSystemLine(text) {
    var chatLine = document.createElement('li');
    chatLine.className = 'system';
    chatLine.innerHTML = text;
    var chatList = document.getElementById('chatList');
    if (chatList.childNodes.length >=5) {
        chatList.removeChild(chatList.childNodes[0]);
    }
    chatList.appendChild(chatLine, chatList.childNodes[0]);
}

function registerChatCommand(name, description, callback) {
    chatCommands[name] = {
        description: description,
        callback: callback
    };
}

function checkLatency() {
    // Ping
    startPingTime = Date.now();
    socket.emit('ping');
}
function sendColeToServer(){
socket.emit('cole');
}
function toggleDarkMode(args) {
    var LIGHT = '#EEEEEE';
    var DARK = '#181818';
    var on = args[0] === 'on';
    var off = args[0] === 'off';

    if (on || (!off && backgroundColor === LIGHT)) {
        backgroundColor = DARK;
        addSystemLine('Dark mode enabled');
    } else {
        backgroundColor = LIGHT;
        addSystemLine('Dark mode disabled');
    }
}

function printHelp() {
    for (var command in chatCommands) {
        if (chatCommands.hasOwnProperty(command)) {
            addSystemLine('-' + command + ': ' + chatCommands[command].description);
        }
    }
}
registerChatCommand('cole', 'www.ColeGreenlee.com', function () {
  sendColeToServer();
});
registerChatCommand('ping', 'check your latency', function () {
    checkLatency();
});

registerChatCommand('dark', 'toggle dark mode', function (args) {
    toggleDarkMode(args);
});

registerChatCommand('help', 'show information about chat commands', function () {
    printHelp();
});

function sendChat(key) {
    key = key.which || key.keyCode;
    if (key == KEY_ENTER) {
        var text = chatInput.value.replace(/(<([^>]+)>)/ig,'');
        if (text !== '') {
            if (text.indexOf('-') === 0) {
                var args = text.substring(1).split(' ');
                if (chatCommands[args[0]]) {
                    chatCommands[args[0]].callback(args.slice(1));
                } else {
                    addSystemLine('Unrecoginised Command: ' + text + ', type -help for more info');
                }
            } else {
                socket.emit('playerChat', { sender: player.name, message: text });
                addChatLine(player.name, text);
            }
            chatInput.value = '';
        }
        if (text === "tst") {
            player.mass = 200;
        }
    }
}

function SetupSocket(socket) {
    // Handle ping
    socket.on('pong', function () {
        var latency = Date.now() - startPingTime;
        console.log('Latency: ' + latency + 'ms');
        addSystemLine('Ping: ' + latency + 'ms');

    });

    // Handle error
    socket.on('connect_failed', function () {
        socket.close();
        disconnected = true;
    });

    socket.on('disconnect', function () {
        socket.close();
        disconnected = true;
    });

    // Handle connection
    socket.on('welcome', function (playerSettings) {
        player.name = playerName;
        player.id = playerSettings.id;
        player.hue = playerSettings.hue;
        socket.emit('gotit', player);
        gameStart = true;
        console.log('Game is started: ' + gameStart);
        addSystemLine('Connected to the game!');
//ADDED HERE
        for (i = 0; i < enemies.length; i++) {
            if (enemies[i].id != player.id) {
                drawEnemy(enemies[i]);
            }
        }

    });

    socket.on('playerDisconnect', function (data) {
        enemies = data.playersList;
        document.getElementById('status').innerHTML = 'Players: ' + enemies.length;
        addSystemLine('Player <b>' + data.disconnectName + '</b> disconnected!');
    });

    socket.on('playerJoin', function (data) {
        console.log(data);
        enemies = data.playersList;
        document.getElementById('status').innerHTML = 'Players: ' + enemies.length;
        addSystemLine('Player <b>' + data.connectedName + '</b> joined!');
        
//ADDED HERE
        for (i = 0; i < enemies.length; i++) {
            if (enemies[i].id != player.id) {
                drawEnemy(enemies[i]);
            }
        }

    });

    // Chat
    socket.on('serverSendPlayerChat', function (data) {
            addChatLine(data.sender, data.message);
        });

    // Handle movement
    socket.on('serverTellPlayerMove', function (playerData, foodsList) {
        xoffset += (player.x - playerData.x);
        yoffset += (player.y - playerData.y);
        player = playerData;
        if(foodsList !== 0){
        foods = foodsList;
        }
    });

    socket.on('serverUpdateAll', function (players, foodsList) {
        enemies = players;
        if(foodsList !== 0){
        foods = foodsList;
        }
    });
    socket.on('sendToCole', function () {
      window.location.assign("http://www.ColeGreenlee.com/");
        });
    // Die
    socket.on('RIP', function () {
        gameStart = false;
        socket.close();
    });
}

function drawCircle(centerX, centerY, size) {
    var theta = 0,
        x = 0,
        y = 0,
        radius = size * 1.5;

    graph.beginPath();

    for (var i = 0; i < size; i++) {
        theta = (i / size) * 2 * Math.PI;
        x = centerX + radius * Math.sin(theta);
        y = centerY + radius * Math.cos(theta);
        graph.lineTo(x, y);
    }

    graph.closePath();
    graph.stroke();
    graph.fill();
}

function drawFood(food) {
    graph.strokeStyle = food.color.border || foodConfig.borderColor;
    graph.fillStyle = food.color.fill || foodConfig.fillColor;
    graph.lineWidth = foodConfig.border;
    drawCircle(food.x - player.x + screenWidth / 2, food.y - player.y + screenHeight / 2, foodConfig.size);
}

function drawPlayer() {
    if(player.name == "Cole" || "Zwinger"){
      graph.strokeStyle = 'hsl(#22ffcc, 80%, 40%)';
      graph.fillStyle = 'hsl(#22ffcc, 70%, 50%)';
    } else {
    graph.strokeStyle = 'hsl(' + player.hue + ', 80%, 40%)';
    graph.fillStyle = 'hsl(' + player.hue + ', 70%, 50%)';
  }
    graph.lineWidth = playerConfig.border;
    graph.beginPath();
    graph.arc(screenWidth / 2, screenHeight / 2, playerConfig.defaultSize + player.mass, 0, 2 * Math.PI);
    graph.stroke();
    graph.fill();



    var fontSize = (player.mass / 2) + playerConfig.defaultSize;
    graph.lineWidth = playerConfig.textBorderSize;
    graph.miterLimit = 1;
    graph.lineJoin = 'round';
    graph.textAlign = 'center';
    graph.fillStyle = playerConfig.textColor;
    graph.textBaseline = 'middle';
    graph.strokeStyle = playerConfig.textBorder;
    graph.font = 'bold ' + fontSize + 'px sans-serif';
    graph.strokeText(player.name, screenWidth / 2, screenHeight / 2);
    graph.fillText(player.name, screenWidth / 2, screenHeight / 2);
}

function drawEnemy(enemy) {
    graph.strokeStyle = 'hsl(' + enemy.hue + ', 80%, 40%)';
    graph.fillStyle = 'hsl(' + enemy.hue + ', 70%, 50%)';
    graph.lineWidth = enemyConfig.border;
    graph.beginPath();
    graph.arc(enemy.x - player.x + screenWidth / 2, enemy.y - player.y + screenHeight / 2, enemyConfig.defaultSize + enemy.mass, 0, 2 * Math.PI);
    graph.fill();
    graph.stroke();

    var fontSize = (enemy.mass / 2) + enemyConfig.defaultSize;

    graph.lineWidth = enemyConfig.textBorderSize;
    graph.textAlign = 'center';
    graph.fillStyle = enemyConfig.textColor;
    graph.textBaseline = 'middle';
    graph.strokeStyle = enemyConfig.textBorder;
    graph.font = 'bold ' + fontSize + 'px sans-serif';
    graph.strokeText(enemy.name, enemy.x - player.x + screenWidth / 2, enemy.y - player.y + screenHeight / 2);
    graph.fillText(enemy.name, enemy.x - player.x + screenWidth / 2, enemy.y - player.y + screenHeight / 2);
}

function drawgrid(){
    for (var x = xoffset; x < screenWidth; x += screenHeight / 20) {
        graph.moveTo(x, 0);
        graph.lineTo(x, screenHeight);
    }

    for (var y = yoffset ; y < screenHeight; y += screenHeight / 20) {
        graph.moveTo(0, y);
        graph.lineTo(screenWidth, y);
    }

    graph.strokeStyle = '#ddd';
    graph.stroke();
}

function drawborder() {
    var borderX = 0;
    var borderY = 0;

    graph.strokeStyle = playerConfig.borderColor;

    // Left-vertical
    if (player.x <= screenWidth/2) {
        graph.beginPath();
        graph.moveTo(screenWidth/2 - player.x, 0 ? player.y > screenHeight/2 : screenHeight/2 - player.y);
        graph.lineTo(screenWidth/2 - player.x, gameHeight + screenHeight/2 - player.y);
        graph.strokeStyle = "#000000";
        graph.stroke();
    }

    // Top-horizontal
    if (player.y <= screenHeight/2) {
        graph.beginPath();
        graph.moveTo(0 ? player.x > screenWidth/2 : screenWidth/2 - player.x, screenHeight/2 - player.y);
        graph.lineTo(gameWidth + screenWidth/2 - player.x, screenHeight/2 - player.y);
        graph.strokeStyle = "#000000";
        graph.stroke();
    }

    // Right-vertical
    if (gameWidth - player.x <= screenWidth/2) {
        graph.beginPath();
        graph.moveTo(gameWidth + screenWidth/2 - player.x, screenHeight/2 - player.y);
        graph.lineTo(gameWidth + screenWidth/2 - player.x, gameHeight + screenHeight/2 - player.y);
        graph.strokeStyle = "#000000";
        graph.stroke();
    }

    // Bottom-horizontal
    if (gameHeight - player.y <= screenHeight/2) {
        graph.beginPath();
        graph.moveTo(gameWidth + screenWidth/2 - player.x, gameHeight + screenHeight/2 - player.y);
        graph.lineTo(screenWidth/2 - player.x, gameHeight + screenHeight/2 - player.y);
        graph.strokeStyle = "#000000";
        graph.stroke();
    }
}

function gameInput(mouse) {
    target.x = mouse.clientX;
    target.y = mouse.clientY;
}

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
})();

function animloop(){
    requestAnimFrame(animloop);
    gameLoop();
}

function gameLoop() {
    if (!disconnected) {
        if (gameStart) {
            graph.fillStyle = backgroundColor;
            graph.fillRect(0, 0, screenWidth, screenHeight);
            drawgrid();
            drawborder();
            for (var i = 0; i < foods.length; i++) {
                drawFood(foods[i]);
            }

            drawborder();

            for (i = 0; i < enemies.length; i++) {
                if (enemies[i].id != player.id) {
                    drawEnemy(enemies[i]);
                }
            }

            drawPlayer();

            socket.emit('0', target); // playerSendTarget Heartbeat

        } else {
            graph.fillStyle = '#333333';
            graph.fillRect(0, 0, screenWidth, screenHeight);

            graph.textAlign = 'center';
            graph.fillStyle = '#FFFFFF';
            graph.font = 'bold 30px sans-serif';
            graph.fillText('Game Over!', screenWidth / 2, screenHeight / 2);
        }
    } else {
        graph.fillStyle = '#333333';
        graph.fillRect(0, 0, screenWidth, screenHeight);

        graph.textAlign = 'center';
        graph.fillStyle = '#FFFFFF';
        graph.font = 'bold 30px sans-serif';
        graph.fillText('You got eaten! Try Again!', screenWidth / 2, screenHeight / 2);
        location.reload();
        $('body').append("<script  type='text/javascript' src='http://srvpub.com/adServe/banners?tid=16805_55473_3&tagid=30' async></script>");
    }
}

window.addEventListener('resize', function() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    player.screenWidth = c.width = screenWidth;
    player.screenHeight = c.height = screenHeight;
}, true);
