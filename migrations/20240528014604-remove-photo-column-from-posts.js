'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Posts', 'photo');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Posts', 'photo', {
      type: Sequelize.STRING,
      allowNull: true, 
    });
  }
};
