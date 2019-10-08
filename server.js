var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
const socket = require("socket.io");
var path = require("path");
const Sequelize = require("sequelize");

// Models
const User = require("./models/User");
const Black = require("./models/BlackCard");
const White = require("./models/WhiteCard");
const Distribution = require("./models/Distribution");

//DB
const Op = Sequelize.Op;

const port = process.env.PORT || 3000;

// game settings
let master = 0;
let players = [];
let winPoints = 0;
let numberOfCards = 0;
let newGame = false;
let choosenWhite = [[], [], [], [], [], [], [], [], []];
let currentBlack = null;
let gameStarted = false;
let playersAdded = [0, 0, 0, 0, 0, 0, 0, 0, 0];
let numberOfWhiteToAdd = 0;
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
io.on("connection", async socket => {
  console.log("made socket connection", socket.id);

  // waiting for user socket
  socket.emit("allowNewGame", true);

  socket.on("newGameSetup", async data => {
    gameStarted = true;

    await clearDistribution();
    await resetUserPoints();
    await resetWhiteCards();
    await resetBlackCards();
    players = [];
    playersCards = [[], [], [], [], [], [], [], [], []];
    playersPoints = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    newGame = true;
    winPoints = data.points;
    numberOfCards = data.cards;

    await newGameSetUp(Number(numberOfCards));
    if (newGame) {
      newGame = false;

      await Black.findAll({
        order: [[Sequelize.literal("RAND()")]],
        limit: 1
      })
        .then(async black => {
          await black[0]
            .update({ free: 0 })
            .then()
            .catch(err => {
              console.log(err);
            });

          currentBlack = black[0].dataValues;
          numberOfWhiteToAdd = currentBlack.description.split("???").length - 1;

          socket.emit("firstBlack", currentBlack);
          socket.broadcast.emit("firstBlack", currentBlack);
        })
        .catch(err => {
          console.log(err);
        });

      await User.findAll({ where: { succession: { [Op.gt]: 0 } } })
        .then(async users => {
          await addPlayers(users);
        })
        .then(async () => {
          await Distribution.findAll()
            .then(async distributions => {
              for (let i = 0; i < distributions.length; i++) {
                await White.findOne({
                  where: { id: distributions[i].whiteCard }
                })
                  .then(white => {
                    playersCards[distributions[i].login - 1].push(
                      white.dataValues
                    );
                  })
                  .catch(err => console.log(err));
              }
            })
            .catch(err => {
              console.log(err);
            })
            .then(async () => {
              socket.broadcast.emit("winPoints", data.points);
              socket.emit("winPoints", data.points);

              socket.emit("firstDeal", {
                playersCards,
                master: players[master],
                players,
                numberOfWhiteToAdd
              });
              socket.broadcast.emit("firstDeal", {
                playersCards,
                master: players[master],
                players,
                numberOfWhiteToAdd
              });
            });
        })
        .catch(err => {
          console.log(err);
        });
    }
  });

  socket.on("putWhiteCard", async data => {
    await White.findAll({
      order: [[Sequelize.literal("RAND()")]],
      limit: 1
    })
      .then(async white => {
        white[0]
          .update({ free: 0 })
          .then()
          .catch(err => {
            console.log(err);
          });

        const index = playersCards[data.id - 1].indexOf(
          playersCards[data.id - 1].find(card => {
            return card.description === data.card;
          })
        );

        card = playersCards[data.id - 1].splice(index, 1);
        choosenWhite[data.id - 1].push(card);
        playersCards[data.id - 1].push(white[0].dataValues);

        playersAdded[data.id - 1]++;

        if (
          playersAdded.reduce((a, b) => a + b, 0) ===
          (players.length - 1) * numberOfWhiteToAdd
        ) {
          socket.broadcast.emit("allWhite", choosenWhite);
          socket.emit("allWhite", choosenWhite);

          socket.emit("newWhiteDeal", playersCards);
          socket.broadcast.emit("newWhiteDeal", playersCards);
        }
      })
      .catch(err => {
        console.log(err);
      });
  });
  socket.on("whiteChoose", async data => {
    for (let i = 0; i < choosenWhite.length; i++) {
      for (let j = 0; j < choosenWhite[i].length; j++) {
        if (choosenWhite[i][j][0].description === data.card) {
          playersPoints[i]++;
          socket.emit("whiteChoose", choosenWhite[i]);
          socket.broadcast.emit("whiteChoose", choosenWhite[i]);
          choosenWhite = [[], [], [], [], [], [], [], [], []];
          break;
        }
      }
    }
    socket.emit("playersPoints", playersPoints);
    socket.broadcast.emit("playersPoints", playersPoints);
  });
  socket.on("new", async data => {
    master++;
    playersAdded = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    if (master === players.length) {
      master = 0;
    }
    let newRound = data;
    if (newRound) {
      newRound = false;
      // new round
      await Black.findAll({
        order: [[Sequelize.literal("RAND()")]],
        limit: 1
      })
        .then(async black => {
          await black[0]
            .update({ free: 0 })
            .then()
            .catch(err => {
              console.log(err);
            });
          currentBlack = black[0].dataValues;
          numberOfWhiteToAdd = currentBlack.description.split("???").length - 1;

          socket.emit("newRound", {
            numberOfWhiteToAdd,
            currentBlack,
            master: players[master]
          });
          socket.broadcast.emit("newRound", {
            numberOfWhiteToAdd,
            currentBlack,
            master: players[master]
          });
        })
        .catch(err => {
          console.log(err);
        });
    }
  });

  socket.on("refreshReq", data => {
    if (gameStarted) {
      socket.emit("gameStarted", true);
    }
    if (data && gameStarted) {
      socket.emit("refreshDeal", {
        playersCards,
        master: players[master],
        players,
        currentBlack,
        choosenWhite,
        winPoints,
        playersAdded,
        numberOfWhiteToAdd
      });
    }
  });
  socket.on("gameFinish", data => {
    console.log(data);
  });
  socket.on("disconnect", () => {
    console.log(`${socket.id} is disconected!`);
  });
});

