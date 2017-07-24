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

const schemaNodeWithoutArrayIndex = (schema,nodeName) => {
    return schema[nodeNameWithoutArrayIndex(nodeName)];
};

const documentNodeUsingArrayIndex = (document,nodeName) => {
    return document[nodeNameWithoutArrayIndex(nodeName)][arrayIndexInNodeName(nodeName)];
};
const documentNodeWithoutArrayIndex = (document,nodeName) => {
    return document[nodeNameWithoutArrayIndex(nodeName)];
};

function finalAssignment(document, currentNodeName, currentSchemaNode, postedDocFragment, rootData) {
    let currentNode = documentNodeWithoutArrayIndex(document, currentNodeName);
    if (currentSchemaNode.type === 'array') {
        if (currentNode) {
            let arrayIndex = arrayIndexInNodeName(currentNodeName);
            if (arrayIndex) {
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
    return rootData.document;
}

function invalidPath(rootData, newCurrentPath) {
    let errorMessage = "Invalid path '" + rootData.pathIntoDocument + "' at '" + newCurrentPath + "'";
    console.log("Erroring, path = " + newCurrentPath + ", and error is " + errorMessage);
    return errorMessage;
}

function getOrCreateDocumentNode(document, currentNodeName, currentSchemaNode) {
    let currentNodeOrArray = documentNodeWithoutArrayIndex(document, currentNodeName);
    if (!currentNodeOrArray) {
        if(currentSchemaNode.type === 'array') {
            document[currentNodeName] = [];
            currentNodeOrArray = {};
            document[currentNodeName].push(currentNodeOrArray)
        } else {
            document[currentNodeName] = {};
            currentNodeOrArray = document[currentNodeName];
        }
    } else if (currentSchemaNode.type === 'array') {
        const arrayIndex = arrayIndexInNodeName(currentNodeName);
        if(arrayIndex) {
            currentNodeOrArray = documentNodeUsingArrayIndex(document, currentNodeName);
        } else {
            currentNodeOrArray = {};
            document[currentNodeName].push(currentNodeOrArray)
        }
    }
    return currentNodeOrArray;
}

const recursiveStore = (rootData, currentPath, currentNodeName, remainingNodeNames, postedDocFragment, schema, document) => {
    const newCurrentPath = advancePath(currentPath, currentNodeName);
    const currentSchemaNode = schemaNodeWithoutArrayIndex(schema, currentNodeName);
    if (!currentSchemaNode) {
        return invalidPath(rootData, newCurrentPath);
    }
    if (remainingNodeNames.length === 0) {
        console.log("Terminating, path = " + newCurrentPath + ", and document is " + JSON.stringify(document));
        return finalAssignment(document, currentNodeName, currentSchemaNode, postedDocFragment, rootData);
    }
    const documentNode = getOrCreateDocumentNode(document, currentNodeName, currentSchemaNode);
    const nextNodeName = _.first(remainingNodeNames);
    const newRemainingNodeNames = _.rest(remainingNodeNames);
    console.log("Recursing, path = " + newCurrentPath + ",  next node = "  +nextNodeName+ ", remaining nodes = " + newRemainingNodeNames + ", schema is " + JSON.stringify(currentSchemaNode) + ", and document is " + JSON.stringify(documentNode));
    return recursiveStore(rootData, newCurrentPath, nextNodeName, newRemainingNodeNames, postedDocFragment, currentSchemaNode, documentNode);
};

exports.store = (pathIntoDocument, postedDocFragment, schema, document) => {
    const pathParts = pathIntoDocument.split("/");
    const rootData = {
        schema: schema, document: document, pathIntoDocument: pathIntoDocument
    };
    return recursiveStore(rootData, "", _.first(pathParts), _.rest(pathParts), postedDocFragment, schema, document);
};