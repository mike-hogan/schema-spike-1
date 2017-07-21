"use strict";
const expect = require("chai").expect;
const store = require("../lib/schemaStore.js").store;


describe('document storage against schema', function() {
    it('should work with an empty doc and an empty schema', function() {
        expect(store({},{})).to.deep.equal({});
    });
});
