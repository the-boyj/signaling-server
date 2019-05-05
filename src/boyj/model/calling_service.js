/* eslint-disable object-curly-newline */
import { Callings } from './models';
import {
  sequelize,
  Sequelize,
} from './data_source';

const joinInThisCalling = ({
  roomId,
  userId,
}) => sequelize.transaction({
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
}, t => Callings.create({
  roomId,
  userId,
  callingFrom: Date.now(),
}, {
  transaction: t,
}).then(resp => resp.dataValues));

/**
 * userId를 제외하고 room에 참여중인 다른 유저들 목록을 반환
 * userId가 room에 참여하는 것을 포함하며
 * 이 과정에서 동기화를 위해 SERIALIZABLE isolation level의 transaction을 사용.
 * https://en.wikipedia.org/wiki/Isolation_(database_systems)
 *
 * @param roomId
 * @param userId
 */
const findUsersInThisCallingWithJoining = ({
  roomId,
  userId,
}) => sequelize.transaction({
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
}, async (t) => {
  const usersInThisCalling = await Callings.findAll({
    attributes: [
      [Sequelize.fn('DISTINCT', Sequelize.col('user_id')), 'userId'],
    ],
    where: {
      roomId,
      userId: {
        [Sequelize.Op.not]: userId,
      },
      callingTo: null,
    },
    lock: true,
    transaction: t,
  }).then(entries => entries.reduce((arr, entry) => {
    const { dataValues: user } = entry;
    arr.push(user);
    return arr;
  }, []));

  await Callings.create({
    roomId,
    userId,
    callingFrom: Date.now(),
  }, {
    transaction: t,
  });

  return usersInThisCalling;
});

const removeUserFromThisCalling = ({ userId }) => Callings.update({ callingTo: Date.now() }, {
  where: {
    userId,
    callingTo: null,
  },
});

export {
  joinInThisCalling,
  findUsersInThisCallingWithJoining,
  removeUserFromThisCalling,
};
