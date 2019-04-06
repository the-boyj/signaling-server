/**
 * 커넥션 연결 시 소켓에 매핑될 세션객체를 초기화하는 함수
 *
 * @param defaultSession
 * @returns {{user: undefined, room: undefined}}
 */
const createSession = (defaultSession) => {
  const session = {
    room: undefined,
    user: undefined,
  };
  Object.assign(session, defaultSession);
  return session;
};

/**
 * caller의 방 생성 요청 이벤트(create room)의 핸들러 함수이다.
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
 * create room 이벤트에서 에러 발생 시 에러 핸들러
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
    description: 'Invalid Create Room Payload',
    message: err.message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', payload);
};

export {
  createSession,
  createRoom,
  createRoomErrorHandler,
};
