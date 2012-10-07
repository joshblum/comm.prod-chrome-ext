var baseUrl = "http://localhost:5000/" // global website base, set to localhost for testing
//var baseUrl = "http://burtonthird.com/"


/*
    Call the login page with a get request. If the user has a username and a password, post request using postLogin with the data of the page recieved
*/
function getLogin() {
    $('#errors').fadeOut();

    var username = $('#id_username').val() 
    username = username ? username : user.get('username');
    var password = $('#id_password').val()
    password =  password ? password : user.get('password');
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
                    addUserInfo(username, password);
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
    rmUserInfo();
}

/*
    Store the username and password in global state
*/
function addUserInfo(username, password) {
    user.setUsername(username);
    user.setPassword(password);
}
/*
    Clear user state
*/
function rmUserInfo() {
    addUserInfo('', '');
}

/*
    Attempts to log the user in if data has been stored.
    Adds events listeners for login button/key press for future use
*/
function setLoginListener() {
    $('#errors').hide();
    $('.commprod-timeline-container').hide();
    $('#id_username').focus();
    if (user.get('validInfo')){
        getLogin();
    }
    $('#login').click(getLogin);
    $('input').keypress(function (e) {
        if (e.which == 13) { // listen for enter event
            e.preventDefault();
            getLogin()
        }
    });

}

function hideLogin() { 
    $('#login_container').hide()
}

/*
    Query for unread recent commprods
*/
function fetchProds() {
    $('.commprod-timeline-container').fadeIn();
    $.get(url_search(), function(data) {
        var $prod_container = $('.commprod-timeline');
        $prod_container.html("");
        $.each(data, function(index, html) { 
            $prod_container.append(html)
        });
    })
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

function url_search(unvoted, limit, orderBy) { 
    var unvoted = unvoted || true;
    var limit = limit || 15;
    var orderBy = orderBy || '-date';
    var return_type = "list";

    return baseUrl +  sprintf("commprod/api/search?unvoted=%s&limit=%s&orderBy=%s&return_type=%s", unvoted, limit, orderBy, return_type)
}
////////////////////////////////////////////////////


$(document).ready(function() {
    window.backpage = chrome.extension.getBackgroundPage(); //get the background page for state
    user = backpage.user;
    console.log(user)
    setLoginListener();
    console.log(user)
});