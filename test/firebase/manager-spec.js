import chai from 'chai';
import * as mocha from 'mocha';
import * as mocks from '../resources/mocks';
import * as manager from '../../src/firebase/manager';

const { describe, it } = mocha;
const { assert, expect } = chai;
const { mockCert, mockDatabaseURL } = mocks;

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
