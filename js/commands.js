var model = require("./model/model.js"),
    db = require("./db.js")

var modelType = model.modelType;

const ERROR_NO_SUCH_ENTITY = "1000";

function makeSelectPart(entityName, count) {
    var modelEntry = model.getModelEntry(entityName);
    console.log("Model entry for:", entityName, " = ", modelEntry);

    // Make SELECT
    var fields = [];
    var join, joins = {};

    for (var field in modelEntry.fields) {
        var col = modelEntry.fields[field];

        fields.push(modelEntry.table + "." + col.dataField + " AS " + entityName + "_" + field);
        if (col.type == modelType.REFERENCE) {
            var referenceEntity = model.getModelEntry(col.referenceEntityName);

            for(var i = 0; i < col.referenceFields.length; i++) {
                // Делаем список reference полей
                var refField = referenceEntity.table+"." + col.referenceFields[i] +
                    " AS " + field + "_" + col.referenceFields[i];
                fields.push(refField);
            }

            // делаем join
            //from command inner JOIN sport on command.sportId=sport.ID
            join = " INNER JOIN " + referenceEntity.table + " ON " + modelEntry.table + "." + col.dataField + "=" +
                referenceEntity.table + ".ID";
            joins[referenceEntity.table] = join;
        }
    }

    if (count)
        fields.unshift("count(" + modelEntry.table + ".ID) as c");

    var selectPart = "SELECT " + fields.join(",") + " FROM " + modelEntry.table;

    for(join in joins) {
        selectPart += " " + joins[join];
    }

    return selectPart;
}

function makeWherePart(entityName, queryParams) {
    var modelEntry = model.getModelEntry(entityName);
    console.log("Model entry for:", entityName, " = ", modelEntry);

    // Make WHERE
    var wherePart = [];

    for(var prop in queryParams) {
        var fieldDescr = modelEntry.fields[prop];
        if (!fieldDescr)
            continue;

        var cond = modelEntry.table + "." + fieldDescr.dataField;

        if (fieldDescr.type) {
            switch (fieldDescr.type) {
                case modelType.ID:
                case modelType.INTEGER:
                    cond += "=" + queryParams[prop];
                    break
                case modelType.REFERENCE:
                    cond += " IN (" + queryParams[prop] + ")";
                    break;
                default: cond +=  " LIKE '" + queryParams[prop] + "'"; break;
            }
        }
        wherePart.push(cond);
    }

    if (modelEntry.fields.discriminator && modelEntry.fields.discriminator.defaultValue) {
        var discr = modelEntry.table + ".discriminator='" + modelEntry.fields.discriminator.defaultValue + "'";
        wherePart.push(discr);
    }

    return wherePart.join(" AND ");
}

const DEFAULT_PAGE_NUM = 0;
const DEFAULT_PAGE_SIZE = 50;
function makeLimitPart(queryParams) {
    var s = "";
    console.log("makeLimitPart", queryParams);
    if (queryParams.page_num || queryParams.page_num) {
        var page_num = queryParams.page_num ? Number(queryParams.page_num) : DEFAULT_PAGE_NUM,
            rows_per_page = queryParams.rows_per_page ? Number(queryParams.rows_per_page) : DEFAULT_PAGE_SIZE;
        s = rows_per_page * page_num + "," + rows_per_page;
    }
    return s;
}

exports.getEntityElement = function getEntityElement(req, res, next) {
    var id = req.params.id;
    console.log("getEntityElement")

    function getList() {
        RfplTurnir.find({link: id}, function (err, rfplTurnir) {
            var data = {};
            if (err) {
                data.code = 1;
                data.data = "Error description: Error: getEntityElement";
                console.log(data.data);
            }
            else {
                console.log(rfplTurnir);
                data.code = 0;
                data.data = rfplTurnir;
            }
            req.data = data;
            return next();
        });
    }

    getDbConnection(getList);
};

function getEntityCount (req, res, next) {
    console.log("getEntityList:...");

    var entityName = req.params.entityName,
        modelEntry = model.getModelEntry(entityName),
        queryParams;

    // Check for exist entity
    if (!modelEntry) {
        var data = {};
        data.code = ERROR_NO_SUCH_ENTITY;
        data.message = "ERROR_NO_SUCH_ENTITY";
        req.data = data;
        return next();
    }



    queryParams = getQueryParams(req);



    var connection = db.getOpenDbConnection();
    var query = makeListQuery(entityName, queryParams, true);

    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        var data = {};
        data.code = 0;
        data.message = "";
        var count = rows.length ? rows[0].c.toString() : "0";

        data.rows = [{row: [count]}];
        req.data = data;
        console.log('list is: ', rows);
        return next();
    });

    connection.end();
}

function getQueryParams(req) {
    return req.method === "POST" ? req.body : req.query
}

