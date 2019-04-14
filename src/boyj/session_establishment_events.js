/**
 * accept 이벤트의 핸들러
 *
 * @param session
 * @returns {Function}
 */
const acceptFromCallee = session => (payload) => {
  if (!payload) {
    throw new Error(`Invalid payload. payload: ${payload}`);
  }

  const { sdp } = payload;

  if (!sdp) {
    throw new Error(`Invalid payload. sdp: ${sdp}`);
  }

  // TODO: session 객체에 대한 유효성 검사 필요.
  const {
    user,
    room,
    socket,
  } = session;

  const relayOfferPayload = {
    sender: user,
    sdp,
  };

  // 송신자를 제외한 나머지 클라이언트에 브로드캐스팅
  socket.to(room).emit('relay offer', relayOfferPayload);
};

/**
 * accept 이벤트의 에러 핸들러
 *
 * @param err
 * @param context
 */
const acceptFromCalleeErrorHandler = (err, context) => {
  const { message } = err;
  const { session } = context;
  const { socket } = session;
  const payload = {
    code: 304,
    description: 'Invalid Accept Payload',
    message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', payload);
};

/**
 * reject 이벤트 핸들러
 *
 * @param session
 * @returns {Function}
 */
const rejectFromCallee = session => () => {
  const {
    room,
    user,
    socket,
  } = session;

  const byeEventPayload = { sender: user };

  // TODO: 세션 유효성 검사 필요.
  // TODO: room이 아닌 caller에 보내는게 더 좋아보임.
  socket.to(room).emit('bye', byeEventPayload);
};

/**
 * send answer 이벤트 핸들러
 *
 * @param session
 * @returns {Function}
 */
const answerFromClient = session => (payload) => {
  if (!payload) {
    throw new Error(`Invalid payload. payload: ${payload}`);
  }

  const {
    sdp,
    receiver,
  } = payload;

  if (!sdp || !receiver) {
    throw new Error(`Invalid payload. sdp: ${sdp}, receiver: ${receiver}`);
  }

  // TODO: 세션 유효성 검사 필요.
  const {
    user,
    socket,
  } = session;

  const relayAnswerPayload = {
    sdp,
    receiver,
    sender: user,
  };

  // TODO: createRoom, awaken에서 user:userId 방 생성 필요
  // TODO: bye에서 user:userId release 필요.
  socket.to(`user:${receiver}`).emit('relay answer', relayAnswerPayload);
};

/**
 * send answer 이벤트의 에러 핸들러
 *
 * @param err
 * @param context
 */
const answerFromClientErrorHandler = (err, context) => {
  const { message } = err;
  const { session } = context;
  const { socket } = session;
  const errorPayload = {
    code: 305,
    description: 'Invalid Send Answer Payload',
    message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', errorPayload);
};

/**
 * send icecandidate 이벤트 핸들러
 *
 * @param session
 * @returns {Function}
 */
const icecandidateFromClient = session => (payload) => {
  if (!payload) {
    throw new Error(`Invalid payload. payload: ${payload}`);
  }

  const {
    iceCandidate,
    receiver,
  } = payload;

  if (!iceCandidate || !receiver) {
    throw new Error(`Invalid payload. iceCandidate: ${iceCandidate}, receiver: ${receiver}`);
  }

  // TODO: 세션 유효성 검사 필요.
  const {
    user,
    socket,
  } = session;

  const relayIcecandidatePayload = {
    iceCandidate,
    receiver,
    sender: user,
  };

  // TODO: createRoom, awaken에서 user:userId 방 생성 필요
  // TODO: bye에서 user:userId release 필요.
  socket.to(`user:${receiver}`).emit('relay icecandidate', relayIcecandidatePayload);
};

/**
 * send icecandidate 이벤트의 에러 핸들러
 *
 * @param err
 * @param context
 */
const icecandidateFromClientErrorHandler = (err, context) => {
  const { message } = err;
  const { session } = context;
  const { socket } = session;
  const errorPayload = {
    code: 306,
    description: 'Invalid Send Icecandidate Payload',
    message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', errorPayload);
};

export {
  acceptFromCallee,
  acceptFromCalleeErrorHandler,
  rejectFromCallee,
  answerFromClient,
  answerFromClientErrorHandler,
  icecandidateFromClient,
  icecandidateFromClientErrorHandler,
};
