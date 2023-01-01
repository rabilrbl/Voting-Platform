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
      // this.hasMany(models.Ballots, { foreignKey: 'electionId' });
    }
  }
  Elections.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
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