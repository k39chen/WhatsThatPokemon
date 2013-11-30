var quiz = {};
var quizLength = 0;
var puzzle = null;
var locked = false;

var numRight = 0;
var numWrong = 0;

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
	// hide the result banner
	hideResult(0);

	// create the first quiz :)
	createQuiz();

	// initialize the play again button
	initPlayAgainButton();
}

function initPlayAgainButton() {
	$("#play-again")
		.mouseover(function(){ $(this).addClass("hover"); })
		.mouseout(function(){ $(this).removeClass("hover").removeClass("active"); })
		.mousedown(function(){ $(this).addClass("active"); })
		.mouseup(function(){ 
			// hide this button
			hidePlayAgainButton();

			$(this).removeClass("active");
			hideResult(400);

			// play again :D
			createQuiz();
		});

	// initially we will hide the play again button
	hidePlayAgainButton();
}

/**
 * Creates a new quiz screen.
 *
 * @method createQuiz
 */
function createQuiz() {
	locked = false;

	// lets update the hud every time we create a new quiz
	updateHud();

	generateQuiz(4, function(q){
		// generate the choices
		var choices = [];
		for (var choice in quiz) {
			var result = quiz[choice];
			var name = result.pokemon.name.capitalize();
			if (isMega(result.pokemon)) {
				var split = name.split("-");
				name = "Mega " + split[0];
				if (isMegaX(result.pokemon)) name += " X";
				if (isMegaY(result.pokemon)) name += " Y";
			}
			if (name.indexOf("-") >= 0) {
				var split = name.split("-");

				switch (name) {
					case "Ho-oh": name = "Ho-Oh"; break;
					case "Porygon-z": name = "Porygon Z"; break;
					case "Mr-mime": name = "Mr. Mime"; break;
					default: name = split[0] + " (" + split[1].capitalize() + ")"; break;
				}
			}
			result.pokemon.name = name;
			choices.push(result);
		}
		// last stand... only allow 4 choices to populate
		choices = choices.slice(0,4);

		// decide which of the choices will be the puzzle
		puzzle = choices[Math.floor(Math.random()*choices.length)];

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

				var canvasWidth = 360, 
					canvasHeight = 360,
					width = e.target.naturalWidth * 2, 
					height = e.target.naturalHeight * 2;

				if (width > canvasWidth || height > canvasHeight) {
					if (width > height) {
						height *= (canvasWidth / width);
						width = canvasWidth;
					} else {
						width *= (canvasHeight / height);
						height = canvasHeight;
					}
				}

				var left = (canvasWidth - width) / 2, 
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
 * Chooses an option.
 *
 * @method chooseOption
 * @param choice {Object} The DOM element for the button choice
 */
function chooseOption(choice) {

	var selected = choice.attr("ident");
	var solution = puzzle.pokemon.id;

	if (selected == solution) {
		correct();
	} else {
		incorrect(selected);
	}
}

/**
 * Performs actions for providing a correct answer.
 *
 * @method correct
 */
function correct() {
	lockChoices();
	revealPokemon();
	showResult({correct: true, name: puzzle.pokemon.name});

	numRight++;
	updateHud();

	$(".pokemon-choice[ident='"+puzzle.pokemon.id+"']").addClass("correct");
	$(".pokemon-choice").css({opacity:1.0}).stop().animate({opacity:0.6},400);
}

/**
 * Performs actions for providing an incorrect answer.
 *
 * @method incorrect
 * @param selected {Number} The id of the selected pokemon.
 */
function incorrect(selected) {
	lockChoices();
	revealPokemon();
	showResult({correct: false, name: puzzle.pokemon.name});

	numWrong++;
	updateHud();

	$(".pokemon-choice[ident='"+puzzle.pokemon.id+"']").addClass("correct");
	$(".pokemon-choice[ident='"+selected+"']").addClass("incorrect");
	$(".pokemon-choice").css({opacity:1.0}).stop().animate({opacity:0.6},400);
}

/**
 * Disable interaction with choices once it has been locked.
 *
 * @method lockChoices
 */
function lockChoices() {
	locked = true;
	$(".pokemon-choice").removeClass("hover","active").addClass("locked");
}

/**
 * Perform some flashy reveal for the pokemon.
 *
 * @method revealPokemon
 */
function revealPokemon() {
	$("#pokemon-puzzle .mask").stop().animate(
		{"brightness": 100},
		{
			duration: 400,
			start: function() {
				this.brightness = 0;
			},
			step: function(now, fx){
				$(this).css("WebkitFilter", "brightness("+now+"%)");
			},
			complete: function(){
				this.brightness = 0;
			}
		}
	);
}

/**
 * Show the result banner
 *
 * @method showResult
 * @param result {Object} A result object.
 */
function showResult(result) {
	if (result.correct) {
		$("#result-container").addClass("correct");
		$("#result-name").html(result.name);
	} else {
		$("#result-container").addClass("incorrect");
		$("#result-name").html(result.name);
	}

	$("#result-container")
		.css({height: 0, padding: 0})
		.stop()
		.animate({height: 32, padding: 16}, 400,function(){
			showPlayAgainButton();
		});
}

/**
 * Hide the result banner.
 *
 * @method hideResult
 * @param animDuration {Number} Optional parameter.
 */
function hideResult(animDuration) {
	var duration = animDuration ? animDuration : 0;
	$("#result-container")
		.removeClass("correct")
		.removeClass("incorrect");

	if ($("#result-container").css("height") != 0) {
		$("#result-container")
			.css({height: 32, padding: 16})
			.stop()
			.animate({height: 0, padding: 0}, duration);
	}
}

/**
 * Shows the play again button
 * 
 * @method showPlayAgainButton
 */
function showPlayAgainButton() {
	$("#play-again").show().css({opacity:0}).stop().animate({opacity:1},400);
}

/**
 * Hides the play again button
 *
 * @method hidePlayAgainButton
 * @param animDuration {Number} Optional parameter.
 */
function hidePlayAgainButton(animDuration) {
	var duration = animDuration ? animDuration : 0;
	$("#play-again").css({opacity:1}).stop().animate({opacity:0},duration,function(){
		$(this).hide();
	});
}

/**
 * Update the HUD.
 *
 * @method updateHud
 */
function updateHud() {

	var rightChanged = false,
		wrongChanged = false;

	if (numRight != $("#hud-text-correct span").html()) {
		rightChanged = true;
		$("#hud-text-correct span").css({opacity:1}).stop().animate({opacity:0},200,function(){
			$(this).html(numRight).css({opacity:0}).stop().animate({opacity:1},200);
		});
	}
	if (numWrong != $("#hud-text-incorrect span").html()) {
		wrongChanged = true;
		$("#hud-text-incorrect span").css({opacity:1}).stop().animate({opacity:0},200,function(){
			$(this).html(numWrong).css({opacity:0}).stop().animate({opacity:1},200);
		});
	}

	var total = numRight + numWrong;

	if (total == 0 || (!rightChanged && !wrongChanged)) return;

	var correctBarWidth = numRight / total * 100,
		incorrectBarWidth = 100 - correctBarWidth;

	if (correctBarWidth > 0) {
		$("#hud-hidden").animate({myWidth: correctBarWidth}, {
			duration: 400,
			start: function(){
				this.myWidth = $("#hud-correct").width();
			},
			step: function(now,fx){
				$("#hud-correct").width(now + "%");
				if (numWrong > 0) {
					$("#hud-incorrect").width((100-now)+"%");
				}
			},
			complete: function(){
				this.myWidth = correctBarWidth;
			}
		});
	} else {
		$("#hud-hidden").animate({myWidth: incorrectBarWidth}, {
			duration: 400,
			start: function(){
				this.myWidth = $("#hud-incorrect").width();
			},
			step: function(now,fx){
				if (numRight > 0) {
					$("#hud-correct").width((100-now) + "%");
				}
				$("#hud-incorrect").width(now+"%");
			},
			complete: function(){
				this.myWidth = incorrectBarWidth;
			}
		});
	}
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
 	return Session.get("puzzle"); 
 };

/**
 * Render behaviour for choices
 */
Template.choices.choices = function(){
	return Session.get("choices");
};
Template.choice.events = {
	"mouseover": function(e){
		var $this = $(e.target);
		if (!locked) {
			$this.addClass("hover");
		}
	},
	"mouseout": function(e){
		var $this = $(e.target);
		if (!locked) {
			$this.removeClass("hover");
			$this.removeClass("active");
		}
	},
	"mousedown": function(e){
		var $this = $(e.target);
		if (!locked) {
			$this.addClass("active");
		}
	},
	"mouseup": function(e){
		var $this = $(e.target);
		if (!locked) {
			$this.removeClass("active");
			chooseOption($this);
		}
	}
};
