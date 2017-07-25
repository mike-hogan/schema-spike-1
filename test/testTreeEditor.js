"use strict";
const expect = require("chai").expect;
const TreeEditor = require("../lib/treeEditor").TreeEditor;

function StubIdGenerator (cannedId) {
    this.cannedId = cannedId;
}

StubIdGenerator.prototype.generateId = function() {
    return this.cannedId;
};


describe('TreeEditor', function () {
    const idGenerator = new StubIdGenerator("id-1");

    const mortgageApplicationSchema = {
        types: {
            property: {
                fields: ["name", "value"],
                name: {type: "string"},
                value: {type: "number"}
            },
            shares: {
                fields: ["ticker", "numberOfShares", "value"],
                ticker: {type: "string"},
                numberOfShares: {type: "number"},
                value: {type: "decimal"}
            },
            cash: {
                fields: ["currency", "value"],
                currency: {type: "string"},
                value: {type: "number"}
            },
        },
        applicant: {
            personalDetails: {
                fields: ["firstName", "lastName"],
                firstName: {
                    type: "string"
                },
                lastName: {
                    type: "string"
                }
            },
            address: {
                fields: ["postcode", "houseNumber"],
                postcode: {
                    type: "string"
                },
                houseNumber: {
                    type: "number"
                }
            }
        },
        collateral: {
            type: "array",
            allowedTypes: ["property", "shares", "cash"]
        }
    };

    it('should follow path through object nodes of existing document', function () {
        const mortgageApplication = {
            applicant: {
                personalDetails: {
                    firstName: "Donald", lastName: "Duck"
                }
            }
        };
        new TreeEditor(mortgageApplicationSchema, idGenerator).setExistingNode(mortgageApplication,"/applicant/personalDetails", {
            firstName: "Charlie", lastName: "Chaplin"
        });
        expect(mortgageApplication).to.deep.equal({
            applicant: {
                personalDetails: {
                    firstName: "Charlie", lastName: "Chaplin"
                }
            }
        });
    });

    it('should support removal of existing nodes', function () {
        const mortgageApplication = {
            applicant: {
                personalDetails: {
                    firstName: "Donald", lastName: "Duck"
                }
            }
        };
        new TreeEditor(mortgageApplicationSchema, idGenerator).removeExistingNode(mortgageApplication,"/applicant/personalDetails");
        expect(mortgageApplication).to.deep.equal({
            applicant: {}
        });
    });

    it('should create path of object nodes in empty document', function () {
        const mortgageApplication = {};
        new TreeEditor(mortgageApplicationSchema, idGenerator).createNode(mortgageApplication,"/applicant/personalDetails", {
            firstName: "Charlie", lastName: "Chaplin"
        });
        expect(mortgageApplication).to.deep.equal({
            applicant: {
                personalDetails: {
                    firstName: "Charlie", lastName: "Chaplin"
                }
            }
        });
    });

    it('should follow path through array nodes of existing document', function () {
        const mortgageApplication = {
            collateral: [
                {type:"cash",id:"id-1",uri:"/collateral/id-1", cash:{currency:"GBP", value:1000}},
                {type:"shares",id:"id-22",uri:"/collateral/id-22", shares:{ticker:"TSLA", numberOfShares:300,value:332.98}},
                {type:"cash",id:"id-2",uri:"/collateral/id-2", cash:{currency:"USD", value:1400}}
            ]
        };
        new TreeEditor(mortgageApplicationSchema, idGenerator).setExistingNode(mortgageApplication,"/collateral/id-22", {cash:{currency:"EUR", value:999}});
        expect(mortgageApplication).to.deep.equal({
                collateral: [
                    {type:"cash",id:"id-1",uri:"/collateral/id-1", cash:{currency:"GBP", value:1000}},
                    {type:"cash",id:"id-22",uri:"/collateral/id-22", cash:{currency:"EUR", value:999}},
                    {type:"cash",id:"id-2",uri:"/collateral/id-2", cash:{currency:"USD", value:1400}}
                ]
            });
    });

    it('should create path through array nodes of empty document', function () {
        const mortgageApplication = {};
        new TreeEditor(mortgageApplicationSchema, idGenerator).createNode(mortgageApplication,"/collateral", {cash:{currency:"EUR", value:999}});
        expect(mortgageApplication).to.deep.equal({
            collateral: [
                {type:"cash",id:"id-1",uri:"/collateral/id-1", cash:{currency:"EUR", value:999}},
            ]
        });
    });

    it('should delete array items of existing document', function () {
        const mortgageApplication = {
            collateral: [
                {type:"cash",id:"id-1",uri:"/collateral/id-1", cash:{currency:"GBP", value:1000}},
                {type:"shares",id:"id-22",uri:"/collateral/id-22", shares:{ticker:"TSLA", numberOfShares:300,value:332.98}},
                {type:"cash",id:"id-2",uri:"/collateral/id-2", cash:{currency:"USD", value:1400}}
            ]
        };
        new TreeEditor(mortgageApplicationSchema, idGenerator).removeExistingNode(mortgageApplication,"/collateral/id-22");
        expect(mortgageApplication).to.deep.equal({
            collateral: [
                {type:"cash",id:"id-1",uri:"/collateral/id-1", cash:{currency:"GBP", value:1000}},
                {type:"cash",id:"id-2",uri:"/collateral/id-2", cash:{currency:"USD", value:1400}}
            ]
        });
    });


    it('should enforce allowed array types when creating array nodes', function () {
        const mortgageApplication = {};
        try {
            new TreeEditor(mortgageApplicationSchema, idGenerator).createNode(mortgageApplication,"/collateral", {
                unknownCollateralType: {
                    currency: "EUR",
                    value: 999
                }
            });
            expect.fail("should have gotten an exception");
        } catch (e) {
            expect(e.message).to.equal("Attempting to set invalid array type at '/collateral'")
        }
    });
});
