import logger from '../logger';
import redis from './model/data_source';
import notification from './notification_messaging';

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

/**
 * caller의 방 생성 요청 이벤트(CREATE_ROOM)의 핸들러 함수이다.
 * 세션 생성 후 처음으로 caller 정보 및 room 정보를 받을 수 있기 때문에
 * 이를 세션 객체에 저장해둔다.
 *
 * @param session
 * @returns {Function}
 */
const createRoom = session => (payload) => {
  if (!payload) {
    throw new Error(`Invalid payload. payload: ${payload}`);
  }

  const {
    room,
    callerId,
  } = payload;

  if (!room || !callerId) {
    throw new Error(`Invalid payload. room: ${room}, callerId: ${callerId}`);
  }

  const extraSessionInfo = {
    room,
    user: callerId,
  };

  Object.assign(session, extraSessionInfo);

  const { socket } = session;

  socket.join(room);
};

/**
 * CREATE_ROOM 이벤트에서 에러 발생 시 에러 핸들러
 * payload의 validation 에러 외에는 발생하지 않으므로
 * 잘못된 payload 에러를 전달한다.
 *
 * @param err
 * @param context
 */
const createRoomErrorHandler = (err, context) => {
  const { session } = context;
  const { socket } = session;
  const payload = {
    code: 301,
    description: 'Invalid CREATE_ROOM Payload',
    message: err.message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', payload);
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
  // TODO: session, payload 유효성 검사 로직 분리 필요.
  if (!payload) {
    throw new Error(`Invalid payload. payload: ${payload}`);
  }

  const {
    calleeId,
    skipNotification = false,
  } = payload;

  if (!calleeId) {
    throw new Error(`Invalid payload. calleeId: ${calleeId}`);
  }

  if (skipNotification) {
    return;
  }

  // notification routine
  const {
    room,
    user: callerId,
  } = session;

  if (!room || !callerId) {
    throw new Error(`The session is not initialized. room: ${room}, user: ${callerId}`);
  }

  // TODO: 유저 정보 연동 로직 -> 서비스 레이어로 추상화 필요(RESTful api위해)
  const callee = await redis.hgetallAsync(`user:${calleeId}`);

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
 * 통화 요청 이벤트(DIAL)의 에러 핸들러
 * 잘못된 payload의 경우 302 에러를 보내며
 * 그 외의 경우에는 알 수 없는 서버 에러로 전달하게 된다.
 *
 * @param err
 * @param context
 */
const dialToCalleeErrorHandler = (err, context) => {
  const { message } = err;
  const { session } = context;
  const { socket } = session;

  // TODO: 이후 Error를 상속한 다른 에러 클래스로 분기 필요
  const isPayloadError = /^Invalid payload\.*/.test(message);
  const payload = {
    code: isPayloadError ? 302 : 300,
    description: isPayloadError ? 'Invalid DIAL Payload' : 'Internal Server Error',
    message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', payload);
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
  if (!payload) {
    throw new Error(`Invalid payload. payload: ${payload}`);
  }

  const {
    room,
    callerId,
    calleeId,
  } = payload;

  if (!room || !callerId || !calleeId) {
    throw new Error(`Invalid payload. room: ${room}, callerId: ${callerId}, calleeId: ${calleeId}`);
  }

  const extraSessionInfo = {
    room,
    callerId,
    user: calleeId,
  };

  Object.assign(session, extraSessionInfo);
};

/**
 * AWAKEN 이벤트의 에러 헨들러.
 * 해당 이벤트 핸들러의 에러는 payload의 유효성 검사 과정에서 발생하는것이 전부이므로
 * 잘못된 Awaken Payload에 해당하는 에러 메시지만 전달하게 된다.
 *
 * @param err
 * @param context
 */
const awakenByCallerErrorHandler = (err, context) => {
  const { session } = context;
  const { socket } = session;
  const { message } = err;
  const payload = {
    code: 303,
    description: 'Invalid AWAKEN Payload',
    message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', payload);
};

/**
 * 수신자의 END_OF_CALL 이벤트에 대한 핸들러.
 * 수신자를 room에서 제외시키며
 * 세션에 할당된 객체들을 해제하여 가비지컬렉션의 대상으로 만듦.
 *
 * @param session
 * @returns {Function}
 */
const byeFromClient = session => () => {
  const {
    user,
    room,
    socket,
  } = session;

  if (!user || !room) {
    throw new Error(`Session is not initialized. user: ${user}, room: ${room}`);
  }

  const endOfCallPayload = { sender: user };

  // sender를 제외한 나머지 클라이언트에 해당 정보를 브로드캐스팅
  socket.to(room).emit('NOTIFY_END_OF_CALL', endOfCallPayload);
  socket.leave();

  // eslint-disable-next-line
  session.user = session.callerId = session.room = session.socket = session.io = undefined;
};

const byeFromClientErrorHandler = (err, context) => {
  const { message } = err;
  const { session } = context;
  const { socket } = session;
  const payload = {
    code: 300,
    description: 'Internal Server Error',
    message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', payload);
};

const receiveErrorFromClient = session => (payload) => {
  logger.error(session, payload);
};

export {
  createSession,
  createRoom,
  createRoomErrorHandler,
  dialToCallee,
  dialToCalleeErrorHandler,
  awakenByCaller,
  awakenByCallerErrorHandler,
  byeFromClient,
  byeFromClientErrorHandler,
  receiveErrorFromClient,
};
