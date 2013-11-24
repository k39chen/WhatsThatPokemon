var quiz = {};
var quizLength = 0;

// initialize the pokedex for the client
var pokedex = null;
Meteor.call("getPokedex", function(err,data){
	if (data) {
		pokedex = data;

		// initialize the game once the pokedex has been populated
		initGame();
	}
});

/**
 * Initializes the game.
 *
 * @method initGame
 */
function initGame() {

	createQuiz();
}

/**
 * Creates a new quiz screen.
 *
 * @method createQuiz
 */
function createQuiz() {

	generateQuiz(4, function(q){

		// generate the choices
		var choices = [];
		for (var choice in quiz) {
			choices.push(quiz[choice].pokemon);
		}

		// decide which of the choices will be the puzzle
		var puzzle = choices[Math.floor(Math.random()*choices.length)];

		Session.set("choices",choices);

	});
}

/**
 * Generates a set of random pokemon.
 *
 * @method generateQuiz
 * @param num {Number} the number of pokemon to generate
 * @param cb {Function} The callback function.
 * @return {Object} the list of generated pokemon (as a hash map)
 */
function generateQuiz(num, cb) {
	quiz = {};
	quizLength = num;

	for (var i=0; i<num; i++) {
		getRandomPokemon(function(pokemon,sprite){

			console.log(pokemon);

			// ensure that there are no duplicates
			handleDuplicate(pokemon,sprite);

			// add this pokemon to the quiz
			quiz[pokemon.id] = {pokemon:pokemon,sprite:sprite};

			// check if we are done making our quiz
			if (Object.keys(quiz).length >= quizLength) {
				cb(quiz);
			}
		});
	}

	function handleDuplicate(pokemon,sprite) {
		if (quiz[pokemon.id] != null) {
			getRandomPokemon(handleDuplicate);
		}
	}
}

/**
 * Fetches a random pokemon
 *
 * @method getRandomPokemon
 * @param cb {Function} The callback function.
 * @return {Object} The random pokemon object.
 }
 */
function getRandomPokemon(cb) {
	var pokemon = pokedex[Math.floor(Math.random() * pokedex.length)];

	getPokemonSprite(pokemon, function(sprite){
		if (sprite) {
			cb(pokemon,sprite);
		} else {
			getRandomPokemon(cb);
		}
	});
}

/**
 * Get pokemon sprite URL.
 *
 * @method getPokemonSprite
 * @param pokemon {Object} The pokemon object.
 * @param cb {Function} The callback for when the pokemon sprite has been finished loading.
 * @return {String|null} The url of the pokemon sprite, or if null then the sprite could not be found/loaded.
 */
function getPokemonSprite(pokemon, cb) {
	// we hotlink the images from serebii
	var url = "http://www.serebii.net/art/th/";	// the base url for normal pokemon sprites
	var url_mega = "http://www.serebii.net/xy/pokemon/"; // the base url for mega pokemon sprites

	// the sprite url
	var sprite = null;

	if (isMega(pokemon)) {
		sprite = url_mega + bufferWithZeroes(pokemon.id) + "-m";
		if (isMegaX(pokemon)) {
			sprite += "x";
		} else if (isMegaY(pokemon)) {
			sprite += "y";
		}
		sprite += ".png";
	} else {
		sprite = url + pokemon.id + ".png";
	}

	// first we're going to see if the image is going to load...
	var img = $("<img>").attr("src",sprite);
	img.load(function(e){
		if (cb) {
			cb({
				src: $(this).attr("src"),
				width: e.target.naturalWidth,
				height: e.target.naturalHeight
			});
		}
	}).error(function(){
		if (cb) {
			cb(null);
		}
	});
}

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

/**
 * Render behaviour for puzzle
 */
 Template.puzzle.image = function(){ return Session.get("puzzleImage"); };
 Template.puzzle.width = function(){ return Session.get("puzzleWidth"); };
 Template.puzzle.height = function(){ return Session.get("puzzleHeight"); };

/**
 * Render behaviour for choices
 */
Template.choices.choices = function(){
	return Session.get("choices");
};
Template.choice.events = {
	"mouseover": function(e){
		var $this = $(e.target);
		$this.addClass("hover");
	},
	"mouseout": function(e){
		var $this = $(e.target);
		$this.removeClass("hover");
		$this.removeClass("active");
	},
	"mousedown": function(e){
		var $this = $(e.target);
		$this.addClass("active");
	},
	"mouseup": function(e){
		var $this = $(e.target);
		$this.removeClass("active");

		// choose this option! :D
		// ...
	}
};