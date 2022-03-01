# Using with associations

The `viewQueryOptions` options support the most features of a sequelize query
options, including `include`, the only extra-step we need to do, is indicate to
the view, where are the information of the included fields.

For this proppose, there are an option param called `fieldsMap`, this should to
be a dictionary like object using the view field as key, and the query field as
value.

## Example: 

```javascript
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

// Create View
class PublicPost extends View {}; 

PublicPost.init({
  title: DataTypes.STRING,
  author: DataTypes.STRING,
  createdAt: DataTypes.DATE,
}, {
    sequelize,
    modelName: 'public_posts',
    timestamps: false,
    viewQueryOptions: {
        model: Post, 
        attributes: ['id', 'title', 'createdAt'],
        include: [{
            model: User,
            required: true,
            attributes: ['username'],
        }],
        // Map user.username to author
        fieldsMap: {
            author: 'user.username',
        },
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

  const result = await PublicPost.findAll();

  console.log(result.map((post) => post.toJSON()));
})();
```

this example should to return:

```javascript
[
  {
    id: 1,
    title: 'Post 1',
    author: 'janedoe',
    createdAt: 2022-03-01T01:05:53.411Z
  },
  {
    id: 2,
    title: 'Post 2',
    author: 'robert',
    createdAt: 2022-03-01T01:05:53.414Z
  }
]
```

