const Sequelize = require("sequelize");
const db = require("../config/mysql-connection");

const Black = db.define("blackcards", {
  description: {
    type: Sequelize.STRING
  },
  free: {
    type: Sequelize.BOOLEAN
  }
});

module.exports = Black;
