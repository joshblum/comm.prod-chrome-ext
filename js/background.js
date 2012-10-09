///////////Models//////////////
var User = Backbone.Model.extend({
    defaults: {
        'loggedIn' : false,
        'updateBadge' : 'always', //default to update badge for every new commprod
        'tab' : 'recent_tab',
    },

    isLoggedIn function() {
        return this.get('loggedIn')
    },

    setLogin : function(status) {
        this.set({ 
            'loggedIn': status,
        });
    },

    setTab : function(tab) {
        this.set({ 
            'tab': tab, 
        });
    }
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
    },

    url_search : function(unvoted, filter, filterType, limit) { 
        var unvoted = unvoted || true;
        var limit = limit || 30;
        var return_type = "list";

        return baseUrl +  sprintf("/commprod/api/search?unvoted=%s&limit=%s&%s=%s&return_type=%s", unvoted, limit, filterType, filter, return_type)
    },

    checkSet : function(callback) {
        if (this.get('renderedProds').length < 10) {
            this.updateSet(callback);
        } else {
            callback()
        }
    },

    updateSet : function(callback) {
        var url = this.url_search(user.get('unvoted'), this.get('filter'), this.get('filterType'));
        var renderedProds = this.get('renderedProds');
        var cleanProd = this.cleanProd;
        $.get(url, function(data) {
            $.each(data.res, function(index, prod) {
                prod = cleanProd(String(prod));
                renderedProds.push(prod);
                if (index == data.res.length-1){
                    callback();
                }
            });
        });
    },

    cleanProd : function(prod) {
        var href_find = /href\="\//g;
        var src_find = /src\="\//g;
        var href_replace = 'href="' + baseUrl + "/";
        var src_replace = 'src="' + baseUrl + "/";
        prod = prod.replace(href_find, href_replace);
        prod = prod.replace(src_find, href_replace);
        return prod
    },
});

///////////Global vars/////////////
var baseUrl = "http://localhost:5000" // global website base, set to localhost for testing
//var baseUrl = "http://burtonthird.com"

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

