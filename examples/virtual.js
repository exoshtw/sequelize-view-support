const { Sequelize, Model, literal, DataTypes } = require('sequelize');
const { View, decorateSequelize } = require('../lib');

const ViewsSupportedSequelize = decorateSequelize(Sequelize);

const sequelize = new ViewsSupportedSequelize(('sqlite::memory:'));

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
