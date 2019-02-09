import * as uuid from 'uuid';
import * as manager from '../firebase/manager';

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

const preparedToRtcCall = ({ io, room }) => isValidData({ io, room })
  && hasFullParticipants({ io, room });

const dial = ({ socket: caller, weakMap }) => ({ deviceToken }) => {
  if (isValidData(deviceToken)) {
    const room = uuid.v1();
    caller.join(room);
    weakMap.set(caller, { room });
    // send fcm message for callee to wake up. (using room)
    manager
      .send({
        data: { room },
        android: { priority: 'high' },
        token: deviceToken,
      })
      .then((response) => {
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        caller.emit('serverError', { description: error.message });
        caller.leave(room);
        weakMap.delete(caller);
      });
  } else {
    caller.emit('serverError', { description: `Invalid device token. ${deviceToken}` });
  }
};

const defaultAwaken = canParticipate => ({
  io, socket: callee, weakMap,
}) => ({ room }) => {
  if (canParticipate({ io, room })) {
    const caller = callee.to(room);
    caller.emit('created');
    callee.join(room);
    weakMap.set(callee, { room });
    callee.emit('knock');
  } else {
    callee.emit('serverError', { description: 'Connection failed' });
  }
};

const awaken = defaultAwaken(isWaitingCallee);

const defaultAccept = canBeReady => ({
  io, socket: callee, weakMap,
}) => () => {
  const { room } = weakMap.get(callee);
  if (canBeReady({ io, room })) {
    io.in(room).emit('ready');
  } else {
    io.in(room).emit('serverError', { description: 'Connection failed' });
  }
};

const accept = defaultAccept(preparedToRtcCall);

const reject = ({
  io, socket: callee, weakMap,
}) => () => {
  const { room } = weakMap.get(callee);
  io.in(room).emit('bye');
};

const helper = { defaultAwaken, defaultAccept };

module.exports = { helper, dial, awaken, accept, reject };
