var updateDiv;				// Debug output element.
var flexBoxContainer;		// Flex box container element.
var interval;				// Interval handle for frequent update requests.


// Create and hold references to the room div elements.
// Create an array of flags to track whether the corresponding
// elements were updated in the latest update request.
// If the elements were not updated, then they are not currently
// being watched and should be removed from the list. 1 = updated.
var roomDivs = [];
var roomDivUpdated = [];


window.addEventListener( "load", () => {
	updateDiv = document.getElementById( "update" );
	flexBoxContainer = document.getElementById( "update-contain" );

	intervalFunc();
	interval = setInterval( intervalFunc, 5000 );
});

var intervalFunc = function()
{
	let xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if( this.readyState == 4 && this.status == 200 ) 
		{
			// Response is a JSON array of items
			let obj = JSON.parse( this.responseText );
			
			let numItems = Object.keys( obj ).length;
			updateDiv.innerHTML = "Number of Hubs Rooms: " + numItems + "\n<br />";


			let room, url, name, users, watching, flexItem;
			let roomIDlist = [];
			for( let i = 0; i < numItems; i++ )
			{
				// Get the room information.
				room = obj[ i ];
				name = room.name;
				users = room.users;
				threshold = room.threshold;
				roomIDlist[ i ] = room.url;
				imageURL = room.image ? room.image : "https://ieeeunt.tk/ntsas21_hubs/media/default.png";


				// Check if there is a current flex-box item
				// associated with the current room. The item IDs
				// are set based on the 7 character alphanumeric room ID
				// from the room URL (https://hubs.mozilla.com/<key>/<name>)
				flexItem = document.getElementById( roomIDlist[ i ] );


				// If the item exists, then update the information in the item.
				// Otherwise create a new item and append to the
				if( flexItem )
				{
				}
				else
				{
					flexItem = document.createElement( "DIV" );
					flexItem.classList.add( "item" );
					flexItem.setAttribute( "id", roomIDlist[ i ] );
					flexItem.setAttribute( "style", `background-image: url( "${imageURL}" );` );

					flexBoxContainer.appendChild( flexItem );
				}

				flexItem.innerHTML = 
					`<div class="roomInfo">${name}<br />${users} / ${threshold} Users</div>` +
					`<div class="roomBG"><a href="https://hubs.mozilla.com/${roomIDlist[ i ]}/"></a></div>`;
				// flexItem.setAttribute( "style", `background-color: ${getRandomColor()};` );


				// Update the debug output on the right side panel.
				updateDiv.innerHTML += 
					`<a href="https://hubs.mozilla.com/${roomIDlist[ i ]}/"><b>${name}</b></a>: ` +
					`${users} / ${threshold} Users<br />`;
			}


			// Iterate through the current list of room elements.
			// If one is found that is not in the most recent list, remove it.
			// Assuming that it is not being watched anymore.
			console.log( `Room ID List: ${roomIDlist}` );
			Array.from( document.getElementById( "update-contain" ).children ).forEach( child => {
				console.log( `Check ${child.id}` );
				if( !roomIDlist.includes( child.id ) )
				{
					console.log( `Removed ${child}` );
					child.remove();
				}
			} );


			// console.log( this.responseText );
		}
		else if( this.readyState == 4 && this.status != 200 )
		{
			updateDiv.innerHTML = "Request inventory status response: " + this.status;
			console.log( "Request inventory status response: " + this.status );
		}
	};

	// Send a GET request to 64.225.29.130/inventory/view
	xmlHttp.open( "GET", "https://ieeeunt.tk/ntsas21_hubs/get_data", true );
	xmlHttp.send();
}


function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}
