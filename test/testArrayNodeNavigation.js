"use strict";
const expect = require("chai").expect;
const store = require("../lib/schemaStore.js").store;


describe('document storage against schema', function () {
    const schema = {
        root: {
            nestedOne: {
                nestedTwo: {
                    type: "array"
                }
            }
        }
    };

    it('should create nodes of any depth', function () {
        const expectedDocument = {
            root: {
                nestedOne: {
                    nestedTwo: [
                        {name: "fred"},
                        {name: "mary"}
                    ]
                }
            }
        };

        let initialStore = store("root/nestedOne/nestedTwo", {name: "fred"}, schema, {});
        const storedDocument = store("root/nestedOne/nestedTwo", {name: "mary"}, schema, initialStore);
        expect(storedDocument).to.deep.equal(expectedDocument);
    });

    it('should allow array indexing', function () {
        const existingDocument = {
            root: {
                nestedOne: {
                    nestedTwo: [
                        {name: "barney"},
                        {name: "fred"},
                        {name: "breda"}
                    ]
                }
            }
        };

        const expectedDocument = {
            root: {
                nestedOne: {
                    nestedTwo: [
                        {name: "barney"},
                        {name: "mary"},
                        {name: "breda"}
                    ]
                }
            }
        };

        const storedDocument = store("root/nestedOne/nestedTwo[1]", {name: "mary"}, schema, existingDocument);
        expect(storedDocument).to.deep.equal(expectedDocument);
    });

    it('should allow nested array indexing', function () {

        const schema = {
            root: {
                nestedOne: {
                    nestedTwo: {
                        type: "array",
                        nestedThreePointOne: {},
                        nestedThreePointTwo: {}
                    }
                }
            }
        };

        const existingDocument = {
            root: {
                nestedOne: {
                    nestedTwo: [
                        {
                            nestedThreePointOne: {},
                            nestedThreePointTwo: {}
                        }
                    ]
                }
            }
        };

        const expectedDocument = {
            root: {
                nestedOne: {
                    nestedTwo: [
                        {
                            nestedThreePointOne: {},
                            nestedThreePointTwo: {name: "mary"}
                        }
                    ]
                }
            }
        };

        const storedDocument = store("root/nestedOne/nestedTwo[0]/nestedThreePointTwo", {name: "mary"}, schema, existingDocument);
        expect(storedDocument).to.deep.equal(expectedDocument);
    });
});
