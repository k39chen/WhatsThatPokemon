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
	},
	/**
	 * Gets the url of the pokemon sprite.
	 *
	 * @method getPokemonSprite
	 * @param pokemon {Object} The pokemon object
	 * @return {String} The url of the pokemon sprite
	 */
	getPokemonSprite: function(pokemon) {
		// we hotlink the images from serebii
		var url = "http://www.serebii.net/art/th/";	// the base url for normal pokemon sprites
		var url_mega = "http://www.serebii.net/xy/pokemon/"; // the base url for mega pokemon sprites

		// the sprite url
		var sprite = null;

		if (pokemon && pokemon.id) {

			// discard pokemon with id>10000 that are not mega.
			if (pokemon.id > 10000 && !isMega(pokemon)) return null;

			// build mega url
			if (isMega(pokemon)) {
				var name = pokemon.name
					.replace("-mega-x","")
					.replace("-mega-y","")
					.replace("-mega");
				var basePokemon = Pokemon.findOne({name: new RegExp(name), id: {$lt: 10000}});

				if (!basePokemon || !basePokemon.id) {
					return null;
				}
				var id = basePokemon.id;

				sprite = url_mega + bufferWithZeroes(id) + "-m";
				if (isMegaX(pokemon)) {
					sprite += "x";
				} else if (isMegaY(pokemon)) {
					sprite += "y";
				}
				sprite += ".png";

				console.log(sprite);

			} else {
				sprite = url + pokemon.id + ".png";
			}
			// try to validate the sprite
			try {
				var result = HTTP.call('GET',sprite);
			} catch(err) {
				if (err.stack.indexOf('Error: failed [404]') >= 0) {
					return null;
				}
			}
			return sprite;
		}
		return null;
	}

});
/**
 * Determines if the pokemon is a mega pokemon.
 *
 * @method isMega | isMegaX | isMegaY
 * @param pokemon {Object} The pokemon object.
 * @return {Boolean} Returns true if the pokemon is mega, otherwise false
 */
function isMega(pokemon) {
	return pokemon && pokemon.name && pokemon.name.indexOf("-mega") > 0;
}
function isMegaX(pokemon) {
	return pokemon && pokemon.name && pokemon.name.indexOf("-mega-x") > 0;
}
function isMegaY(pokemon) {
	return pokemon && pokemon.name && pokemon.name.indexOf("-mega-y") > 0;
}
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