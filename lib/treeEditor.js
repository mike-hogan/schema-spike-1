const _ = require("underscore");

function TreeEditor (schema) {
    this.schema = schema;
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
        _nextSetExistingNode(this.nextPathElements, this.currentSchemaNode, document, this.currentNodeName, newNode);
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

const _existingNodeAccessor = function(currentNodeName,currentSchemaNode, nextPathElements) {
    if(currentSchemaNode.type === 'array') {
        return new ExistingArrayNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements);
    } else {
        return new ExistingObjectNodeAccessor(currentNodeName,currentSchemaNode,nextPathElements);
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
    return this.color + ' ' + this.type + ' apple';
};

exports.TreeEditor = TreeEditor;