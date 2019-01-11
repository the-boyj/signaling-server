import * as mocha from 'mocha';
import chai from 'chai';

const { assert, should } = chai;

console.log(should);

mocha.describe('test', () => {
  mocha.it('should be ok', () => {
    assert.equal(1, 1);
    assert.notEqual(1, 2);
  });
});
