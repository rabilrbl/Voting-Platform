"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Elections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Users, { foreignKey: "userId" });
      this.hasMany(models.Questions, { foreignKey: "electionId" });
    }

    static async isActive(electionId) {
      const election = await this.findByPk(electionId);
      return election.status === "active";
    }

    async toggleStatus() {
      // Check if election has atleast one question and 2 answers
      const questions = await this.getQuestions();
      if (questions.length === 0) {
        throw new Error("Election must have atleast one question");
      }
      for (let question of questions) {
        const answers = await question.getAnswers();
        if (answers.length < 2) {
          throw new Error("Question must have atleast two answers");
        }
      }
      this.status = this.status === "active" ? "inactive" : "active";
      return await this.save();
    }
  }
  Elections.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: 5,
        },
      },
      description: {
        type: DataTypes.STRING,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "inactive",
      },
    },
    {
      sequelize,
      modelName: "Elections",
    }
  );
  return Elections;
};
