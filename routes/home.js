const express = require("express");
const home = express.Router();

const User = require("../models/User");
const Succession = require("../models/Succession");

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
    await clearSuccession(req.session.login);
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

const clearSuccession = async login => {
  await User.findOne({ where: { login } })
    .then(async user => {
      await Succession.findOne({ where: { id: user.succession } })
        .then(async succession => {
          await succession
            .update({ captured: 0 })
            .then()
            .catch(err => {
              console.log(err);
            });
        })
        .catch(err => {
          console.log(err);
        });

      await user
        .update({ succession: 0 })
        .then()
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
};
