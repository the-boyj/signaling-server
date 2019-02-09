import chai from 'chai';
import * as mocha from 'mocha';
import * as firebaseError from 'firebase-admin/lib/utils/error';
import * as firebaseAdmin from 'firebase-admin';
import * as sinon from 'sinon';
import * as mocks from '../resources/mocks';
import * as manager from '../../src/firebase/manager';

const { FirebaseMessagingError } = firebaseError;
const { describe, it } = mocha;
const { assert, expect } = chai;
const { mockCert, mockDatabaseURL, mockMessage } = mocks;

chai.use(require('chai-as-promised')).should();
const firebaseFunctionsTest = require('firebase-functions-test')();

describe('config()', () => {
  it('should not initializeApp because of invalid cert', (done) => {
    // given
    const invalidCerts = [
      undefined,
      null,
    ];
    invalidCerts.forEach((cert) => {
      expect(() => {
        // when
        manager.config(cert, mockDatabaseURL);
        // then
      }).to.throw('Certificate object must be an object');
    });
    done();
  });
  it('should same with expected config', (done) => {
    // given
    const expected = {
      certificate: mockCert,
      databaseURL: mockDatabaseURL,
    };
    // when
    const conf = manager.config(mockCert, mockDatabaseURL);
    // then
    assert.equal(conf.credential.certificate.clientEmail, expected.certificate.client_email);
    assert.equal(conf.credential.certificate.privateKey, expected.certificate.private_key);
    assert.equal(conf.credential.certificate.projectId, expected.certificate.project_id);
    done();
  });
});

describe('send()', () => {
  describe('Message must be a non-null object', () => {
    const invalids = [
      null,
      undefined,
      '',
      NaN,
      false,
    ];
    invalids.forEach((invalidMsg) => {
      it(`should rejected given ${invalidMsg} data`, () => {
        // given : invalidMsg
        // when
        const sendPromise = manager.send(invalidMsg);
        // then
        return assert.isRejected(sendPromise, FirebaseMessagingError, 'Message must be a non-null object');
      });
    });
  });

  describe('Exactly one of topic, token or condition is required', () => {
    const noTarget = [
      {}, { token: null }, { token: '' }, { topic: null }, { topic: '' }, { condition: null }, { condition: '' },
    ];
    noTarget.forEach((invalidMsg) => {
      it(`should throw given message without target: ${JSON.stringify(invalidMsg)}`, () => {
        // given : invalidMsg
        // when
        const sendPromise = manager.send(invalidMsg);
        // then
        return assert.isRejected(sendPromise, FirebaseMessagingError, 'Exactly one of topic, token or condition is required');
      });
    });
  });

  describe('Send should success with valid room and token', () => {
    let adminInitStub;
    before(() => {
      // stub firebaseAdmin.initializeApp to be a dummy function that doesn't do anything.
      adminInitStub = sinon.stub(firebaseAdmin, 'initializeApp');
    });
    after(() => {
      // restore stubbed app
      adminInitStub.restore();
      firebaseFunctionsTest.cleanup();
    });
    // reference : https://github.com/firebase/functions-samples/blob/master/quickstarts/uppercase/functions/test/test.offline.js
    it('msgParam should be delivered into messaging().send() and be resolved with msgParam', (done) => {
      // given
      const messagingStub = sinon.stub();
      const sendStub = sinon.stub();

      Object.defineProperty(manager.firebaseManager, 'messaging', { get: () => messagingStub });
      messagingStub.returns({ send: msg => sendStub(msg) });
      sendStub.withArgs(mockMessage).returns(mockMessage);
      // when
      manager
        .send(mockMessage)
        .then((res) => {
          // then
          assert(sendStub.withArgs(mockMessage).calledOnce);
          assert.equal(res.data.room, mockMessage.data.room);
          assert.equal(res.token, mockMessage.token);
          done();
        }).catch((err) => {
          assert.fail(err);
          done(err);
        });
    });
  });
});
