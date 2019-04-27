import { validatePayload } from './signaling_validations';
import { code } from './signaling_error';

/**
 * ACCEPT 이벤트의 핸들러
 *
 * @param session
 * @returns {Function}
 */
const acceptFromCallee = session => (payload) => {
  validatePayload({
    payload,
    props: ['sdp'],
    options: { code: code.INVALID_ACCEPT_PAYLOAD },
  });

  const { sdp } = payload;

  const {
    user,
    room,
    socket,
  } = session;

  const relayOfferPayload = {
    sender: user,
    sdp,
  };

  socket.join([room, `user:${user}`]);

  // 송신자를 제외한 나머지 클라이언트에 브로드캐스팅
  socket.to(room).emit('RELAY_OFFER', relayOfferPayload);
};

/**
 * REJECT 이벤트 핸들러
 *
 * @param session
 * @returns {Function}
 */
const rejectFromCallee = session => (payload) => {
  validatePayload({
    payload,
    props: ['receiver'],
    options: { code: code.INVALID_REJECT_PAYLOAD },
  });

  const { receiver } = payload;

  const {
    user,
    socket,
  } = session;

  const notifyRejectPayload = {
    sender: user,
    receiver,
  };

  socket.to(`user:${receiver}`).emit('NOTIFY_REJECT', notifyRejectPayload);
};

/**
 * ANSWER 이벤트 핸들러
 *
 * @param session
 * @returns {Function}
 */
const answerFromClient = session => (payload) => {
  validatePayload({
    payload,
    props: ['sdp', 'receiver'],
    options: { code: code.INVALID_ANSWER_PAYLOAD },
  });

  const {
    sdp,
    receiver,
  } = payload;

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
 * SEND_ICE_CANDIDATE 이벤트 핸들러
 *
 * @param session
 * @returns {Function}
 */
const iceCandidateFromClient = session => (payload) => {
  validatePayload({
    payload,
    props: ['iceCandidate', 'receiver'],
    options: { code: code.INVALID_SEND_ICE_CANDIDATE_PAYLOAD },
  });

  const {
    iceCandidate,
    receiver,
  } = payload;

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

export {
  acceptFromCallee,
  rejectFromCallee,
  answerFromClient,
  iceCandidateFromClient,
};
