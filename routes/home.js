const express = require("express");
const home = express.Router();
var path = require("path");
//DB connection
const connection = require("../config/mysql-connection");

//game setup
let numberOfPlayers;
let master;
let gameStarted = false;
let player;

//routing
home.get("/", (req, res, next) => {
  if (gameStarted === true && req.session.loggedin) {
    //
    return res.render("game", {
      user: req.session.ids
    });
    //return res.sendFile(path.resolve("./views/game.html"));
  } else if (req.session.loggedin) {
    return res.sendFile(path.resolve("./views/home.html"));
  } else {
    res.send("Please login to view this page!");
  }
  res.end();
});

home.get("/newGame", (req, res, next) => {
  if (req.session.loggedin) {
    return res.sendFile(path.resolve("./views/newGame.html"));
  } else {
    res.send("Please login to view this page!");
  }
  res.end();
});

home.post("/newGame", async (req, res, next) => {
  if (!req.session.loggedin) {
    res.send("Please login to view this page!");
  } else {
    if (req.body.reset === "Reset All") {
      clearDistribution();
      resetUserPoints();
      resetWhiteCards();
      resetBlackCards();
    }
    // } else if (req.body.resetDark) {
    // } else if (req.body.resetWhite) {
    // } else {
    // }
  }
  await newGameSetUp(Number(req.body.cards));

  // newGameCardsDeal(numberOfPlayers, req.session.ids);
  res.redirect("/home");
  res.end();
});
home.get("/logout", (req, res, next) => {
  // destroying session === clear succession && clear points
  clearSuccession(req.session.login);
  resetUserPoints(req.session.login);

  req.session.destroy(err => {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
});

module.exports = home;

// helper functions
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

const clearSuccession = async login => {
  let id;
  connection.query(
    "SELECT * FROM users WHERE login = ?",
    [login],
    (err, res) => {
      if (err) {
        console.log(err);
      }
      id = res[0].succession;
    }
  );
  const interval = setInterval(() => {
    if (id !== undefined) {
      clearInterval(interval);
      connection.query(
        "UPDATE succession SET captured = ? WHERE id = ?",
        [0, id],
        (err, res) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
  }, 10);

  connection.query(
    "UPDATE users SET succession = ? WHERE login = ?",
    [0, login],
    (err, res, fields) => {
      if (err) {
        console.log(err);
      }
    }
  );
};

async function newGameSetUp(numberOfCards) {
  gameStarted = true;
  connection.query(
    "SELECT id,login,succession FROM users WHERE succession > 0",
    (err, resLogin, fields) => {
      if (err) {
        console.log(err);
      }
      numberOfPlayers = resLogin.length;
      master = resLogin[0].succession;

      // for each user
      for (let j = 0; j < resLogin.length; j++) {
        setTimeout(() => {
          connection.query(
            "SELECT * FROM whitecards WHERE free = ? ORDER BY RAND() LIMIT  ?",
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