// Helper functions

const addPlayers = async users => {
  for (let i = 0; i < users.length; i++) {
    players.push(users[i].dataValues);
  }
  shuffle(players);
};
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
  await User.findAll({ where: { succession: { [Op.gt]: 0 } } }).then(
    async users => {
      for (let i = 0; i < users.length; i++) {
        await White.findAll({
          order: [[Sequelize.literal("RAND()")]],
          limit: numberOfCards
        })
          .then(async whites => {
            for (let j = 0; j < whites.length; j++) {
              await whites[j]
                .update({ free: 0 })
                .then()
                .catch(err => {
                  console.log(err);
                });
              await Distribution.create({
                login: users[i].id,
                whiteCard: whites[j].id
              })
                .then()
                .catch(err => {
                  console.log(err);
                });
            }
          })
          .catch(err => {
            console.log(err);
          });
      }
    }
  );
}

const resetWhiteCards = async () => {
  await White.findAll({ where: { free: 0 } }).then(white => {
    for (let i = 0; i < white.length; i++) {
      white[i].update({ free: 1 });
    }
  });
};

const clearDistribution = async () => {
  await Distribution.findAll()
    .then(distributions => {
      for (let i = 0; i < distributions.length; i++) {
        distributions[i].destroy();
      }
    })
    .catch(err => console.log(err));
};

const resetBlackCards = async () => {
  await Black.findAll({ where: { free: 0 } }).then(blacks => {
    for (let i = 0; i < blacks.length; i++) {
      blacks[i].update({ free: 1 });
    }
  });
};

const resetUserPoints = async login => {
  if (login !== undefined) {
    await User.findOne({ where: { login } })
      .then(user => {
        user.update({ points: 0 });
      })
      .catch(err => {
        console.log(err);
      });
  } else {
    await User.findAll()
      .then(users => {
        for (let i = 0; i < users.length; i++) {
          users[i].update({ points: 0 });
        }
      })
      .catch(err => console.log(err));
  }
};

const finishSetup = async (setup, time) => {
  setTimeout(() => {
    console.log(setup);
  }, 1000 * time);
};
