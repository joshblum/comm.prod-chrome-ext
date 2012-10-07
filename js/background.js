///////////Models//////////////
var User = Backbone.Model.extend({
    defaults: {
        'loggedIn' : false,
        'updateBadge' : 'always', //default to update badge for every new commprod
        'unvoted' : true, //default pref of exlcuding voted commprods
    },

    setLogin : function(status){
        this.set({ 
            loggedIn: status 
        });
    },
});

var ProdSet = Backbone.Model.extend({
    
    defaults : {
        'renderedProds' : [], // get back a list of rendered commmprods from the server
        'recentId' : 0, // used for updating the badge if this changes
        'filter' : '', // trending, best, media, -date, 
        'filterType' : '', // type or orderBy
    },

    initialize : function() {
        this.bind("change:renderedProds", this.checkSet);
        this.bind("change:recentId", this.updateSet);
    },

    checkSet : function() {
        if (this.renderedProds.length == 0) {
            updateSet();
        }
    },

    updateSet : function() {
        var url = url_search(user.get('unvoted'), this.filter, this.filterType)
        $.get(url_search(), function(data) {
            $.each(data, function(index, html) { 
                this.renderedProds.push($(html));
            });
        });
    }
});

var Album = Backbone.Collection.extend({
    model: ProdSet
});


///////////Global vars/////////////
var baseUrl = "http://localhost:5000/" // global website base, set to localhost for testing
//var baseUrl = "http://burtonthird.com/"

var user = new User();

