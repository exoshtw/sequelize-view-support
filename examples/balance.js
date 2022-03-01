const { Sequelize, Model, fn, col, DataTypes } = require('sequelize');
const { View, decorateSequelize } = require('../lib');

const ViewsSupportedSequelize = decorateSequelize(Sequelize);

const sequelize = new ViewsSupportedSequelize(('sqlite::memory:'));


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
