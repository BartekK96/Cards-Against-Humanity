const express = require("express");
const login = express.Router();
const path = require("path");
const connection = require("../config/mysql-connection");

login.get("/", (req, res, next) => {
  res.sendFile(path.resolve("./views/login.html"));
});

login.post("/", (req, res, next) => {
  const login = req.body.login;
  const password = req.body.password;
  if (login && password) {
    connection.query(
      "SELECT * FROM users WHERE login = ? AND password = ?",
      [login, password],
      (err, response, fields) => {
        if (err) {
          console.log(err);
        }
        if (response.length > 0) {
          const id = response[0].id;
          req.session.loggedin = true;
          req.session.login = login;
          req.session.ids = id;

          connection.query(
            "SELECT * FROM succession WHERE captured = ?",
            [0],
            (successionErr, successionResponse, successionfields) => {
              if (successionErr) {
                console.log(successionErr);
              }
              if (successionResponse.length > 0) {
                connection.query(
                  "UPDATE users SET succession = ? WHERE login = ?",
                  [successionResponse[0].succession, login],
                  (err, res, fields) => {
                    if (err) {
                      console.log(err);
                    }
                  }
                );
                connection.query(
                  "UPDATE succession SET captured = ? WHERE succession = ?",
                  [1, successionResponse[0].id],
                  (err, res, fields) => {
                    if (err) {
                      console.log(err);
                    }
                  }
                );
                res.redirect("/home");
              } else {
                res.send("No place!");
              }
            }
          );
        } else {
          res.send("Incorrect Username and/or Password!");
        }
        //  res.end();
        // next();
      }
    );
  } else {
    res.send("Please enter Username and Password!");
    res.end();
  }
});

module.exports = login;
