require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Connection to mongodb:
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI);

const UserSchema = new mongoose.Schema({
  username: String,
});
const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  const user = new User({ username: req.body.username });

  try {
    const savedUser = await user.save();
    res.json(savedUser);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({}).select("_id username");
  if (!users) {
    res.send({ error: "No users found!" });
  } else {
    res.json(users);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.send({ error: "Could not find user" });
    } else {
      const exercise = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      });
      const savedExercise = await exercise.save();

      const resDate = new Date(savedExercise.date);

      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const dayOfWeek = daysOfWeek[resDate.getUTCDay()];
      const month = months[resDate.getUTCMonth()];
      const day = resDate.getUTCDate();
      const year = resDate.getUTCFullYear();

      // Format dat:
      const formattedDay = day < 10 ? `0${day}` : day;

      const formattedDate = `${dayOfWeek} ${month} ${formattedDay} ${year}`;

      const resJSON = {
        _id: user._id,
        username: user.username,
        description: savedExercise.description,
        duration: savedExercise.duration,
        date: formattedDate,
      };
      console.log(resJSON);
      res.json(resJSON);
    }
  } catch (error) {
    console.log(error);
    res.send({ error: "Error saving the exercise D:" });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params._id;

  const user = await User.findById(userId);
  if (!user) {
    res.send({ error: "User not found D:" });
    return;
  }

  let date = {};

  if (from) {
    date["$gte"] = new Date(from);
  }
  if (to) {
    date["$lte"] = new Date(to);
  }

  let filter = {
    user_id: userId,
  };

  if (from || to) {
    filter.date = date;
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 100);

  const log = exercises.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
  }));

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
  console.log(`http://localhost:${listener.address().port} 🪴🪴🪴`);
});
