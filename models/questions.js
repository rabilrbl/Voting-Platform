'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Questions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Elections, { foreignKey: 'electionId' });
      this.hasMany(models.Answers, { foreignKey: 'questionId' });
    }
  }
  Questions.init({
    question: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    electionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Elections',
        key: 'id',
      },
    },
  }, {
    sequelize,
    modelName: 'Questions',
  });
  return Questions;
};