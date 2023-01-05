'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // add electionId column to questions table
    await queryInterface.addColumn("Questions", "electionId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Elections",
        key: "id",
      },
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // remove electionId column from questions table
    await queryInterface.removeColumn("Questions", "electionId");
  }
};
