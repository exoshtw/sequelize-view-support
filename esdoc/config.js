
const manualGroups = require('./manual-groups.json');
const _ = require('lodash');

module.exports = {
  source: './src',
  destination: './docs',
  includes: ['\\.js$'],
//  excludes: ['\\.d:.ts$'],
  plugins: [
    {
      name: 'esdoc-ecmascript-proposal-plugin',
      option: {
        all: true,
      },
    },
    {
      name: 'esdoc-inject-style-plugin',
      option: {
        enable: true,
        styles: [
          './esdoc/css/style.css',
          './esdoc/css/theme.css',
        ],
      },
    },
    {
      name: 'esdoc-standard-plugin',
      option: {
        lint: { enable: true },
        coverage: { enable: false },
        accessor: {
          access: ['public'],
          autoPrivate: true,
        },
        undocumentIdentifier: { enable: false },
        unexportedIdentifier: { enable: true },
        typeInference: { enable: true },
        brand: {
          logo: './esdoc/images/logo.png',
          title: 'Sequelize',
          description: 'An easy-to-use multi SQL dialect ORM for Node.js',
          repository: 'https://github.com/sequelize/sequelize',
          site: 'https://sequelize.org/master/',
        },
        manual: {
          index: './esdoc/manual/index.md',
          globalIndex: true,
          asset: './esdoc/images',
          files: _.flatten(_.values(manualGroups)).map(file => `./esdoc/manual/${file}`)
        },
      },
    },
  ],
};
