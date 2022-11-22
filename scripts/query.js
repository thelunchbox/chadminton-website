function query () {

    var QUERYTYPES = {
        SELECT: 1,
        INSERT: 2,
        UPDATE: 3,
        DELETE: 4
    };
    
    var queryMethods = ['GET', 'GET', 'POST', 'POST', 'POST'];

    this.type = QUERYTYPES.SELECT;
    this.fields = null;
    this.fieldValues = null;
    this.table = null;
    this.joins = null;
    this.conditions = null;
    this.sorts = null;

    this.select = function (fields) {
        this.fields = fields;
        this.type = QUERYTYPES.SELECT;
        return this;
    }

    this.delete = function () {
        this.type = QUERYTYPES.DELETE;
        return this;
    }

    this.insertInto = function (table) {
        this.table = table;
        this.type = QUERYTYPES.INSERT;
        return this;
    }

    this.values = function (values) {
        this.fieldValues = values;
        return this;
    }

    this.from = function (table) {
        this.table = table;
        return this;
    }

    this.update = function (table) {
        this.table = table;
        this.type = QUERYTYPES.UPDATE;
        return this;
    }
    
    this.set = function (values) {
        this.fieldValues = values;
        return this;
    }

    this.where = function (conditions) {
        this.conditions = conditions;
        return this;
    }

    this.orderBy = function (sorts) {
        this.sorts = sorts;
        return this;
    }

    var sanitize = function (keyValues) {
        var values = {};
        $.each(keyValues, function (key, value) {
            var sanitizedValue = value;
            if (value === '' || value === null) {
                values[key] = 'NULL';
                return;
            }
            switch(typeof value) {
                case 'string':
                    sanitizedValue = '\'' + value + '\'';
                    break;
                case 'number':
                    break;
                case 'boolean':
                    break;
                default:
                    break;
            }
            values[key] = sanitizedValue;
        });
        return values;
    }

    this.package = function () {
        return {
            type: this.type,
            fields: this.fields,
            values: sanitize(this.fieldValues),
            table: this.table,
            conditions: sanitize(this.conditions),
            sorts: sanitize(this.sorts)
        };
    };

    this.execute = function (callback) {
        if ($ != null) {
            $.ajax({
                url: 'scripts/db.php',
                data: this.package(),
                dataType: 'text', //'json',
                method: queryMethods[this.type],
                success: function (data, status, jqXHR) {
                    console.log(data);
                    data = JSON.parse(data);
                    callback && callback(data.results);
                },
                error: function (jqXHR, status, error) {
                    console.warn(error);
                }
            });
        } else {
            console.warn('jQuery is required for this library!');
        }
    }
};