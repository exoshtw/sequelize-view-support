# Combine concepts

If you read the previous examples, you are aware the power of Views, in this
example, we are going to combine some concepts like associations and
aggregations to make something more complex, in this case we are going to
create a View thats resolve a User balance.

In this example with have two models:

* **User**: The users model getting info from simple users
* **Pay**: Pays to user, each register add an amount to a user

## Example

```javascript
// Create User Model
class User extends Model {};

User.init({
  username: DataTypes.STRING,
  birthday: DataTypes.DATE,
}, { sequelize, modelName: 'user' });

// Create Pays Model 

class Pay extends Model {};

Pay.init({
  amount: DataTypes.DECIMAL(),
  observation: DataTypes.STRING,
}, { sequelize, modelName: 'pay' });

// Create Pay -> User sssociation
Pay.belongsTo(User, {allowNull: false});
User.hasMany(Pay);

// Create View
class UserBalance extends View {}; 

UserBalance.init({
    username: DataTypes.STRING,
    amount: DataTypes.DECIMAL,
}, {
    sequelize,
    modelName: 'user_balance',
    timestamps: false,
    viewQueryOptions: {
        model: User, 
        attributes: [
            'id',
            'username',
            [fn('coalesce', fn('sum', col('pays.amount')), 0), 'amount']
        ],
        group: ['user.id'],
        include: [{
            model: Pay,
            required: false,
        }],
    },
});

(async () => {
  await sequelize.sync();

  const jane = await User.create({
    username: 'janedoe',
    birthday: new Date(1980, 6, 20),
  });

  const robert = await User.create({
    username: 'robert',
    birthday: new Date(1987, 1, 25),
  });

  await Pay.create({
    amount: 100,
    observation: 'Salary',
    userId: jane.id,
  });

  await Pay.create({
    amount: 50,
    observation: 'Gift',
    userId: jane.id,
  });

  await Pay.create({
    amount: 0.57,
    observation: 'Interest',
    userId: jane.id,
  });

    const result = await UserBalance.findAll({
        // Use aggreation functions in order like a sr.
        order: [['amount', 'ASC']],
    });

  console.log(result.map((user) => user.toJSON()));
})();
```

The output should to be:

```javascript
[
  { id: 2, username: 'robert', amount: 0 },
  { id: 1, username: 'janedoe', amount: 150.57 }
] 
```

## Explanation

In this case we use an association with `Pay` model, and an aggregation
function to `sum` the amounts, getting a reduced balance from user, in this
case don't map fields becouse the `amount` field is declared in the main Model,
this View can be used for obtain single registers without use aggregations:

```javascript
const janedoeBalance = await UserBalance.findOne({
  attributes: ['amount'],
  where: {id: 1},
  raw: true,
})
  .then((result) => result.amount)
;
```

