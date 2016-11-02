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
    '#index': bookmarks.indexView,
    '#show': bookmarks.showView
  };

  var viewFn = routes[hash];

  if(viewFn) {
    $('.view-container').empty().append(viewFn);
  }
}

bookmarks.indexView = function() {}
bookmarks.showView = function() {}
