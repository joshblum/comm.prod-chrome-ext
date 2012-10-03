var base_url = "http://localhost:5000/" // global website base, set to localhost for testing
//var base_url = "http://burtonthird.com/"


/*
    Call the login page with a get request. If the user has a username and a password, post request using post_login with the data of the page recieved
*/
function get_login() {
    var username = $('#id_username').val(),
    password = $('#id_password').val();
    if (username === '' || password === '') {
        displayErrors("Enter a username and a password")
    } else {
        $.get(url_login(), function(data) {
            post_login(data, username, password);
        });
    }
}

/*
    Call the login url with the user's username and password. Upon success get commprods. If failure display error
*/
var x
function post_login(data, username, password) {
    var REGEX = /name\=['"]csrfmiddlewaretoken['"] value\=['"].*['"]/; //regex to find the csrf token
    var match = data.match(REGEX);
    if (match)  {
        match = match[0]
        var csrfmiddlewaretoken = match.slice(match.indexOf("value=") + 7, match.length-1); // grab the csrf token
        //now call the server and login
        debugger
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

                    get_login();
                } else {
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
}


function fetchProds() {
    console.log('here')
}

/*
    Show any errors from the login process.

*/
function displayErrors(errorMsg) {
    $errorDiv = $('#errors');
    $errorDiv.html(errorMsg);
    $errorDiv.removeClass('hidden');
}


///////////////////URL BUILDERS///////////////////
function url_login() {
    return base_url + 'login'
}

function url_logout() {
    return base_url + 'logout'
}

function url_search(unvoted, limit, orderBy) { 
    var unvoted = unvoted || true;
    var limit = limit || 15;
    var orderBy = orderBy || 'date';
    var return_type = "list";

    return base_url +  sprintf("/commprod/api/search?unvoted=%s&limit=%orderBy=%s&return_type=%s", unvoted, limit, orderBy, return_type)
}
////////////////////////////////////////////////////


$(document).ready(function() {
    $('#login').click(get_login);
    $('.input').keypress(function (e) {
        if (e.which == 13) { // listen for enter event
            get_login()
        }
        e.preventDefault();
    });
});