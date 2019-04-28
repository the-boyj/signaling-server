import {
  Sequelize,
  sequelize,
} from './data_source';

const Users = sequelize.define('users', {
  user_id: {
    type: Sequelize.STRING(45),
    primaryKey: true,
    allowNull: false,
  },
  device_token: { type: Sequelize.STRING(1000) },
  name: { type: Sequelize.STRING(100) },
}, { timestamps: false });

const Callings = sequelize.define('callings', {
  room_id: {
    type: Sequelize.STRING(45),
    allowNull: false,
  },
  user_id: {
    type: Sequelize.STRING(45),
    allowNull: false,
  },
  seq: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  calling_from: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  calling_to: { type: Sequelize.DATE },
}, { timestamps: false });

Users.hasMany(Callings);
Callings.belongsTo(Users);

export {
  Users,
  Callings,
};
