// It is a handler of 'echo' event. (The event name is echo)
const echo = () => socket => (data) => {
  socket.emit('echo', data);
};

const serverError = () => socket => (data) => {
  socket.emit('serverError', data);
};

const peerError = () => socket => (data) => {
  socket.emit('peerError', data);
};

const log = () => socket => (data) => {
  socket.emit('log', data);
};
// module.exports must have event handlers.
module.exports = { echo, serverError, peerError, log };
