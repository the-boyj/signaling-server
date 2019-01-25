import chai from 'chai';
import MockedSocket from 'socket.io-mock';
import * as mocha from 'mocha';
import * as common from '../../src/events/common';

const { describe, it } = mocha;
const { assert } = chai;
describe('Common Test', () => {
  describe('Echo Test', () => {
    it('should echo received string', (done) => {
      // given
      const anyString = 'hello';
      const mockedServer = new MockedSocket();
      const mockedClient = mockedServer.socketClient;
      // then
      mockedClient.on('echo', (echoString) => {
        assert.equal(echoString, anyString);
        done();
      });
      // when
      common.echo(mockedServer)(anyString);
    });
  });

})
