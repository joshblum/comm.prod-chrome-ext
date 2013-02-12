///////////Models//////////////
var User = Backbone.Model.extend({
    defaults: {
        'loggedIn' : false,
        'updateBadge' : 'always', //default to update badge for every new commprod
        'tab' : 'recent_tab',
        'username' : '',
        'unvoted' : false,
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

    getUnvoted : function() {
        return this.get('unvoted')
    },

    getUnvotedState : function() {
        return !this.getUnvoted() //flip boolean since true=all=!unvoted
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

    setUnvoted : function(unvoted) {
        this.set({
            'unvoted' : unvoted,
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

    getTab : function() {
        return this.get('tab')
    },

    url_search : function(filter, filterType, limit) {
        filter = filter || this.get('filter');
        filterType = filterType || this.get('filterType');
        limit = limit || 33;
        var return_type = "list";
        var unvoted = this.getUnvotedArg()
        return baseUrl +  sprintf("/commprod/api/search?limit=%s&%s=%s&return_type=%s%s", limit, filterType, filter, return_type, unvoted)
    },

    getUnvotedArg : function() {
        if (user.getUnvoted()) {
            return '&unvoted=true';
        }
        return ''
    },

    updateSet : function(callback) {
        var url = this.url_search();
        var renderedProds = [];
        var cleanProd = this.cleanProd;
        var that = this;
        $.get(url, function(data) {
            if(data.res === undefined) { //we aren't logged in
                chrome.extension.sendMessage('logout');
                return
            }
            $.each(data.res, function(index, prod) {
                prod = cleanProd(String(prod));
                renderedProds.push(prod);
                if (index == data.res.length-1){
                    that.addProds(renderedProds);
                    callback();
                }
            });
        });
    },

    addProds : function(renderedProds) {
        this.set({
            'renderedProds' : renderedProds
        })
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

    getProdLink : function() {
        return baseUrl + sprintf("/commprod/search?page=2%s&%s=%s", this.getUnvotedArg(), this.get('filterType'), this.get('filter'))
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
//var baseUrl = "http://localhost:8000" // global website base, set to localhost for testing
var baseUrl = "http://burtonthird.com"

/////////init models///////
var user = getLocalStorageUser();
initBadge();

var recent_set = new ProdSet({ 
    filter : "recent", 
    filterType : "type",
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

var worst_set = new ProdSet({ 
    filter : "worst", 
    filterType : "type",
    tab : 'worst_tab',
});