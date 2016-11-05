'use strict'
var bookmarks = {};

bookmarks.appOnReady = function() {
  window.onhashchange = function() {
    bookmarks.router(window.location.hash);
  };

  bookmarks.router(window.location.hash);
}

bookmarks.router = function(hash) {
  var routes = {
    '': bookmarks.landingView,
    '#': bookmarks.landingView,
    '#index': bookmarks.indexView,
    '#show': bookmarks.showView
  };

  var viewFn = routes[hash];

  if(viewFn) {
    bookmarks.triggerEvent('removingView', []);
    $('.view-container').empty().append(viewFn);
  }
}

bookmarks.template = function(name) {
  return $('.templates .' + name).clone();
}

bookmarks.triggerEvent = function(name, args) {
  $('.view-container>*').trigger(name, args);
}

bookmarks.landingView = function() {
  return bookmarks.template('landing-view');
}

bookmarks.indexView = function() {
  return bookmarks.template('index-view');
}
bookmarks.showView = function() {}

function googleSignIn() {
  console.log(arguments);
}
