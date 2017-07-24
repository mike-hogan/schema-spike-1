"use strict";

const _ = require("underscore");

const recursiveStore = (rootData, currentPath, currentNodeName, remainingNodeNames, postedDocFragment, schema, document) => {
    console.log("currentNodeName = " + currentNodeName);
    if(remainingNodeNames.length === 0) {
        document[currentNodeName] = postedDocFragment;
        return rootData.document;
    }
    const newCurrentPath = currentPath === "" ? currentNodeName : currentPath + "/" + currentNodeName;
    const currentSchemaNode = schema[currentNodeName];
    if(!currentSchemaNode) {
        return "Invalid path '"+rootData.pathIntoDocument+"' at '"+newCurrentPath+"'"
    }
    var currentNode = document[currentNodeName];
    if(!currentNode) {
        document[currentNodeName] = {};
        currentNode = document[currentNodeName];
    }
    var nextNodeName = _.first(remainingNodeNames);
    var newRemainingNodeNames = _.rest(remainingNodeNames);
    return recursiveStore(rootData, newCurrentPath, nextNodeName, newRemainingNodeNames, postedDocFragment, currentSchemaNode, document[currentNodeName]);
};

exports.store = (pathIntoDocument, postedDocFragment,schema, document) => {
    const pathParts = pathIntoDocument.split("/");
    var firstNodeName = _.first(pathParts);
    const rootData = {
        schema:schema, document:document, pathIntoDocument:pathIntoDocument
    };
    return recursiveStore(rootData,"",firstNodeName, _.rest(pathParts), postedDocFragment, schema, document);
};