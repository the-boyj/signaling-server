// It is a handler of 'echo' event. (The event name is echo)
const echo = socket => (data) => {
  socket.emit('echo', data);
};

const dial = socket => () => {
  socket.emit('created', 'created success');
};

const accept = socket => (deviceToken) => {
  socket.join(deviceToken);
};

const sice = socket => (candidate) => {
  // evaluate to true if value is null, undefined, NaN, empty string, 0, false
  if (!candidate || !candidate.deviceToken) {
    socket.emit('peer_error', candidate.deviceToken);
  }
  socket.to(candidate.deviceToken).emit('rice', candidate);
};

// module.exports must have event handlers.
module.exports = { echo, dial, accept, sice };
