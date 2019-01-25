import chai from 'chai';
import MockedSocket from 'socket.io-mock';
import * as mocha from 'mocha';
import * as webrtc from '../../src/events/webrtc';

const { describe, it } = mocha;
const { assert } = chai;

describe('webrtc tests', () => {
  let mockedServer = null;
  beforeEach((done) => {
    mockedServer = new MockedSocket();
    // because mockedServer has no "to" function, define it
    mockedServer.to = deviceToken => mockedServer.broadcast.to(deviceToken);
    done();
  });

  describe('Sice Test', () => {
    describe('Sice Error Test', () => {
      it('should emit "peer_error" when invalid candidate', (done) => {
        // given
        let tests = 0;
        const mockedClient = mockedServer.socketClient;

        const invalids = [
          {},
          { deviceToken: '' },
          { deviceToken: null },
          { deviceToken: undefined },
          { sdpMid: 'sdpMid' },
        ];
        // then
        mockedClient.on('rice', (data) => {
          assert.fail(data);
        });
        mockedClient.on('peer_error', () => {
          tests += 1;
          if (tests >= invalids.length) {
            assert.equal(tests, invalids.length);
            done();
          }
        });
        // when
        invalids.forEach((candidate) => {
          webrtc.sice(mockedServer)(candidate);
        });
      });
    });
    describe('Sice Test', () => {
      it('sice -> rice', () => {
        // given
        const anyToken = '12345';
        const mockedClient = mockedServer.socketClient;
        const candidate = {
          deviceToken: anyToken,
          sdpMid: 'IamSDPMid',
          sdpMLineIndex: '12345',
          candidate: 'candidate:1234567890 1 udp 0987654321 192.168.0.1',
        };

        // then
        mockedClient.on('rice', (data) => {
          assert.equal(data, candidate);
        });

        // when
        webrtc.sice(mockedServer)(candidate);
      });
    });
  });
});
