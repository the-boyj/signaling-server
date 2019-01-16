import * as mocha from 'mocha';
import chai from 'chai';
import chaiHttp from 'chai-http';
import io from 'socket.io-client';

import Server from '../src/server';

const { assert, expect } = chai;
const options = null;
const user1 = { name: 'user1' };

const server = new Server();
server.start()
  .then(() => {
    chai.use(chaiHttp);

    mocha.describe('GET /echo test', () => {
      mocha.it('should echo hello', (done) => {
        const echoUrl = '/echo?msg=hello';
        chai.request(server.app)
          .get(echoUrl)
          .end((err, res) => {
            expect(res).to.have.status(200);
            assert.equal(res.text, 'hello');
            done();
          });
      });
    });

    mocha.describe('Event Message Test', () => {
      // "dial" : A가 시그널링 서버한테 통화 요청
      mocha.describe('Dial', () => {
        mocha.it('user1 should dial to Signaling server', (done) => {
          const url = `http://localhost:${server.port}`;
          const client1 = io.connect(url, options);

          client1.on('connect', () => {
            // after server receive 'dial',
            // server send the data 'created success'
            // in event name 'created'
            client1.on('created', (data) => {
              assert.equal(data, 'created success');
              done();
            });
            client1.emit('dial', user1);
          }).on('connect_error', (error) => {
            // if connection is invalid,
            // test should fail
            assert.fail(error);
            done();
          });
        });
      });
    });
  });
