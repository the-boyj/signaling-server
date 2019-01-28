// evaluate to true if it is not null, undefined, NaN, empty string, 0, false
const isValidCandidate = candidate => candidate && candidate.deviceToken;

const sice = () => socket => (candidate) => {
  if (isValidCandidate(candidate)) {
    socket.to(candidate.deviceToken).emit('rice', candidate);
  } else {
    socket.emit('peer_error', candidate);
  }
};

module.exports = { sice };
