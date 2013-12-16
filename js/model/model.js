var extend = require('node.extend');

var TYPE_ID = "ID",
    TYPE_INTEGER = "integer",
    TYPE_REFERENCE = "reference"
    TYPE_TEXT = "text"; // default type

var __modelTypes = {
    ID: TYPE_ID,
    INTEGER: TYPE_INTEGER,
    REFERENCE: TYPE_REFERENCE,
    TEXT: TYPE_TEXT
};

var modelDescription = require("./model.json"),
    __model = {};

// construct model from files
for(var entity in modelDescription) {
    var filename = "./mediation/" + modelDescription[entity];
    __model[entity] = require(filename);
    if (!__model[entity])
        throw new Error("Not found file:" + filename + "for entity:" + entity);
}

function getModelEntry(entityName) {
    return __model[entityName];
}

function mergeEntityWithParent(entity) {
    if (!entity.parent)
        return entity;
    var parentEntity = getModelEntry(entity.parent);
    var mergedParentEntity = mergeEntityWithParent(parentEntity);
    var extendedEntity = extend(true, {}, mergedParentEntity, entity);
    console.log("parentEntity=", parentEntity);
    console.log("mergedParentEntity=", mergedParentEntity);
    console.log("extendedEntity=", extendedEntity);
    return extendedEntity;
}

// link to models
(function prepareModel() {
    console.log("prepareModel")
    for(var entityName in __model) {
        var modelEntry = getModelEntry(entityName);
        modelEntry = mergeEntityWithParent(modelEntry);
        __model[entityName] = modelEntry;


        for (var field in modelEntry.fields) {
            // set default type if it is not defined
            modelEntry.fields[field].type = modelEntry.fields[field].type ? __modelTypes[modelEntry.fields[field].type] : undefined;
            modelEntry.fields[field].type = modelEntry.fields[field].type || __modelTypes.TEXT;
            modelEntry.fields[field].dataField = modelEntry.fields[field].dataField ? modelEntry.fields[field].dataField : field;

            if (modelEntry.fields[field].type === __modelTypes.REFERENCE) {
                modelEntry.fields[field].referenceFields = modelEntry.fields[field].referenceFields ? modelEntry.fields[field].referenceFields : "";
            }
        }
    }
}());

exports.model = __model;
exports.modelType = __modelTypes;
exports.getModelEntry = getModelEntry;