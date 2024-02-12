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

const User = mongoose.model('User', userSchema)

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




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
  console.log(`http://localhost:${listener.address().port}`);
})