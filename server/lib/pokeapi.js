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
						name: getNormalizedName(pokemon.name)
					});
				}
				console.log(pokemon);
			}
		}
	},

	/**
	 * Get the pokemon sprite
	 *
	 * @method getPokemonSprite
	 * @param pokemon {Object} The pokemon data object.
	 */
	getPokemonSprite: function(pokemon) {
		var id = bufferWithZeroes(pokemon.id,3);
		var name = pokemon.name;

		var url = "http://bulbapedia.bulbagarden.net/wiki/File:"+id+name+".png";

		var data = HTTP.call("GET",url);
		var content = data.content;

		console.log(url);

		var matches = [];
		content.replace(/[^<]*<a href="([^"]+\.png)">([^<]+)<\/a>/g, function () {
			var match = Array.prototype.slice.call(arguments, 1, 2);
			matches.push(match[0]);
		});

		if (matches.length > 0) {
			return matches[0];
		}
		return null; 
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

/**
 * Helper function to normalize the pokemon name
 *
 * @method getNormalizedName
 * @param name {String} The input name
 * @return {String} The resultant normalized pokemon name
 */
function getNormalizedName(name){
	var res = name;
	res = res.replace(/-m/g,"-M");
	res = res.capitalize();
	return res;
}

/**
 * Buffer number with zeroes.
 * 
 * @method bufferWithZeroes
 * @param number {Number} The number that we want to buffer.
 * @param digits {Number} The number of digits
 * @return {String} The result buffered number as a string.
 */
function bufferWithZeroes(number, digits) {
	var strnum = number+"";
	var length = strnum.length;

	for (var i=0; i<digits-length; i++) {
		strnum = "0" + strnum;
	}

	return strnum;
}