import * as mocha from 'mocha';
import chai from 'chai';
import io from 'socket.io-client';

import * as Rx from 'rxjs-compat';
import Server from '../src/server';

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
    const observable = Rx.Observable
      .fromEvent(client, 'echo')
      .first();

    // when
    client.emit('echo', 'hello');

    // then
    observable.subscribe((data) => {
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

  it('A user should be responded "created" to "dial"', (done) => {
    // given
    const client = io.connect(url, null);
    const observable = Rx.Observable
      .fromEvent(client, 'created')
      .first();

    // when
    client.emit('dial');

    // then
    observable
      .subscribe((data) => {
        assert.equal(data, 'created success');
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
