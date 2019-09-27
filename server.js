var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
const socket = require("socket.io");
var path = require("path");

const port = process.env.PORT || 3000;

let winPoints = 4;
let numberOfCards = 6;

var app = express();
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "views")));

//routing
const home = require("./routes/home");
app.use("/", home);
app.use("/", (req, res, next) => {
  //middleware
  next();
});

const login = require("./routes/login");
app.use("/", login);
app.use("/", (req, res, next) => {
  //return res.redirect("/home");
  next();
});

const server = app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

const io = socket(server);

io.on("connection", socket => {
  console.log("made socket connection", socket.id);

  socket.on("setupPoints", data => {
    winPoints = data.points;
  });
  socket.on("setupCards", data => {
    numberOfCards = data.cards;
  });
});
