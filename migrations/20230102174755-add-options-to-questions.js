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
    // add options column to questions table
    await queryInterface.addColumn("Questions", "options", {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      validate: {
        len: 2,
      },
    });
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
    // remove options column from questions table
    await queryInterface.removeColumn("Questions", "options");
    // remove electionId column from questions table
    await queryInterface.removeColumn("Questions", "electionId");
  }
};
