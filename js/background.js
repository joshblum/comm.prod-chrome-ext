///////////Models//////////////
var User = Backbone.Model.extend({
    defaults: {
        'loggedIn' : false,
        'updateBadge' : 'always', //default to update badge for every new commprod
        'tab' : 'recent_tab',
        'baseUrl' : '',
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

        return baseUrl +  sprintf("commprod/api/search?unvoted=%s&limit=%s&%s=%s&return_type=%s", unvoted, limit, filter, filterType, return_type)
    },

    checkSet : function() {
        if (this.get('renderedProds').length < 10) {
            this.updateSet();
        }
    },

    updateSet : function() {
        var url = this.url_search(user.get('unvoted'), this.filter, this.filterType)
        var renderedProds = this.get('renderedProds');
        var cleanProd = this.cleanProd;
        $.get(url, function(data) {
            debugger
            $.each(data, function(index, prod) {
                prod = cleanProd(prod)
                renderedProds.push(prod);
            });
        });
    },

    cleanProd : function(prod) {
        var $prod = $(prod);
        $("a[href]").each(function() {
            if (this.href.indexof('www') == -1){
                this.href = baseUrl + this.href;
            }
        });
        return prod
    },
});

///////////Global vars/////////////
var baseUrl = "http://localhost:5000/" // global website base, set to localhost for testing
//var baseUrl = "http://burtonthird.com/"

/////////init models///////
var user = new User({'baseUrl' : baseUrl});

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

