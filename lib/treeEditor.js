"use strict";

const _ = require("underscore");

function TreeEditor (schema, idGenerator) {
    this.schema = schema;
    this.idGenerator = idGenerator;
}

function ExistingArrayNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements, entireSchema) {
    this.currentNodeName = currentNodeName;
    this.currentSchemaNode = currentSchemaNode;
    this.arrayItemId = _.first(nextPathElements);
    this.nextPathElements = _.rest(nextPathElements);
    this.entireSchema = entireSchema;
}

const _findArrayType = function(arraySchemaNode, newNode) {
    return _.find(arraySchemaNode.allowedTypes, (t) => {return newNode.hasOwnProperty(t)});
};

const _nextSetExistingNode = function(nextPathElements, currentSchemaNode, document, currentNodeName, newNode, entireSchema) {
    const nextNodeName = _.first(nextPathElements);
    const nextSchemaNode = currentSchemaNode[nextNodeName];
    const nodeAccessor = _existingNodeAccessor(nextNodeName, nextSchemaNode, _.rest(nextPathElements), entireSchema);
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

ExistingArrayNodeAccessor.prototype.removeExistingNode = function(document) {
    if(this.nextPathElements.length === 0) {
        const array = document[this.currentNodeName];
        const existingArrayItem = _.find(array, (i) => {return i.id === this.arrayItemId});
        const indexOfExistingArrayItem = array.indexOf(existingArrayItem);
        array.splice(indexOfExistingArrayItem,1);
    } else {
        const array = document[this.currentNodeName];
        const existingArrayItem = _.find(array, (i) => {return i.id === this.arrayItemId});
        const nextNodeName = _.first(this.nextPathElements);
        const nextSchemaNode = this.entireSchema.types[existingArrayItem.type];
        const nodeAccessor = _existingNodeAccessor(nextNodeName, nextSchemaNode, _.rest(this.nextPathElements),this.entireSchema);
        nodeAccessor.removeExistingNode(existingArrayItem);
    }
};

function ExistingObjectNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements, entireSchema) {
    this.currentNodeName = currentNodeName;
    this.currentSchemaNode = currentSchemaNode;
    this.nextPathElements = nextPathElements;
    this.entireSchema = entireSchema;
}

ExistingObjectNodeAccessor.prototype.setExistingNode = function(document, newNode) {
    if(this.nextPathElements.length === 0) {
        document[this.currentNodeName] = newNode;
    } else {
        _nextSetExistingNode(this.nextPathElements, this.currentSchemaNode, document, this.currentNodeName, newNode, this.entireSchema);
    }
};

ExistingObjectNodeAccessor.prototype.removeExistingNode = function(document) {
    if(this.nextPathElements.length === 0) {
        delete document[this.currentNodeName];
    } else {
        const nextNodeName = _.first(this.nextPathElements);
        const nextSchemaNode = this.currentSchemaNode[nextNodeName];
        const nodeAccessor = _existingNodeAccessor(nextNodeName, nextSchemaNode, _.rest(this.nextPathElements),this.entireSchema);
        nodeAccessor.removeExistingNode(document[this.currentNodeName]);
    }
};

function CreateObjectNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements, idGenerator, pathSoFar, entireSchema) {
    this.currentNodeName = currentNodeName;
    this.currentSchemaNode = currentSchemaNode;
    this.nextPathElements = nextPathElements;
    this.idGenerator =idGenerator;
    this.pathSoFar =pathSoFar;
    this.entireSchema = entireSchema;
}

CreateObjectNodeAccessor.prototype.createNode = function(document, newNode) {
    if(this.nextPathElements.length === 0) {
        document[this.currentNodeName] = newNode;
        return this.pathSoFar;
    } else {
        if(!document[this.currentNodeName]) {
            document[this.currentNodeName] = {};
        }
        const nextNodeName = _.first(this.nextPathElements);
        const nextSchemaNode = this.currentSchemaNode[nextNodeName];
        const nodeAccessor = _createNodeAccessor(nextNodeName, nextSchemaNode, _.rest(this.nextPathElements), this.idGenerator, this.pathSoFar + "/" + nextNodeName, this.entireSchema);
        return nodeAccessor.createNode(document[this.currentNodeName], newNode);
    }
};

function CreateArrayNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements, idGenerator, pathSoFar, entireSchema) {
    this.currentNodeName = currentNodeName;
    this.currentSchemaNode = currentSchemaNode;
    this.arrayItemId = _.first(nextPathElements);
    this.nextPathElements = _.rest(nextPathElements);
    this.idGenerator = idGenerator;
    this.pathSoFar = pathSoFar;
    this.entireSchema = entireSchema;
}

CreateArrayNodeAccessor.prototype.createNode = function(document, newNode) {
    let array = document[this.currentNodeName];
    if(!array) {
        document[this.currentNodeName] = [];
        array = document[this.currentNodeName]
    }
    if(this.nextPathElements.length === 0) {
        const newArrayItemType = this.arrayItemId;
        if(!newArrayItemType) {
            throw new Error("Attempting to set invalid array type at '" + this.pathSoFar + "'");
        }
        const id = this.idGenerator.generateId();
        newNode.id = id;
        newNode.type = newArrayItemType;
        newNode.uri = this.pathSoFar + "/" +id;
        array.push(newNode);
        return newNode.uri;
    } else {

        let arrayItem = _.find(array, (i) => {return i.id === this.arrayItemId});
        if(!arrayItem) {
            let id = this.idGenerator.generateId();
            arrayItem = {id: id, type:this.arrayItemId, uri:this.pathSoFar + "/" + id};
            array.push(arrayItem);
        }
        const nextNodeName = _.first(this.nextPathElements);
        const nextSchemaNode = this.entireSchema.types[arrayItem.type];
        const nodeAccessor = _createNodeAccessor(nextNodeName, nextSchemaNode, _.rest(this.nextPathElements),this.idGenerator, arrayItem.uri + "/" + nextNodeName,this.entireSchema);
        return nodeAccessor.createNode(arrayItem, newNode);
    }
};

const _existingNodeAccessor = function(currentNodeName,currentSchemaNode, nextPathElements, entireSchema) {
    if(currentSchemaNode.type === 'array') {
        return new ExistingArrayNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements,entireSchema);
    } else {
        return new ExistingObjectNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements, entireSchema);
    }
};

const _createNodeAccessor = function(currentNodeName,currentSchemaNode, nextPathElements, idGenerator, pathSoFar, entireSchema) {
    if(currentSchemaNode.type === 'array') {
        return new CreateArrayNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements, idGenerator, pathSoFar, entireSchema);
    } else {
        return new CreateObjectNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements, idGenerator, pathSoFar, entireSchema);
    }
};

const _createExistingNodeAccessor = function(path, schema, entireSchema) {
    path = path.replace(/^\//, "");
    const pathParts = path.split("/");
    const rootNodeName = _.first(pathParts);
    const rootSchemaNode = schema[rootNodeName];
    return _existingNodeAccessor(rootNodeName, rootSchemaNode, _.rest(pathParts),entireSchema);
}

TreeEditor.prototype.setExistingNode = function(document,path, newNode) {
    const nodeAccessor = _createExistingNodeAccessor(path, this.schema, this.schema);
    return nodeAccessor.setExistingNode(document, newNode);
};

TreeEditor.prototype.removeExistingNode = function(document,path) {
    const nodeAccessor = _createExistingNodeAccessor(path, this.schema,this.schema);
    nodeAccessor.removeExistingNode(document);
};

TreeEditor.prototype.createNode = function(document,path, newNode) {
    path = path.replace(/^\//,"");
    const pathParts = path.split("/");
    const rootNodeName = _.first(pathParts);
    const rootSchemaNode = this.schema[rootNodeName];
    const nodeAccessor = _createNodeAccessor(rootNodeName, rootSchemaNode, _.rest(pathParts), this.idGenerator, "/" + rootNodeName, this.schema);
    return nodeAccessor.createNode(document, newNode);
};

exports.TreeEditor = TreeEditor;