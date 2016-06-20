var yelp = require('../yelp');
var expect = require('chai').expect;

describe('Yelp module methods:', function() {
  this.timeout(0);

  it('Should return results on a search with location string', function() {
    var params = {
      category: 'restaurants',
      location: 'Sacramento, CA',
    };
    return yelp.search(params)
      .then(function(businesses) {
        expect(businesses.length).to.not.equal(0);
      });
  });

  it('Should return results on a search with coordinates', function() {
    var params = {
      category: 'coffee',
      latitude: 37.773972,
      longitude: -122.431297,
    };
    return yelp.search(params)
      .then(function(businesses) {
        expect(businesses.length).to.not.equal(0);
      });
  });

});
