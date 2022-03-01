# Basics

The views support try to be the more transparent and _squelize-styled_ as
possible.

## Define new View

To create a new View, you need to use a familiar syntax, as a normal Model,
with the difference that you need to define the _select query_ the view must to
create.

There are two ways for it; Using an option called `viewQueryOptions` or
override a static method called `getQueryOptions`.

### Using config:

The easy way is pass the query options by init options, ex:

```javascript
class EnabledUser extends View {}

EnabledUser.init({
  username: DataTypes.STRING,
  enabled: DataTypes.BOOLEAN,
}, {
  sequelize,
  timestamps: false,
  viewQueryOptions: {
    model: User,
    attributes: ['id', 'username'],
    where: {
      enabled: true,
    },
  },
});
```

Using it we are creating a view using info from model User, using a similar
syntax to do a `findAll`. 

### Overriding `getQueryOptions`

The other way is overriding the static method `getQueryOptions`, this gets as
first param the options of the View (as a model):

```javascript
class EnabledUser extends View {
  static getQueryOptions(options) {
    return {
      model: User,
      attributes: ['id', 'username'],
      where: {
        enabled: true,
      },
    };
  }
}

EnabledUser.init({
  username: DataTypes.STRING,
  enabled: DataTypes.BOOLEAN,
}, {
  sequelize,
  timestamps: false,
});
```

### Using both

You can to override the method using the previous `viewQueryOptions` option,
ex:

```javascript
class EnabledUser extends View {
  static getQueryOptions(options) {
    return {
      model: User,
      attributes: ['id', 'username'],
      ...options.viewQueryOptions,
    };
  }
}

EnabledUser.init({
  username: DataTypes.STRING,
  enabled: DataTypes.BOOLEAN,
}, {
  sequelize,
  timestamps: false,
  viewQueryOptions: {
    where: { enabled: true },
  },
});
```

## Usage

The usage of a defined view is totally similar to use a standar model, using
the View defined below, we can do:

```javascript
const result = await EnabledUser.findAll();
console.log(result.map((user) => user.toJSON()));
```

The query options are applicable over the View, for example:

```javascript
const result = await EnabledUser.findAll({
  attributes: ['username'],
  order: [
    ['username', 'DESC'],
  ],
});
```

All the supported methods by `Sequelize.Model` are supported, like `findOne`,
`count`, etc.

