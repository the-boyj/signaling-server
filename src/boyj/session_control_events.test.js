/* eslint-disable no-unused-expressions */
const chai = require('chai');

const { expect } = chai;
const chaiAsPromise = require('chai-as-promised');

chai.use(chaiAsPromise);
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const events = require('./session_control_events');

describe('session_control_events', () => {
  const io = {};
  const socket = {
    join: () => {},
    emit: () => {},
  };
  const fakeSession = {
    io,
    socket,
  };

  context('createSession', () => {
    it('should create session including boyj session properties', () => {
      const session = events.createSession();

      expect(session).to.have.property('room').with.not.exist;
      expect(session).to.have.property('user').with.not.exist;
    });

    it('should create session including defaultSession', () => {
      const fakeDefaultSession = { foo: 'fake foo', bar: 'fake bar' };
      const session = events.createSession(fakeDefaultSession);

      expect(session).to.deep.include(fakeDefaultSession);
    });
  });

  context('createRoom', () => {
    it('should occur error if payload is undefined', () => {
      const errorMessage = `Invalid payload. payload: ${undefined}`;

      expect(events.createRoom(fakeSession).bind(this)).to.throw(errorMessage);
    });

    it('should occur error if payload is not verified', () => {
      const invalidPayloads = [
        {},
        { room: 'fake room', callerId: undefined },
        { room: undefined, callerId: 'fake callerId' },
      ];

      invalidPayloads.forEach((payload) => {
        const errorMessage = `Invalid payload. room: ${payload.room}, callerId: ${payload.callerId}`;

        expect(events.createRoom(fakeSession).bind(this, payload)).to.throw(errorMessage);
      });
    });

    it('should assign session info and join into the room', () => {
      const fakePayload = {
        room: 'fake room',
        callerId: 'fake callerId',
      };
      const joinStub = sinon.stub(socket, 'join').callsFake(() => {});

      events.createRoom(fakeSession)(fakePayload);

      expect(fakeSession).to.have.property('room').with.equal('fake room');
      expect(fakeSession).to.have.property('user').with.equal('fake callerId');
      expect(joinStub).to.be.calledOnce;
      expect(joinStub).to.be.calledWith('fake room');

      joinStub.restore();
    });
  });

  context('createRoomErrorHandler', () => {
    it('should emit error message to sender', () => {
      const fakePayload = {};
      const fakeContext = {
        session: fakeSession,
        payload: fakePayload,
      };
      const fakeError = { message: 'fake error message' };
      const emitStub = sinon.stub(socket, 'emit').callsFake(() => {});

      events.createRoomErrorHandler(fakeError, fakeContext);

      expect(emitStub).to.be.calledOnce;
      expect(emitStub).to.be.calledWith('SERVER_TO_PEER_ERROR', {
        code: 301,
        description: 'Invalid Create Room Payload',
        message: 'fake error message',
      });

      emitStub.restore();
    });
  });
});
