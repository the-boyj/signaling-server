/* eslint-disable object-curly-newline */
import { ValidationError } from 'sequelize';
import { Sequelize } from './data_source';
import { Users } from './models';

const findAllUsers = ({ except = [] }) => Users.findAll({
  where: {
    userId: {
      [Sequelize.Op.notIn]: except,
    },
  },
});

const findUserById = ({ userId }) => Users.findByPk(userId)
  .then((resp) => {
    if (!resp) {
      return null;
    }

    return resp.dataValues;
  });

const save = user => Users.create(user)
  .then(resp => resp.dataValues);

const setUserInfo = async (user) => {
  const { userId } = user;

  // eslint-disable-next-line no-param-reassign
  delete user.userId;

  return Users.update(user, {
    where: {
      userId,
    },
  }).then(() => Users.findByPk(userId))
    .then((resp) => {
      if (!resp) {
        throw new ValidationError('There is no data');
      }

      return resp.dataValues;
    });
};

export {
  findAllUsers,
  findUserById,
  save,
  setUserInfo,
};
