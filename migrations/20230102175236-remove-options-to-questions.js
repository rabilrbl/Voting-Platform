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
    // remove options column from questions table
    await queryInterface.removeColumn("Questions", "options");
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // add options column to questions table
    await queryInterface.addColumn("Questions", "options", {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      validate: {
        len: 2,
      },
    });
  }
};
