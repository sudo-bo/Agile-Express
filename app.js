const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const app = express();

require('dotenv').config();

app.use(bodyParser.json());
app.use('/users', userRoutes);
app.use('/posts', postRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await sequelize.sync({ force: false });
  console.log('Database synced!');
});
