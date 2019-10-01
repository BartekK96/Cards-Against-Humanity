const express = require("express");
const home = express.Router();
var path = require("path");
//DB connection
const connection = require("../config/mysql-connection");

//routing
home.get("/", (req, res, next) => {
  const user = { id: req.session.ids, login: req.session.login };
  if (req.session.loggedin) {
    return res.render("game", { user });
  } else {
    res.send("Please login to view this page!");
  }
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
