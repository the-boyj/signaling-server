// It is a handler of 'echo' event. (The event name is echo)
const echo = () => socket => (data) => {
  socket.emit('echo', data);
};

// module.exports must have event handlers.
module.exports = { echo };
