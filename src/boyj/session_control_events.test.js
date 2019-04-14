/* eslint-disable no-unused-expressions */
const chai = require('chai');

const { expect } = chai;
const chaiAsPromise = require('chai-as-promised');

chai.use(chaiAsPromise);
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const events = require('./session_control_events');
const redis = require('./model/data_source').default;
const notification = require('./notification_messaging').default;

describe('session_control_events', () => {
  const io = {};
  const socket = {
    join: () => {},
    emit: () => {},
  };
  let fakeSession;

  beforeEach(() => {
    fakeSession = {
      io,
      socket,
    };
  });

  afterEach(() => {});

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

  context('dialToCallee', () => {
    const fakeCallerInfo = {
      user: 'fake user',
      room: 'fake room',
    };
    let fakePayload;

    beforeEach(() => {
      fakePayload = {
        calleeId: 'fake calleeId',
        skipNotification: false,
      };
      Object.assign(fakeSession, fakeCallerInfo);
    });

    afterEach(() => {});

    it('should throw error if payload is undefined', () => {
      const errorMessage = `Invalid payload. payload: ${undefined}`;

      const dialToCalleePromise = events.dialToCallee(fakeSession)();

      expect(dialToCalleePromise).to.eventually.be.rejectedWith(errorMessage);
    });

    it('should throw error when payload does not contain calleeId', () => {
      const invalidPayloads = [
        {},
        { calleeId: undefined },
      ];

      invalidPayloads.forEach((payload) => {
        const errorMessage = `Invalid payload. calleeId: ${payload.calleeId}`;

        const dialToCalleePromise = events.dialToCallee(fakeSession)(payload);

        expect(dialToCalleePromise).to.eventually.be.rejectedWith(errorMessage);
      });
    });

    it('should exit right after validating payload if skipNotification is true', () => {
      fakePayload = {
        calleeId: 'fake calleeId',
        skipNotification: true,
      };
      const hgetallAsyncSpy = sinon.spy(redis, 'hgetallAsync');
      const sendSpy = sinon.spy(notification, 'send');

      events.dialToCallee(fakeSession)(fakePayload);

      expect(hgetallAsyncSpy).to.not.be.called;
      expect(sendSpy).to.not.be.called;

      hgetallAsyncSpy.restore();
      sendSpy.restore();
    });

    it('should throw error when session is not initialized', () => {
      const invalidSessions = [
        {},
        { room: 'fake room', user: undefined },
        { room: undefined, user: 'fake user' },
      ];

      invalidSessions.forEach((session) => {
        const {
          room,
          user,
        } = session;
        const errorMessage = `The session is not initialized. room: ${room}, user: ${user}`;

        const dialToCalleePromise = events.dialToCallee(session)(fakePayload);

        expect(dialToCalleePromise).to.eventually.be.rejectedWith(errorMessage);
      });
    });

    it('should throw error if there is no user data', () => {
      const hgetallAsyncStub = sinon.stub(redis, 'hgetallAsync').resolves(undefined);
      const errorMessage = 'There is no user data for user fake calleeId';

      const dialToCalleePromise = events.dialToCallee(fakeSession)(fakePayload);

      expect(dialToCalleePromise).to.eventually.be.rejectedWith(errorMessage);
      expect(hgetallAsyncStub).to.be.calledOnce;
      expect(hgetallAsyncStub).to.be.calledWith(`user:${fakePayload.calleeId}`);

      hgetallAsyncStub.restore();
    });

    it('should throw error if there is no available user device token', () => {
      const callee = { deviceToken: undefined };
      const hgetallAsyncStub = sinon.stub(redis, 'hgetallAsync').resolves(callee);
      const errorMessage = 'There is no available deviceToken for user fake calleeId';

      const dialToCalleePromise = events.dialToCallee(fakeSession)(fakePayload);

      expect(dialToCalleePromise).to.eventually.be.rejectedWith(errorMessage);
      expect(hgetallAsyncStub).to.be.calledOnce;
      expect(hgetallAsyncStub).to.be.calledWith(`user:${fakePayload.calleeId}`);

      hgetallAsyncStub.restore();
    });

    it('should send notification with caller information', async () => {
      const callee = { deviceToken: 'fake deviceToken' };
      const notificationPayload = {
        data: {
          room: fakeSession.room,
          caller: { tel: fakeSession.user },
        },
        android: { priority: 'high' },
        token: callee.deviceToken,
      };
      const hgetallAsyncStub = sinon.stub(redis, 'hgetallAsync').resolves(callee);
      const sendStub = sinon.stub(notification, 'send').resolves();

      await events.dialToCallee(fakeSession)(fakePayload);

      expect(hgetallAsyncStub).to.be.calledOnce;
      expect(sendStub).to.be.calledOnce;
      expect(sendStub).to.be.calledWith(notificationPayload);

      hgetallAsyncStub.restore();
      sendStub.restore();
    });
  });

  context('dialToCalleeErrorHandler', () => {
    let fakeContext;
    let emitStub;

    beforeEach(() => {
      fakeContext = { session: fakeSession };
      emitStub = sinon.stub(socket, 'emit');
    });

    afterEach(() => {
      emitStub.restore();
    });

    it('should emit payload error if error message starts with specific words', () => {
      const payloadErrorMessages = [
        'Invalid payload.',
        `Invalid payload. payload: ${undefined}`,
        `Invalid payload. calleeId: ${undefined}`,
      ];

      payloadErrorMessages.forEach((message) => {
        const err = { message };

        events.dialToCalleeErrorHandler(err, fakeContext);

        expect(emitStub).to.have.been.calledOnce;
        expect(emitStub).to.have.been.calledWith('SERVER_TO_PEER_ERROR', {
          code: 302,
          description: 'Invalid Dial Payload',
          message,
        });

        emitStub.reset();
      });
    });

    it('should emit internal error if error message is not starts with specific words', () => {
      const internalErrorMessage = [
        `The session is not initialized. room: ${undefined}, user: ${undefined}`,
        'There is no user data for user fake user',
        'There is no available deviceToken for user fake user',
      ];

      internalErrorMessage.forEach((message) => {
        const err = { message };

        events.dialToCalleeErrorHandler(err, fakeContext);

        expect(emitStub).to.have.been.calledOnce;
        expect(emitStub).to.have.been.calledWith('SERVER_TO_PEER_ERROR', {
          code: 300,
          description: 'Internal Server Error',
          message,
        });

        emitStub.reset();
      });
    });
  });
});
