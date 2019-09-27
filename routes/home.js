const express = require("express");
const home = express.Router();
var path = require("path");
const connection = require("../config/mysql-connection");

//game setup
let numberOfPlayers;
let master;

home.get("/home", (req, res, next) => {
  if (req.session.loggedin) {
    return res.sendFile(path.resolve("./views/home.html"));
  } else {
    res.send("Please login to view this page!");
  }
  res.end();
});

home.get("/home/newGame", (req, res, next) => {
  if (req.session.loggedin) {
    return res.sendFile(path.resolve("./views/newGame.html"));
  } else {
    res.send("Please login to view this page!");
  }
  res.end();
});

home.post("/home/newGame", (req, res, next) => {
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
  newGameSetUp();
  res.redirect("/home");
  res.end();
});
home.get("/home/logout", (req, res, next) => {
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
    console.log(id);
    if (id !== undefined) {
      clearInterval(interval);
      connection.query(
        "UPDATE succession SET captured = ? WHERE id = ?",
        [0, id],
        (err, res) => {
          if (err) {
            console.log(err);
          }
          console.log(res);
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

const newGameSetUp = () => {
  connection.query(
    "SELECT login FROM users WHERE succession > 0",
    (err, res, fields) => {
      if (err) {
        console.log(err);
      }
      numberOfPlayers = res.length;
      master = res[0].login;

      for (let i = 0; i < numberOfPlayers; i++) {
        connection;
        console.log(res[i].login);
      }
    }
  );
};
