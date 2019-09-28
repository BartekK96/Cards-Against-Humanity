var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
const socket = require("socket.io");
var path = require("path");
const connection = require("./config/mysql-connection");

const port = process.env.PORT || 3000;

let winPoints = 4;
let gameStarted = false;
let numberOfCards = 6;
const playersWhiteCards = [
  { player1: { cards: null } },
  { player2: { cards: null } },
  { player3: { cards: null } },
  { player4: { cards: null } },
  { player5: { cards: null } },
  { player6: { cards: null } },
  { player7: { cards: null } },
  { player8: { cards: null } },
  { player9: { cards: null } }
];

const app = express();
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "views")));

//View engine
app.set("view engine", "ejs");

//routing
const home = require("./routes/home");
app.use("/home", home);
app.use("/home", (req, res, next) => {
  // console.log(req.session);

  next();
});

const login = require("./routes/login");
app.use("/", login);
app.use("/", (req, res, next) => {
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
  connection.query(
    "SELECT login,points FROM users WHERE succession > 0",
    (err, res) => {
      if (err) {
        console.log(err);
      }

      socket.emit("sendSetup", { winPoints, numberOfCards, res });
    }
  );
  socket.on("gameStarted", data => {
    if (data) {
      connection.query(
        "SELECT * FROM distribution WHERE login = ?",
        [data.id],
        (err, res) => {
          if (err) {
            console.log(err);
          }
          console.log(res);
        }
      );
      socket.emit("newWhiteCardsDeal");
    }
  });

  socket.on("putWhiteCard", data => {
    console.log(data);
  });
  socket.on("chooseWhiteCard", data => {
    console.log(data);
  });
});
module.exports = server;
