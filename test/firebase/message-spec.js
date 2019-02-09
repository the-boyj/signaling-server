import chai from 'chai';
import * as mocha from 'mocha';
import * as messageMaker from '../../src/firebase/message-maker';
import * as mocks from '../resources/mocks';

const { describe, it } = mocha;
const { assert } = chai;
const { mockToken, mockData } = mocks;

const defaultPriority = { priority: 'high' };


// https://firebase.google.com/docs/cloud-messaging/admin/errors
describe('makeMessage()', () => {
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
    // given, when
    const msg = messageMaker.makeMessage({ data: mockData, token: mockToken });
    // then
    assert.equal(msg.data, mockData);
    assert.equal(msg.android.priority, defaultPriority.priority);
    assert.equal(msg.token, mockToken);
    done();
  });

  it('should has same data, same priority, same token', (done) => {
    // given
    const priority = 'normal';
    // when
    const msg = messageMaker.makeMessage({ data: mockData, priority, token: mockToken });
    // then
    assert.equal(msg.data, mockData);
    assert.equal(msg.android.priority, priority);
    assert.equal(msg.token, mockToken);
    done();
  });
});
