'use strict'
var bookmarks = {
  poolId: 'us-east-1:1271b35b-0814-46eb-8fe0-433d8b646463'
};

bookmarks.appOnReady = function() {
  window.onhashchange = function() {
    bookmarks.router(window.location.hash);
  };

  bookmarks.router(window.location.hash);
  bookmarks.identity.done(bookmarks.addProfileLink);
}

bookmarks.router = function(hash) {
  var routes = {
    '': bookmarks.landingView,
    '#': bookmarks.landingView,
    '#index': bookmarks.indexView,
    '#show': bookmarks.showView,
    '#profile': bookmarks.profileView
  };

  var viewFn = routes[hash];

  if(viewFn) {
    bookmarks.triggerEvent('removingView', []);
    $('.view-container').empty().append(viewFn);
  }
}

//////////////////////////////////////////////////
//
// Util
//
//////////////////////////////////////////////////
bookmarks.template = function(name) {
  return $('.templates .' + name).clone();
}

bookmarks.triggerEvent = function(name, args) {
  $('.view-container>*').trigger(name, args);
}

bookmarks.addProfileLink = function(profile) {
  var link = bookmarks.template('profile-link');
  link.find('a').text(profile.email);
  $('.signin-bar').prepend(link);
}

//////////////////////////////////////////////////
//
// Templates
//
//////////////////////////////////////////////////

bookmarks.landingView = function() {
  return bookmarks.template('landing-view');
}

bookmarks.indexView = function() {
  return bookmarks.template('index-view');
}

bookmarks.profileView = function() {
  var view = bookmarks.template('profile-view');
  bookmarks.identity.done(function(identity) {
    view.find('.email').text(identity.email);
  });

  return view;
}

bookmarks.showView = function() {}

//////////////////////////////////////////////////
//
// Google Authentication
//
//////////////////////////////////////////////////
bookmarks.identity = new $.Deferred();

function googleSignIn(googleUser) {
  var id_token = googleUser.getAuthResponse().id_token;
  AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: bookmarks.poolId,
      Logins: {
        'accounts.google.com': id_token
      }
    })
  })

  function refresh() {
    return gapi.auth2.getAuthInstance().signIn({
      prompt: 'login'
    }).then(function(userUpdate) {
      var creds = AWS.config.credentials;
      var newToken = userUpdate.getAuthResponse().id_token;
      creds.params.Logins['accounts.google.com'] = newToken;

      return bookmarks.awsRefresh();
    });
  }

  bookmarks.awsRefresh().then(function(id) {
    bookmarks.identity.resolve({
      id: id,
      email: googleUser.getBasicProfile().getEmail(),
      refresh: refresh
    });
  });
}

bookmarks.awsRefresh = function() {
  var deferred = $.Deferred();
  AWS.config.credentials.refresh(function(err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(AWS.config.credentials.identityId);
    }
  });

  return deferred.promise();
}
