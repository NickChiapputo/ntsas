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


var peopleNode, fullNode;


window.addEventListener( "load", () => {
	updateDiv = document.getElementById( "update" );
	flexBoxContainer = document.getElementById( "update-contain" );

	peopleNode = 	'<svg width="20" height="20" style="display: inline-block;" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000">' +
						'<title>People</title>' +
						'<path d="M15.703 6.563c-.114 1.588-1.293 2.812-2.578 2.812s-2.466-1.223-2.578-2.812c-.117-1.653 1.03-2.813 2.578-2.813 1.548 0 2.695 1.19 2.578 2.813z" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>' +
						'<path d="M13.125 11.875c-2.546 0-4.994 1.264-5.607 3.727-.081.326.123.648.458.648h10.299c.335 0 .538-.322.458-.648-.614-2.502-3.062-3.727-5.608-3.727z" stroke="#000" stroke-width="1.5" stroke-miterlimit="10"></path>' +
						'<path d="M7.812 7.264C7.721 8.532 6.77 9.53 5.742 9.53c-1.026 0-1.98-.998-2.07-2.267C3.578 5.944 4.505 5 5.742 5c1.237 0 2.164.968 2.07 2.264z" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>' +
						'<path d="M8.047 11.954c-.705-.324-1.482-.448-2.305-.448-2.031 0-3.988 1.01-4.478 2.977-.065.26.098.517.366.517h4.386" stroke="#000" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round"></path>' +
					'</svg>';

	fullNode = 	'<div class="room-full">' +
					'<span>ROOM FULL</span>' +
				'</div>';

	intervalFunc();
	interval = setInterval( intervalFunc, 5000 );
});

var intervalFunc = function()
{
	// document.getElementById( "test" ).innerHTML = `Screen Size: ${window.innerWidth}x${window.innerHeight}`;
	// document.getElementById( "test" ).innerHTML = fullNode;


	let xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if( this.readyState == 4 && this.status == 200 ) 
		{
			// Response is a JSON array of items
			let obj = JSON.parse( this.responseText );
			
			let numItems = Object.keys( obj ).length;
			// updateDiv.innerHTML = "Number of Hubs Rooms: " + numItems + "\n<br />";


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
				imageURL = room.image ? room.image : "https://ieeeunt.org/ntsas21_hubs/media/default.png";


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


				// Change display based on threshold criteria.
				// If over threshold, do not add link to room,
				// add room full banner, and grayscale background.
				if( users >= threshold )
				{
					flexItem.classList.add( "item-full" )
					flexItem.innerHTML = 
						`<div class="roomInfo">` +
							fullNode +
							`<span class="name">${name}</span>` +
							`<span class="users-full" style="color: red;">${peopleNode}  ${users} / ${threshold}</span>` +
						`</div>`;
				}
				else
				{
					flexItem.innerHTML = 
						`<div class="roomInfo">` +
							`<span class="name">${name}</span>` +
							`<span class="users">${peopleNode}  ${users} / ${threshold}</span>` +
						`</div>` +
						`<div class="roomBG"><a href="https://hubs.mozilla.com/${roomIDlist[ i ]}/"></a></div>`;
				}


				// flexItem.setAttribute( "style", `background-color: ${getRandomColor()};` );


				// Update the debug output on the right side panel.
				// updateDiv.innerHTML += 
				// 	`<a href="https://hubs.mozilla.com/${roomIDlist[ i ]}/"><b>${name}</b></a>: ` +
				// 	`${users} / ${threshold} Users<br />`;
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
			// updateDiv.innerHTML = "Request inventory status response: " + this.status;
			console.log( "Request inventory status response: " + this.status );
		}
	};

	// Send a GET request to 64.225.29.130/inventory/view
	xmlHttp.open( "GET", "https://ieeeunt.org/ntsas21_hubs/get_data", true );
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
