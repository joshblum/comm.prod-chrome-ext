User = Backbone.Model.extend({
    defaults: {
        'username' : '',
        'password' : '',
        'updateBadge' : 'always', //default to update badge for every commprod
        'validInfo' : false, 
    },
    initialize : function(){
        this.bind("change:name", this.validateUserInfo);
        this.bind("change:password", this.validateUserInfo);
    },
    setUsername : function(username){
        this.set({ 
            username: username 
        });
    },
    setPassword : function(password){
        this.set({ 
            password: password 
        });
    },
    validateUserInfo : function() {
        if (this.get('username') && this.get('password')) {

            this.set({
                validInfo : true
            }); 
        }
    },
});

var user = new User();

