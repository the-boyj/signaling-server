// evaluate to true if it is not null, undefined, NaN, empty string, 0, false
const isValidData = data => data && data.room;

// get the number of participants in the room
const getParticipantsCount = ({ io, room }) => {
  const participants = io.sockets.adapter.rooms[room];
  return participants ? Object.keys(participants.sockets).length : 0;
};

// If the number of participants in the room is 1, this room is waiting callee.
const isWaitingCallee = ({ io, room }) => getParticipantsCount({ io, room }) === 1;

// If the number of participants in the room is 2, this room has fully participants.
const hasFullParticipants = ({ io, room }) => getParticipantsCount({ io, room }) === 2;

const preparedToReady = ({ io, room }) => isValidData({ io, room })
  && hasFullParticipants({ io, room });

const dial = () => socket => (data) => {
  if (isValidData(data)) {
    socket.emit('created', data);
  } else {
    socket.emit('peer_error', data);
  }
};

const defaultAccept = canBeReady => io => () => ({ room }) => {
  if (canBeReady({ io, room })) {
    io.in(room).emit('ready');
  } else {
    io.in(room).emit('serverError', { description: 'Connection failed' });
  }
};

const accept = defaultAccept(preparedToReady);

const reject = io => () => ({ room }) => {
  io.in(room).emit('bye');
};

const defaultAwaken = canParticipate => io => socket => ({ room }) => {
  if (canParticipate({ io, room })) {
    socket.join(room);
  } else {
    socket.emit('serverError', { description: 'Connection failed' });
  }
};

const awaken = defaultAwaken(isWaitingCallee);

const helper = { defaultAwaken, defaultAccept, isWaitingCallee, preparedToReady };

module.exports = { helper, dial, accept, reject, awaken };
