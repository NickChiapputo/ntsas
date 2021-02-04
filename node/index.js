// Requirements for MongoDB server.
const mongoLib = require( './db/' );
// mongoLib.updateHubsOccupancy( "https://hubs.mozilla.com/vq9dk8N/palatable-ethical-rendezvous/", 5 ).then( res => {
// 	console.log( `\n\nUpdate Return Value: ${JSON.stringify( res, null, 2 )}` );
// });


// Reuirements for redirect server.
const hostname = 'localhost';
const port = 3000;

const serverLib = require( './server/' );
serverLib.linkDatabase( mongoLib );
const server = serverLib.createServer( hostname, port );


// Requirements for Discord bot.
let https = require( 'https' );
let fs = require( 'fs' );

const Discord = require( "discord.js" );	// Discord API.
const config = require( "./config.json" );	// Bot configuration.
const client = new Discord.Client();		// Create a discord client.

const channelIDs = [];
const prefix = '!';				// Prefix text to identify commands.
const hubsBotID = '509129921826914304';		// ID for the Hubs bot to identify messages from it.
const deleteMessage = 0;			// Flag to delete last message sent and Hubs Bot response.

let messageChannels = [];			// Create object to hold list of references to channels to message in.
let intervalHandle = undefined;			// Create object to hold interval handle.
let lastMessage = undefined;			// Hold reference to last message to clean it up after response.