function makeListQuery(entityName, queryParams, count) {
    var modelEntry = model.getModelEntry(entityName);
    console.log("Model entry for:", entityName, " = ", modelEntry);

    var query = makeSelectPart(entityName, count);

    // WHERE part
    var wherePart = makeWherePart(entityName, queryParams);
    if (wherePart !== "")
        query += " WHERE " + wherePart;

    // LIMIT part
    if (!count) {
        var limitPart = makeLimitPart(queryParams);
        if (limitPart.length > 0) {
            query += " LIMIT " + limitPart;
        }
    }
    else {
        query += " LIMIT 0,1";
    }


    console.log("List query:", query);
    return query;
}

function makeSimpleListQuery(entityName, queryParams) {
    var modelEntry = model.getModelEntry(entityName);
    console.log("Model entry for:", entityName, " = ", modelEntry);

    // Make SELECT
    var fields = queryParams.field.split(",");

    var query = "SELECT " + fields.join(",")+ " FROM " + modelEntry.table;

    // wherePart
    var wherePart = makeWherePart(entityName, queryParams);
    if (wherePart !== "")
        query += " WHERE " + wherePart;

    // LIMIT part
    var limitPart = makeLimitPart(queryParams);
    if (limitPart.length > 0) {
        query += " LIMIT " + limitPart;
    }

    console.log("Simple List query:", query);

    return query;
}

function makeUpdateQuery(entityName, queryParams) {
    var modelEntry = model.getModelEntry(entityName);
    console.log("makeUpdateQuery: Model entry for:", entityName, " = ", modelEntry);

    var query,
        setValues = [];

    //
    for (var queryParam in queryParams) {
        if (queryParam === "ID")
            continue;
        var s = modelEntry.table + "." + modelEntry.fields[queryParam].dataField + "=";
        switch(modelEntry.fields[queryParam].type) {
            case modelType.TEXT:
                s += "'" + queryParams[queryParam] + "'";
                break;
            default:
                s += queryParams[queryParam];
                break;
        }
        setValues.push(s);
    }

    //
    if (setValues.length === 0) {
        throw {
            err: "Empty update query"
        };
    }

    query = "UPDATE " + modelEntry.table + " SET " +
        setValues.join(",") +
        " WHERE " + modelEntry.table + ".ID=" + queryParams.ID;

    console.log("Update query:", query);

    return query;
}
function makeInsertQuery(entityName, queryParams) {
    console.log("makeInsertQuery: Model entry for:", entityName);
    var modelEntry = model.getModelEntry(entityName);
    console.log("makeInsertQuery: Model entry for:", entityName, " = ", modelEntry);

    if (modelEntry)

    var query,
        columns = [],
        values = [];

    //
    for (var queryParam in queryParams) {
        var col = modelEntry.fields[queryParam];

        columns.push(col.dataField);

        var value;
        switch(col.type) {
            case modelType.TEXT:
                value = "'" + queryParams[queryParam] + "'";
                break;
            default:
                value = queryParams[queryParam];
                break;
        }
        values.push(value);
    }

    // discriminator
    if (modelEntry.fields.discriminator && modelEntry.fields.discriminator.defaultValue) {
        columns.push("DISCRIMINATOR");
        values.push("'" + modelEntry.fields.discriminator.defaultValue + "'");
    }



    //
    if (values.length === 0)
        throw {
            err: "Empty update query"
        }
    query = "INSERT INTO " + modelEntry.table + " (" + columns.join(",") +
        ") VALUES (" + values.join(",") + ")";

    console.log("Insert query:", query);
    return query;
}
function makeDeleteQuery(entityName, queryParams) {
    var modelEntry = model.getModelEntry(entityName);
    console.log("makeDeleteQuery: Model entry for:", entityName, " = ", modelEntry);

    var query = "DELETE FROM " + modelEntry.table + " WHERE ID=" + queryParams.ID;

    console.log("DELETE query:", query);
    return query;
}

exports.User = {};
exports.User.login = function getEntityElement(req, res, next) {
    console.log("exports.User.login");
    var loginResult = {
        code: 0,
        message: "",
        rows: [
            {
                number: "0",
                ID: "23698",
                isAdmin: "1",
                login: "admin",
                providerId: "1000026",
                providerName: "Тестовые учетные записи",
                genre: "",
                group: "",
                settings: "",
                nextChangePwd: "11/10/2013 18:00:23",
                lastUpdate: "11/10/2013 21:35:07",
                errCount: "0",
                changePwd: "0",
                adminPasswordMask: "^.*(?=[0-9a-zA-Z]{12,40})(?=.*d)(?=.*[a-z])(?=.*[A-Z]).*$",
                userPasswordMask: "^.*(?=[0-9a-zA-Z]{8,40})(?=.*d)(?=.*[a-z])(?=.*[A-Z]).*$",
                settingsJSON: "",
                mrfName: "ct",
                accessGroups: [ ],
                roles: {
                    ID: "1000033",
                    name: "Администратор платформы",
                    externalId: "administrator",
                    passwordMask: "",
                    passwordHint: "",
                    roleSettings: []
                }
            }
        ]
    }
    req.data = loginResult;
    return next();
};

