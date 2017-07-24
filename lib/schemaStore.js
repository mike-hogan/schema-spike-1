"use strict";

const _ = require("underscore");

const advancePath = (currentPath, currentNodeName) => {
    return currentPath === "" ? currentNodeName : currentPath + "/" + currentNodeName;
};

const arrayIndexInNodeName = (nodeName) => {
    let secondPart = nodeName.split("[")[1];
    if(!secondPart) {
        return undefined;
    }
    return secondPart.replace("]","");
};

const nodeNameWithoutArrayIndex = (nodeName) => {
    return nodeName.split("[")[0]
};

const schemaNode = (schema,nodeName) => {
    return schema[nodeNameWithoutArrayIndex(nodeName)];
};

const documentNode = (document,nodeName) => {
    return document[nodeNameWithoutArrayIndex(nodeName)];
};

const recursiveStore = (rootData, currentPath, currentNodeName, remainingNodeNames, postedDocFragment, schema, document) => {
    const newCurrentPath = advancePath(currentPath, currentNodeName);
    const currentSchemaNode = schemaNode(schema, currentNodeName);
    if (!currentSchemaNode) {
        let errorMessage = "Invalid path '" + rootData.pathIntoDocument + "' at '" + newCurrentPath + "'";
        console.log("Erroring, path = " + newCurrentPath + ", and error is " + errorMessage);
        return errorMessage;
    }
    let currentNode = documentNode(document, currentNodeName);
    if (remainingNodeNames.length === 0) {
        if(currentSchemaNode.type === 'array') {
            if(currentNode) {
                let arrayIndex = arrayIndexInNodeName(currentNodeName);
                if(arrayIndex) {
                    currentNode[arrayIndex] = postedDocFragment;
                } else {
                    currentNode.push(postedDocFragment);
                }
            } else {
                document[currentNodeName] = [];
                document[currentNodeName].push(postedDocFragment);
            }
        } else {
            document[currentNodeName] = postedDocFragment;
        }
        console.log("Terminating, path = " + newCurrentPath + ", and document is " + JSON.stringify(document));
        return rootData.document;
    }
    if (!currentNode) {
        document[currentNodeName] = {};
        currentNode = document[currentNodeName];
    }
    const nextNodeName = _.first(remainingNodeNames);
    const newRemainingNodeNames = _.rest(remainingNodeNames);
    console.log("Recursing, path = " + newCurrentPath + ", remaining nodes = " + newRemainingNodeNames + ", schema is " + JSON.stringify(currentSchemaNode) + ", and document is " + JSON.stringify(currentNode));
    return recursiveStore(rootData, newCurrentPath, nextNodeName, newRemainingNodeNames, postedDocFragment, currentSchemaNode, currentNode);
};

exports.store = (pathIntoDocument, postedDocFragment, schema, document) => {
    const pathParts = pathIntoDocument.split("/");
    const rootData = {
        schema: schema, document: document, pathIntoDocument: pathIntoDocument
    };
    return recursiveStore(rootData, "", _.first(pathParts), _.rest(pathParts), postedDocFragment, schema, document);
};