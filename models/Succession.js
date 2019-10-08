const Sequelize = require("sequelize");
const db = require("../config/mysql-connection");

const Succession = db.define("succession", {
  succession: {
    type: Sequelize.INTEGER
  },
  captured: {
    type: Sequelize.TINYINT
  }
});

module.exports = Succession;
