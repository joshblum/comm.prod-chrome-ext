//////////Views ///////////////
LoginView = Backbone.View.extend({
    'el' : $('.content-container'),

    initialize : function() {
         _.bindAll(this);
        this.render();
    },

    render : function() {
        if (!user.isLoggedIn()) {
            $('.content-container').empty();
            $('body').css('width', '300px');
            var template = _.template($("#login_template").html(), {
                    'baseUrl' : baseUrl,
                });

            $(this.el).html(template);
            $('#errors').fadeOut();
            $('#id_username').focus();
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
        var self = this;
        var username = $('#id_username').val();
        var password = $('#id_password').val();
        if (username === '' || password === '') {
            self.displayErrors("Enter a username and a password")
        } else {
            $.get(url_login(), function(data) {
                self.postLogin(data, username, password);
            });
        }
    },

    postLogin : function(data, username, password) {
        var REGEX = /name\='csrfmiddlewaretoken' value\='.*'/; //regex to find the csrf token
        var match = data.match(REGEX);
        var self = this;
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
                        self.displayErrors("Invalid username or password");
                    } else {
                        self.completeLogin()
                    }
                },
                error : function(data) {
                    self.displayErrors("Unable to connect, try again later.")
                }
            });
        }
        else {
            self.completeLogin();
        }
    },

    completeLogin : function() {
        $('#login_container').remove();
        $('body').css('width', '600px');
        user.setLogin(true);
        navView.render('home_tab');
        subNavView.render();
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
    'el' : $('.content-container'),

    render : function() {
        $('.content-container').empty();
        var tab = user.get('tab');
        var template = _.template( $("#timeline_template").html(), {
                'baseUrl' : baseUrl,
            });

        $(this.el).html(template);

        var set_name = tab.split('_')[0] + '_set'
        var set = prod_collection[set_name];
        set.checkSet(function() {
            $container = $(".commprod-timeline");
            $container.empty();
            $.each(set.get('renderedProds'), function (index, item) {
                set.cleanProd(item);
                $container.append(item);
            });
        })
    },

    vote : function(event) {

    }
});

SubNavView = Backbone.View.extend({
    'el' : $('.subnav-container'),

    initialize : function(){
        this.render();
    },

    render : function() {
        var tab = user.get('tab')
        if (user.isLoggedIn()) {
            $('.subnav-container').empty();
            var template = _.template( $("#subnav_template").html(), {
                    'baseUrl' : baseUrl,
                });

            $(this.el).html(template);
            $('.subnav-tab').removeClass('active');
            $('#' + tab).addClass('active');        
            searchView = view_collection[tab];
            searchView.render();
        }
        
    },
});

NavView = Backbone.View.extend({
    'el' : $('.nav-container'),

    initialize : function(){
        this.render('home_tab');
        $('.brand').blur()
    },

    render : function(tab) {
        $('.nav-container').empty();
        var loggedIn = user.isLoggedIn();
        var template = _.template($("#nav_template").html(), {
                baseUrl : baseUrl,
                loggedIn : loggedIn,
            });

        $(this.el).html(template);
        if (!loggedIn) {
            tab = "login_tab"
        }
        $('nav-tab').removeClass('active');
        $('#' + tab).addClass('active');
    },
});

///////////////////URL BUILDERS///////////////////
function url_login() {
    return baseUrl + '/login'
}

function url_logout() {
    return baseUrl + '/logout'
}

$(document).ready(function() {
    window.backpage = chrome.extension.getBackgroundPage(); //get the background page for state
    user = backpage.user;
    baseUrl = backpage.baseUrl;
    prod_collection = {
        'recent_set' : backpage.recent_set,
        'trending_set' : backpage.trending_set,
        'media_set' : backpage.media_set,
        'best_set' : backpage.best_set,
    }
    view_collection = { 
        'recent_tab' : new SearchView(),
        'trending_tab' : new SearchView(),
        'media_tab' : new SearchView(),
        'best_tab' : new SearchView(),
    }
    navView =  new NavView();
    subNavView = new SubNavView();
    loginView = new LoginView();
});