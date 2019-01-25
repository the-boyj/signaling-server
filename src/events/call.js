// created, dial, awaken, accept, reject, ready, bye

const dial = socket => () => {
  socket.emit('created', 'created success');
};

const accept = socket => (deviceToken) => {
  socket.join(deviceToken);
};

module.exports = { dial, accept };
