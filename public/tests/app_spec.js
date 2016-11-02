describe('Banal Bookmarks', function() {
  it('shows the landing page when tehre is no hash', function() {
    bookmarks.router('');
    expect($('.view-container .landing-view').length).toEqual(1);
  });

  it('invokes the router when HTML document is loaded', function() {
    spyOn(bookmarks, 'router');
    bookmarks.appOnReady();

    expect(bookmarks.router).toHaveBeenCalledWith(window.location.hash);
  });

  it("subscribes to the hash change event", function() {
    bookmarks.appOnReady();
    spyOn(bookmarks, 'router');
    $(window).trigger('hashchange');

    expect(bookmarks.router).toHaveBeenCalledWith(window.location.hash);
  });

  it ('passes the hash view parameter to the router function', function() {
    spyOn(bookmarks, 'router');
    bookmarks.router('42');

    expect(bookmarks.router).toHaveBeenCalledWith('42');
  });
});
