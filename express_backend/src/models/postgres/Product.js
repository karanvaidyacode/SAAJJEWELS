const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discountedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 4.5
  },
  reviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'products'
});

module.exports = Product;