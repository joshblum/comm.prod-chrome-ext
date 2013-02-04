function voteSelection (e, data) {
    var $src = $(e.target);
    var $commprod = $src.closest('.commprod-container');
    //don't submit again if already selected
    if ($src.hasClass('selected')){
        return; 
    }

    //gather info about this vote
    var isUpVote = $src.hasClass('up-vote');
    var score = isUpVote ? 1:-1;
    var id = $commprod.data('id'),
    type = $commprod.data('type');

    //diff is the change from this users previous score given to this commprod
    var diff = $commprod.find('.vote').hasClass('selected') ? score*2 : score;

    //only select one arrow at a time
    $src.addClass('selected').siblings().removeClass('selected');
    sendVote(id, score, type, diff);
}

function sendVote(id, score, type, diff) {
    var $commprod = $('#'+ type + '_object_'  + id);

    var payload = {
        'id':id,
        'score':score,
        'type': type,
        'diff': diff
    };
    $.post(baseUrl + '/commprod/vote/', payload, function(res){
        $commprod.trigger('voteResponse', res);
    });    
    $commprod.trigger('voteSent', payload);
}

function postVote (e, d) {
    var $commprod = $(e.target);

    //quickly change the ui -- must use diff to handle if user already voted
    var $commprod_score = $commprod.find('.score');
    var new_score = parseInt($commprod_score.data('score')) + d.diff;
    $commprod_score.data('score', new_score); // update the data with the int score

    $commprod_score.html(numberWithCommas(new_score)); //format with commas for

    /*
    Below is correction only stuff
    */
    if ($commprod.data('type') != 'correction'){
        return;
    }
    //note the below code probably only work for the permalink page. Be careful expecting this to work elsewhere
    var max = 5;
    var min = -5;

    var new_score = $commprod.find('.score').text()

    if (new_score>=max) {
        //make new_prod the features one.
        var new_prod = $commprod.find('.commprod-content').html();
        $('.commprod-content:first').html(new_prod);

        //remove all other commprod
        $('.correction').remove();
   }
   else if (new_score<=min) {
        $commprod.remove();
   }
}

function detailsCorrectionText(e) {
    $(e.target).text("Click for more")
}

function detailsDefaultText(e) {
    $(e.target).text("Details")
}

function favToggle(e) {
    $(e.target).toggleClass('icon-star icon-star-empty');
}

function favVote(e) {
    var $src = $(e.target);
    var $commprod = $src.closest('.commprod-container');
    $src.toggleClass('icon-star icon-star-empty');
    
    var id = $commprod.data('id'),
    type = $commprod.data('type'),
    choice = $src.hasClass('icon-star-empty'),
    payload = {'id':id, 'choice' : choice};
    $commprod = $('#'+ type + '_object_'  + id);

    $.post(baseUrl + '/commprod/favorite/', payload, function(res){
        $commprod.trigger('favResponse', res);
    }); 

    $commprod.trigger('favSent', payload)

}

//helper function for fomatting numbers with commas
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

$(function(){

    $(document).on('click', '.vote-container .vote', voteSelection);

    $(document).on('voteSent', postVote);

}); 
