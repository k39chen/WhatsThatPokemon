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

	var quiz = generateQuiz(4);

	// generate the choices
	var choices = [];
	for (var choice in quiz) {
		choices.push(quiz[choice]);
	}

	// decide which of the choices will be the puzzle
	var puzzle = choices[Math.floor(Math.random()*choices.length)];

	Meteor.call("getPokemonSprite", puzzle, function(err,res){

		// set to re-render these objects
		Session.set("puzzleImage", res);
		Session.set("choices", choices);
	});


}

/**
 * Generates a set of random pokemon.
 *
 * @method generateQuiz
 * @param num {Number} the number of pokemon to generate
 * @return {Object} the list of generated pokemon (as a hash map)
 */
function generateQuiz(num) {
	var list = {};
	for (var i=0; i<num; i++) {
		var pokemon = getRandomPokemon();

		// if this pokemon is already in our list, keep looking until we get a distinct one!
		while (list[pokemon.id] != null) {
			pokemon = getRandomPokemon();
		}

		list[pokemon.id] = pokemon;
	}
	return list;
}

/**
 * Fetches a random pokemon
 *
 * @method getRandomPokemon
 * @return {Object} The random pokemon object.
 }
 */
function getRandomPokemon() {
	return pokedex[Math.floor(Math.random() * pokedex.length)];
}

/**
 * Render behaviour for puzzle
 */
Template.puzzle.image = function(){
	return Session.get("puzzleImage");
}

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