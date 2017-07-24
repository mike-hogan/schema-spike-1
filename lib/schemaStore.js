"use strict";

const _ = require("underscore");

const advancePath = (currentPath, currentNodeName) => {
    return currentPath === "" ? currentNodeName : currentPath + "/" + currentNodeName;
};

const recursiveStore = (rootData, currentPath, currentNodeName, remainingNodeNames, postedDocFragment, schema, document) => {
    const newCurrentPath = advancePath(currentPath, currentNodeName);
    if(remainingNodeNames.length === 0) {
        document[currentNodeName] = postedDocFragment;
        console.log("Terminating, path = " + newCurrentPath + ", and document is " + JSON.stringify(document));
        return rootData.document;
    }
    const currentSchemaNode = schema[currentNodeName];
    if(!currentSchemaNode) {
        let errorMessage = "Invalid path '"+rootData.pathIntoDocument+"' at '"+newCurrentPath+"'";
        console.log("Erroring, path = " + newCurrentPath + ", and error is " + errorMessage);
        return errorMessage;
    }
    let currentNode = document[currentNodeName];
    if(!currentNode) {
        document[currentNodeName] = {};
        currentNode = document[currentNodeName];
    }
    const nextNodeName = _.first(remainingNodeNames);
    const newRemainingNodeNames = _.rest(remainingNodeNames);
    console.log("Recursing, path = " + newCurrentPath + ", schema is " + JSON.stringify(currentSchemaNode) + ", and document is " + JSON.stringify(currentNode));
    return recursiveStore(rootData, newCurrentPath, nextNodeName, newRemainingNodeNames, postedDocFragment, currentSchemaNode, currentNode);
};

exports.store = (pathIntoDocument, postedDocFragment,schema, document) => {
    const pathParts = pathIntoDocument.split("/");
    const rootData = {
        schema:schema, document:document, pathIntoDocument:pathIntoDocument
    };
    return recursiveStore(rootData,"",_.first(pathParts), _.rest(pathParts), postedDocFragment, schema, document);
};