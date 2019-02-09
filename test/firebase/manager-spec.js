import chai from 'chai';
import * as mocha from 'mocha';
import * as firebaseError from 'firebase-admin/lib/utils/error';
import * as firebaseAdmin from 'firebase-admin';
import * as sinon from 'sinon';
import * as mocks from '../resources/mocks';
import * as messageMaker from '../../src/firebase/message-maker';
import * as manager from '../../src/firebase/manager';

const { FirebaseMessagingError } = firebaseError;
const { describe, it } = mocha;
const { assert, expect } = chai;

chai.use(require('chai-as-promised')).should();
const firebaseFunctionsTest = require('firebase-functions-test')();

describe('Cert Test', () => {
  it('should not initializeApp because of invalid cert', (done) => {
    // given
    const invalidCerts = [
      undefined,
      null,
    ];
    invalidCerts.forEach((cert) => {
      expect(() => {
        // when
        manager.config(cert, mocks.mockDatabaseURL);
        // then
      }).to.throw('Certificate object must be an object');
    });
    done();
  });
  it('should same with expected config', (done) => {
    // given
    const expected = {
      certificate: mocks.mockCert,
      databaseURL: mocks.mockDatabaseURL,
    };
    // when
    const conf = manager.config(mocks.mockCert, mocks.mockDatabaseURL);
    // then
    assert.equal(conf.credential.certificate.clientEmail, expected.certificate.client_email);
    assert.equal(conf.credential.certificate.privateKey, expected.certificate.private_key);
    assert.equal(conf.credential.certificate.projectId, expected.certificate.project_id);
    done();
  });
});

describe('Send Test', () => {
  describe('Send Fail Test', () => {
    describe('Send Error Test', () => {
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
            const sendPromise = manager.send(manager.firebaseManager, invalidMsg);
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
            const sendPromise = manager.send(manager.firebaseManager, invalidMsg);
            return assert.isRejected(sendPromise, FirebaseMessagingError, 'Exactly one of topic, token or condition is required');
          });
        });
      });
    });
  });

  describe('Send Success Test', () => {
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
      const mockMessage = messageMaker.makeMessage({
        data: { room: mocks.mockRoom },
        token: mocks.mockToken,
      });
      const sendStub = sinon.stub();
      const messagingStub = sinon.stub();
      Object.defineProperty(manager.firebaseManager, 'messaging', { get: () => messagingStub });
      messagingStub.returns({ send: msg => Promise.resolve(msg) });
      sendStub.withArgs(mockMessage).returns(mockMessage);
      // when
      const sendPromise = manager.send(manager.firebaseManager, mockMessage);
      // then
      sendPromise
        .then((res) => {
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
