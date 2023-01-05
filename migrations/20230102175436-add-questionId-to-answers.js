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
    // add questionId column to answers table
    await queryInterface.addColumn("Answers", "questionId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Questions",
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
    // remove questionId column from answers table
    await queryInterface.removeColumn("Answers", "questionId");
  }
};
