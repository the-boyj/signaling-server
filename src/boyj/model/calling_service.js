import { Callings } from './models';
import {
  sequelize,
  Sequelize,
} from './data_source';

const { REPEATABLE_READ } = Sequelize.Transaction.ISOLATION_LEVELS;

/**
 * userId를 제외하고 room에 참여중인 다른 유저들 목록을 반환
 * userId가 room에 참여하는 것을 포함하며
 * 이 과정에서 동기화를 위해 REPEATABLE_READ isolation level의 transaction을 사용.
 *
 * @param roomId
 * @param userId
 * @returns {Promise<T>}
 */
const findUsersInThisCallingAfterJoining = ({
  roomId,
  userId,
}) => sequelize.transaction({ isolationLevel: REPEATABLE_READ },
  async (t) => {
    await Callings.create({
      room_id: roomId,
      user_id: userId,
      calling_from: Date.now(),
    }, { lock: t });

    const usersInThisRoomQuery = `
SELECT distinct user_id
  FROM callings
 WHERE room_id = :room_id
   AND user_id <> :user_id
   AND calling_to is NULL
    `;

    const usersInThisRoomPromise = sequelize.query(usersInThisRoomQuery, {
      replacements: {
        room_id: roomId,
        user_id: userId,
      },
      type: Sequelize.QueryTypes.SELECT,
      model: Callings,
      mapToModel: true,
    }, { lock: t });

    return usersInThisRoomPromise
      .then(resp => resp.reduce((acc, entry) => {
        const { dataValues: user } = entry;
        acc.push(user);
        return acc;
      }, []));
  });

const removeUserFromThisCalling = ({ userId }) => Callings.update({ calling_to: Date.now() }, {
  where: {
    user_id: userId,
    calling_to: null,
  },
});

export {
  findUsersInThisCallingAfterJoining,
  removeUserFromThisCalling,
};
