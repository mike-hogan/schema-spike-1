"use strict";

const _ = require("underscore");

function TreeEditor (schema, idGenerator) {
    this.schema = schema;
    this.idGenerator = idGenerator;
}

function ExistingArrayNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements) {
    this.currentNodeName = currentNodeName;
    this.currentSchemaNode = currentSchemaNode;
    this.arrayItemId = _.first(nextPathElements);
    this.nextPathElements = _.rest(nextPathElements);
}

const _findArrayType = function(arraySchemaNode, newNode) {
    return _.find(arraySchemaNode.allowedTypes, (t) => {return newNode.hasOwnProperty(t)});
};

const _nextSetExistingNode = function(nextPathElements, currentSchemaNode, document, currentNodeName, newNode) {
    const nextNodeName = _.first(nextPathElements);
    const nextSchemaNode = currentSchemaNode[nextNodeName];
    const nodeAccessor = _existingNodeAccessor(nextNodeName, nextSchemaNode, _.rest(nextPathElements));
    nodeAccessor.setExistingNode(document[currentNodeName], newNode);
};

ExistingArrayNodeAccessor.prototype.setExistingNode = function(document, newNode) {
    if(this.nextPathElements.length === 0) {
        const array = document[this.currentNodeName];
        const existingArrayItem = _.find(array, (i) => {return i.id === this.arrayItemId});
        const indexOfExistingArrayItem = array.indexOf(existingArrayItem);
        const newArrayItemType = _findArrayType(this.currentSchemaNode, newNode);
        array[indexOfExistingArrayItem] = {id:existingArrayItem.id, uri:existingArrayItem.uri, type:newArrayItemType};
        array[indexOfExistingArrayItem][newArrayItemType] = newNode[newArrayItemType];
    } else {
        throw new Error("untested");
    }
};

function ExistingObjectNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements) {
    this.currentNodeName = currentNodeName;
    this.currentSchemaNode = currentSchemaNode;
    this.nextPathElements = nextPathElements;
}

ExistingObjectNodeAccessor.prototype.setExistingNode = function(document, newNode) {
    if(this.nextPathElements.length === 0) {
        document[this.currentNodeName] = newNode;
    } else {
        _nextSetExistingNode(this.nextPathElements, this.currentSchemaNode, document, this.currentNodeName, newNode);
    }
};

function CreateObjectNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements) {
    this.currentNodeName = currentNodeName;
    this.currentSchemaNode = currentSchemaNode;
    this.nextPathElements = nextPathElements;
}

CreateObjectNodeAccessor.prototype.createNode = function(document, newNode) {
    if(this.nextPathElements.length === 0) {
        document[this.currentNodeName] = newNode;
    } else {
        document[this.currentNodeName] = {};
        const nextNodeName = _.first(this.nextPathElements);
        const nextSchemaNode = this.currentSchemaNode[nextNodeName];
        const nodeAccessor = _createNodeAccessor(nextNodeName, nextSchemaNode, _.rest(this.nextPathElements));
        nodeAccessor.createNode(document[this.currentNodeName], newNode);
    }
};

function CreateArrayNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements, idGenerator, pathSoFar) {
    this.currentNodeName = currentNodeName;
    this.currentSchemaNode = currentSchemaNode;
    this.arrayItemId = _.first(nextPathElements);
    this.nextPathElements = _.rest(nextPathElements);
    this.idGenerator = idGenerator;
    this.pathSoFar = pathSoFar;
}

CreateArrayNodeAccessor.prototype.createNode = function(document, newNode) {
    if(this.nextPathElements.length === 0) {
        let array = document[this.currentNodeName];
        if(!array) {
            document[this.currentNodeName] = [];
            array = document[this.currentNodeName]
        }
        const newArrayItemType = _findArrayType(this.currentSchemaNode, newNode);
        if(!newArrayItemType) {
            throw new Error("Attempting to set invalid array type at '/" + this.pathSoFar + "'");
        }
        const id = this.idGenerator.generateId();
        const newItem = {id: id, type:newArrayItemType, uri:"/" + this.pathSoFar + "/" +id};
        newItem[newArrayItemType] = newNode[newArrayItemType];
        array.push(newItem);
    } else {
        throw new Error("to be tested");
    }
};

const _existingNodeAccessor = function(currentNodeName,currentSchemaNode, nextPathElements) {
    if(currentSchemaNode.type === 'array') {
        return new ExistingArrayNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements);
    } else {
        return new ExistingObjectNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements);
    }
};

const _createNodeAccessor = function(currentNodeName,currentSchemaNode, nextPathElements, idGenerator, pathSoFar) {
    if(currentSchemaNode.type === 'array') {
        return new CreateArrayNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements, idGenerator, pathSoFar);
    } else {
        return new CreateObjectNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements, idGenerator, pathSoFar);
    }
};

TreeEditor.prototype.setExistingNode = function(document,path, newNode) {
    path = path.replace(/^\//,"");
    const pathParts = path.split("/");
    const rootNodeName = _.first(pathParts);
    const rootSchemaNode = this.schema[rootNodeName];
    const nodeAccessor = _existingNodeAccessor(rootNodeName, rootSchemaNode, _.rest(pathParts));
    nodeAccessor.setExistingNode(document, newNode);
};

TreeEditor.prototype.removeExistingNode = function(document,path) {
    return this.color + ' ' + this.type + ' apple';
};

TreeEditor.prototype.createNode = function(document,path, newNode) {
    path = path.replace(/^\//,"");
    const pathParts = path.split("/");
    const rootNodeName = _.first(pathParts);
    const rootSchemaNode = this.schema[rootNodeName];
    const nodeAccessor = _createNodeAccessor(rootNodeName, rootSchemaNode, _.rest(pathParts), this.idGenerator, rootNodeName);
    nodeAccessor.createNode(document, newNode);
};

exports.TreeEditor = TreeEditor;