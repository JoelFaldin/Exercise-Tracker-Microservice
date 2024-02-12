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
    type: Number,
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
  const userList = await User.find({}).select({ _id: 1, username: 1 });
  
  await Exercise.deleteMany({ description: 'test' })
  await User.deleteMany({ username: { $regex: `^${'fcc_test_'}`, $options: 'i' } });

  res.json(userList);
})

// Create an exercise:
app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;
  const user = await User.findById(id);

  const newExercise = new Exercise({
    user_id: user._id,
    description,
    duration,
    date: date ? new Date(date) : new Date().toDateString()
  })

  const savedExercise = await newExercise.save();

  const resDate = new Date(savedExercise.date)
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayOfWeek = daysOfWeek[resDate.getUTCDay()];
  const month = months[resDate.getUTCMonth()];
  const day = resDate.getUTCDate();
  const year = resDate.getUTCFullYear();

  // Format dat:
  const formattedDay = day < 10 ? `0${day}` : day;

  const formattedDate = `${dayOfWeek} ${month} ${formattedDay} ${year}`;

  const jsonRes = {
    username: user.username,
    description: savedExercise.description,
    duration: +savedExercise.duration,
    date: formattedDate,
    _id: id,
  }

  res.json(jsonRes)
})

// Getting all exercises from an user:
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = await User.findById(userId);
  
  let date = {};
  if (from) {
    date["$gte"] = new Date(from);
  }
  if (to) {
    date["$lte"] = new Date(to);
  }

  let filter = {
    user_id: user.id
  }

  if (from || to) {
    filter.date = date
  }
  
  const exercises = await Exercise.find(filter).limit(limit).select({ _id: 0, description: 1, duration: 1, date: 1 });
  const count = exercises.length;

  res.json({
    user: user.username,
    count,
    _id: user._id,
    log: exercises
  })
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
  console.log(`http://localhost:${listener.address().port}`);
})