function getEntityList(req, res, next) {
    console.log("getEntityList:...");
    var entityName = req.params.entityName,
        modelEntry = model.getModelEntry(entityName),
        queryParams;

    // Check for exist entity
    if (!modelEntry) {
        var data = {};
        data.code = ERROR_NO_SUCH_ENTITY;
        data.message = "ERROR_NO_SUCH_ENTITY";
        req.data = data;
        return next();
    }

    queryParams = getQueryParams(req);

    var connection = db.getOpenDbConnection();
    var query = makeListQuery(entityName, queryParams);

    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        var data = {};
        data.code = 0;
        data.message = "";
        data.rows = rows;
        req.data = data;
        console.log('list is: ', rows);
        return next();
    });

    connection.end();
};
function getSimpleList(req, res, next) {
    console.log("getSimpleList:...");

    var entityName = req.params.entityName,
        modelEntry = model.getModelEntry(entityName),
        queryParams;

    // Check for exist entity
    if (!modelEntry) {
        var data = {};
        data.code = ERROR_NO_SUCH_ENTITY;
        data.message = "ERROR_NO_SUCH_ENTITY";
        req.data = data;
        return next();
    }

    queryParams = getQueryParams(req);

    var query = makeSimpleListQuery(entityName, queryParams);
    var connection = db.getOpenDbConnection();


    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        var data = {};
        data.code = 0;
        data.message = "";
        data.rows = rows;
        req.data = data;
        console.log('list is: ', rows);
        return next();
    });

    connection.end();
};

function updateItem(req, res, next) {
    console.log("updateItem:...");

    var entityName = req.params.entityName,
        modelEntry = model.getModelEntry(entityName),
        queryParams;

    // Check for exist entity
    if (!modelEntry) {
        var data = {};
        data.code = ERROR_NO_SUCH_ENTITY;
        data.message = "ERROR_NO_SUCH_ENTITY";
        req.data = data;
        return next();
    }

    queryParams = getQueryParams(req);

    if (!queryParams || !queryParams.ID) {
        throw {
            error: "ID field is absent"
        }
    }
    var query = makeUpdateQuery(entityName, queryParams);
    var connection = db.getOpenDbConnection();

    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;
        }

        var data = {};
        data.code = 0;
        data.message = "";
        data.rows = {
            ENTITY_NAME: entityName,
            IDS: queryParams.ID
        };
        req.data = data;
        console.log('list is: ', rows);
        return next();
    });

    connection.end();
}
function insertItem(req, res, next) {
    console.log("insertItem:...");

    var entityName = req.params.entityName,
        modelEntry = model.getModelEntry(entityName),
        queryParams;

    // Check for exist entity
    if (!modelEntry) {
        var data = {};
        data.code = ERROR_NO_SUCH_ENTITY;
        data.message = "ERROR_NO_SUCH_ENTITY";
        req.data = data;
        return next();
    }
    queryParams = getQueryParams(req);

    var query = makeInsertQuery(entityName, queryParams);
    var connection = db.getOpenDbConnection();

    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;
        }

        var data = {};
        data.code = 0;
        data.message = "";
        data.rows = [{
            ENTITY_NAME: entityName,
            IDS: '' + rows.insertId
        }];
        req.data = data;
        console.log('list is: ', rows);
        return next();
    });

    connection.end();
}

function deleteItem(req, res, next) {
    console.log("deleteItem:...");

    var entityName = req.params.entityName,
        queryParams;

    // Check for exist entity
    if (!modelEntry) {
        var data = {};
        data.code = ERROR_NO_SUCH_ENTITY;
        data.message = "ERROR_NO_SUCH_ENTITY";
        req.data = data;
        return next();
    }
    queryParams = getQueryParams(req);

    if (!queryParams || !queryParams.ID) {
        throw {
            error: "ID field is absent for delete"
        }
    }
    var query = makeDeleteQuery(entityName, queryParams);
    var connection = db.getOpenDbConnection();

    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;
        }

        var data = {};
        data.code = 0;
        data.message = "";
        data.rows = {
            ENTITY_NAME: entityName,
            IDS: queryParams.ID
        };
        req.data = data;
        console.log('list is: ', rows);
        return next();
    });

    connection.end();
}

