import { Users } from './models';

const findUserById = ({ userId }) => Users.findByPk(userId)
  .then((resp) => {
    if (!resp) {
      return null;
    }

    return resp.dataValues;
  });


export { findUserById };
