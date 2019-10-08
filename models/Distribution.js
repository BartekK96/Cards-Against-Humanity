const Sequelize = require("sequelize");
const db = require("../config/mysql-connection");

const Distribution = db.define("distribution", {
  login: {
    type: Sequelize.INTEGER,
    references: {
      model: "users",
      key: "id"
    }
  },
  whiteCard: {
    type: Sequelize.INTEGER,
    references: {
      model: "whitecards",
      key: "id"
    }
  }
});

module.exports = Distribution;
