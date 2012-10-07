/*
    Call the login page with a get request. If the user has a username and a password, post request using postLogin with the data of the page recieved
*/
function getLogin() {
    $('#errors').fadeOut();
    var username = $('#id_username').val();
    var password = $('#id_password').val();
    if (username === '' || password === '') {
        displayErrors("Enter a username and a password")
    } else {
        $.get(url_login(), function(data) {
            postLogin(data, username, password);
        });
    }
}

/*
    Call the login url with the user's username and password. Upon success get commprods. If failure display error
*/
function postLogin(data, username, password) {
    var REGEX = /name\=['"]csrfmiddlewaretoken['"] value\=['"].*['"]/; //regex to find the csrf token
    var match = data.match(REGEX);
    if (match)  {
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
                    hideLogin();
                    fetchProds();
                }
            }
        });
    }
    else {
        fetchProds(); // we didn't match the regex so the user is already logged in, lets get them comm.prods
    }
    
}

/*
    Log the user out.
*/
function logout() { 
    $.get(url_logout());
    user.setLogin(false);
}

/*
    Attempts to log the user in if data has been stored.
    Adds events listeners for login button/key press for future use
*/
function setLoginListener() {
    if (user.get('loggedIn')){
        
    }
    else {
        $('#login').click(getLogin);
        $('input').keypress(function (e) {
            if (e.which == 13) { // listen for enter event
                e.preventDefault();
                getLogin()
            }
        });        
    }


}

function hideLogin() { 
    $('#login_container').hide()
}

/*
    Show any errors from the login process.
*/
function displayErrors(errorMsg) {
    $errorDiv = $('#errors');
    $errorDiv.html(errorMsg);
    $errorDiv.fadeIn();
}


///////////////////URL BUILDERS///////////////////
function url_login() {
    return baseUrl + 'login'
}

function url_logout() {
    return baseUrl + 'logout'
}

function url_search(unvoted, filter, filter_type, limit) { 
    var unvoted = unvoted || true;
    var limit = limit || 15;

    var return_type = "list";

    return baseUrl +  sprintf("commprod/api/search?unvoted=%s&limit=%s&%s=%s&return_type=%s", unvoted, limit, filter, filterType, return_type)
}
////////////////////////////////////////////////////


$(document).ready(function() {
    window.backpage = chrome.extension.getBackgroundPage(); //get the background page for state
    user = backpage.user;
    setLoginListener();
});