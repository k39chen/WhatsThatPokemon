
Template.choices = {

	choices: function(){
		return [
			{name:'Bulbasaur'},
			{name:'Ivysaur'},
			{name:'Venasaur'}
		]
	}

};

var imgsrc = "http://cdn.bulbagarden.net/upload/thumb/2/21/001Bulbasaur.png/250px-001Bulbasaur.png"

Template.picture.image_src = function(){
		return imgsrc;
	};