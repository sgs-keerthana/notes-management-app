'use strict';
module.exports ={
  async up(queryInterface) {
    await queryInterface.sequelize.query(`SELECT 1;`);
  },
  async down(){

  },
};

