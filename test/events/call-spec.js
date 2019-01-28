import chai from 'chai';
import * as mocha from 'mocha';
import * as call from '../../src/events/call';

const { describe, it } = mocha;
const { assert } = chai;

describe('Call Test', () => {
  describe('Dial Test', () => {
    it('should emit peer_error after receiving invalid data', (done) => {
      // given
      const receiver = {
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
        { room: null },
        { room: undefined },
        { room: '' },
      ];
      const eventName = 'peer_error';
      invalids.forEach((data, index) => {
        // when
        call.dial(receiver)(data);
        // then
        assert.equal(receiver.messageBox.length, index + 1);
        assert.equal(receiver.messageBox[index].eventName, eventName);
        assert.equal(receiver.messageBox[index].message, data);
      });
      done();
    });

    it('should get message after dial', (done) => {
      // given
      const receiver = {
        messageBox: [],
        emit: (eventName, message) => {
          const msg = { eventName, message };
          receiver.messageBox.push(msg);
        },
      };
      const roomNumber = '12345';
      const eventName = 'created';
      const data = {
        room: roomNumber,
      };
      // when
      call.dial(receiver)(data);
      // then
      assert.equal(receiver.messageBox.length, 1);
      assert.equal(receiver.messageBox[0].eventName, eventName);
      assert.equal(receiver.messageBox[0].message, data);
      done();
    });
  });

  describe('Accept Test', () => {
    it('should join the room', (done) => {
      // given
      const receiver = {
        messageBox: [],
        join: (deviceToken) => {
          receiver.messageBox.push(deviceToken);
        },
      };
      const roomNumber = '12345';
      // when
      call.accept(receiver)(roomNumber);
      // then
      assert.equal(receiver.messageBox.length, 1);
      assert.equal(receiver.messageBox[0], roomNumber);
      done();
    });
  });
});
