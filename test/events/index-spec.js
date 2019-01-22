import * as mocha from 'mocha';
import chai from 'chai';

import { isValidHandler, getHandler } from '../../src/events';

const { describe, it } = mocha;
const { expect } = chai;

describe('Tests for invalidHandler()', () => {
  it('should pass functions except default', (done) => {
    // given
    const properties = { default: () => {},
      func1: () => {},
      func2: () => {},
      prop1: 'abc',
      prop2: '1234' };

    // when
    const validProperties = Object.keys(properties)
      .filter(isValidHandler(properties));

    // then
    expect(properties).to.have.all.keys('default', 'func1', 'func2', 'prop1', 'prop2');
    expect(validProperties).to.eql(['func1', 'func2']);
    done();
  });
});

describe('Tests for getHandler()', () => {
  it('should get only functions except default', (done) => {
    // given
    const properties = { default: () => {},
      func1: () => {},
      func2: () => {},
      prop1: 'abc',
      prop2: '1234' };

    // when
    const validProperties = Object.keys(properties)
      .filter(isValidHandler(properties))
      .map(getHandler(properties));

    const expected = [{ name: 'func1', handler: properties.func1 },
      { name: 'func2', handler: properties.func2 }];

    // then
    expect(properties).to.have.all.keys('default', 'func1', 'func2', 'prop1', 'prop2');
    expect(validProperties).to.eql(expected);
    done();
  });
});
