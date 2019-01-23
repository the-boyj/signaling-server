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

  it('A user should be responded "created" to "dial"', (done) => {
    // given
    const client = io.connect(url, null);
    const createdObservable = Rx.Observable
      .fromEvent(client, 'created')
      .first();

    // when
    client.emit('dial');

    // then
    createdObservable
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
