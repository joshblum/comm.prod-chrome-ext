//////////Views ///////////////
LoginView = Backbone.View.extend({
    'el' : 'content-container',

    initialize : function() {
        this.render();
    },

    render : function() {
        if (!user.get('loggedIn')) {
            $('.content-container').empty()
            var template = _.template($("#login_template").html(), {
                    'baseUrl' : baseUrl,
                });

            this.el.html(template);
        }
    },

    events : {
        "click #login" : "getLogin",
        "keypress input" : "filterKey"
    },

    filterKey : function(e) {
        if (e.which == 13) { // listen for enter event
            e.preventDefault();
            this.getLogin()
        }
    },

    getLogin : function() {
        $('#errors').fadeOut();
        var username = $('#id_username').val();
        var password = $('#id_password').val();
        if (username === '' || password === '') {
            this.displayErrors("Enter a username and a password")
        } else {
            $.get(url_login(), function(data) {
                postLogin(data, username, password);
            });
    },

    postLogin : function(data, username, password) {
        var REGEX = /name\=['"]csrfmiddlewaretoken['"] value\=['"].*['"]/; //regex to find the csrf token
        var match = data.match(REGEX);
        if (match) {
            match = match[0]
            var csrfmiddlewaretoken = match.slice(match.indexOf("value=") + 7, match.length-1); // grab the csrf token
            //now call the server and login
            $.ajax({
                url: url_login(),
                type: "POST",
                data: {
                        "username": username,
                        "password": password,
                        "csrfmiddlewaretoken" : csrfmiddlewaretoken,
                        "remember_me": 'on', // for convience
                },
                dataType: "html",
                success: function(data) {
                    var match = data.match(REGEX)
                    if(match) { // we didn't log in successfully
                        displayErrors("Invalid username or password");
                    } else {
                        this.completeLogin()
                    }
                },
                error : function(data) {
                    displayErrors("Unable to connect, try again later.")
                }
            });
        }
        else {
            this.completeLogin();
        }
    },

    completeLogin : function() {
        $('#login_container').remove()
        user.setLogin(true)
        fetchProds();
    },

    logout : function() {
        $.get(url_logout());
        user.setLogin(false);
        this.render();
    },

    displayErrors : function(errorMsg) {
        $errorDiv = $('#errors');
        $errorDiv.html(errorMsg);
        $errorDiv.fadeIn();
    },

});

SearchView = Backbone.View.extend({
    'el' : 'content-container',

    initialize : function(){
        var tab = user.get('tab')
        this.render(tab);
    },

    render : function(tab){
        $('.content-container').empty();
        var template = _.template( $("#timeline_template").html(), {
                'baseUrl' : baseUrl,
            });
        this.el.html(template);
        var set_name = tab.split('_') + 'set'
        var set = prod_collection[set_name];
        $container = $(".commprod-timeline");
        $container.empty();
        $.each(set.get('renderedProds'), function (index, item) {
            $container.append(item);
        });
    },

    vote : function(event){

    }
});

///////////////////URL BUILDERS///////////////////
function url_login() {
    return baseUrl + 'login'
}

function url_logout() {
    return baseUrl + 'logout'
}

function url_search(unvoted, filter, filter_type, limit) { 
    var unvoted = unvoted || true;
    var limit = limit || 30;
    var return_type = "list";

    return baseUrl +  sprintf("commprod/api/search?unvoted=%s&limit=%s&%s=%s&return_type=%s", unvoted, limit, filter, filterType, return_type)
}



$(document).ready(function() {
    window.backpage = chrome.extension.getBackgroundPage(); //get the background page for state
    user = backpage.user;
    prod_collection = {
        'recent_set' : backpage.recent_set;
        'trending_set' : backpage.trending_set;
        'media_set' : backpage.media_set;
        'best_set' : backpage.best_set;
    }
    
});