// evaluate to true if it is not null, undefined, NaN, empty string, 0, false
const isValidData = data => data && data.room;

const dial = () => socket => (data) => {
  if (isValidData(data)) {
    socket.emit('created', data);
  } else {
    socket.emit('peer_error', data);
  }
};

const accept = () => socket => (deviceToken) => {
  socket.join(deviceToken);
};

const defaultAwaken = isWaitingCallee => io => socket => ({ room }) => {
  if (isWaitingCallee({ io, room })) {
    socket.join(room);
  } else {
    socket.emit('serverError', { description: 'Connection failed' });
  }
};

const isWaitingCallee = ({ io, room }) => {
  const clients = io.sockets.adapter.rooms[room];
  return !!(clients && Object.keys(clients.sockets).length === 1);
};

const awaken = defaultAwaken(isWaitingCallee);

const helper = { defaultAwaken, isWaitingCallee };

module.exports = { helper, dial, accept, awaken };
