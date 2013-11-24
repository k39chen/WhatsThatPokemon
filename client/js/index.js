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

	$("button").click(function(e){
		createQuiz();
	});

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
			choices.push(quiz[choice]);
		}

		// decide which of the choices will be the puzzle
		var puzzle = choices[Math.floor(Math.random()*choices.length)];

		// update the session variables
		Session.set("puzzle",puzzle.sprite);
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
	Meteor.call("getPokemonSprite", pokemon, function(err,sprite){
		if (sprite) {
			// first we're going to see if the image is going to load...
			var img = $("<img>").attr("src",sprite);
			img.load(function(e){

				var canvasWidth = 400, 
					canvasHeight = 400,
					width = e.target.naturalWidth * 2, 
					height = e.target.naturalHeight * 2,
					left = (canvasWidth - width) / 2, 
					top = (canvasHeight - height) / 2;

				if (cb) {
					cb({
						src: $(this).attr("src"),
						width: width,
						height: height,
						top: top,
						left: left
					});
				}
			}).error(function(){
				if (cb) {
					cb(null);
				}
			});
		} else {
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
	return pokemon && pokemon.name && pokemon.name.indexOf("-mega") >= 0;
}
function isMegaX(pokemon) {
	return pokemon && pokemon.name && pokemon.name.indexOf("-mega-x") >= 0;
}
function isMegaY(pokemon) {
	return pokemon && pokemon.name && pokemon.name.indexOf("-mega-y") >= 0;
}

/**
 * Render behaviour for puzzle
 */
 Template.puzzle.puzzle = function() { 
 	
 	console.log(Session.get("puzzle"));

 	return Session.get("puzzle"); 

 };
 /*
 Template.puzzle.image = function(){ return Session.get("puzzleImage"); };
 Template.puzzle.width = function(){ return Session.get("puzzleWidth"); };
 Template.puzzle.height = function(){ return Session.get("puzzleHeight"); };
 Template.puzzle.left = function(){ return Session.get("puzzleLeft"); };
 Template.puzzle.top = function(){ return Session.get("puzzleTop"); };
*/
/**
 * Render behaviour for choices
 */
Template.choices.choices = function(){
	console.log(Session.get("choices"));
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