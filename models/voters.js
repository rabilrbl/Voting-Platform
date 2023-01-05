"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Voters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Elections, { foreignKey: "electionId" });
    }
  }
  Voters.init(
    {
      voterId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "Voter ID already exists",
        },
        validate: {
          notEmpty: {
            msg: "Voter ID cannot be empty",
          },
          notNull: true,
          len: 3,
        },
      },
      password: {
        type: DataTypes.STRING,
      },
      electionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Elections",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Voters",
    }
  );
  return Voters;
};
