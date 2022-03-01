const { Sequelize, Model, fn, DataTypes } = require('sequelize');
const { View, decorateSequelize } = require('../lib');

const ViewsSupportedSequelize = decorateSequelize(Sequelize);

const sequelize = new ViewsSupportedSequelize(('sqlite::memory:'));


// Create User Model
class User extends Model {};

User.init({
  username: DataTypes.STRING,
  birthday: DataTypes.DATE,
}, { sequelize, modelName: 'user' });

// Create Post Model

class Post extends Model {};

Post.init({
  title: DataTypes.STRING,
  content: DataTypes.TEXT,
}, { sequelize, modelName: 'post' });

// Create Post -> User sssociation
Post.belongsTo(User, {allowNull: false});
User.hasMany(Post);

// Create View
class UserPosts extends View {}; 

UserPosts.init({
    username: DataTypes.STRING,
    posts: DataTypes.INTEGER,
}, {
    sequelize,
    modelName: 'user_posts',
    timestamps: false,
    viewQueryOptions: {
        model: User, 
        attributes: [
            'id',
            'username',
            [fn('count', 'post.id'), 'posts']
        ],
        group: ['user.id'],
        include: [{
            model: Post,
            attributes: [],
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

  const post1 = await Post.create({
    title: 'Post 1',
    content: 'This is the first post',
    userId: jane.id,
  });

  const post2 = await Post.create({
    title: 'Post 2',
    content: 'This is the second post',
    userId: robert.id,
  });

  const post3 = await Post.create({
    title: 'Post 3',
    content: 'This is the third post',
    userId: robert.id,
  });

  const result = await UserPosts.findAll();

  console.log(result.map((user) => user.toJSON()));
})();
