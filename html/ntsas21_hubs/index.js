const updateDiv = document.getElementById( "update" );
updateDiv.innerHTML = "Hello?";

let interval = setInterval( intervalFunc, 5000 );
console.log( interval );

var intervalFunc = function()
{
	console.log( "Interval Function." );
	let xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if( this.readyState == 4 && this.status == 200 ) 
		{
			// Response is a JSON array of items
			let obj = JSON.parse( this.responseText );
			
			let numItems = Object.keys( obj ).length;
			updateDiv.innerHTML = "Number of Hubs Rooms: " + numItems + "\n";

			var i;
			for( i = 0; i < numItems; i++ )
			{
				var room = obj[ i ];
				updateDiv.innerHTML += 
					`<a href="${room.url}"><b>${room.name}</b></a>: ` +
					`${room.users} Users (watching: ${room.watching}`;
			}

			console.log( this.responseText );
		}
		else if( this.readyState == 4 && this.status != 200 )
		{
			updateDiv.innerHTML = "Request inventory status response: " + this.status;
			console.log( "Request inventory status response: " + this.status );
		}
	};

	// Send a GET request to 64.225.29.130/inventory/view
	xmlHttp.open( "GET", "https://ieeeunt.tk/ntsas21_hubs/read", true );
	xmlHttp.send();
}