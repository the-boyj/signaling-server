/**
 * ACCEPT 이벤트의 핸들러
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

  socket.join(room);

  const relayOfferPayload = {
    sender: user,
    sdp,
  };

  // 송신자를 제외한 나머지 클라이언트에 브로드캐스팅
  socket.to(room).emit('RELAY_OFFER', relayOfferPayload);
};

/**
 * ACCEPT 이벤트의 에러 핸들러
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
    description: 'Invalid ACCEPT Payload',
    message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', payload);
};

/**
 * REJECT 이벤트 핸들러
 *
 * @param session
 * @returns {Function}
 */
const rejectFromCallee = session => (payload) => {
  if (!payload) {
    throw new Error(`Invalid payload. payload: ${payload}`);
  }

  const { receiver } = payload;

  if (!receiver) {
    throw new Error(`Invalid payload. receiver: ${receiver}`);
  }

  const {
    user,
    socket,
  } = session;

  const notifyRejectPayload = {
    sender: user,
    receiver,
  };

  // TODO: 세션 유효성 검사 필요.
  socket.to(`user:${receiver}`).emit('NOTIFY_REJECT', notifyRejectPayload);
};

/**
 * REJECT 이벤트의 에러 핸들러
 *
 * @param err
 * @param context
 */
const rejectFromCalleeErrorHandler = (err, context) => {
  const { message } = err;
  const { session } = context;
  const { socket } = session;
  const errorPayload = {
    code: 307,
    description: 'Invalid REJECT Payload',
    message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', errorPayload);
};

/**
 * ANSWER 이벤트 핸들러
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
    sender: user,
  };

  socket.to(`user:${receiver}`).emit('RELAY_ANSWER', relayAnswerPayload);
};

/**
 * ANSWER 이벤트의 에러 핸들러
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
    description: 'Invalid ANSWER Payload',
    message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', errorPayload);
};

/**
 * SEND_ICE_CANDIDATE 이벤트 핸들러
 *
 * @param session
 * @returns {Function}
 */
const iceCandidateFromClient = session => (payload) => {
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

  const relayIceCandidatePayload = {
    iceCandidate,
    sender: user,
  };

  socket.to(`user:${receiver}`).emit('RELAY_ICE_CANDIDATE', relayIceCandidatePayload);
};

/**
 * send icecandidate 이벤트의 에러 핸들러
 *
 * @param err
 * @param context
 */
const iceCandidateFromClientErrorHandler = (err, context) => {
  const { message } = err;
  const { session } = context;
  const { socket } = session;
  const errorPayload = {
    code: 306,
    description: 'Invalid SEND_ICE_CANDIDATE Payload',
    message,
  };

  socket.emit('SERVER_TO_PEER_ERROR', errorPayload);
};

export {
  acceptFromCallee,
  acceptFromCalleeErrorHandler,
  rejectFromCallee,
  rejectFromCalleeErrorHandler,
  answerFromClient,
  answerFromClientErrorHandler,
  iceCandidateFromClient,
  iceCandidateFromClientErrorHandler,
};
