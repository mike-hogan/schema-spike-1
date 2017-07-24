"use strict";

const _ = require("underscore");

const recursiveStore = (nodeName, remainingNodeNames, postedDocFragment, schema, document) => {
    console.log("nodeName = " + nodeName);
    if(remainingNodeNames.length === 0) {
        document[nodeName] = postedDocFragment;
        return;
    }
    var currentNode = document[nodeName];
    if(!currentNode) {
        document[nodeName] = {};
        currentNode = document[nodeName];
    }
    return recursiveStore(_.first(remainingNodeNames), _.rest(remainingNodeNames), postedDocFragment, schema, document[nodeName]);
};

exports.store = (pathIntoDocument, postedDocFragment,schema, document) => {
    const pathParts = pathIntoDocument.split("/");
    recursiveStore(_.first(pathParts), _.rest(pathParts), postedDocFragment, schema, document);
    return document;
};