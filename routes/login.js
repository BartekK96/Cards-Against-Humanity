const express = require("express");
const login = express.Router();
const User = require("../models/User");
const Succession = require("../models/Succession");

login.get("/", (req, res, next) => {
  res.render("login");
});

login.post("/", (req, res, next) => {
  const login = req.body.login;
  const password = req.body.password;
  if (login && password) {
    User.findOne({ where: { login, password } })
      .then(async user => {
        if (user) {
          const id = user.id;
          req.session.loggedin = true;
          req.session.login = login;
          req.session.ids = id;
          await Succession.findOne({ where: { captured: 0 } })
            .then(async succession => {
              if (succession) {
                await User.findOne({ where: { login, password } })
                  .then(user => {
                    if (user) {
                      user.update({
                        succession: succession.id
                      });
                    }
                  })
                  .catch(err => console.log(err));
                succession.update({ captured: 1 });

                res.redirect("/home");
              } else {
                res.send("No place!");
              }
            })
            .catch(err => console.log(err));
        } else {
          res.send("Incorrect Username and/or Password!");
        }
      })
      .catch(err => console.log(err));
  } else {
    res.send("Please enter Username and Password!");
    res.end();
  }
});

module.exports = login;
