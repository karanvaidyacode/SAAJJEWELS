const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  otp: {
    type: DataTypes.STRING
  },
  otpCreatedAt: {
    type: DataTypes.DATE
  },
  googleId: {
    type: DataTypes.STRING
  },
  firstName: {
    type: DataTypes.STRING
  },
  lastName: {
    type: DataTypes.STRING
  },
  profilePicture: {
    type: DataTypes.STRING
  },
  cart: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  timestamps: true,
  tableName: 'users'
});

// Hash password before saving
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Compare password method
User.prototype.comparePassword = async function(candidate) {
  return await bcrypt.compare(candidate, this.password);
};

// Hash password method
User.hashPassword = async function(password) {
  return await bcrypt.hash(password, 10);
};

module.exports = User;