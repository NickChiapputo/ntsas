// Requirements
const MongoClient = require( 'mongodb' ).MongoClient;
const fs = require( 'fs' );


// Read in config file for secure constants.
var username, password;
try
{
	let content = JSON.parse( fs.readFileSync( 'db/config.json' ) );
	username = content.username;
	password = content.password;
}
catch( e )
{
	console.error( `Unable to read from config file.\n${e}\n \n ` );
}



// Global constants for MongoDB access.
const hostname = 'localhost';
const port = '27017';
const authentication = 'admin';
const dburl = `mongodb://${username}:${password}@${hostname}:${port}?authSource=${authentication}`
const mongoClientOptions = {
   useNewUrlParser: true,
   useUnifiedTopology: true
 };

const hubsDbName = 'hubs';
const hubsOccCollection = 'occupancy';


module.exports = {
	updateHubsOccupancy: async function( url, occ )
	{
		// console.log( `(${getTimeStamp()}): Update Hubs Occupancy.` );

		const client = new MongoClient( dburl, mongoClientOptions );

		let result = null;
		try
		{
			await client.connect();
			// console.log( `Successfully connected to MongoDB.` );


			// Retrieve the collection from the database.
			let collection = client.db( hubsDbName ).collection( hubsOccCollection );

			// console.log( `Succesfully retrieved ${hubsDbName} ${hubsOccCollection} collection.` );


			let query = { url: url };			// Create query to search with.

			let update = {};					// Create updated data.
			update[ "$set" ] = {};
			update[ "$set" ][ "users" ] = occ;	

			let options = {						// Create options for update command.
				returnOriginal: false,				// Don't return the old document.
				returnNewDocument: true,			// Return the updated document.
				upsert: true						// Create document if it doesn't exist.
			};

			// Retrieve the occupancy collection in the hubs database.
			result = await updateDocument( query, update, options, collection );
		}
		catch( err )
		{
			console.error( `${err}` );
		}
		finally
		{
			if( !result )
				console.log( `Error connecting to MongoDB.` );
			
			await client.close();
			return result;
		}
	},


	getHubsOccupancy: async function()
	{
		// console.log( `(${getTimeStamp()}): Get Hubs Occupancy.` );

		const client = new MongoClient( dburl, mongoClientOptions );

		let result = null;
		try
		{
			await client.connect();
			// console.log( `Successfully connected to MongoDB.` );


			// Retrieve the collection from the database.
			let collection = client.db( hubsDbName ).collection( hubsOccCollection );

			// console.log( `Succesfully retrieved ${hubsDbName} ${hubsOccCollection} collection.` );


			// Query all documents in collection.
			let query = {
				watching: 1
			};
			let options = { 
				projection: { "_id": 0 } 
			};
			result = await getAllDocuments( query, options, collection );

			// console.log( `Retrieved all documents:\n${JSON.stringify( result, null, 2 )}` );
		}
		catch( err )
		{
			console.error( `${err}` );
		}
		finally
		{
			if( !result )
				console.log( `Error connecting to MongoDB.` );
			
			client.close();
			return result;
		}
	},


	updateRoomWatching: async function( url, watching )
	{
		console.log( `(${getTimeStamp()}): Update Hubs Occupancy.` );

		const client = new MongoClient( dburl, mongoClientOptions );

		let result = null;
		try
		{
			await client.connect();
			// console.log( `Successfully connected to MongoDB.` );


			// Retrieve the collection from the database.
			let collection = client.db( hubsDbName ).collection( hubsOccCollection );

			// console.log( `Succesfully retrieved ${hubsDbName} ${hubsOccCollection} collection.` );


			let query = { url: url };			// Create query to search with.

			let update = {};					// Create updated data. Make sure we set it to a valid value (1 or 0).
			update[ "$set" ] = {};
			update[ "$set" ][ "watching" ] = watching == true || watching == 1 ? 1 : 0;	

			let options = {						// Create options for update command.
				returnOriginal: false,				// Don't return the old document.
				returnNewDocument: true,			// Return the updated document.
				upsert: true						// Create document if it doesn't exist.
			};

			// Retrieve the occupancy collection in the hubs database.
			result = await updateDocument( query, update, options, collection );
		}
		catch( err )
		{
			console.error( `${err}` );
		}
		finally
		{
			if( !result )
				console.log( `Error connecting to MongoDB.` );
			
			await client.close();
			return result;
		}
	},


	updateHubsMany: async function( url, updates )
	{
		console.log( `(${getTimeStamp()}): Update Hubs Occupancy.` );

		const client = new MongoClient( dburl, mongoClientOptions );

		let result = null;
		try
		{
			await client.connect();
			// console.log( `Successfully connected to MongoDB.` );


			// Retrieve the collection from the database.
			let collection = client.db( hubsDbName ).collection( hubsOccCollection );

			// console.log( `Succesfully retrieved ${hubsDbName} ${hubsOccCollection} collection.` );


			let query = { url: url };			// Create query to search with.

			let update = {};					// Create updated data.
			update[ "$set" ] = updates;

			let options = {						// Create options for update command.
				returnOriginal: false,				// Don't return the old document.
				returnNewDocument: true,			// Return the updated document.
				upsert: true						// Create document if it doesn't exist.
			};

			// Retrieve the occupancy collection in the hubs database.
			result = await updateDocument( query, update, options, collection );
		}
		catch( err )
		{
			console.error( `${err}` );
		}
		finally
		{
			if( !result )
				console.log( `Error connecting to MongoDB.` );
			
			await client.close();
			return result;
		}
	},


	getHubsRooms: async function( query, options )
	{
		console.log( `(${getTimeStamp()}): Get Hubs Occupancy.` );

		const client = new MongoClient( dburl, mongoClientOptions );

		let result = null;
		try
		{
			await client.connect();
			console.log( `Successfully connected to MongoDB.` );


			// Retrieve the collection from the database.
			let collection = client.db( hubsDbName ).collection( hubsOccCollection );
			console.log( `Succesfully retrieved ${hubsDbName} ${hubsOccCollection} collection.` );


			// Query all documents in collection matching query+options.
			result = await getAllDocuments( query, options, collection );

			// console.log( `Retrieved all documents:\n${JSON.stringify( result, null, 2 )}` );
		}
		catch( err )
		{
			console.error( `${err}` );
		}
		finally
		{
			if( !result )
				console.log( `Error connecting to MongoDB.` );
			
			client.close();
			return result;
		}
	}
}


var getCollection = async function( dbName, collectionName )
{
	let collection;

	try
	{
		// Connect client to the server.
		await client.connect();


		// Establish and verify connection.
		collection = await client.db( dbName ).collection( collectionName );
	}
	finally
	{
		await client.close();
	}


	console.log( `Get Collection: ${collection}` );
	return collection;
}


var getAllDocuments = function( query, options, collection )
{
	return collection.find( query, options ).toArray();
}


var updateDocument = function( query, update, options, collection )
{
	return collection.findOneAndUpdate( query, update, options );
}


var getTimeStamp = function()
{
	return new Date().toISOString().substr( 11, 8 );
}
