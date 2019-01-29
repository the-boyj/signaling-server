// evaluate to true if it is not null, undefined, NaN, empty string, 0, false
const isValidCandidate = candidate => candidate && candidate.deviceToken;

const sice = ({ socket: sender }) => (candidate) => {
  if (isValidCandidate(candidate)) {
    const receivers = sender.to(candidate.deviceToken);
    receivers.emit('rice', candidate);
  } else {
    sender.emit('peer_error', candidate);
  }
};

module.exports = { sice };
