'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

  }
  Users.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'First name is required'
        },
        len: {
          args: 3,
          msg: 'First name must be at least 3 characters'
        },
        notEmpty: {
          msg: 'First name is required'
        },
      },
    },
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Email is required'
        },
        isEmail: {
          msg: 'Email is not valid'
        },
        notEmpty: {
          msg: 'Email is required'
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Password is required'
        },
        notEmpty: {
          msg: 'Password is required'
        },
        
      },
    }
  }, {
    sequelize,
    modelName: 'Users',
  });
  return Users;
};