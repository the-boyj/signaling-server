/* eslint-disable no-prototype-builtins */
import { SignalingError, code } from './signaling_error';

/**
 * 유효성 규칙들.
 * payload의 각 property를 키값으로 해당 property에 대한 유효성 검증 로직을 갖는다.
 */
const rules = {
  room: (payload, prop) => !payload.hasOwnProperty(prop) || !payload[prop],
  callerId: (payload, prop) => !payload.hasOwnProperty(prop) || !payload[prop],
  calleeId: (payload, prop) => !payload.hasOwnProperty(prop) || !payload[prop],
  sender: (payload, prop) => !payload.hasOwnProperty(prop) || !payload[prop],
  receiver: (payload, prop) => !payload.hasOwnProperty(prop) || !payload[prop],
  sdp: (payload, prop) => !payload.hasOwnProperty(prop) || !payload[prop],
  iceCandidate: (payload, prop) => !payload.hasOwnProperty(prop) || !payload[prop],
  DEFAULT_PROPERTY_RULE: (payload, prop) => !payload.hasOwnProperty(prop) || !payload[prop],
};

/**
 * 인자로 받은 payload의 property 각각을 정해진 규칙에 의해 유효성 검사
 *
 * @param payload
 * @param props
 * @param options
 */
const validatePayload = ({
  payload = {},
  props = [],
  options,
}) => {
  const invalidProperties = props.filter((prop) => {
    const rule = rules[prop] || rules.DEFAULT_PROPERTY_RULE;
    return rule(payload, prop);
  });

  if (invalidProperties.length === 0) {
    return;
  }

  const errorDetails = invalidProperties
    .map(prop => `${prop}: ${payload[prop]}`)
    .join(', ');
  const message = `Invalid payload. ${errorDetails}`;

  throw new SignalingError(message, options);
};

/**
 * 시그널링 이벤트 핸들링에 앞서 세션의 초기화 여부를 확인.
 *
 * @param callback
 * @returns {function(*=): Function}
 */
const withSession = callback => session => async (payload) => {
  const {
    user,
    room,
  } = session;

  if (!user || !room) {
    throw new SignalingError('Session is not initialized', {
      options: { code: code.INTERNAL_SERVER_ERROR },
    });
  }

  await callback(session)(payload);
};

export {
  validatePayload,
  withSession,
};
