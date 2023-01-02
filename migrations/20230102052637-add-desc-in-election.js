"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // add description column to elections table
    await queryInterface.addColumn("Elections", "description", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    // add status column to elections table
    await queryInterface.addColumn("Elections", "status", {
      type: Sequelize.ENUM("active", "inactive"),
      defaultValue: "inactive",
    });
    // add userId column to elections table
    await queryInterface.addColumn("Elections", "userId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // remove description column from elections table
    await queryInterface.removeColumn("Elections", "description");
    // remove status column from elections table
    await queryInterface.removeColumn("Elections", "status");
    // remove userId column from elections table
    await queryInterface.removeColumn("Elections", "userId");
  },
};
