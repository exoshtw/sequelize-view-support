# Using Views instead of virtual fields

Another usage for the Views impplementation must to be the use of pre-calculate
or aggregated values instead of virtual fields, for querying implementation and
performance.

In the sequelize style, we need to create a virtual field and define the `get`
property to _for example_ do a concat.

Using views we are abble to use these fields for querying, filter, order, etc.

## Example

```javascript
class User extends Model {};

User.init({
  name: DataTypes.STRING,
  lastname: DataTypes.STRING,
}, { sequelize, modelName: 'user' });

class FullNameUser extends View {}; 

FullNameUser.init({
    fullname: DataTypes.STRING,
}, {
    sequelize,
    modelName: 'fullname_user',
    timestamps: false,
    viewQueryOptions: {
        model: User,
        attributes: [
            'id',
            // Use fn('concat', ...) in postgres
            [literal(`name || ' ' || lastname `), 'fullname']
        ],
    },
});

(async () => {
  await sequelize.sync();

  const jane = await User.create({
    name: 'Jane',
    lastname: 'Doe',
  });

  const robert = await User.create({
    name: 'Robert',
    lastname: 'Jhonson',
  });

  const enableds = await FullNameUser.findAll();

  console.log(enableds.map((user) => user.toJSON()));
})();
```

This should to output:

```javascript
[
  { id: 1, fullname: 'Jane Doe' },
  { id: 2, fullname: 'Robert Jhonson' }
]
```

Obviuoly, we are limmited to use logic from the dialect and not in Javscript,
but with the adventage to use it in queries, for ex:

```javascript
const result = await FullNameUser.findAll({
  where: {
    fullname: {
      [Op.like]: 'J% D%',
    },
  },
});
```

