# Install

## Via package manager

    $ npm install --save @exoshtw/sequelize-views-support

Or Yarn

    $ yarn add @exoshtw/sequelize-views-support

## Via Git

    $ git clone https://github.com/exoshtw/sequelize-views-support.git
    $ cd sequelize-views-support
    $ npm install

## Use in your project

This package provide a decorator for `Sequelize` class, you need to use it
decorated version of the class instead the original:

```javascript
import { Sequelize } from 'sequelize';
import { decorateSequelize } from '@exoshtw/sequelize-views-support';

const ViewSupporterSequelize = decorateSequelize(Sequelize);

const sequelize = new ViewSupporterSequelize(...);
```

