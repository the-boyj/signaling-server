import {
  SignalingError,
  code as errorCode,
  descriptionTable,
} from './signaling_error';
import logger from '../logger';

/**
 * 시그널링 이벤트 핸들러에서 에러 발생시의 에러 핸들러
 * 정의된 에러의 경우 해당 에러 코드(30x)와 그에 대한 설명,
 * 그 외의 경우 기본 에러 코드(300)과 그에 대한 설명이 상대에 전달된다.
 *
 * @param err: 발생된 에러 객체
 * @param context: session, payload 등을 갖고있는 컨텍스트 객체
 */
const signalingErrorHandler = (err, context) => {
  const code = (err instanceof SignalingError)
    ? err.code
    : errorCode.INTERNAL_SERVER_ERROR;
  const description = (err instanceof SignalingError)
    ? err.description
    : descriptionTable[code];
  const { message } = err;
  const { session } = context;
  const {
    socket,
    room,
    user,
  } = session;

  logger.error({
    err,
    room,
    user,
  });

  socket.emit('SERVER_TO_PEER_ERROR', {
    code,
    description,
    message,
  });
};

export default signalingErrorHandler;
