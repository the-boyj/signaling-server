import chai from 'chai';
import * as mocha from 'mocha';
import * as webrtc from '../../src/events/webrtc';

const { describe, it } = mocha;
const { assert } = chai;

describe('Sice Test', () => {
  describe('Sice Error Test', () => {
    it('should emit "peer_error" when candidate is invalid', (done) => {
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
        { deviceToken: '' },
        { deviceToken: null },
        { deviceToken: undefined },
        { sdpMid: 'sdpMid' }, // deviceToken undefined
      ];
      const eventName = 'peer_error';

      invalids.forEach((candidate, index) => {
        // when
        webrtc.sice()(receiver)(candidate);
        // then
        assert.equal(receiver.messageBox.length, index + 1);
        assert.equal(receiver.messageBox[index].eventName, eventName);
        assert.equal(receiver.messageBox[index].message, candidate);
      });
      done();
    });
  });
  describe('Sice Test', () => {
    // given
    const candidate = {
      deviceToken: '12345',
      sdpMid: 'IamSDPMid',
      sdpMLineIndex: '12345',
      candidate: 'candidate:1234567890 1 udp 0987654321 192.168.0.1',
    };
    const receiver = {
      deviceToken: null,
      messageBox: {},
      to: (deviceToken) => {
        receiver.deviceToken = deviceToken;
        return receiver;
      },
      emit: (eventName, message) => {
        const msg = { eventName, message };
        const token = receiver.deviceToken;
        if (!receiver.messageBox[token]) {
          receiver.messageBox[token] = [];
        }
        receiver.messageBox[token].push(msg);
      },
    };
    const eventName = 'rice';
    // when
    webrtc.sice()(receiver)(candidate);
    // then
    const { deviceToken } = receiver;
    assert.equal(receiver.messageBox[deviceToken].length, 1);
    assert.equal(receiver.messageBox[deviceToken][0].eventName, eventName);
    assert.deepEqual(receiver.messageBox[deviceToken][0].message, candidate);
  });
});
