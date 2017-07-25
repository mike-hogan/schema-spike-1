function TreeEditor (schema) {
    this.schema = schema;
}

TreeEditor.prototype.setExistingNode = function(document,path, newNode) {
    return this.color + ' ' + this.type + ' apple';
};

TreeEditor.prototype.removeExistingNode = function(document,path) {
    return this.color + ' ' + this.type + ' apple';
};

TreeEditor.prototype.createNode = function(document,path, newNode) {
    return this.color + ' ' + this.type + ' apple';
};

exports.TreeEditor = TreeEditor;