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
                        self.completeLogin(username)
                    }
                },
                error : function(data) {
                    self.displayErrors("Unable to connect, try again later.")
                }
            });
        } else {
            self.completeLogin(username);
        }
    },

    completeLogin : function(username) {
        $('#login_container').remove();
        $('body').css('width', '650px');

        user.login();
        user.setUsername(username);
        user.saveState();

        navView.render('home_tab');
        subNavView.render();
    },

    logout : function() {
        $.get(url_logout());
        user.logout();
        backpage.clearLocalStorage('user');
        this.render();
        navView.render();
        subNavView.destroy();
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
        var tab = user.getTab();
        var template = _.template( $("#timeline_template").html(), {
                'baseUrl' : baseUrl,
            });

        $(this.el).html(template);

        var set_name = getSetName();
        var set = prod_collection[set_name];
        set.checkSet(function() {
            $container = $(".commprod-timeline");
            $container.empty();
            $.each(set.get('renderedProds'), function (index, item) {
                $container.append(item);
            });
        })
    },
});

SubNavView = Backbone.View.extend({
    'el' : $('.subnav-container'),

    initialize : function(){
        this.render();
    },

    render : function() {
        var tab = user.getTab();
        if (user.isLoggedIn()) {
            this.destroy();
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

    destroy : function() {
        $('.subnav-container').empty();
    }
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

function clickHandle(e) {
    e.preventDefault();
    var url = $(e.target).context.href;
    if (url.indexOf("logout") !== -1) {
        loginView.logout();
    } else if (url.indexOf("http") !== -1){
        backpage.openLink(url);
    } else {
        url = url.split('#')[1];
        user.setTab(url);
        subNavView.render();
    }
}

///////////////////URL BUILDERS///////////////////
function url_login() {
    return baseUrl + '/login'
}

function url_logout() {
    return baseUrl + '/logout'
}

function getSetName() { 
    var tab = user.getTab();
    return tab.split('_')[0] + '_set'
}

function updateSet() {
    var set = prod_collection[getSetName()]
    set.updateSet();
}


/*
Ajax CSRF protection
*/
function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
function sameOrigin(url) {
    // test that a given url is a same-origin URL
    // url could be relative or scheme relative or absolute
    var host = document.location.host; // host + port
    var protocol = document.location.protocol;
    var sr_origin = '//' + host;
    var origin = protocol + sr_origin;
    // Allow absolute or scheme relative URLs to same origin
    return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
        (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
        // or any other URL that isn't scheme relative or absolute i.e relative.
        !(/^(\/\/|http:|https:).*/.test(url));
}

$(document).ready(function() {
    
    $(document).on('voteSent', updateSet);

    window.backpage = chrome.extension.getBackgroundPage(); //get the background page for state
    user = backpage.user;
    baseUrl = backpage.baseUrl;

    chrome.cookies.get({
        'name' :'csrftoken', 'url' : baseUrl
        }, function(cookie){
            csrftoken = cookie.value;
    });
    
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type)) {
                // Send the token to same-origin, relative URLs only.
                // Send the token only if the method warrants CSRF protection
                // Using the CSRFToken value acquired earlier
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

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

    $('a').click(clickHandle);
});