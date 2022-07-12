require('dotenv').config();
require('./config/database').connect();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Imports
const User = require('./model/user');
const auth = require('./middleware/auth');

const app = express();

app.use(express.json());

//Logic goes here
// Register
app.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    // Validate user input
    if (!(email && password && first_name && last_name)) {
      res.status(400).send('All input is required');
    }
    const oldUser = await User.findOne({ email: email });
    if (oldUser) {
      return res.status(409).send('User Already Exist. Please Login!');
    }

    encryptPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: encryptPassword,
    });

    // Create toekn
    const token = jwt.sign(
      {
        user_id: user._id,
        email,
      },
      process.env.JWT_KEY,
      { expiresIn: '2h' }
    );
    // save user token
    user.token = token;

    // return new user
    res.status(201).json(user);
  } catch (error) {
    console.log(error);
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password)) {
      res.status(400).send('All input is required');
    }
    const user = await User.findOne({ email: email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.JWT_KEY,
        {
          expiresIn: '2h',
        }
      );
      user.token = token;
      res.status(200).json(user);
    }
    res.status(400).send('Invalid Credentials');
  } catch (error) {
    console.log(error.message);
  }
});

app.post('/welcome', auth, (req, res) => {
  res.status(200).send('Welcome');
});

module.exports = app;
