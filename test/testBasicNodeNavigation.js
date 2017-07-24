"use strict";
const expect = require("chai").expect;
const store = require("../lib/schemaStore.js").store;


describe('document storage against schema', function() {
    it('should work with an empty doc and an empty schema', function() {
        expect(store("root",{},{}, {})).to.deep.equal({root:{}});
    });

    const schema = {
        root:{
            nestedOne:{
                nestedTwo:{
                    name:{
                        type:"string"
                    }
                }
            }
        }
    };

    const expectedDocument = {
        root:{
            nestedOne:{
                nestedTwo:{
                    name:"fred"
                }
            }
        }
    };

    it('should create nodes of any depth', function() {

        var storedDocument = store("root/nestedOne/nestedTwo",{name:"fred"},schema, {});
        expect(storedDocument).to.deep.equal(expectedDocument);
    });

    it('should navigate nodes of any depth and replace existing node', function() {
        const existingDocument = {
            root:{
                nestedOne:{
                    nestedTwo:{
                        name:"mary"
                    }
                }
            }
        };

        var storedDocument = store("root/nestedOne/nestedTwo",{name:"fred"},schema, existingDocument);
        expect(storedDocument).to.deep.equal(expectedDocument);
    });

    it('should navigate nodes of any depth and create existing node', function() {
        const existingDocument = {
            root:{
                nestedOne:{
                }
            }
        };

        var storedDocument = store("root/nestedOne/nestedTwo",{name:"fred"},schema, existingDocument);
        expect(storedDocument).to.deep.equal(expectedDocument);
    });

    it('should reject paths that dont match schema', function() {
        var storedDocument = store("root/nestedOne/nestedFive/nestedSix",{name:"fred"},schema, {});
        expect(storedDocument).to.equal("Invalid path 'root/nestedOne/nestedFive/nestedSix' at 'root/nestedOne/nestedFive'");
    });
});
