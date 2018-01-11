const http = require('http');
const WebSocketServer = require('websocket').server;
const fs = require('fs');
const Log = require('log');
const log = new Log('debug');
const PORT = 18000;

//Partie pour servir les fichiers statiques (serveur http normal)
const server = http.createServer(function(request, response) {
	let responsePage;
	switch(request.url) {
		case '/':
			response.writeHead(200, {'Content-Type': 'text/html'});
			responsePage = fs.readFileSync('client.html');
		break;
		case '/GameManager.js':
			response.writeHead(200, {'Content-Type': 'text/javascript'});
			responsePage = fs.readFileSync('GameManager.js');
		break;
		case '/client.js':
			response.writeHead(200, {'Content-Type': 'text/javascript'});
			responsePage = fs.readFileSync('client.js');
		break;
		//404 Not found
		default:
			response.writeHead(404, {'Content-Type': 'text/html'});
			responsePage = '<html><head><meta charset="utf-8"><title>Oops !</title></head><body><p>404, Page not found<p></body>';
		break;
	}
	response.end(responsePage);
})
server.listen(PORT, function() {
	log.debug('Server listening on port ' + PORT)
})

// create the server
const wsServer = new WebSocketServer({
	httpServer: server
});

let connections = [];
let id = 0;

// WebSocket server
wsServer.on('request', function(request) {
	let connection = request.accept(null, request.origin);
	connection.id = id;
	
    connection.on('message', function(msg) {
		if (msg.type == 'utf8') {
			msg = JSON.parse(msg.utf8Data);
		}
		else {
			return;
		}

		switch(msg.type) {
			case 'hello':
				log.debug('case hello');
				let player = msg.data;
				player.id = id;
				connection.player = player;
				log.debug(connection.player);

				// Send id to new client
				let message = {
					id: id,
					type: 'id',
					data: player
				};
				connection.send(JSON.stringify(message));

				message.type = 'hello';
				for (const conn of connections) {
					// Send to others clients infos about new player
					message.id = id;
					message.data = player;
					conn.send(JSON.stringify(message));

					// Send others players to new client/player
					message.id = conn.id;
					message.data = conn.player;
					connection.send(JSON.stringify(message));
				}
				connections[id] = connection;
				id++;

				break;
			case 'position':
			case 'message':
				for (const conn of connections) {
					if (conn.id != connection.id) {
						conn.send(JSON.stringify(msg));
					}
				}
				break;
			default:
				break;
		}
    });

    connection.on('close', function(connection) {
    		///////////////////
		//CODE TO INSERT HERE
		///////////////////

    });
})
