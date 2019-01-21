import * as mocha from 'mocha';
import chai from 'chai';
import io from 'socket.io-client';

import Server from '../src/server';

const { describe, it } = mocha;
const { assert } = chai;
const url = 'ws://localhost:3000';

describe('Connection Test', () => {
  const server = new Server();
  beforeEach((done) => {
    server.start();
    done();
  });

  afterEach((done) => {
    server.close();
    done();
  });

  it('should echo hello', (done) => {
    // given
    const client = io.connect(url, null);
    // when
    client.once('connect', () => {
      client.once('echo', (data) => {
        // then
        assert.equal(data, 'hello');
        client.disconnect();
        done();
      });
      client.emit('echo', 'hello');
    }).on('connect_error', (error) => {
      // if connection is invalid,
      // test should fail
      assert.fail(error);
      client.disconnect();
      done();
    });
  });

  it('A user should be responded "created" to "dial"', (done) => {
    // given
    const client = io.connect(url, null);
    // when
    client.once('connect', () => {
      client.once('created', (data) => {
        // then
        assert.equal(data, 'created success');
        client.disconnect();
        done();
      });
      client.emit('dial');
    });
  });
});
