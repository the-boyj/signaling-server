import Sequelize from 'sequelize';
import config from '../config';

const {
  schema,
  user_name: userName,
  password,
  options,
} = config.sequelize;

const sequelize = new Sequelize(schema, userName, password, options);

export {
  Sequelize,
  sequelize,
};
