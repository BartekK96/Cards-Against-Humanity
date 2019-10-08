const express = require("express");
const home = express.Router();
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

home.get("/newGame", (req, res, next) => {
  if (req.session.loggedin) {
    return res.render("newGame");
  } else {
    res.send("Please login to view this page!");
  }
  res.end();
});
home.post("/newGame", (req, res, next) => {
  if (req.session.loggedin) {
    res.redirect("/home");
    res.end();
  } else {
    res.send("Please login to view this page!");
    res.end();
  }
});

home.get("/logout", async (req, res, next) => {
  // destroying session === clear succession && clear points
  if (req.session.loggedin) {
    // await clearSuccession(req.session.login);
    await resetUserPoints(req.session.login);

    req.session.destroy(err => {
      if (err) {
        console.log(err);
      }
      res.redirect("/");
    });
  }
});

module.exports = home;

// helper functions
// need to add sequelize
const resetUserPoints = async login => {
  if (login !== undefined) {
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
