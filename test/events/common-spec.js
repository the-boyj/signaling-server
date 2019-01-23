import * as mocha from 'mocha';
import chai from 'chai';
import io from 'socket.io-client';
import * as Rx from 'rxjs-compat';
import Server from '../../src/server';

const { describe, it } = mocha;
const { assert } = chai;

describe('Connection Test', () => {
  const url = 'ws://localhost:3000';
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
    const echoObservable = Rx.Observable
      .fromEvent(client, 'echo')
      .first();

    // when
    client.emit('echo', 'hello');

    // then
    echoObservable
      .subscribe((data) => {
        assert.equal(data, 'hello');
      },
      (err) => {
        assert.fail(err);
      })
      .add(() => {
        client.disconnect();
        done();
      });
  });
});
