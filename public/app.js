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
// Database Related
//
//////////////////////////////////////////////////

bookmarks.saveLink = function(link) {
  return bookmarks.identity.then(function(identity) {
    var db = new AWS.DynamoDB.DocumentClient();
    var item = {
      TableName: 'banalbookmarks',
      Item: {
        userId: identity.id,
        link: link
      }
    };
    return bookmarks.sendDbRequest(db.put(item), function() {
      return bookmarks.saveLink(link);
    });
  });
};

bookmarks.deleteLink = function(link) {
  return bookmarks.identity.then(function(identity) {
    var db = new AWS.DynamoDB.DocumentClient();
    var item = {
      TableName: 'banalbookmarks',
      Key: {
        userId: identity.id,
        link: link
      }
    };

    return bookmarks.sendDbRequest(db.delete(item), function() {
      return bookmarks.deleteLink(link);
    });
  });
}

bookmarks.fetchLinks = function() {
  return bookmarks.identity.then(function(identity) {
    var lambda = new AWS.Lambda();
    var params = {
      FunctionName: "fetchLinks",
      Payload: JSON.stringify({"identity": identity, "id_token": bookmarks.id_token}),
      InvocationType: "RequestResponse"
    };

    return bookmarks.sendDbRequest(lambda.invoke(params), function() {
      return bookmarks.fetchlinks;
    })
  });
}


bookmarks.sendDbRequest = function(req, retry) {
  var promise = new $.Deferred();
  req.on('error', function(error) {
    if (error.code == "CredentialsError") {
      bookmarks.identity.then(function(identity) {
        return identity.refresh().then(function() {
          return retry();
        }, function() {
          promise.reject(resp);
        });
      });
    } else {
      promise.reject(error);
    }
  });
  req.on('success', function(resp) {
    promise.resolve(resp.data);
  });

  req.send();
  return promise;
};


//////////////////////////////////////////////////
//
// Templates
//
//////////////////////////////////////////////////

bookmarks.landingView = function() {
  return bookmarks.template('landing-view');
}

bookmarks.indexView = function() {
  var view = bookmarks.template('index-view');

  function submitLink() {
    return view.find('.new-link').val();
  }

  function checkSubmittedLink() {
    if (submitLink()) {
      var link = view.find('.new-link');
      bookmarks.saveLink(link.val());
    } else {
      console.log('No link submitted!');
    }
  }
  view.find('.submit-link').click(checkSubmittedLink);

  bookmarks.fetchLinks().then(function(data) {
    var data = JSON.parse(data.Payload);
    var table = $("#links-table");

    if (data) {
      var items = data.Items;

      $.each(items, function(rowIndex, data) {
        var row = $("<tr/>");
        var link = data["link"];
        var deleteBtn = $("<button>",
                         { text: "Delete",
                           type: "button",
                           class: "button-danger btn-delete",
                           click: function () { bookmarks.deleteLink(link); } })

        row.append($("<td/>").text(link));
        row.append($("<td/>").append(deleteBtn));

        table.append(row);
      });
    } else {
    }
  });
  return view;
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
// Google Authentication
//
//////////////////////////////////////////////////
bookmarks.identity = new $.Deferred();

function googleSignIn(googleUser) {
  var id_token       = googleUser.getAuthResponse().id_token;
  bookmarks.id_token = id_token;

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
      var creds          = AWS.config.credentials;
      var newToken       = userUpdate.getAuthResponse().id_token;
      bookmarks.id_token = newToken;

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

function googleSignOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
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
