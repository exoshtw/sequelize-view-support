const { Sequelize, Model, DataTypes } = require('sequelize');
const { View, decorateSequelize } = require('../lib');

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
