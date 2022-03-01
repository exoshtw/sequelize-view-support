const { Sequelize, Model, DataTypes } = require('sequelize');
const { View, decorateSequelize } = require('../lib');

const ViewsSupportedSequelize = decorateSequelize(Sequelize);

const sequelize = new ViewsSupportedSequelize(('sqlite::memory:'));


// Create Vehicle Model
class Vehicle extends Model {};

Vehicle.init({
  type: DataTypes.ENUM('car', 'bike'),
  name: DataTypes.STRING,
  price: DataTypes.DECIMAL,
}, { sequelize, modelName: 'vehicle' });

// Create Child Model Abstract
class VehicleChildren extends Model {
  // Override init for add id field
  static init(fields, options = {}) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: false,
      },
      ...fields,
    }, {
      timestamps: false,
      ...options,
    });
  }

  static associate(models) {
    Vehicle.hasOne(this, {
        foreignKey: 'id',
        sourceKey: 'id',
        constraints: true,
    });
  }
};

// Create Car Model
class Car extends VehicleChildren {};

Car.init({
    transmission: DataTypes.ENUM('automatic', 'manual'),
    doors: DataTypes.INTEGER,
    style: DataTypes.ENUM('sedan', 'coupe', 'convertible'),
    hp: DataTypes.INTEGER,
}, { sequelize, modelName: 'car'});

// Create Bike Model
class Bike extends VehicleChildren {};

Bike.init({
    style: DataTypes.ENUM('road', 'mountain', 'hybrid'),
    cicles: DataTypes.INTEGER,
    cc: DataTypes.INTEGER,
}, { sequelize, modelName: 'bike'});

// Create associations 

Car.associate();
Bike.associate();

// Create View Base
class VehicleChildView extends View {

    // Override getQueryOptions using props
    static getQueryOptions(options) {
        return {
            model: Vehicle, 
            include: [{
                model: this.model,
                required: true,
            }],
            where: {
                type: this.type,
            },
            ...(options.viewQueryOptions || {}),
        };
    }

    static init(fields, options = {}) {

        const extraFields = Object.keys(fields).reduce((acc, key) => {
            acc[key] = `${this.type}.${key}`;
            return acc;
        }, {});

        const {viewQueryOptions}  = options;

        super.init({
            name: DataTypes.STRING,
            price: DataTypes.DECIMAL,
            ...fields,
        }, {
            ...options,
            viewQueryOptions: {
                fieldsMap: {
                    ...extraFields,
                    ...(viewQueryOptions || {}),
                },
                ...(viewQueryOptions && options.viewQueryOptions || {}),
            },
        });
    }

    // Override create 
    static async create(data, options = {}) {
        return sequelize.transaction(async (transaction) => {
            const {
                name,
                price,
                ...extra
            } = data;

            const vehicle = await Vehicle.create({
                type: this.type,
                name,
                price,
            }, { transaction });

            const child = await this.model.create({
                id: vehicle.id,
                ...extra,
            }, { transaction });

            return this.build({
                ...vehicle.get({plane: true}),
                ...child.get({plane: true}),
            });
        });
    }
};

// Create Car View
class VehicleCar extends VehicleChildView {
    static type = 'car';
    static model = Car;
};

VehicleCar.init({
    transmission: DataTypes.STRING,
    doors: DataTypes.INTEGER,
    style: DataTypes.STRING,
    hp: DataTypes.INTEGER,
}, {
    sequelize,
});

// Create Bike View
class VehicleBike extends VehicleChildView {
    static type = 'bike';
    static model = Bike;
};

VehicleBike.init({
    style: DataTypes.STRING,
    cicles: DataTypes.INTEGER,
    cc: DataTypes.INTEGER,
}, {
    sequelize,
});


(async () => {
  await sequelize.sync();

  const car = await VehicleCar.create({
    name: 'Audi',
    price: 100000,
    transmission: 'automatic',
    doors: 4,
    style: 'sedan',
    hp: 200,
  });

  const bike = await VehicleBike.create({
    name: 'BMX',
    price: 10000,
    style: 'road',
    cicles: 100,
    cc: 100,
  });

  const cars = await VehicleCar.findAll();
  console.log(cars.map((car) => car.toJSON()));

  const bikes = await VehicleBike.findAll();
  console.log(bikes.map((bike) => bike.toJSON()));
})();
