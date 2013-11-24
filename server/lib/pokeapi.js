Meteor.methods({

	/**
	 * Gets a list of all the pokemon available for the quizzes.
	 *
	 * @method getPokedex
	 * @param getFromAPI {Boolean} Should only be set to true by the server, otherwise gets data from the collection
	 * @return {Object} The pokemon response object.
	 */
	getPokedex: function(getFromAPI){

		var data = null;

		if (getFromAPI) {
			// fetch data from the API
			data = HTTP.call("GET", "http://pokeapi.co/api/v1/pokedex/1/");
		} 
		else {
			// get from the Pokemon collection
			data = Pokemon.find().fetch();
		}

		return data;
	},

	/**
	 * Saves a batch of pokemon data to the Pokemon collection.
	 *
	 * @method saveToPokedex
	 * @param data {Object} The response data from the pokedex dump call
	 */
	saveToPokedex: function(data) {
		// store pokemon data in the Pokemon collection
		if (data && data.pokemon) {
			for (var i=0; i<data.pokemon.length; i++) {
				var pokemon = data.pokemon[i];

				// only insert this pokemon if hasn't already been inserted before
				if (!Pokemon.findOne({id: getIdFromUri(pokemon.resource_uri)})){
					Pokemon.insert({
						id: getIdFromUri(pokemon.resource_uri),
						name: pokemon.name
					});
				}
				console.log(pokemon);
			}
		}
	}

});

/**
 * Helper function to extract the pokemon id from the resource uri. 
 *
 * @method getIdFromUri
 * @param uri {String} The resource uri string
 * @return {Integer} The pokemon id
 */
function getIdFromUri(uri) {
	return parseInt(uri.match(/api\/v.\/pokemon\/(\d+)/)[1]);
}
