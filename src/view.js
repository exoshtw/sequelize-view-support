
import {Model} from 'sequelize';

const resolveModels = (sequelize, ops) => {
    if (!ops.include) {
        return;
    }

    Object.keys(ops.include).forEach((k) => {
        const inc = ops.include[k];
        if (typeof inc.model === 'string') {
            inc.model = sequelize.modelManager.getModel(inc.model);
        }
        if (inc.include) {
            resolveModels(sequelize, inc);
        }
    });
};


/**
 * Use as view
 */
export default class View extends Model {

    /**
     * isView
     * @type {bool}
     */
    get isView() {
        return true;
    }

    /**
     * isView
     * @type {bool}
     */
    static get isView() {
        return true;
    }

    /**
     * @override
     */
    static drop(options) {
        return this.QueryInterface.dropView(
            this.getTableName(options),
            options,
        );
    }

    /**
     * @override
     */
    static async sync(options) {
        return;
    }

    /**
     * Get View Query options
     * @param {object} options
     * @return {object}
     */
    static getQueryOptions(options) {
        const queryOptions = {...options.viewQueryOptions || {}};
        return queryOptions;
    }

    /**
     * Resolve subquery options
     * @param {object} options
     * @return {object}
     */
    static resolveSubqueryOptions(options) {
        options = Object.assign({}, this.options, options);
        const queryOptions = this.getQueryOptions(options);
        const {model: qmodel, fieldsMap, ...qoptions} = queryOptions;

        resolveModels(this.sequelize, options);

        const qtableName = typeof qmodel?.getTableName === 'function' ?
            qmodel.getTableName() :
            `${qmodel}`;

        if (qtableName === 'undefined') {
            throw new Error('Invalid query model');
        }

        resolveModels(this.sequelize, qoptions);

        qmodel._injectScope(qoptions);
        qmodel._conformIncludes(qoptions, this);
        qmodel._expandAttributes(qoptions);
        qmodel._expandIncludeAll(qoptions);

        qoptions.originalAttributes = qmodel._injectDependentVirtualAttributes(
            qoptions.attributes
        );

        if (qoptions.include) {
            qoptions.hasJoin = true;
            qmodel._validateIncludedElements(qoptions, {
                [qtableName]: true,
            });
        }

        return {
            qtableName,
            qmodel,
            fieldsMap,
            qoptions,
        };
    }

    /**
     * Sync view.
     * @param {object} [options]
     * @param {object} [subQueryOptions]
     */
    static async syncView(options, subQueryOptions) {
        debugger;
        const attributes = this.tableAttributes;

        options = Object.assign({}, this.options, options);
        options.hooks = options.hooks === undefined ? true : !!options.hooks;

        if (options.hooks) {
            await this.runHooks('beforeSync', options);
        }

        if (options.force) {
            await this.drop();
        }

        await this.QueryInterface.createView(
            this.getTableName(options),
            attributes,
            subQueryOptions || this.resolveSubqueryOptions(options),
            options,
            this
        );
    }
}
