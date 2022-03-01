# Polymorphism using Views

One of pilars of the object oriented programming is the polymorphism, but this
paradigm is very hard to apply in relational databases, and this complexity is
increased in the ORM layer.

Sequelie [have an
example](https://sequelize.org/v6/manual/polymorphic-associations.html) using
the `beforeFind` hook and scopes.

There we explore an alternative using Views, with the adventage of the
transparent usage in queries.

## Stage

In this stage with have and entity called `Vehicle`, with a serie of common
vehicles attributes, as the price or the name, and a attribute called `type`
that define who type of _vehicle_ is, the rest of properties are in two
separate models: `Car` and `Bike`, this referers to the `Vehicle` model with an
one to one relation.

## Propouse

We propose to create two abstract class, `VehicleChild` extending of `Model`,
and `VehicleChildView` extending of `View`.


## Implement

### Create parent model

First, we are going the Parent entity model:

```javascript
// Create Vehicle Model
class Vehicle extends Model {};

Vehicle.init({
  type: DataTypes.ENUM('car', 'bike'),
  name: DataTypes.STRING,
  price: DataTypes.DECIMAL,
}, { sequelize, modelName: 'vehicle' });
```

This has the type of vehicle and the common information.

### Create child abstract

Next, we are going to code a abstract class for use by the childs of `Vehicle`:

```javascript 
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
```

In this case, we are overriding the method `init`, to add an id field, in this
case, it's neccesary the child id was the same of the parent model, for this
reason set `autoIncrement` in false.

By other hand, set `timestamps` in false becouse the creation time is in the
parent model. By practical propouses we will not to worry for the `updatedAt`
field.

In the associate method, we are associating own child model with the parent.

### Create child models

```javascript
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
```

We extends the `VehicleChildren` and define a serie of own properties for each
vehicle type.

### Create the abstract View

For DRY, we have to create an abstract View overriding some methods:

```javascript
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
            }, }); }

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
```

In this case we are using the method `getQueryOptions` to define the View
query, equal for all childrens. We expect two static properties in the
definition of a `VehicleChildView`; `type` and `model`, this properties are
used for abstract View to create the query options, the relation and to be used
in the overrided logic of `create` method, in this case we are overriting
`create` to desmotrate a use of a View like some kind of serializer.

We are auto-mapping the own-properties too.

## Create the child views

With the code abstracted bellow, the definition of new Views that represent
a child of `Vehicle`, must to be simple:

```javascript
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
```

Only extending the class `VehicleChildView` and creating the properties
`type`and `model`, the rest of the logic runs over the abstract View.

## Usage

The usage is very simple, we treat the final views like models with the full
information of entitiy (parent and child attributes):

```javascript
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
```

The result should to output:

```javascript
[
  {
    id: 1,
    name: 'Audi',
    price: 100000,
    transmission: 'automatic',
    doors: 4,
    style: 'sedan',
    hp: 200,
    createdAt: 2022-03-01T03:58:18.941Z,
    updatedAt: 2022-03-01T03:58:18.941Z
  }
]
[
  {
    id: 2,
    name: 'BMX',
    price: 10000,
    style: 'road',
    cicles: 100,
    cc: 100,
    createdAt: 2022-03-01T03:58:18.962Z,
    updatedAt: 2022-03-01T03:58:18.962Z
  }
]
```

