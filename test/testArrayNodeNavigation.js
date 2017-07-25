"use strict";
const expect = require("chai").expect;
const store = require("../lib/schemaStore.js").store;


describe('array based storage against schema', function () {

    const idGenerator = {
        generateId : () => {
            return "cannedId";
        }
    };

    it('should enforce types against array elements', function () {
        const schema = {
            types: {
                name: {
                    fields: ["firstName", "lastName"],
                    firstName: {type: "string"},
                    lastName: {type: "string"}
                },
                address: {
                    fields: ["postcode"],
                    postcode: {type: "string"}
                }
            },
            root: {
                nestedOne: {
                    nestedTwo: {
                        type: "array",
                        allowedTypes: ["name", "address"]
                    }
                }
            }
        };

        let originalDocument = {};
        store("root/nestedOne/nestedTwo", {address: {postcode: "W1 68U"}}, schema, originalDocument, idGenerator);
        expect(originalDocument).to.deep.equal({
            root: {
                nestedOne: {
                    nestedTwo: [
                        {
                            id:"cannedId",
                            type:"address",
                            uri:"root/nestedOne/nestedTwo/cannedId",
                            address: {postcode: "W1 68U"}
                        }
                    ]
                }
            }
        });

        originalDocument = {};
        store("root/nestedOne/nestedTwo", {name: {firstName: "Donald", lastName:"Duck"}}, schema, originalDocument, idGenerator);
        expect(originalDocument).to.deep.equal({
            root: {
                nestedOne: {
                    nestedTwo: [
                        {
                            id:"cannedId",
                            type:"name",
                            uri:"root/nestedOne/nestedTwo/cannedId",
                            name: {firstName: "Donald", lastName:"Duck"}
                        }
                    ]
                }
            }
        });

        const errorMessage = store("root/nestedOne/nestedTwo", {alienNode: {age: 12}}, schema, {}, idGenerator);
        expect(errorMessage).to.equal("Invalid array type at path 'root/nestedOne/nestedTwo'");
    });

    it('should create nodes of any depth', function () {
        const schema = {
            types: {
                name: {
                    fields: ["name"],
                    name: {type: "string"}
                }
            },
            root: {
                nestedOne: {
                    nestedTwo: {
                        type: "array",
                        allowedTypes: ["name"]
                    }
                }
            }
        };

        const expectedDocument = {
            root: {
                nestedOne: {
                    nestedTwo: [
                        {
                            "id": "cannedId",
                            "name": "fred",
                            "type": "name",
                            "uri": "root/nestedOne/nestedTwo/cannedId"
                        },
                        {
                            "id": "cannedId",
                            "name": "mary",
                            "type": "name",
                            "uri": "root/nestedOne/nestedTwo/cannedId"
                        }
                    ]
                }
            }
        };

        let initialStore = store("root/nestedOne/nestedTwo", {name: "fred"}, schema, {},idGenerator);
        const storedDocument = store("root/nestedOne/nestedTwo", {name: "mary"}, schema, initialStore, idGenerator);
        expect(storedDocument).to.deep.equal(expectedDocument);
    });

    it('should allow setting of individual array elements', function () {
        const schema = {
            types: {
                name: {
                    fields: ["name"],
                    name: {type: "string"}
                }
            },
            root: {
                nestedOne: {
                    nestedTwo: {
                        type: "array",
                        allowedTypes: ["name"]
                    }
                }
            }
        };

        const existingDocument = {
            root: {
                nestedOne: {
                    nestedTwo: [
                        {
                            "id": "id1",
                            "name": "fred",
                            "type": "name",
                            "uri": "root/nestedOne/nestedTwo/id1"
                        },
                        {
                            "id": "id2",
                            "name": "barney",
                            "type": "name",
                            "uri": "root/nestedOne/nestedTwo/id2"
                        },
                        {
                            "id": "id3",
                            "name": "breda",
                            "type": "name",
                            "uri": "root/nestedOne/nestedTwo/id3"
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
                            "id": "id1",
                            "name": "fred",
                            "type": "name",
                            "uri": "root/nestedOne/nestedTwo/id1"
                        },
                        {
                            "id": "id2",
                            "name": "mary",
                            "type": "name",
                            "uri": "root/nestedOne/nestedTwo/id2"
                        },
                        {
                            "id": "id3",
                            "name": "breda",
                            "type": "name",
                            "uri": "root/nestedOne/nestedTwo/id3"
                        }
                    ]
                }
            }
        };

        const storedDocument = store("root/nestedOne/nestedTwo/id2", {name: "mary"}, schema, existingDocument,idGenerator);
        expect(storedDocument).to.deep.equal(expectedDocument);
    });

    it('should allow nested array indexing through existing structure', function () {

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

        const storedDocument = store("root/nestedOne/nestedTwo[0]/nestedThreePointTwo", {name: "mary"}, schema, existingDocument,idGenerator);
        expect(storedDocument).to.deep.equal(expectedDocument);
    });

    it('should create necessary nodes to allow nested array indexing', function () {

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
                nestedOne: {}
            }
        };

        const expectedDocument = {
            root: {
                nestedOne: {
                    nestedTwo: [
                        {
                            nestedThreePointTwo: {name: "mary"}
                        },
                        {
                            nestedThreePointOne: {name: "fred"}
                        }
                    ]
                }
            }
        };

        const intermediateDocument = store("root/nestedOne/nestedTwo/nestedThreePointTwo", {name: "mary"}, schema, existingDocument,idGenerator);
        const storedDocument = store("root/nestedOne/nestedTwo/nestedThreePointOne", {name: "fred"}, schema, intermediateDocument,idGenerator);
        expect(storedDocument).to.deep.equal(expectedDocument);
    });

    it('should return invalid path message for nodes after array nodes', function () {

        const schema = {
            root: {
                nestedOne: {
                    nestedTwo: {
                        type: "array",
                        nestedThree: {}
                    }
                }
            }
        };

        const storedDocument = store("root/nestedOne/nestedTwo/invalidPath/more", {name: "fred"}, schema, {},idGenerator);
        expect(storedDocument).to.equal("Invalid path 'root/nestedOne/nestedTwo/invalidPath/more' at 'root/nestedOne/nestedTwo/invalidPath'");
    });
});
