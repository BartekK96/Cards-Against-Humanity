var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
const socket = require("socket.io");
var path = require("path");
const connection = require("./config/mysql-connection");

const port = process.env.PORT || 3000;

// game settings
let master = 0;
let players = [];
let winPoints = 0;
let numberOfCards = 0;
let newGame = false;
let choosenWhite = [];
// id -1 === pleyersCards[id-1]
let playersCards = [[], [], [], [], [], [], [], [], []];
let playersPoints = [0, 0, 0, 0, 0, 0, 0, 0, 0];
//
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
  let finishSetup = false;
  const card = {};
  socket.on("newGameSetup", async data => {
    setTimeout(async () => {
      socket.broadcast.emit("winPoints", data.points);
      socket.emit("winPoints", data.points);

      clearDistribution();
      resetUserPoints();
      resetWhiteCards();
      resetBlackCards();
      players = [];
      playersCards = [[], [], [], [], [], [], [], [], []];
      newGame = true;
      winPoints = data.points;
      numberOfCards = data.cards;

      await newGameSetUp(Number(numberOfCards));
      if (newGame) {
        newGame = false;

        connection.query(
          "SELECT * FROM blackcards WHERE free = ? ORDER BY RAND() LIMIT  ?",
          [1, 1],
          (err, res) => {
            if (err) {
              console.log(err);
            }
            socket.emit("firstBlack", res);
            socket.broadcast.emit("firstBlack", res);
            connection.query(
              "UPDATE blackcards SET free = ? WHERE id = ?",
              [0, res[0].id],
              (err, res) => {
                if (err) {
                  console.log(err);
                }
              }
            );
          }
        );

        connection.query(
          "SELECT id,login,points FROM users WHERE succession > 0",
          (err, res) => {
            if (err) {
              console.log(err);
            }

            for (let i = 0; i < res.length; i++) {
              players.push(res[i]);
            }
            shuffle(players);

            setTimeout(() => {
              connection.query(
                "SELECT * FROM distribution",
                (err, response) => {
                  if (err) {
                    console.log(err);
                  }

                  for (let i = 0; i < response.length; i++) {
                    connection.query(
                      "SELECT description FROM whitecards WHERE id = ?",
                      [response[i].whiteCard],
                      (err, res) => {
                        if (err) {
                          console.log(err);
                        }
                        playersCards[response[i].login - 1].push(
                          res[0].description
                        );
                      }
                    );

                    if (i === response.length - 1) {
                      setTimeout(() => {
                        finishSetup = true;
                      }, 1000);
                    }
                  }
                }
              );
            }, 200);

            if (finishSetup) {
              socket.emit("firstDeal", {
                playersCards,
                master: players[master]
              });
              socket.broadcast.emit("firstDeal", {
                playersCards,
                master: players[master]
              });
              finishSetup = false;
            } else {
              const newDeal = setInterval(() => {
                if (finishSetup) {
                  socket.emit("firstDeal", {
                    playersCards,
                    master: players[master],
                    players
                  });
                  socket.broadcast.emit("firstDeal", {
                    playersCards,
                    master: players[master],
                    players
                  });
                  finishSetup = false;
                  clearInterval(newDeal);
                }
              }, 100);
            }
          }
        );
      }
    }, 200);
  });

  socket.on("putWhiteCard", data => {
    connection.query(
      "SELECT * FROM whitecards WHERE free = ? ORDER BY RAND() LIMIT  ?",
      [1, 1],
      (err, res) => {
        if (err) {
          console.log(err);
        }
        connection.query(
          "UPDATE whitecards SET free = ? WHERE id = ?",
          [0, res[0].id],
          (err, res) => {
            if (err) {
              console.log(err);
            }
          }
        );
        const card = {};
        card.id = data.id;

        const index = playersCards[data.id - 1].indexOf(data.card);
        card.card = playersCards[data.id - 1].splice(index, 1);
        playersCards[data.id - 1].push(res[0].description);
        socket.broadcast.emit("allWhite", data.card);
        socket.emit("allWhite", data.card);
        socket.emit("newWhiteDeal", playersCards[data.id - 1]);
        choosenWhite.push(card);
      }
    );
  });
  socket.on("whiteChoose", data => {
    master++;
    if (master === players.length) {
      master = 0;
    }

    for (let i = 0; i < choosenWhite.length; i++) {
      if (choosenWhite[i].card[0] === data.card) {
        playersPoints[choosenWhite[i].id - 1]++;
        choosenWhite = [];
        break;
      }
    }
    socket.emit("playersPoints", playersPoints);
    socket.broadcast.emit("playersPoints", playersPoints);

    //new round
    connection.query(
      "SELECT * FROM blackcards WHERE free = ? ORDER BY RAND() LIMIT  ?",
      [1, 1],
      (err, res) => {
        if (err) {
          console.log(err);
        }
        socket.emit("newRound", { res, master: players[master] });
        socket.broadcast.emit("newRound", { res, master: players[master] });

        connection.query(
          "UPDATE blackcards SET free = ? WHERE id = ?",
          [0, res[0].id],
          (err, res) => {
            if (err) {
              console.log(err);
            }
          }
        );
      }
    );
  });
  socket.on("gameFinish", data => {
    console.log(data);
  });
});

// shuffle function - randomize succession
function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

async function newGameSetUp(numberOfCards) {
  connection.query(
    "SELECT id,login,succession FROM users WHERE succession > 0",
    (err, resLogin, fields) => {
      if (err) {
        console.log(err);
      }

      // for each user
      for (let j = 0; j < resLogin.length; j++) {
        setTimeout(() => {
          connection.query(
            "SELECT * FROM whitecards WHERE free = ?  ORDER BY RAND() LIMIT ?",
            [1, numberOfCards],
            (err, resCards, fields) => {
              if (err) {
                console.log(err);
              }

              for (let i = 0; i < resCards.length; i++) {
                connection.query(
                  "UPDATE whitecards SET free = ? WHERE id = ?",
                  [0, resCards[i].id],
                  (err, res) => {
                    if (err) {
                      console.log(err);
                    }
                  }
                );

                connection.query(
                  "INSERT INTO distribution (login,whitecard) VALUES ( ? , ? )",
                  [resLogin[j].id, resCards[i].id],
                  (err, res) => {
                    if (err) {
                      console.log(err);
                    }
                  }
                );
              }
            }
          );
        }, 100 * j);
      }
    }
  );
}

// helper
const resetWhiteCards = () => {
  connection.query(
    "UPDATE whitecards SET free = ?",
    [1],
    (err, res, fields) => {
      if (err) {
        console.log(err);
      }
    }
  );
};
const clearDistribution = () => {
  connection.query("DELETE FROM distribution", (err, res, fields) => {
    if (err) {
      console.log(err);
    }
  });
};

const resetBlackCards = () => {
  connection.query(
    "UPDATE blackcards SET free = ?",
    [1],
    (err, res, fields) => {
      if (err) {
        console.log(err);
      }
    }
  );
};

const resetUserPoints = login => {
  if (login === undefined) {
    connection.query("UPDATE users SET points=?", [0], (err, res, fields) => {
      if (err) {
        console.log(err);
      }
    });
  } else {
    connection.query(
      "UPDATE users SET points = ? WHERE login = ?",
      [0, login],
      (err, res, fields) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }
};
