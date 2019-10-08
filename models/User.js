const Sequelize = require("sequelize");
const db = require("../config/mysql-connection");

const User = db.define("users", {
  login: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING
  },
  succession: {
    type: Sequelize.INTEGER
  },
  points: {
    type: Sequelize.INTEGER
  }
});

module.exports = User;
