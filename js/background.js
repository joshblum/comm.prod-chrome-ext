///////////Models//////////////
var User = Backbone.Model.extend({
    defaults: {
        'loggedIn' : false,
        'updateBadge' : 'always', //default to update badge for every new commprod
        'tab' : 'recent_tab',
        'username' : '',
    },

    initialize : function() {
        _.bindAll(this); //allow access to 'this' in callbacks with 'this' meaning the object not the context of the callback

    },

    getUsername : function() {
        return this.get('username')
    },

    getTab : function() {
        return this.get('tab')
    },

    isLoggedIn : function() {
        if (this.getUsername() === this.defaults.username) {
            this.logout();
        }
        return this.get('loggedIn')
    },

    login : function() {
        this.setLogin(true);
    },

    logout : function() {
        this.setLogin(false);
    },

    //when the user is logged in set the boolean to give logged in views.
    setLogin : function(status) {
        this.set({ 
            'loggedIn': status,
        });

        var map = {
            'true' : 'login',
            'false' : 'logout'
        };

        loginBadge(map[status]);
    },
    
    setUsername : function(username) {
        this.set({ 
            'username': username,
        });
    },

    setTab : function(tab) {
        this.set({ 
            'tab': tab, 
        });
    },

    //save the current state to local storage
    saveState : function(){
        localStorage.user = JSON.stringify(this);
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
    },

    url_search : function(filter, filterType, unvoted, limit) { 
        var unvoted = unvoted || false;
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
        var url = this.url_search(this.get('filter'), this.get('filterType'));
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
        prod = prod.replace(src_find, src_replace);
        return prod
    },
});

/*
    Get and return the user from local storage.
    If no user is found create a new one.
    If an old user exists unJSON the object and return it.
*/
function getLocalStorageUser() {
    var storedUser = localStorage.user;
    if (storedUser === undefined || storedUser === "null") {
        u = new User();
        return u
    }

    o = JSON.parse(storedUser);
    var u = new User();

    u.setUsername(o.username);
    u.setLogin(o.loggedIn);

    return u
}

/*
    Clear the local storage for the given key
*/ 
function clearLocalStorage(key) {
    localStorage[key] = null;
}

function updateBadge(text) {
    chrome.browserAction.setBadgeText(
        {
            'text' : text
        });
}

function loginBadge(e) {
    if (e == 'logout') {
        updateBadge('!');
    } else if(e == 'login') {
        updateBadge('');
    }
}

function initBadge() {
    chrome.browserAction.setBadgeBackgroundColor({'color':'#FE7227'});
    if (!user.isLoggedIn()) {
        loginBadge('logout');
    }
}

/*
Helper to open urls from the extension to the main website
*/
function openLink(url) {
    chrome.tabs.create({'url': url});
}

function clearStorage(){
    localStorage.removeItem('local_history')
    local_history = []
}

///////////Global vars/////////////
var baseUrl = "http://localhost:8000" // global website base, set to localhost for testing
//var baseUrl = "http://burtonthird.com"

/////////init models///////
var user = getLocalStorageUser();
initBadge()

var recent_set = new ProdSet({ 
    filter : "-date", 
    filterType : "orderBy",
    tab : 'recent_tab',
});

var trending_set = new ProdSet({ 
    filter : "trending", 
    filterType : "type",
    tab : 'trending_tab',
});

var media_set = new ProdSet({ 
    filter : "media", 
    filterType : "type",
    tab : 'media_tab',
});

var best_set = new ProdSet({ 
    filter : "best", 
    filterType : "type",
    tab : 'best_tab',
});