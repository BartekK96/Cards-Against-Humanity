var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
const socket = require("socket.io");
var path = require("path");
const connection = require("./config/mysql-connection");

const port = process.env.PORT || 3000;

let winPoints = 4;
const players = [];
let master = 0;
let numberOfCards = 6;
const playersWhiteCards = [
  { player: [null] },
  { player: [null] },
  { player: [null] },
  { player: [null] },
  { player: [null] },
  { player: [null] },
  { player: [null] },
  { player: [null] },
  { player: [null] }
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
      for (let i = 0; i < res.length; i++) {
        if (!players.includes(res[i].login)) {
          players.push(res[i].login);
        }
      }

      socket.emit("sendSetup", {
        winPoints,
        numberOfCards,
        res
      });
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

          if (playersWhiteCards[data.id - 1].player.length > 0) {
            playersWhiteCards[data.id - 1].player = [];
          }
          for (let i = 0; i < res.length; i++) {
            connection.query(
              "SELECT description FROM whitecards WHERE id = ?",
              [res[i].whiteCard],
              (err, res) => {
                if (err) {
                  console.log(err);
                }
                playersWhiteCards[data.id - 1].player.push(res[0].description);
              }
            );
          }

          setTimeout(() => {
            socket.emit(
              "newWhiteCardsDeal",
              playersWhiteCards[data.id - 1].player
            );
          }, 100);
        }
      );
    }
  });
  socket.on("newTurn", data => {
    connection.query(
      "SELECT * FROM blackcards WHERE free = ? ORDER BY RAND() LIMIT  ?",
      [1, 1],
      (err, res) => {
        if (err) {
          console.log(err);
        }

        connection.query(
          "UPDATE blackcards SET free = ? WHERE id = ?",
          [0, res[0].id],
          (err, res) => {
            if (err) {
              console.log(err);
            }
          }
        );
        socket.emit("newBlackCard", { data: res[0], master: players[master] });
        master++;
        if (players[master] === undefined) {
          master = 0;
        }
      }
    );
  });

  socket.on("putWhiteCard", data => {
    console.log(data);
  });
  socket.on("chooseWhiteCard", data => {
    console.log(data);
  });
});
