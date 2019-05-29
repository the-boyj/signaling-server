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

const lastRoomIdQuery = `
SELECT DISTINCT room_id as roomId
  FROM callings
 WHERE (user_id, calling_from) = (
     SELECT user_id, max(calling_from) as calling_from
       FROM callings
      WHERE user_id = :userId
     GROUP BY user_id
 )
`;

const findLastRoomWithSetupCalling = ({ userId }) => sequelize.transaction({
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
}, async (t) => {
  const lastRoomId = await sequelize.query(lastRoomIdQuery, {
    replacements: { userId },
    type: Sequelize.QueryTypes.SELECT,
    transaction: t,
  }).then((resp) => {
    if (resp.length !== 1) {
      return null;
    }
    return resp[0].roomId;
  });

  if (!lastRoomId) {
    return null;
  }

  await Callings.update({ callingTo: null }, {
    where: {
      userId,
      roomId: lastRoomId,
    },
    transaction: t,
  });

  return lastRoomId;
});

const findCallingRoomIdQuery = `
SELECT DISTINCT room_id as roomId
  FROM callings
 WHERE user_id = :userId
   AND calling_to IS NULL
`;

const isCallingIn = ({
  userId,
}) => sequelize.transaction(async (t) => {
  const callingRoomId = await sequelize.query(findCallingRoomIdQuery, {
    replacements: {
      userId,
    },
    transaction: t,
  }).then(resp => resp[0])
    .then((data) => {
      if (data.length === 0) {
        return null;
      }
      return data[0].roomId;
    });

  return callingRoomId !== null;
});

const findCallingInThisRoomQuery = `
SELECT DISTINCT room_id as roomId
  FROM callings
 WHERE user_id = :userId
   AND room_id = :roomId
   AND calling_to IS NULL
`;

const isCallingInThisRoom = ({
  userId,
  roomId,
}) => sequelize.transaction(async (t) => {
  const callingRoomId = await sequelize.query(findCallingInThisRoomQuery, {
    replacements: {
      userId,
      roomId,
    },
    transaction: t,
  }).then(resp => resp[0])
    .then((data) => {
      if (data.length === 0) {
        return null;
      }
      return data[0].roomId;
    });

  return callingRoomId === roomId;
});

export {
  joinInThisCalling,
  findUsersInThisCallingWithJoining,
  removeUserFromThisCalling,
  findLastRoomWithSetupCalling,
  isCallingIn,
  isCallingInThisRoom,
};
