"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Votes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Elections, { foreignKey: "electionId" });
      this.belongsTo(models.Questions, { foreignKey: "questionId" });
      this.belongsTo(models.Answers, { foreignKey: "answerId" });
    }

    static hasAlreadyVoted(electionId, voterId) {
      const voted = this.findOne({
        where: {
          electionId,
          voterId,
        },
      });
      return voted ? true : false;
    }
  }
  Votes.init(
    {
      voterId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      electionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Elections",
          key: "id",
        },
      },
      questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Questions",
          key: "id",
        },
      },
      answerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "Answers",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Votes",
    }
  );
  return Votes;
};
