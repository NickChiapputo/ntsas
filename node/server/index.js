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
	console.log( `Return Vaule: ${JSON.stringify( occupancyData )}`);


	res.end( JSON.stringify( occupancyData ) );
	return;
	// res.send( await dbLib.getHubsOccupancy() );
	// res.end();
	///////////////////////////////////////////////////////////////////////////////////////

/*
	res.statusCode = 200;									// Set 200 OK status
	res.setHeader( 'Content-Type', 'text/plain' );			// Set response type as plain text since that's what we receive from the client.
	res.setHeader( 'Access-Control-Allow-Origin', '*' );	// Allow CORS requests for local work


	// Get URL parameters.
	var url_parts = url.parse( req.url, true );
	var path  = url_parts.pathname;
	var query = url_parts.query;

	console.log( `Threshold: ${query.threshold}` );


	// Verify query parts.
	let server_threshold = query.threshold ? query.threshold : defaultServerThreshold;
	let nav_url = query.url ? query.url : defaultServerUrl;


	// Plain text response.
	//let body = '<html><head><title>Welcome to your_domain!</title></head><body><img src="/joe.gif" />';
	let body = '';


	body += `You tried to navigate to ${nav_url}\n\n` + 
			`Maximum Occupancy Threshold: ${server_threshold}\n\n`;


	// Copy the JSON object so we don't have race issues.
	let tempJSON = serverInformation;


	// Display JSON object.
	console.log( `Site Data: \n${JSON.stringify( tempJSON, null, 2 )}` );
	body += `Site Data: \n${JSON.stringify( tempJSON, null, 2 )}`;


	// Best URL stats.
	let bestUrl = "";
	let bestUrlOcc = -1;


	// Check if the desired URL is under the threshold.
	if( tempJSON[ nav_url ] < server_threshold )
	{
		bestUrl = nav_url;
		bestUrlOcc = tempJSON[ nav_url ]
	}
	else
	{
		// Iterate through the servers to find the first one under the threshold.
		for( var attr in tempJSON )
		{
			if( tempJSON[ attr ] < server_threshold &&
				tempJSON[ attr ] > bestUrlOcc )
			{
				bestUrl = attr;
				bestUrlOcc = tempJSON[ attr ];
			}
		}
	}


	console.log( ` \n \nNAVIGATING TO ${bestUrl}` );
	body += ` \n \nNAVIGATING TO ${bestUrl}`;

	//body += '</body></html>'

	res.end( body );
	// res.writeHead( 302, {
	// 	'Location': redir_url
	// } );
	// res.end();
*/
}