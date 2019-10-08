const Sequelize = require("sequelize");
const db = require("../config/mysql-connection");

const White = db.define("whitecards", {
  description: {
    type: Sequelize.STRING
  },
  free: {
    type: Sequelize.BOOLEAN
  }
});

module.exports = White;