// Discord bot message handler.
client.on("message", async function(message) 
{
	// Check if we received a response from the hubs bot.
	if( message.author.id === hubsBotID )
	{
		// console.log( `Received Hubs Bot message.\n${message.content}` );
		if( message.content.startsWith( "Users currently in " ) )
		{
			// There are some number of users in the current room.
			
			let messageParts = message.content.substring( 20 ).split( ':' );
			let url = messageParts[ 0 ] + ':' + messageParts[ 1 ];
			url = url.substring( 25, 32 );
			let numUsers = messageParts[ 2 ].split( ',' ).length;
			// console.log( ` \nHubs Room URL: ${url}\nNumber of Users: ${numUsers}` );
		

			// Delete last request message and current user update
			// only if the response was from the last request message.
			if( lastMessage !== undefined && deleteMessage )
			{
				lastMessage.delete();
				lastMessage = undefined;
				message.delete( { timeout: 0 } );
			}


			// Update the JSON object with the updated user count.
			// serverInformation[ url ] = numUsers;
			// console.log( JSON.stringify( serverInformation, null, 2 ) + "\n " );
			mongoLib.updateHubsOccupancy( url, numUsers ).then( res => {
				// console.log( `\n\nUpdate Return Value: ${JSON.stringify( res, null, 2 )}` );
			});
		}
		else if( message.content.startsWith( "No users currently in " ) )
		{
			// There are no users in the current room.

			let url = message.content.substring( 48, 55 );
			// console.log( ` \nHubs Room URL: ${url}\nNumber of Users: 0` );


			// Delete last request message and current user update
			// only if the response was from the last request message.
			if( lastMessage !== undefined && deleteMessage )
			{
				lastMessage.delete();
				lastMessage = undefined;
				message.delete( { timeout: 0 } );
			}


			// Update the JSON object with the updated user count.
			// serverInformation[ url ] = 0;
			// console.log( JSON.stringify( serverInformation, null, 2 ) + "\n " );
			mongoLib.updateHubsOccupancy( url, 0 ).then( res => {
				// console.log( `\n\nUpdate Return Value: ${JSON.stringify( res, null, 2 )}` );
			});
		}

		return;
	}


	if( !message.content.startsWith( prefix ) ) return;

	const commandBody = message.content.slice( prefix.length );
	const args = commandBody.split( ' ' );
	const command = args.shift().toLowerCase();

	
	if( command !== "ntsas" )
		return;

	if( args[ 0 ] === "ping" )
	{
		const timeTaken = Date.now() - message.createdTimestamp;
		message.reply( `Pong! This message had a latency of ${timeTaken} ms.` );
	}
	else if( args[ 0 ] === "stop" )
	{
		if( intervalHandle !== undefined )
		{
			client.clearInterval( intervalHandle );
			
			intervalHandle = undefined;

			message.channel.send( "Stopping!" );
			console.log( "Stopping!" );
		}
	}
	else if( args[ 0 ] === "start" )
	{
		if( intervalHandle !== undefined )
		{
			// Restart the checking interval.
			
			// Stop the current interval
			client.clearInterval( intervalHandle );
		}


		// Parse the interval frequency, if required.
		let freqS = parseFloat( args[ 1 ] );
		if( !freqS && args[ 1 ]  )
		{
			// Received a frequency argument, but the value was not valid.
			message.channel.send( `Invalid frequency ('${args[ 1 ]}'). Please enter a value greater than 1.` );
		}
		else
		{
			if( !freqS )
				freqS = 5
			let response = `Starting checking every ${freqS * 1000.} milliseconds to:\n`;
			for( i = 0; i < channelIDs.length; i++ )
				response += `<#${channelIDs[ i ]}>\n`;
			//message.channel.send( `Starting checking every ${freqS * 1000.} milliseconds.` );
			message.channel.send( response );
		}

		intervalHandle = client.setInterval( intervalFunc, freqS * 1000. );
	}
	else if( args[ 0 ] === "delete" )
	{
		let deleteCount = parseInt( args[ 1 ] )
		if( deleteCount <= 101 && deleteCount >= 1 )
		{
			console.log( `Deleting ${deleteCount} message.` );
			message.channel.bulkDelete( deleteCount );
			return;
		}
		
		console.log( `Invalid argument ('${args[ 1 ]}'). Please provide an integer in the [1, 100] range.` );
		message.reply( "Invalid argument. Please provide an interger in the [1, 100] range." );
	}
	else if( args[ 0 ] === "link" )
	{
		console.log( `Received link request. ${args[ 1 ]}` );

		// Verify that we received a valid formatted channel.
		if( !args[ 1 ] || !args[ 1 ].match( /<#[0-9]{18}>/ ) )
		{
			console.log( `Invalid channel.\n'${args[ 1 ]}'` );
			message.channel.send( 'Please provide a valid channel.\n\nUsage:\n> **`!ntsas link <channel> <room_name> <threshold>`**' );
			return;
		}


		// Verify that we have received a threshold.
		if( !args[ 2 ] || !args[ 2 ].match( /[0-9]+/ ) )
		{
			console.log( `Invalid threshold.\n'${args[ 2 ]}'` );
			message.channel.send( 'Please provide a valid threshold.\n\nUsage:\n> **`!ntsas link <channel> <room_name> <threshold>`**' )
			return;
		}


		// Verify that we have received a room name.
		if( !args[ 3 ] )
		{
			console.log( `Invalid room name.\n'${args[ 3 ]}'` );
			message.channel.send( 'Please provide a room name.\n\nUsage:\n> **`!ntsas link <channel> <room_name> <threshold>`**' );
			return;
		}

		
		// Search for the channel link request and verify it is an existing channel.
		let newChannelID = args[ 1 ].substring( 2, args[ 1 ].length - 1 );
		let newMessageChannel = undefined;
		if( !(newMessageChannel = client.channels.cache.get( newChannelID ) ) )
		{
			console.log( "Unable to find channel." );
			message.channel.send( `Sorry! I was unable to find the channel ${args[ 1 ]}` );
			return;
		}


		// Check if the channel is in the current list of channels.
		if( channelIDs.includes( newChannelID ) )
		{
			console.log( `Channel ${args[ 1 ]} already linked.` );
			message.channel.send( `Channel ${args[ 1 ]} already linked.` );
			return;


			// TODO: Update channel with new data instead of returning error message.
		}


		// Verify that the channel is bridged with a Hubs room by
		// checking that the topic of the room is set to a valid Hubs URL.
		// URL format is `https://hubs.mozilla.com/<key>/<room-name>/` where
		// <key> is a seven character unique key of alphanumeric values and <room-name>
		// is some human-readable value. The final forward slash is not currently used in
		// Discord topics, but could be added in the future, so we specify it here for completeness.
		if( !newMessageChannel.topic || !newMessageChannel.topic.match( /https:\/\/hubs\.mozilla\.com\/[0-9A-Za-z]{7}\/*\/?/ ) )
		{
			console.log( `Channel ${args[ 1 ]} is not linked with a Hubs room.` );
			message.channel.send( `Channel ${args[ 1 ]} is not linked with a Hubs room.` );
			return;
		}


		// Add the message channel from the list.
		channelIDs.push( newChannelID );
		messageChannels.push( newMessageChannel );


		// Get the threshold user limit.
		let threshold = parseInt( args[ 2 ] );


		// Get the name of the room by combining the remaining arguments.
		// Need to use all arguments to allow for spaces in the room name.
		let name = '';
		for( i = 3; i < args.length - 1; i++ )
		{
			name += args[ i ] + " ";
		}
		name += args[ args.length - 1 ];


		// Check if we have received an image attachment.
		let attachment = message.attachments.first();
		let imageURL = `https://ieeeunt.tk/ntsas21_hubs/media/default.png`;
		if( attachment )
		{
			// Verify that we're receiving a png file to make sure it's an image.
			if( !attachment.name.endsWith( '.png' ) )
			{
				message.reply( 'Please provide a .png attachment to set a preview image.' );
				return;
			}


			// Check to make sure we won't override the default image.
			if( attachment.name === 'default.png' )
			{
				attachment.name = 'default(1).png';
			}


			// TODO check if file exists. If so, change name.


			imageURL = `https://ieeeunt.tk/ntsas21_hubs/media/${attachment.name}`;

			const file = fs.createWriteStream( `../html/ntsas21_hubs/media/${attachment.name}` );
			file.on( 'finish', () => { file.close(); } );
			const request = https.get( attachment.url, response => { response.pipe( file ); } );
		}


		// Update the watching flag, the name of the room, the channel ID, and the image URL in the database.
		// For the URL, we only take the room ID value. This is because the full URL can be changed
		// by room moderators without notice. The room ID will always stay the same and the format
		// of a Hubs room URL will always be https://hubs.mozilla.com/<roomID>/
		// The room name after the final / is not necessary to connect to the room.
		let url = newMessageChannel.topic.substring( 25, 32 );
		let update = {
			watching: 1,
			name: name,
			channelID: newChannelID,
			threshold: threshold,
			image: imageURL
		}
		let upsert = true;

		// Update the room, or create a new one (upsert = true) if one does not exist with the provided room URL ID.
		let result = ( await mongoLib.updateHubsMany( url, update, upsert ) ).value;

		let response = `Now checking channel ${args[ 1 ]} for room '${name}' with threshold ${threshold}. Preview image set to: ${imageURL}.\n\nCurrent channel list:\n`
		for( let i = 0; i < channelIDs.length; i++ )
			response += `<#${channelIDs[ i ]}>\n`;
		message.channel.send( response );
		return;
	}
	else if( args[ 0 ] === "unlink" )
	{
		console.log( `Received unlink request. ${args[ 1 ]}` );
		if( args[ 1 ] && args[ 1 ].match( /<#[0-9]{18}>/ ) )
		{
			console.log( "Unlink request matches." );
			
			// Search for the channel link request and verify it is an existing channel.
			let newChannelID = args[ 1 ].substring( 2, args[ 1 ].length - 1 );
			let newMessageChannel = undefined;
			if( !(newMessageChannel = client.channels.cache.get( newChannelID ) ) )
			{
				console.log( "Unable to find channel." );
				message.channel.send( `Sorry! I was unable to find the channel ${args[ 1 ]}` );
				return;
			}

			console.log( `Found channel. ${newChannelID}` );


			// Check if the channel is not in the current list of channels.
			if( !channelIDs.includes( newChannelID ) )
			{
				console.log( `Channel ${args[ 1 ]} is not currently linked.` );
				message.channel.send( `Channel ${args[ 1 ]} is not currently linked.` );
				return;
			}


			// Remove the message channel from the list.
			channelIDs.splice( channelIDs.indexOf( newChannelID ), 1 );
			messageChannels.splice( messageChannels.indexOf( newMessageChannel ), 1 );


			// Update the watching flag in the database.
			// You HAVE TO ADD A TRAILING '/'. The topic URL does not terminate in one.
			// Since the URL field is a unique key, it must be exactly the same as the link
			// sent by the Hubs bot later on, which contains the trailing slash. We use here a ternary
			// just in case this is changed in the future.
			let url = newMessageChannel.topic.substring( 25, 32 );
			mongoLib.updateRoomWatching( url, 0 );


			let response = `Removed channel ${args[ 1 ]} from user checking list. Current list:\n`;
			for( let i = 0; i < channelIDs.length; i++ )
				response += `<#${channelIDs[ i ]}>\n`;
			console.log( response );
			message.channel.send( response );
			return;
		}

		console.log( "Link request invalid." );
	}
	else if( args[ 0 ] === "list" )
	{
		console.log( "Received list request." );

		let response = `Currently watching rooms:\n`;
		let occupancyResults = await mongoLib.getHubsOccupancy();
		for( let i = 0; i < occupancyResults.length; i++ )
		{
			response += `<#${occupancyResults[ i ].channelID}> - https://hubs.mozilla.com/${occupancyResults[ i ].url}/\n`;
		}
		console.log( response );
		message.channel.send( response );
	}
	else if( args[ 0 ] === "status" )
	{
		console.log( "Received status request." );

		let occupancyResults = await mongoLib.getHubsOccupancy();
		console.log( `Occupancy Results:\n${JSON.stringify( occupancyResults, null, 2 )}` );
		console.log( `${occupancyResults[ 0 ].name}` );

		const postMessage = '\n‎';	// There is a blank character after the \n that can be copied.
		const response = new Discord.MessageEmbed()
							.setColor( '#00853E' )
							.setThumbnail( 'https://ieeeunt.tk/IEEEUNT.png' )
							.setTitle( `Current Occupancy Levels` );
		for( let i = 0; i < occupancyResults.length; i++ )
		{
			let room = occupancyResults[ i ];
			let name = occupancyResults[ i ].name;
			let value = `${occupancyResults[ i ].users} / ${occupancyResults[ i ].threshold} Users\n` +
							`Channel: <#${occupancyResults[ i ].channelID}>\n` +
							`[Join Room](https://hubs.mozilla.com/${occupancyResults[ i ].url}/)`;
			response.addFields( { name: name, value: value + postMessage } );
			// response += `**${occupancyResults[ i ].name}** (<#${occupancyResults[ i ].channelID}>): ${occupancyResults[ i ].users}\n`;
		}

		response.setTimestamp();
		console.log( response );
		message.channel.send( response );
	}
	else if( args[ 0 ] === "update" )
	{
		// USAGE: !ntsas update <channel-name> <field-to-update> <new-value>
		// <new-value> is an attachment if <field-to-update> = image
		let validFields = [ "name", "image", "threshold" ];

		console.log( "Received update request." );


		// Verify the channel is in valid format.
		if( !args[ 1 ] || !args[ 1 ].match( /<#[0-9]{18}>/ ) )
		{
			console.log( `Invalid channel.\n'${args[ 1 ]}'` );
			message.channel.send( 'Please provide a valid channel.\n\nUsage:\n> **`!ntsas link <channel> <room_name> <threshold>`**' );
			return;
		}

		
		// Search for the channel link request and verify it is an existing channel.
		let newChannelID = args[ 1 ].substring( 2, args[ 1 ].length - 1 );
		let newMessageChannel = undefined;
		if( !(newMessageChannel = client.channels.cache.get( newChannelID ) ) )
		{
			console.log( `Unable to find channel. '${args[ 1 ]}'` );
			message.channel.send( `Sorry! I was unable to find the channel ${args[ 1 ]}` );
			return;
		}


		// Verify the field to update is valid.
		if( !args[ 2 ] || !validFields.includes( args[ 2 ] ) )
		{
			console.log( `Invalid field to update. '${args[ 2 ]}'` );
			message.channel.send( `Invalid field to update. '${args[ 2 ]}'` );
			return;
		}


		// Verify the new value exists (if not image type)
		if( !args[ 2 ] && args[ 1 ] !== 'image' )
		{
			console.log( 'No updated value.' );
			message.channel.send( 'No updated value.' );
			return;
		}


		// If update type is threshold, verify valid threshold.
		if( args[ 2 ] === 'threshold' && !args[ 3 ].match( /[0-9]+/ ) )
		{
			console.log( `Invalid threshold.\n'${args[ 2 ]}'` );
			message.channel.send( 'Please provide a valid threshold.' )
			return;
		}


		// If update type is image, verify attachment is found.
		let attachment = message.attachments.first();
		if( args[ 2 ] === 'image' && !attachment )
		{
			console.log( 'No attachment found.' );
			message.channel.send( 'No attachment found.' );
			return;
		}


		// If update type is image and attachment is found, verify it is .png.
		if( args[ 2 ] === 'image' && !attachment.name.endsWith( '.png' ) )
		{
			console.log( 'Image attachment is not a png.' );
			message.channel.send( 'Please provide a png attachment.' );
			return;
		}


		// Get Hubs room URL from selected channel topic.
		let url = newMessageChannel.topic.substring( 25, 32 );


		// Create the update object based on the update type.
		let update = {};
		if( args[ 2 ] === 'name' )
		{
			// Get the name of the room by combining the remaining arguments.
			// Need to use all arguments to allow for spaces in the room name.
			let name = '';
			for( i = 3; i < args.length - 1; i++ )
			{
				name += args[ i ] + " ";
			}
			name += args[ args.length - 1 ];

			update.name = name;
		}
		else if( args[ 2 ] === 'image' )
		{
			// Check to make sure we won't override the default image.
			if( attachment.name === 'default.png' )
			{
				attachment.name = 'default(1).png';
			}


			// TODO check if file exists. If so, change name.


			update.image = `https://ieeeunt.tk/ntsas21_hubs/media/${attachment.name}`;

			const file = fs.createWriteStream( `../html/ntsas21_hubs/media/${attachment.name}` );
			file.on( 'finish', () => { file.close(); } );
			const request = https.get( attachment.url, response => { response.pipe( file ); } );
		}
		else if( args[ 2 ] === 'threshold' )
		{
			update.threshold = parseInt( args[ 3 ] );
		}


		// Update the room with matching room URL ID. Upsert = false so we do not
		// create a new room if we don't have a previous entry fo rit.
		let updatedRoom = ( await mongoLib.updateHubsMany( url, update, false ) ).value;
		console.log( JSON.stringify( updatedRoom, null, 2 ) );
		let response = `Updated Room:\n` +
						`**Name:** ${updatedRoom.name}\n` +
						`**Threshold:** ${updatedRoom.threshold}\n` +
						`**Preview Image:** ${updatedRoom.image}\n` +
						`**Channel:** ${updatedRoom.channelID}`;
		console.log( response );
		message.channel.send( response );
	}
	else
	{
		console.log( "Help message request." );
		let helpMessage = 
			"North Tech-SAS Hubs Bot Commands:\n\n" +
			">>> " +
			"**`!ntsas link <channel> <threshold> <room_name>`**\n" + 
					"Add a new Hubs-connected channel to the checking list with an integer user threshold count and name the room. Provide an attachment .png image to the message to specify a preview image for the website.\n\n" +
			"**`!ntsas unlink <channel>`**\n" + 
					"Remove a Hubs-connected channel from the checking list.\n\n" +
			"**`!ntsas update <channel> <field-to-update> <new-value>`**\n" + 
					"Updated a Hubs room information. Valid values for <field-to-update> are `name`, `image`, and `threshold`. If `image`, provide an attachment and <new-value> can be blank.\n\n" +
			"**`!ntsas list`**\n" + 
					"List the channels currently being watched.\n\n" +
			"**`!ntsas status`**\n" + 
					"Check the occupancy status of the rooms currently being watched.\n\n" +
			"**`!ntsas start <frequency>`**\n" + 
					"Start Hubs user checking every `frequency` seconds. Frequency is optional, default value is 5.\n\n" +
			"**`!ntsas stop`**\n" + 
					"Stop the Hubs user checking.\n\n" +
			"**`!ntsas delete <num>`**\n" + 
					"Delete `num` of the last message including the command message.\n\n" +
			"**`!ntsas ping`**\n" + 
					"Ping the bot and see the latency.\n\n" +
			"";

		message.channel.send( helpMessage );
	}
});


// Discord bot initialization.
client.on( "ready", async () => {
	console.log( `Discord bot logged in!` );


	// Get a list of all rooms we are watching.
	let query = {
		watching: 1
	};
	let options = {
		projection: { "_id": 0, "channelID": 1 } 
	}
	let channelSearchResult = await mongoLib.getHubsRooms( query, options );


	console.log( `Channel IDs: ${channelIDs}` );


	if( intervalHandle !== undefined )
	{
		// Stop the current interval
		client.clearInterval( intervalHandle );
	}


	// Parse the interval frequency, if required.
	let freqS = 5
	let response = `Starting checking every ${freqS * 1000.} milliseconds to:\n`;
	for( i = 0; i < channelSearchResult.length; i++ )
		response += `<#${channelSearchResult[ i ].channelID}>\n`;
	//message.channel.send( `Starting checking every ${freqS * 1000.} milliseconds.` );
	// message.channel.send( response );
	console.log( response );

	intervalHandle = client.setInterval( intervalFunc, freqS * 1000. );



	
	for( let i = 0; i < channelSearchResult.length; i++ )
	{
		channelIDs.push( channelSearchResult[ i ].channelID );
		messageChannels[ i ] = client.channels.cache.get( channelIDs[ i ] );
		// messageChannels[ i ].send( "Ready!" );
	}



	// TEST
	let linkCommand = 	"**`!ntsas link <channel> <threshold> <room_name>`**";
	let linkHelp = 		"Add a new Hubs-connected channel to the checking list. Provide an attachment .png image to the message to specify a preview image for the website.";
	
	let unlinkCommand = "**`!ntsas unlink <channel>`**";
	let unlinkHelp = 	"Remove a Hubs-connected channel from the checking list.";
	
	let updateCommand = "**`!ntsas update <channel> <field-to-update> <new-value>`**";
	let updateHelp = 	"Update a room's information. <field-to-update> can be `name`, `image`, and `threshold`. If `image`, provide an attachment and <new-value> can be blank.";
	
	let listCommand = 	"**`!ntsas list`**";
	let listHelp = 		"List the channels currently being watched.";
	
	let statusCommand = "**`!ntsas status`**";
	let statusHelp = 	"Check the occupancy status of the rooms currently being watched.";
	
	let startCommand = 	"**`!ntsas start <frequency>`**";
	let startHelp = 	"Start Hubs user checking every `frequency` seconds. Frequency is optional, default value is 5.";
	
	let stopCommand = 	"**`!ntsas stop`**";
	let stopHelp = 		"Stop the Hubs user checking.";
	
	let deleteCommand = "**`!ntsas delete <num>`**";
	let deleteHelp = 	"Delete `num` of the last message including the command message.";
	
	let pingCommand = 	"**`!ntsas ping`**";
	let pingHelp = 		"Ping the bot and see the latency.";

	let testChannel = client.channels.cache.get( "803030839171874816" );
	let inline = false;
	let postMessage = '\n‎';	// There is a blank character after the \n that can be copied.
	const embed = new Discord.MessageEmbed()
						.setColor( '#00853E' )
						.setTitle( 'North Tech-SAS Bot Usage' )
						// .setURL( 'https://discord.js.org/' )
						// .setAuthor( 'Some name', 'https://i.imgur.com/wSTFkRM.png', 'https://discord.js.org' )
						// .setDescription( 'Some description here' )
						.setThumbnail( 'https://ieeeunt.tk/IEEEUNT.png' )
						.addFields(
							{ name: 'Linking Rooms', 	value: `${linkCommand}\n${linkHelp}${postMessage}`, 	inline: inline },
							{ name: 'Unlinking Rooms', 	value: `${unlinkCommand}\n${unlinkHelp}${postMessage}`, inline: inline },
							{ name: 'Updating Room', 	value: `${updateCommand}\n${updateHelp}${postMessage}`, inline: inline },
							{ name: 'List Channels', 	value: `${listCommand}\n${listHelp}${postMessage}`, 	inline: inline },
							{ name: 'Check Status', 	value: `${statusCommand}\n${statusHelp}${postMessage}`, inline: inline },
							{ name: 'Start Checking', 	value: `${startCommand}\n${startHelp}${postMessage}`, 	inline: inline },
							{ name: 'Stop Checking', 	value: `${stopCommand}\n${stopHelp}${postMessage}`, 	inline: inline },
							{ name: 'Delete Messages', 	value: `${deleteCommand}\n${deleteHelp}${postMessage}`, inline: inline },
							{ name: 'Pinging Bot', 		value: `${pingCommand}\n${pingHelp}${postMessage}`, 	inline: inline },
							// { name: 'Check the Website', value: '[country codes](https://countrycode.org/)'}
							// { name: 'Inline field title', value: 'Some value here', inline: true },
							// { name: 'Inline field title', value: 'Some value here', inline: true },
						)
						// .setFooter( '[website](https://ieeeunt.tk/ntsas21_hubs/)[country codes](https://countrycode.org/)' )
						.setTimestamp();

    // Send the embed to the same channel as the message
    // testChannel.send( embed );
});


// Function to run on an interval.
function intervalFunc()
{
	for( let i = 0; i < messageChannels.length; i++ )
	{
		messageChannels[ i ].send( '!hubs users' );
	}
}



// Start-up code.
client.login( config.BOT_TOKEN );	// Log discord bot in.
server.listen( port, hostname, () => {
	// Display start debugging
	var date = new Date().toISOString().substr( 11, 8 );
	console.log( " \n \n \n(" + date  + "): Hubs/Discord Test.\n" );
});

