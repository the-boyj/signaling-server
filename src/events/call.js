const dial = socket => () => {
  socket.emit('created', 'created success');
};

const accept = socket => (deviceToken) => {
  socket.join(deviceToken);
};

module.exports = { dial, accept };
