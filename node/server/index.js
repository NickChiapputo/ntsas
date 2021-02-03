const http = require( 'http' );			// Server library.
const url = require( 'url' );			// Used to parse URL parameters.

const defaultServerThreshold = 35;
const defaultServerUrl = 'https//hubs.mozilla.com/vq9dk8N/palatable-ethical-rendezvous/';


let dbLib = undefined;


// Communication between Discord bot and redirecting server.
// Create initial empty JSON object. Each key is a url to a hubs room.
// Each value is the occupancy of the room.
let serverInformation = {};


module.exports = {
	createServer: function( hostname, port )
	{
		return http.createServer( serverAction );
	},


	linkDatabase: function( db )
	{
		return dbLib = db;
	}
}

var serverAction = async function ( req, res )
{
	// Display date and action for debugging
	var date = new Date().toISOString().substr( 11, 8 );
	console.log( " \n \n(" + date  + "): Redirect Query." );


	// Get the path information.
	let url_parts = url.parse( req.url );
	let pathname = url_parts.pathname;


	console.log( `Pathname: ${pathname}` );
	// If we receive the join link, auto-route.
	if( pathname === "/join/" )
	{
		// Get all the hubs rooms.
		let query = {
			watching: 1
		};
		let options = {};
		let occupancyData = await dbLib.getHubsRooms( query, options );


		// Iterate through each room and find the room
		// with the highest occupancy under the threshold.
		let redir_url = undefined;
		let max_occ = -1;
		for( let i = 0; i < occupancyData.length; i++ )
		{
			let curr_room = occupancyData[ i ];
			if( curr_room.users < curr_room.threshold && curr_room.users > max_occ )
			{
				redir_url = curr_room.url;
				max_occ = curr_room.users;
			}
		}

		console.log( `Redirecting to ${redir_url}` );


		// Redirect to the Hubs room.
		res.writeHead( 302, {
			'Location': redir_url
		});
		res.end();
		return;
	}


	res.statusCode = 200;									// Set 200 OK status
	res.setHeader( 'Content-Type', 'application/json' );	// Set response type as plain text since that's what we receive from the client.
	res.setHeader( 'Access-Control-Allow-Origin', '*' );	// Allow CORS requests for local work


	let query = {
		"watching": 1
	};

	let options = {
		projection: { "_id": 0 } 
	};

	let occupancyData = await dbLib.getHubsRooms( query, options );
	// console.log( `Return Vaule: ${JSON.stringify( occupancyData )}`);


	res.end( JSON.stringify( occupancyData ) );
	return;
}