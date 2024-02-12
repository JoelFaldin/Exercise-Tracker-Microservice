require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.static('public'))

app.use(express.urlencoded({ extended: true }));

// Connection to mongodb:
const mongoose = require('mongoose')
const mongo_url = process.env.MONGO_URI
mongoose.set('strictQuery', false)

mongoose.connect(mongo_url)
  .then(() => {
    console.log('Database conected! 🌿🌿🌿')
  })
    .catch(error => {
      console.log('DataBase refused to connect. ', error.message)
  })

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})

const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  date: {
    type: String
  }
})

const Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Creating a new user:
app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  
  const existsUser = await User.findOne({ username });
  if (!existsUser) {
    const newUser = new User ({
      username
    })

    await newUser.save();
    res.json({ username, _id: newUser._id });
  } else {
    console.log(existsUser)
    res.json({ username: existsUser.username, _id: existsUser._id });
  }
});

// Getting all users:
app.get('/api/users', async (req, res) => {
  const userList = await User.find({});
  res.json(userList);
})

// Create an exercise:
app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body
  const user = await User.findById(id)

  const newExercise = new Exercise({
    user_id: user._id,
    description,
    duration,
    date: date !== '' ? date : (new Date()).toDateString()
  })

  await newExercise.save();
  res.json({
    _id: user._id,
    username: user.username,
    description,
    duration,
    date: newExercise.date
  })
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
  console.log(`http://localhost:${listener.address().port}`);
})