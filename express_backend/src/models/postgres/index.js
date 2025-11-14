const Product = require('./Product');
const Customer = require('./Customer');
const User = require('./User');
const Order = require('./Order');

// Define associations
User.hasMany(Order, { foreignKey: 'customerId' });
Order.belongsTo(User, { foreignKey: 'customerId' });

// Export models
module.exports = {
  Product,
  Customer,
  User,
  Order
};