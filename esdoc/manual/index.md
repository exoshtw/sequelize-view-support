# Views support for Sequelize

<div>
  <div class="center logo">
    ![logo](manual/asset/logo.png)
  </div>
</div>

Add Views support for [Sequelize](https://sequelize.org/).

You are currently looking at the **Tutorials and Guides**. You might also be
interested in the [API Reference](identifiers.html).

## Supported dialects

* [Postgres](https://en.wikipedia.org/wiki/PostgreSQL)
* [SQLite](https://en.wikipedia.org/wiki/SQLite)

## Quick example

```js
const { Sequelize, Model, DataTypes } = require('sequelize');
const { View, decorateSequelize } = require('@exoshtw/sequelize-views-support');

const ViewsSupportedSequelize = decorateSequelize(Sequelize);

const sequelize = new ViewsSupportedSequelize(('sqlite::memory:'));

class User extends Model {};

User.init({
  username: DataTypes.STRING,
  birthday: DataTypes.DATE,
  enabled: {type: DataTypes.BOOLEAN, defaultValue: true},
}, { sequelize, modelName: 'user' });

class EnabledUser extends View {}; 

EnabledUser.init({
    username: DataTypes.STRING,
    birthday: DataTypes.DATE,
}, {
    sequelize,
    modelName: 'enabled_user',
    timestamps: false,
    viewQueryOptions: {
        model: User,
        where: {
            enabled: true,
        },
    },
});

(async () => {
  await sequelize.sync();

  const jane = await User.create({
    username: 'janedoe',
    birthday: new Date(1980, 6, 20),
    enabled: true,
  });

  const robert = await User.create({
    username: 'robert',
    birthday: new Date(1987, 1, 25),
    enabled: false,
  });

  const enableds = await EnabledUser.findAll();

  console.log(enableds.map((user) => user.toJSON()));
})();
```

## Supporting the project

This project is limmited to a few dialects, if you implement another dialect
please make us a PR.
