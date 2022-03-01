
import Promise from 'bluebird';
import decorateQueryInterface from './queryinterface';

/**
 * Decorate sequelize to support views
 * @param {Class} target
 * @return {Class}
 */
export default function(target) {

    return class Decorated extends target {

        /**
         * @override
         */
        getQueryInterface() {
            super.getQueryInterface();

            if (typeof this.queryInterface.dropView !== 'function') {
                this.queryInterface = decorateQueryInterface(
                    this.queryInterface
                );
            }

            return this.queryInterface;
        }

        /**
         * @override
         */
        async sync(options) {
            await super.sync(options);
            await this.syncViews(options);
        }

        /**
         * Sync views
         * @param {object} options
         * @return {Promise}
         */
        async syncViews(options) {
            const views = [];

            this.modelManager.forEachModel((model) => {
                if (model.isView) {
                    views.push(model);
                }
            });

            const deps = await Promise.map(views, async (view) => [
                view,
                await view.resolveSubqueryOptions(options),
            ])
                .then((_deps) => {
                    return _deps.sort(([va, da], [vb, db]) => {
                        if (db.qoptions.includeNames.includes(va.name)) {
                            return -1;
                        } else {
                            return 1;
                        }
                    });
                })
            ;

            for (const [model, sqops] of deps) {
                await model.syncView(options, sqops);
            }
        }
    };
}
