/* eslint-disable object-curly-newline */
import { ForeignKeyConstraintError } from 'sequelize';
import logger from '../logger';
import notification from './notification_messaging';
import { validatePayload } from './signaling_validations';
import {
  code,
  SignalingError,
} from './signaling_error';
import { findUserById } from './model/user_service';
import {
  joinInThisCalling,
  removeUserFromThisCalling,
  isCallingInThisRoom,
} from './model/calling_service';

/**
 * 커넥션 연결 시 소켓에 매핑될 세션객체를 초기화하는 함수
 *
 * @param defaultSession
 * @returns {{callerId: undefined, user: undefined, room: undefined}}
 */
const createSession = (defaultSession) => {
  const session = {
    room: undefined,
    user: undefined,
    callerId: undefined,
  };
  Object.assign(session, defaultSession);
  return session;
};

const releaseSession = async (session) => {
  const {
    io,
    room,
    user,
  } = session;

  if (room && user) {
    const timeout = await isCallingInThisRoom({
      userId: user,
      roomId: room,
    });
    const notifyEndOfCallPayload = {
      sender: user,
      timeout,
    };
    io.to(room).emit('NOTIFY_END_OF_CALL', notifyEndOfCallPayload);
  }

  // eslint-disable-next-line no-param-reassign,no-multi-assign
  session.room = session.user = session.callerId = undefined;
};

/**
 * caller의 방 생성 요청 이벤트(CREATE_ROOM)의 핸들러 함수이다.
 * 세션 생성 후 처음으로 caller 정보 및 room 정보를 받을 수 있기 때문에
 * 이를 세션 객체에 저장해둔다.
 *
 * @param session
 * @returns {Function}
 */
const createRoom = session => async (payload) => {
  validatePayload({
    payload,
    props: ['room', 'callerId'],
    options: { code: code.INVALID_CREATE_ROOM_PAYLOAD },
  });

  const {
    room,
    callerId,
  } = payload;

  const extraSessionInfo = {
    room,
    user: callerId,
  };

  Object.assign(session, extraSessionInfo);

  const { socket } = session;

  socket.join([room, `user:${callerId}`]);

  await joinInThisCalling({
    userId: callerId,
    roomId: room,
  }).catch((err) => {
    if (err instanceof ForeignKeyConstraintError) {
      throw new SignalingError(`There is no user ${callerId}.`, {
        code: code.INVALID_CREATE_ROOM_PAYLOAD,
      });
    }
    throw err;
  });
};

/**
 * caller의 통화 연결 요청(DIAL) 이벤트 핸들러이다.
 * fcm을 이용하여 상대에게 알림 요청이 되며
 * skipNotification 설정시 별 다른 행동 없이 종료된다.
 *
 * @param session
 * @returns {Function}
 */
const dialToCallee = session => async (payload) => {
  validatePayload({
    payload,
    props: ['calleeId'],
    options: { code: code.INVALID_DIAL_PAYLOAD },
  });

  const {
    calleeId,
    skipNotification = false,
  } = payload;

  if (skipNotification) {
    return;
  }

  // notification routine
  const {
    room,
    user: callerId,
  } = session;

  const callee = await findUserById({ userId: calleeId });

  if (!callee) {
    throw new Error(`There is no user data for user ${calleeId}`);
  }

  const { deviceToken } = callee;

  if (!deviceToken) {
    throw new Error(`There is no available deviceToken for user ${calleeId}`);
  }

  await notification.send({
    data: {
      room,
      callerId,
    },
    android: { priority: 'high' },
    token: deviceToken,
  });
};

/**
 * AWAKEN 이벤트의 핸들러.
 * 전화 요청을 받은 수신자가 ACK의 의미를 포함하여 서버에 최초 연결
 * 세션 객체에 유저 정보를 초기화하며
 * 전화 승인, 거절 여부와 무관하게 room에 들어가게 된다.
 *
 * @param session
 * @returns {Function}
 */
const awakenByCaller = session => (payload) => {
  validatePayload({
    payload,
    props: ['room', 'callerId', 'calleeId'],
    options: { code: code.INVALID_AWAKEN_PAYLOAD },
  });

  const {
    room,
    callerId,
    calleeId,
  } = payload;

  const extraSessionInfo = {
    room,
    callerId,
    user: calleeId,
  };

  Object.assign(session, extraSessionInfo);
};

// The socket will disconnect 100ms later.
const disconnect = (socket) => {
  setTimeout(() => {
    socket.disconnect(true);
  }, 100);
};

/**
 * 수신자의 END_OF_CALL 이벤트에 대한 핸들러.
 * 수신자를 room에서 제외시키며
 * 세션에 할당된 객체들을 해제하여 가비지컬렉션의 대상으로 만듦.
 *
 * @param session
 * @returns {Function}
 */
const byeFromClient = session => async () => {
  const {
    user,
    room,
    socket,
  } = session;

  await removeUserFromThisCalling({ userId: user });

  const endOfCallPayload = {
    sender: user,
    timeout: false,
  };

  // sender를 제외한 나머지 클라이언트에 해당 정보를 브로드캐스팅
  socket.to(room).emit('NOTIFY_END_OF_CALL', endOfCallPayload);
  socket.leave([room, `user:${user}`]);
  disconnect(socket);
};

const receiveErrorFromClient = session => (payload) => {
  const {
    room,
    user,
  } = session;

  logger.error({
    room,
    user,
    payload,
  });
};

export {
  createSession,
  releaseSession,
  createRoom,
  dialToCallee,
  awakenByCaller,
  byeFromClient,
  receiveErrorFromClient,
};
