import * as mocha from 'mocha';
import chai from 'chai';
import chaiHttp from 'chai-http';
import io from 'socket.io-client';

import Server from '../src/server';

const { describe, it } = mocha;
const { assert, expect } = chai;
const options = null;
const user1 = { name: 'user1' };

const server = new Server();
server.start()
  .then(() => {
    chai.use(chaiHttp);

    describe('GET /echo test', () => {
      it('should echo hello', (done) => {
        // given
        const echoUrl = '/echo?msg=hello';
        // when
        chai.request(server.app)
          .get(echoUrl)
          .end((err, res) => {
            // then
            expect(res).to.have.status(200);
            assert.equal(res.text, 'hello');
            done();
          });
      });
    });

    describe('Event Message Test', () => {
      // "dial" : A가 시그널링 서버한테 통화 요청
      describe('Dial', () => {
        it('user1 should dial to Signaling server', (done) => {
          // given
          const url = `http://localhost:${server.port}`;
          const client = io.connect(url, options);

          // when
          client.on('connect', () => {
            // after server receive 'dial',
            // server send the data 'created success'
            // in event name 'created'
            client.on('created', (data) => {
              // then
              assert.equal(data, 'created success');
              done();
            });
            client.emit('dial', user1);
          }).on('connect_error', (error) => {
            // if connection is invalid,
            // test should fail
            assert.fail(error);
            done();
          });
        });

        it('should fail to connect with wrong address', (done) => {
          // given
          const wrongUrl = 'http://localhost:1234';
          const client = io.connect(wrongUrl, options);

          // when
          client.on('connect', () => {
            // nothing to do
          }).on('connect_error', () => {
            assert.equal(client.connected, false);
            done();
          });
        });
      });
    });
  });
