import {
  Sequelize,
  sequelize,
} from './data_source';

const Users = sequelize.define('users', {
  userId: {
    field: 'user_id',
    type: Sequelize.STRING(45),
    primaryKey: true,
    allowNull: false,
  },
  deviceToken: {
    field: 'device_token',
    type: Sequelize.STRING(1000),
  },
  name: { type: Sequelize.STRING(100) },
}, { timestamps: false });

const Callings = sequelize.define('callings', {
  roomId: {
    field: 'room_id',
    type: Sequelize.STRING(45),
    allowNull: false,
  },
  userId: {
    field: 'user_id',
    type: Sequelize.STRING(45),
    allowNull: false,
  },
  seq: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  callingFrom: {
    field: 'calling_from',
    type: Sequelize.DATE,
    allowNull: false,
  },
  callingTo: {
    field: 'calling_to',
    type: Sequelize.DATE,
  },
}, { timestamps: false });

Users.hasMany(Callings);
Callings.belongsTo(Users);

export {
  Users,
  Callings,
};
