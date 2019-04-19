const descriptionTable = {
  300: 'Internal Server Error',
  301: 'Invalid CREATE_ROOM Payload',
  302: 'Invalid DIAL Payload',
  303: 'Invalid AWAKEN Payload',
  304: 'Invalid ACCEPT Payload',
  305: 'Invalid ANSWER Payload',
  306: 'Invalid SEND_ICE_CANDIDATE Payload',
  307: 'Invalid REJECT Payload',
};

const code = {
  INTERNAL_SERVER_ERROR: 300,
  INVALID_CREATE_ROOM_PAYLOAD: 301,
  INVALID_DIAL_PAYLOAD: 302,
  INVALID_AWAKEN_PAYLOAD: 303,
  INVALID_ACCEPT_PAYLOAD: 304,
  INVALID_ANSWER_PAYLOAD: 305,
  INVALID_SEND_ICE_CANDIDATE_PAYLOAD: 306,
  INVALID_REJECT_PAYLOAD: 307,
};

class SignalingError extends Error {
  constructor(message, options = {}) {
    super();

    this.name = this.constructor.name;
    this.message = message;
    this.code = options.code || 300;
    this.description = options.description || descriptionTable[this.code];
  }
}

export {
  descriptionTable,
  code,
  SignalingError,
};
