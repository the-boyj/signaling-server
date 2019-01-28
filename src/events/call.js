// evaluate to true if it is not null, undefined, NaN, empty string, 0, false
const isValidData = data => data && data.room;

const dial = socket => (data) => {
  if (isValidData(data)) {
    socket.emit('created', data);
  } else {
    socket.emit('peer_error', data);
  }
};

const accept = socket => (deviceToken) => {
  socket.join(deviceToken);
};

module.exports = { dial, accept };