// ListToList
function getListLinked(req, res, next) {
    console.log("getListLinked:...");

    var entityName = req.params.entityName,
        modelEntry = model.getModelEntry(entityName),
        queryParams, query, childEntity;

    // Check for exist entity
    if (!modelEntry) {
        var data = {};
        data.code = ERROR_NO_SUCH_ENTITY;
        data.message = "ERROR_NO_SUCH_ENTITY";
        req.data = data;
        return next();
    }
    queryParams = getQueryParams(req);

    query = makeSelectPart(queryParams.childName);

    childEntity = model.getModelEntry(queryParams.childName);

    console.log("isParent=", queryParams.isParent);
    if (queryParams.isParent==="true") {
        query += " WHERE " + childEntity.table + ".ID IN (select `childId` from object_link where discriminator='COMMANDINTURNIR' and parentId=" + queryParams.ID + ")";
    }
    else if (queryParams.isParent==="false") {
        query += " WHERE " + childEntity.table + ".ID IN (select `parentId` from object_link where discriminator='COMMANDINTURNIR' and childId=" + queryParams.ID + ")";
    }
    console.log("Linked list:", query);

    //query = makeInsertQuery(entityName, queryParams);
    var connection = db.getOpenDbConnection();

    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        var data = {};
        data.code = 0;
        data.message = "";
        data.rows = rows;
        req.data = data;
        console.log('list is: ', rows);
        return next();
    });

    connection.end();

}
function addLinked(req, res, next) {
    console.log("addLinked:...");

    var entityName = req.params.entityName,
        modelEntry = model.getModelEntry(entityName),
        queryParams, query;

    // Check for exist entity
    if (!modelEntry) {
        var data = {};
        data.code = ERROR_NO_SUCH_ENTITY;
        data.message = "ERROR_NO_SUCH_ENTITY";
        req.data = data;
        return next();
    }
    queryParams = getQueryParams(req);



    var connection = db.getOpenDbConnection();

    console.log("isParent=", queryParams.isParent);
    var children = queryParams.children.split(","),
        discriminator = "'" + modelEntry.fields.discriminator.defaultValue + "'",
        values = [];
    for(var i = 0; i < children.length; i++)
    {
        var a;
        if (queryParams.isParent==="true") {
            a = [queryParams.ID, children[i], discriminator];
        }
        else if (queryParams.isParent==="false") {
            a = [children[i], queryParams.ID, discriminator];
        }
        else {
            throw newError("addLinked:Unknown isParent=", queryParams.isParent);
        }
        values.push("(" + a.join(",") + ")")
    }

    query = "INSERT INTO " + modelEntry.table + "(parentId,childId,discriminator) VALUES " + values.join(",");

    console.log("add_linked SQL:", query);


    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        var data = {};
        data.code = 0;
        data.message = "";
        data.rows = [];
        req.data = data;
        console.log('list is: ', rows);
        return next();
    });

    connection.end();
}

function deleteLinked(req, res, next) {
    console.log("addLinked:...");

    var entityName = req.params.entityName,
        modelEntry = model.getModelEntry(entityName),
        queryParams, query;

    // Check for exist entity
    if (!modelEntry) {
        var data = {};
        data.code = ERROR_NO_SUCH_ENTITY;
        data.message = "ERROR_NO_SUCH_ENTITY";
        req.data = data;
        return next();
    }
    queryParams = getQueryParams(req);



    var connection = db.getOpenDbConnection();

    console.log("isParent=", queryParams.isParent);
    var children = queryParams.children.split(","),
        discriminator = "'" + modelEntry.fields.discriminator.defaultValue + "'",
        table = modelEntry.table,
        wherePart;

    if (queryParams.isParent==="true") {
        wherePart  = table + ".parentId=" + queryParams.ID + " AND childId IN (" +
            children.join(",") + ") AND " + table + ".discriminator=" + discriminator;
    }
    else if (queryParams.isParent==="false") {
        wherePart  = table + ".childId=" + queryParams.ID + " AND parentId IN (" +
            children.join(",") + ") AND " + table + ".discriminator=" + discriminator;
    }
    else {
        throw newError("addLinked:Unknown isParent=", queryParams.isParent);
    }



    query = "DELETE FROM " + modelEntry.table + " WHERE "+ wherePart;

    console.log("DELETE_linked SQL:", query);


    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        var data = {};
        data.code = 0;
        data.message = "";
        data.rows = [];
        req.data = data;
        console.log('list is: ', rows);
        return next();
    });

    connection.end();
}

exports.getEntityCount = getEntityCount;
exports.getEntityList = getEntityList;
exports.getSimpleList = getSimpleList;
exports.updateItem = updateItem;
exports.insertItem = insertItem;
exports.deleteItem = deleteItem;
exports.getListLinked = getListLinked;
exports.addLinked = addLinked;
exports.deleteLinked = deleteLinked;
