import chai from 'chai';
import MockedSocket from 'socket.io-mock';
import * as mocha from 'mocha';
import * as call from '../../src/events/call';

const { describe, it } = mocha;
const { assert } = chai;

describe('Call Test', () => {
  let mockedServer = null;
  beforeEach((done) => {
    mockedServer = new MockedSocket();
    done();
  });
  describe('Dial Test', () => {
    it('should get "created success" after dial', (done) => {
      // given
      const successMessage = 'created success';
      const mockedClient = mockedServer.socketClient;
      // then
      mockedClient.on('created', (data) => {
        assert.equal(data, successMessage);
        done();
      });
      // when
      call.dial(mockedServer)();
    });
  });

  // this test are following below site
  // https://github.com/SupremeTechnopriest/socket.io-mock/blob/84208bf1434e6fdc92c3904b92f97eb273c08eed/test/test-socket.js
  describe('Accept Test', () => {
    it('should join the room', (done) => {
      // given
      const roomNumber = '12345';
      // when
      call.accept(mockedServer)(roomNumber);
      // then
      // first room has index as 0
      assert.equal(mockedServer.rooms[0], roomNumber);
      done();
    });
  });
});
