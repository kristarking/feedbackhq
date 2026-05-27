const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, validate: { len: [2, 100] } },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async user => { user.password = await bcrypt.hash(user.password, 10); },
    beforeUpdate: async user => {
      if (user.changed('password')) user.password = await bcrypt.hash(user.password, 10);
    },
  },
});

User.prototype.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
