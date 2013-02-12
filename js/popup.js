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
        $('#login').button('loading');
        var self = this;
        var username = $('#id_username').val();
        var password = $('#id_password').val();
        if (username === '' || password === '') {
            self.displayErrors("Enter a username and a password.")
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
                        self.displayErrors("Invalid username or password.");
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
        $('body').css('width', '600px');

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
        $('#login').button('reset');
        var $errorDiv = $('#errors');
        $errorDiv.html(errorMsg);
        $errorDiv.fadeIn();
    },

});

SearchView = Backbone.View.extend({
    'el' : $('.content-container'),

    render : function(loading) {
        loading = loading || false;
        $('.content-container').empty();
        var set_name = getSetName();
        var set = prod_collection[set_name];
        var prods = set.get('renderedProds');
        var template = _.template( $("#timeline_template").html(), {
                'baseUrl' : baseUrl,
                'moreProdsLink' : set.getProdLink(),
            });

        $(this.el).html(template);
        $('.btn-prod').hide();
        if (loading) {
            return
        }
        set.updateSet(function() {
            $container = $(".commprod-timeline");
            $container.empty();
            $.each(prods, function (index, item) {
                $container.append(item);
                if (index === prods.length-1){
                    $('.btn-prod').show();
                    addTips(); // re-add tips
                    popoverListeners();
                }
            });
        });
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
            activateSwitch(); //re-init switches
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
    },

    render : function(tab) {
        $('.nav-container').empty();
        var loggedIn = user.isLoggedIn();
        var template = _.template($("#nav_template").html(), {
                baseUrl : baseUrl,
                loggedIn : loggedIn,
                username : user.getUsername(),
            });

        $(this.el).html(template);
        if (!loggedIn) {
            tab = "login_tab"
        }
        $('nav-tab').removeClass('active');
    },
});


function getSetName() { 
    var tab = user.getTab();
    return tab.split('_')[0] + '_set'
}

function getCurrentSet() {
    return prod_collection[getSetName()]
}

function getCurrentView() {
    return view_collection[user.getTab()]
}

function updateCurrentSet() {
    var set = getCurrentSet();
    set.updateSet();
}

function addTips() {
    $('.claim-profile').tooltip({
        "placement" : "right",
        "title" : "Visit the main site to claim your emails.",
        "trigger" : "hover",
    });

    $('.switch').tooltip({
        "placement" : "bottom",
        "title" : "Toggle between all comm.prods or only unvoted ones.",
        "trigger" : "hover",
    });
}

function activateSwitch(){
    $('.switch')['switch']();
    $('.switch').switch('setState', user.getUnvotedState());
}

function ajaxSetup(csrftoken){

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
}


//////////Event Handlers ///////////
function unvotedHandle(e, d) {
    getCurrentView().render(true); //render loading view
    
    var value = d.value;

    if (value) {
        user.setUnvoted(false);
    } else {
        user.setUnvoted(true);
    }
    $.each(prod_collection, function(key, set){
        set.updateSet(function() {
            if (set.getTab() === user.getTab()){
                getCurrentView().render();
            }
        });
    });
}

function clickHandle(e) {
    e.preventDefault();
    var url = $(e.target).context.href;
    if (url.indexOf("logout") !== -1) {
        loginView.logout();
    } else if (url.indexOf("http") !== -1){
        backpage.openLink(url);
    }else if (url.indexOf("login") !== -1){
        return
    } else {
        url = url.split('#')[1];
        user.setTab(url);
        subNavView.render();
    }
}

function moreProds(e) {
    backpage.openLink($(e.target).data('link'));
}

function popoverListeners() {
    $('.permalink').hover(detailsCorrectionText, detailsDefaultText).popover();

    $('.fav').hover(favToggle).click(favVote);
}

///////////////////URL BUILDERS///////////////////
function url_login() {
    return baseUrl + '/login'
}

function url_logout() {
    return baseUrl + '/logout'
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
    ////global vars//////
    window.backpage = chrome.extension.getBackgroundPage(); //get the background page for state
    user = backpage.user;
    baseUrl = backpage.baseUrl;

    prod_collection = {
        'recent_set' : backpage.recent_set,
        'trending_set' : backpage.trending_set,
        'media_set' : backpage.media_set,
        'best_set' : backpage.best_set,
        'worst_set' : backpage.worst_set,
    };

    view_collection = { 
        'recent_tab' : new SearchView(),
        'trending_tab' : new SearchView(),
        'media_tab' : new SearchView(),
        'best_tab' : new SearchView(),
        'worst_tab' : new SearchView(),
    };

    /////setup funcs///////
    chrome.cookies.get({
        'name' :'csrftoken', 
        'url' : baseUrl
        }, function(cookie){
            ajaxSetup(cookie.value);
    });

    //////event listeners //////
    $(document).on('click', '.vote-container .vote', voteSelection);
    $(document).on('click', '.btn-prod', moreProds);

    $(document).on('click', 'a', clickHandle);

    $(document).on('voteSent', updateCurrentSet);
    $(document).on('switch-change', unvotedHandle);

    chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
        if (msg === 'logout') {
            loginView.logout();
        }
        sendResponse(); //close connection
    });


    /////init views/////
    navView = new NavView();
    subNavView = new SubNavView();
    loginView = new LoginView();
});