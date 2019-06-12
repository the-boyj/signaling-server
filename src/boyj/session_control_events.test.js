/* eslint-disable no-unused-expressions,object-curly-newline,no-underscore-dangle */
const chai = require('chai');

const { expect } = chai;
const chaiAsPromise = require('chai-as-promised');

chai.use(chaiAsPromise);
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const rewire = require('rewire');

const sequelize = require('sequelize');
const validator = require('./signaling_validations');
const { code } = require('./signaling_error');
const userService = require('./model/user_service');
const callingService = require('./model/calling_service');
const notification = require('./notification_messaging').default;

let events = rewire('./session_control_events');

describe('session_control_events', () => {
  const io = {};
  const socket = {
    join: () => {},
    emit: () => {},
    to: () => {},
    leave: () => {},
    disconnect: () => {},
  };
  let fakeSession;
  let validatePayloadStub;

  beforeEach(() => {
    fakeSession = {
      io,
      socket,
    };
    validatePayloadStub = sinon.stub(validator, 'validatePayload').callsFake(() => {});
  });

  afterEach(() => {
    validatePayloadStub.restore();
  });

  context('createSession', () => {
    it('should create session including boyj session properties', () => {
      const session = events.createSession();

      expect(session).to.have.property('room').with.not.exist;
      expect(session).to.have.property('user').with.not.exist;
      expect(session).to.have.property('callerId').with.not.exist;
    });

    it('should create session including defaultSession', () => {
      const fakeDefaultSession = { foo: 'fake foo', bar: 'fake bar' };
      const session = events.createSession(fakeDefaultSession);

      expect(session).to.deep.include(fakeDefaultSession);
    });
  });

  context('releaseSession', () => {
    it('should not contain boyj session properties', () => {
      const session = {
        room: 'fake room',
        user: 'fake user',
        callerId: 'fake callerId',
      };
      const fakeAdditionalProperties = {
        fakeProperty1: 'fake1',
        fakeProperty2: 'fake2',
        fakeProperty3: 'fake3',
      };

      Object.assign(session, fakeAdditionalProperties);

      events.releaseSession(session);

      expect(session).to.have.property('room').with.not.exist;
      expect(session).to.have.property('user').with.not.exist;
      expect(session).to.have.property('callerId').with.not.exist;
      expect(session).to.deep.include(fakeAdditionalProperties);
    });
  });

  context('createRoom', () => {
    const fakePayload = {
      room: 'fake room',
      callerId: 'fake callerId',
    };

    let joinStub;

    beforeEach(() => {
      joinStub = sinon.stub(socket, 'join').callsFake(() => {});
    });

    afterEach(() => {
      joinStub.restore();
    });

    it('should throw SignalingError if there is no user data', () => {
      const joinInThisCallingStub = sinon.stub(callingService, 'joinInThisCalling')
        .rejects(new sequelize.ForeignKeyConstraintError());

      const createRoomPromise = events.createRoom(fakeSession)(fakePayload);

      expect(createRoomPromise).to.eventually.rejectedWith(`There is no user ${fakePayload.callerId}`, {
        code: code.INVALID_CREATE_ROOM_PAYLOAD,
      });

      joinInThisCallingStub.restore();
    });

    it('should assign session info and join into the room', async () => {
      const joinInThisCallingStub = sinon.stub(callingService, 'joinInThisCalling').resolves();

      await events.createRoom(fakeSession)(fakePayload);

      expect(validatePayloadStub).to.have.been.calledOnce;
      expect(validatePayloadStub).to.have.been.calledWith({
        payload: fakePayload,
        props: ['room', 'callerId'],
        options: { code: code.INVALID_CREATE_ROOM_PAYLOAD },
      });
      expect(fakeSession).to.have.property('room').with.equal('fake room');
      expect(fakeSession).to.have.property('user').with.equal('fake callerId');
      expect(joinStub).to.be.calledOnce;
      expect(joinStub).to.be.calledWith(['fake room', 'user:fake callerId']);
      expect(joinInThisCallingStub).to.have.been.calledOnce;
      expect(joinInThisCallingStub).to.have.been.calledAfter(joinStub);
      expect(joinInThisCallingStub).to.have.been.calledWith({
        userId: fakePayload.callerId,
        roomId: fakePayload.room,
      });

      joinStub.restore();
      joinInThisCallingStub.restore();
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

    it('should exit right after validating payload if skipNotification is true', () => {
      fakePayload = {
        calleeId: 'fake calleeId',
        skipNotification: true,
      };
      const findUserById = sinon.spy(userService, 'findUserById');
      const sendSpy = sinon.spy(notification, 'send');

      events.dialToCallee(fakeSession)(fakePayload);

      expect(findUserById).to.not.have.been.called;
      expect(sendSpy).to.not.have.been.called;

      findUserById.restore();
      sendSpy.restore();
    });

    it('should throw error if there is no user data', () => {
      const findUserById = sinon.stub(userService, 'findUserById').resolves(null);
      const errorMessage = `There is no user data for user ${fakePayload.calleeId}`;

      const dialToCalleePromise = events.dialToCallee(fakeSession)(fakePayload);

      expect(dialToCalleePromise).to.eventually.be.rejectedWith(errorMessage);
      expect(findUserById).to.have.been.calledOnce;
      expect(findUserById).to.have.been.calledWith({ userId: fakePayload.calleeId });

      findUserById.restore();
    });

    it('should throw error if there is no available user device token', () => {
      const findUserById = sinon.stub(userService, 'findUserById').resolves({});
      const errorMessage = `There is no available deviceToken for user ${fakePayload.calleeId}`;

      const dialToCalleePromise = events.dialToCallee(fakeSession)(fakePayload);

      expect(dialToCalleePromise).to.eventually.be.rejectedWith(errorMessage);
      expect(findUserById).to.have.been.calledOnce;
      expect(findUserById).to.have.been.calledWith({ userId: fakePayload.calleeId });

      findUserById.restore();
    });

    it('should send notification with caller information', async () => {
      const callee = { deviceToken: 'fake deviceToken' };
      const notificationPayload = {
        data: {
          room: fakeSession.room,
          callerId: fakeSession.user,
        },
        android: { priority: 'high' },
        token: callee.deviceToken,
      };
      const findUserById = sinon.stub(userService, 'findUserById').resolves(callee);
      const sendStub = sinon.stub(notification, 'send').resolves();

      await events.dialToCallee(fakeSession)(fakePayload);

      expect(findUserById).to.have.been.calledOnce;
      expect(findUserById).to.have.been.calledWith({ userId: fakePayload.calleeId });
      expect(sendStub).to.have.been.calledOnce;
      expect(sendStub).to.have.been.calledWith(notificationPayload);

      findUserById.restore();
      sendStub.restore();
    });
  });

  context('awakenByCaller', () => {
    let joinStub;
    let toStub;
    let emitStub;
    let fakePayload;

    beforeEach(() => {
      joinStub = sinon.stub(socket, 'join');
      toStub = sinon.stub(socket, 'to').returns(socket);
      emitStub = sinon.stub(socket, 'emit');
      fakePayload = {
        room: 'fake room',
        callerId: 'fake callerId',
        calleeId: 'fake calleeId',
      };
    });

    afterEach(() => {
      joinStub.restore();
      toStub.restore();
      emitStub.restore();
    });

    it('should emit to sender with extra infos', () => {
      const {
        room,
        calleeId,
        callerId,
      } = fakePayload;

      events.awakenByCaller(fakeSession)(fakePayload);

      expect(fakeSession).to.have.property('room').with.equal(room);
      expect(fakeSession).to.have.property('user').with.equal(calleeId);
      expect(fakeSession).to.have.property('callerId').with.equal(callerId);
    });
  });

  context('byeFromClient', () => {
    let sandbox;

    let emitStub;
    let toStub;
    let leaveStub;
    let disconnectStub;

    beforeEach(() => {
      sandbox = sinon.createSandbox();

      emitStub = sinon.stub(socket, 'emit');
      toStub = sinon.stub(socket, 'to').returns(socket);
      leaveStub = sinon.stub(socket, 'leave');
      disconnectStub = sandbox.stub();

      events.__set__('disconnect', disconnectStub);

      Object.assign(fakeSession, {
        user: 'fake user',
        room: 'fake room',
      });
    });

    afterEach(() => {
      emitStub.restore();
      toStub.restore();
      leaveStub.restore();

      sandbox.restore();
      events = rewire('./session_control_events');
    });

    it('should broadcast bye and cleanup', async () => {
      const removeUserFromThisCallingStub = sinon.stub(callingService, 'removeUserFromThisCalling').resolves();
      const {
        user,
        room,
      } = fakeSession;
      const byeEventPayload = { sender: user };

      await events.byeFromClient(fakeSession)();

      expect(removeUserFromThisCallingStub).to.have.been.calledOnce;
      expect(removeUserFromThisCallingStub).to.have.been.calledWith({ userId: user });
      expect(toStub).to.have.been.calledAfter(removeUserFromThisCallingStub);
      expect(toStub).to.have.been.calledOnce;
      expect(toStub).to.have.been.calledWith(room);
      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('NOTIFY_END_OF_CALL', byeEventPayload);
      expect(leaveStub).to.have.been.calledOnce;
      expect(leaveStub).to.have.been.calledAfter(emitStub);
      expect(leaveStub).to.have.been.calledWith([fakeSession.room, `user:${user}`]);
      expect(disconnectStub).to.have.been.calledOnce;
      expect(disconnectStub).to.have.been.calledAfter(leaveStub);

      removeUserFromThisCallingStub.restore();
    });
  });
});
