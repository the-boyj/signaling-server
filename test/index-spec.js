import * as mocha from 'mocha';
import chai from 'chai';
import io from 'socket.io-client';
import * as Rx from 'rxjs-compat';
import Server from '../src/server';

const { describe, it } = mocha;
const { assert, expect } = chai;

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


  it('sice -> rice', (done) => {
    describe('Caller should send a ICE Candidate to server '
      + 'and Server should broadcast the ICE Candidate', () => {
      // given
      const caller = io.connect(url, null);
      const callee = io.connect(url, null);
      const roomNumber = 12345;
      caller.emit('join', roomNumber);
      callee.emit('join', roomNumber);

      const candidate = { room: roomNumber,
        sdpMid: 'IamSDPMid',
        sdpMLineIndex: '12345',
        candidate: 'candidate:1234567890 1 udp 0987654321 192.168.0.1' };
      const observable = Rx.Observable
        .fromEvent(callee, 'rice')
        .first();

      // when
      caller.emit('sice', candidate);

      // then
      observable.subscribe((data) => {
        expect(data).to.eql(candidate);
      },
      (err) => {
        assert.fail(err);
      })
        .add(() => {
          caller.disconnect();
          callee.disconnect();
          done();
        });
    });
  });
});
