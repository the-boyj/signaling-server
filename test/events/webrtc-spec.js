import * as mocha from 'mocha';
import chai from 'chai';
import io from 'socket.io-client';
import * as Rx from 'rxjs-compat';
import Server from '../../src/server';

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

  describe('sice tests', () => {
    it('caller should send candidate without room', (done) => {
      // given
      const caller = io.connect(url, null);
      const candidate = {};
      const peerErrorObservable = Rx.Observable
        .fromEvent(caller, 'peer_error')
        .first();

      // when
      caller.emit('sice', candidate);

      // then
      peerErrorObservable.subscribe((data) => {
        assert.equal(data, null);
      }, (err) => {
        assert.fail(err);
      }).add(() => {
        caller.disconnect();
        done();
      });
    });

    describe('Caller should send a ICE Candidate to server '
    + 'and Server should broadcast the ICE Candidate', () => {
      it('sice -> rice', (done) => {
      // given
        const caller = io.connect(url, null);
        const callee = io.connect(url, null);
        const anyToken = 12345;

        caller.emit('dial', anyToken);
        callee.emit('accept', anyToken);

        const candidate = { deviceToken: anyToken,
          sdpMid: 'IamSDPMid',
          sdpMLineIndex: '12345',
          candidate: 'candidate:1234567890 1 udp 0987654321 192.168.0.1' };
        const riceObservable = Rx.Observable
          .fromEvent(callee, 'rice')
          .first();

        // when
        caller.emit('sice', candidate);

        // then
        riceObservable
          .subscribe((data) => {
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
});
