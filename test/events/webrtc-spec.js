import chai from 'chai';
import * as mocha from 'mocha';
import * as uuid from 'uuid';
import * as webrtc from '../../src/events/webrtc';

const { describe, it } = mocha;
const { assert } = chai;

describe('ssdp()', () => {
  it('should emit serverError when sdp is invalid', (done) => {
    // given
    const sender = {
      messageBox: [],
      emit: (eventName, message) => {
        const msg = { eventName, message };
        sender.messageBox.push(msg);
      },
    };
    const eventName = 'serverError';
    const weakMap = new Map();
    // when sdp is invalid
    const ssdp = webrtc.helper.defaultSsdp(() => false);
    const expected = { eventName, message: { description: `Invalid SDP. ${undefined}` } };

    // when
    ssdp({ socket: sender, weakMap })();

    // then
    assert.equal(sender.messageBox.length, 1);
    assert.deepEqual(sender.messageBox[0], expected);
    done();
  });

  it('should emit rsdp when sdp is valid', (done) => {
    // given
    const sdp = {};
    const receiver = {
      messageBox: [],
      emit: (eventName, message) => {
        const msg = { eventName, message };
        receiver.messageBox.push(msg);
      },
    };
    const sender = { to: () => receiver };
    const eventName = 'rsdp';
    const room = uuid.v1();
    const ssdp = webrtc.helper.defaultSsdp(() => true);
    const weakMap = new Map();
    weakMap.set(sender, { room });

    const expected = { eventName, message: sdp };

    // when
    ssdp({ socket: sender, weakMap })(sdp);

    // then
    assert.equal(receiver.messageBox.length, 1);
    assert.deepEqual(receiver.messageBox[0], expected);
    done();
  });
});

describe('Sice()', () => {
  it('should emit serverError when candidate is invalid', (done) => {
    // given
    const sender = {
      messageBox: [],
      emit: (eventName, message) => {
        const msg = { eventName, message };
        sender.messageBox.push(msg);
      },
    };
    const eventName = 'serverError';
    const weakMap = new Map();
    // when candidate is invalid
    const sice = webrtc.helper.defaultSice(() => false);
    const expected = { eventName, message: { description: `Invalid ICE candidate. ${undefined}` } };

    // when
    sice({ socket: sender, weakMap })();

    // then
    assert.equal(sender.messageBox.length, 1);
    assert.deepEqual(sender.messageBox[0], expected);
    done();
  });

  it('should emit rice when candidate is valid', (done) => {
    // given
    const candidate = {
      sdpMid: 'IamSDPMid',
      sdpMLineIndex: '12345',
      candidate: 'candidate:1234567890 1 udp 0987654321 192.168.0.1',
    };
    const receiver = {
      messageBox: [],
      emit: (eventName, message) => {
        const msg = { eventName, message };
        receiver.messageBox.push(msg);
      },
    };
    const sender = { to: () => receiver };
    const eventName = 'rice';
    const room = uuid.v1();
    const sice = webrtc.helper.defaultSice(() => true);
    const weakMap = new Map();
    weakMap.set(sender, { room });

    const expected = { eventName, message: candidate };

    // when
    sice({ socket: sender, weakMap })(candidate);

    // then
    assert.equal(receiver.messageBox.length, 1);
    assert.deepEqual(receiver.messageBox[0], expected);
    done();
  });
});
