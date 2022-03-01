
/**
 * Decorator for Sequelize's query interface
 * @param {Sequelize.QueryInterface} queryInterface
 * @return {Sequelize.QueryInterface}
 */
export default function decorateQueryInterface(queryInterface) {

    queryInterface.dropView = function(viewName, options = {}) {
        let sql = `DROP VIEW IF EXISTS ` +
                    `${this.QueryGenerator.quoteTable(viewName)}`
        ;

        if (this.sequelize.options.dialect === 'postgres' && options.cascade) {
            sql += ' CASCADE';
        }

        return this.sequelize.query(sql);
    };

    queryInterface.generateQueryFromOptions = function(subQueryOptions) {
        const {
            qtableName,
            qmodel,
            fieldsMap,
            qoptions,
        } = subQueryOptions;

        const afieldMap = Object.keys(fieldsMap || {})
            .map((k) => [k, fieldsMap[k]])
        ;

        const query = this.QueryGenerator.selectQuery(
            qtableName,
            qoptions,
            qmodel,
        )
            .replace(/;$/, '')
        ;

        return [query, afieldMap];
    };

    /**
     * Create view method
     * @param {string} viewName
     * @param {object} attributes
     * @param {object} subQueryOptions
     * @param {object} options
     * @param {Model} model
     * @return {Promise}
     */
    queryInterface.createView = async function(
        viewName, attributes, subQueryOptions, options, model
    ) {
        const attrStr = [];
        let sql = '';

        attributes = Object.keys(attributes).map((attribute) => this
            .sequelize
            .normalizeAttribute(attributes[attribute])
        );

        // Pick options for exclude defaults, index, etc
        attributes = attributes.map(({
            type, Model, fieldName, _modelAttrbute, field,
        }) => ({type, Model, fieldName, _modelAttrbute, field}));

        // Postgres requires special SQL commands for ENUM/ENUM[]
        /*
        if (this.sequelize.options.dialect === 'postgres') {
            await PostgresQueryInterface
                .ensureEnums(this, viewName, attributes, options, model);
        }
        */

        attributes = this.QueryGenerator.attributesToSQL(
            attributes, {
                table: viewName,
                context: 'createTable',
            },
        );

        for (const attr in attributes) {
            if (!attr.match(/^[a-z0-9]/i)) {
                continue;
            }

            const quotedAttr = this.QueryGenerator.quoteIdentifier(attr);
            const dataType = attributes[attr];
            const i = attributes[attr].indexOf('COMMENT ');

            if (i !== -1) {
                attributes[attr] = attributes[attr].substring(0, i);
            }

            if (this.sequelize.options.dialect === 'postgres') {
                const dataType = this.QueryGenerator.dataTypeMapping(
                    viewName,
                    attr,
                    attributes[attr]
                );
                attrStr.push(`${quotedAttr} ${dataType}`);
            } else if (this.sequelize.options.dialect === 'sqlite') {
                attrStr.push(`${quotedAttr} ${dataType}`);
            }
        }

        let query = subQueryOptions;
        let afieldMap = [];

        if (typeof queryOptions !== 'string') {
            [query, afieldMap] = this.generateQueryFromOptions(subQueryOptions);
        }

        const selattrs = Object.keys(attributes)
            .map((field) => afieldMap.find(([f]) => f === field) || [field])
            .map(([f, t]) => `${this.QueryGenerator.quoteIdentifier(t || f)}` +
                (t ? ` AS ${this.QueryGenerator.quoteIdentifier(f)}` : ``)
            )
            .join(',')
        ;

        switch (this.sequelize.options.dialect) {
            case 'sqlite':
                sql = `CREATE VIEW IF NOT EXISTS ` +
                    `${this.QueryGenerator.quoteTable(viewName)} AS SELECT ` +
                    `${selattrs} FROM (${query});`
                ;
                break;
            case 'postgres':
                sql = `CREATE OR REPLACE VIEW ` +
                    `${this.QueryGenerator.quoteTable(viewName)} AS SELECT ` +
                    `${selattrs} FROM (${query}) as sq;`
                ;
                break;
            default:
                throw new Error(
                    `View support is not compatilbe with this dialect`
                );
        }

        return this.sequelize.query(sql, options);
    };

    return queryInterface;
}
