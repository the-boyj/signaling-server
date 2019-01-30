import chai from 'chai';
import * as mocha from 'mocha';
import * as uuid from 'uuid';
import * as call from '../../src/events/call';

const { describe, it } = mocha;
const { assert } = chai;

describe('Call Test', () => {
  describe('Dial Test', () => {
    it('should emit peer_error after receiving invalid data', (done) => {
      // given
      const receiver = {
        rooms: [],
        messageBox: [],
        emit: (eventName, message) => {
          const msg = { eventName, message };
          receiver.messageBox.push(msg);
        },
      };
      const invalids = [
        undefined,
        null,
        {},
        { deviceToken: null },
        { deviceToken: undefined },
        { deviceToken: '' },
      ];
      const eventName = 'serverError';
      invalids.forEach((invalid, index) => {
        // given
        const deviceToken = invalid && invalid.deviceToken;
        const expected = {
          eventName,
          message: { description: `Invalid device token. ${deviceToken}` },
        };
        // when
        call.dial({ socket: receiver })({ deviceToken });
        // then
        assert.equal(receiver.messageBox.length, index + 1);
        assert.equal(receiver.messageBox[index].eventName, eventName);
        assert.deepEqual(receiver.messageBox[index], expected);
      });
      done();
    });
  });

  describe('Accept Test', () => {
    it('should ready for calling if they can', (done) => {
      // given
      const sockets = {
        emitTargets: [],
        messageBox: [],
        in: (room) => {
          sockets.emitTargets.push(room);
          return sockets;
        },
        emit: (eventName) => {
          sockets.messageBox.push(eventName);
        },
      };
      const roomName = uuid.v1();
      const callee = {};
      const weakMap = new Map();
      weakMap.set(callee, { room: roomName });
      // The callee can be ready for calling.
      const accept = call.helper.defaultAccept(() => true);

      // when
      accept({ io: sockets, socket: callee, weakMap })();

      // then
      assert.equal(sockets.emitTargets.length, 1);
      assert.equal(sockets.emitTargets[0], roomName);
      assert.equal(sockets.messageBox.length, 1);
      assert.equal(sockets.messageBox[0], 'ready');
      done();
    });

    it('should not ready for calling if they cannot', (done) => {
      // given
      const sockets = {
        emitTargets: [],
        messageBox: [],
        in: (room) => {
          sockets.emitTargets.push(room);
          return sockets;
        },
        emit: (eventName, message) => {
          const msg = { eventName, message };
          sockets.messageBox.push(msg);
        },
      };
      const roomName = uuid.v1();
      const callee = {};
      const weakMap = new Map();
      weakMap.set(callee, { room: roomName });
      // They cannot be ready for calling yet.
      const accept = call.helper.defaultAccept(() => false);
      const expected = {
        eventName: 'serverError',
        message: { description: 'Connection failed' },
      };

      // when
      accept({ io: sockets, socket: callee, weakMap })();

      // then
      assert.equal(sockets.emitTargets.length, 1);
      assert.equal(sockets.emitTargets[0], roomName);
      assert.equal(sockets.messageBox.length, 1);
      assert.deepEqual(sockets.messageBox[0], expected);
      done();
    });
  });

  describe('Reject()', () => {
    it('should get bye when they try to reject', (done) => {
      // given
      const sockets = {
        emitTargets: [],
        messageBox: [],
        in: (room) => {
          sockets.emitTargets.push(room);
          return sockets;
        },
        emit: (eventName) => {
          sockets.messageBox.push(eventName);
        },
      };
      const roomName = uuid.v1();
      const callee = {};
      const weakMap = new Map();
      weakMap.set(callee, { room: roomName });

      // when
      call.reject({ io: sockets, socket: callee, weakMap })();

      // then
      assert.equal(sockets.emitTargets.length, 1);
      assert.equal(sockets.emitTargets[0], roomName);
      assert.equal(sockets.messageBox.length, 1);
      assert.equal(sockets.messageBox[0], 'bye');
      done();
    });
  });

  describe('Awaken Test', () => {
    it('should join when it is waiting callee', (done) => {
      // given
      const caller = {
        messageBox: [],
        emit: (eventName) => {
          caller.messageBox.push(eventName);
        },
      };
      const callee = {
        rooms: [],
        messageBox: [],
        join: (room) => {
          callee.rooms.push(room);
        },
        to: () => caller,
        emit: (eventName) => {
          callee.messageBox.push(eventName);
        },
      };
      const weakMap = new Map();
      const roomName = uuid.v1();
      // Counter part is waiting callee.
      const awaken = call.helper.defaultAwaken(() => true);

      // when
      awaken({ socket: callee, weakMap })({ room: roomName });

      // then
      assert.equal(callee.rooms.length, 1);
      assert.equal(callee.rooms[0], roomName);
      assert.equal(callee.messageBox.length, 1);
      assert.equal(callee.messageBox[0], 'knock');
      assert.equal(caller.messageBox.length, 1);
      assert.equal(caller.messageBox[0], 'created');
      assert.equal(weakMap.get(callee).room, roomName);

      done();
    });

    it('should throw error when is is not waiting callee', (done) => {
      // given
      const callee = {
        messageBox: [],
        emit: (eventName, message) => {
          const msg = { eventName, message };
          callee.messageBox.push(msg);
        },
      };
      const roomName = uuid.v1();
      // Counter part is not waiting callee.
      const awaken = call.helper.defaultAwaken(() => false);
      const expected = {
        eventName: 'serverError',
        message: { description: 'Connection failed' },
      };

      // when
      awaken({ socket: callee })({ room: roomName });

      // then
      assert.equal(callee.messageBox.length, 1);
      assert.deepEqual(callee.messageBox[0], expected);
      done();
    });
  });
});
