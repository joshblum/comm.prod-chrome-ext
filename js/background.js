///////////Models//////////////
var User = Backbone.Model.extend({
    defaults: {
        'loggedIn' : false,
        'updateBadge' : 'always', //default to update badge for every new commprod
        'tab' : 'recent_tab'
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
        'tab' : ''
    },

    initialize : function() {
        this.bind("change:renderedProds", this.checkSet);
        this.bind("change:recentId", this.updateSet);
        updateSet();
    },

    checkSet : function() {
        if (this.renderedProds.length < 10) {
            updateSet();
        }
    },

    updateSet : function() {
        var url = url_search(user.get('unvoted'), this.filter, this.filterType)
        $.get(url_search(), function(data) {
            $.each(data, function(index, prod) {
                this.renderedProds.push(this.cleanProd(prod));
            });
        });
    },

    cleanProd : function(prod) {
        var $prod = $(prod);
        $("a[href]").each(function() {
            if (!this.href.contains('www')){
                this.href = baseUrl + this.href;
            });
        }
});


///////////Global vars/////////////
var baseUrl = "http://localhost:5000/" // global website base, set to localhost for testing
//var baseUrl = "http://burtonthird.com/"

/////////init models///////
var user = new User();

var recent_set = new ProdSet({ 
    filter : "-date", 
    filterType : "orderBy",
    tab : 'recent_tab'
});

var trending_set = new ProdSet({ 
    filter : "trending", 
    filterType : "type",
    tab : 'trending_tab'
});

var media_set = new ProdSet({ 
    filter : "media", 
    filterType : "type",
    tab : 'media_tab'
});

var best_set = new ProdSet({ 
    filter : "best", 
    filterType : "type",
    tab : 'best_tab'
});

