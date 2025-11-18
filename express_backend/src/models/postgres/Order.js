const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  customerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  customerName: {
    type: DataTypes.STRING
  },
  customerEmail: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  customerPhone: {
    type: DataTypes.STRING
  },
  shippingAddress: {
    type: DataTypes.TEXT
  },
  items: {
    type: DataTypes.JSON
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('cod', 'razorpay', 'paypal')
  },
  razorpayOrderId: {
    type: DataTypes.STRING
  },
  razorpayPaymentId: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true,
  tableName: 'orders'
});

// Generate order number before creating
Order.beforeCreate((order) => {
  if (!order.orderNumber) {
    // Generate a unique order number: SJ + timestamp + random 4 digits
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 9000) + 1000;
    order.orderNumber = `SJ-${timestamp}-${random}`;
  }
});

module.exports = Order;