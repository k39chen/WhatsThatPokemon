// define startup initialization actions
Meteor.startup(function(){

	// initialize the pokedex at startup
	var getFromAPI = false;
	if (getFromAPI) {
		Meteor.call("getPokedex", getFromAPI, function(err,res){
			if (getFromAPI){
				Meteor.call("saveToPokedex", res.data);
			}
		});
	}

});

