import chai from 'chai';
import * as mocha from 'mocha';
import * as messageMaker from '../../src/firebase/message-maker';

const { describe, it } = mocha;
const { assert } = chai;

const defaultPriority = { priority: 'high' };


// https://firebase.google.com/docs/cloud-messaging/admin/errors
describe('Message Maker Test', () => {
  describe('makeMessage Test', () => {
    it('should has no data, no token', (done) => {
      // given, when
      const msg = messageMaker.makeMessage({});
      // then
      assert.equal(msg.data, null);
      assert.equal(msg.android.priority, defaultPriority.priority);
      assert.equal(msg.token, null);
      done();
    });

    it('should has same data, same token', (done) => {
      // given
      const data = 'some data';
      const token = 'some token';
      // when
      const msg = messageMaker.makeMessage({ data, token });
      // then
      assert.equal(msg.data, data);
      assert.equal(msg.android.priority, defaultPriority.priority);
      assert.equal(msg.token, token);
      done();
    });

    it('should has same data, same priority, same token', (done) => {
      // given
      const data = 'some data';
      const priority = 'normal';
      const token = 'some token';
      // when
      const msg = messageMaker.makeMessage({ data, priority, token });
      // then
      assert.equal(msg.data, data);
      assert.equal(msg.android.priority, priority);
      assert.equal(msg.token, token);
      done();
    });
  });
});
