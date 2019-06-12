/* eslint-disable no-unused-expressions */
const chai = require('chai');

const { expect } = chai;
const chaiAsPromise = require('chai-as-promised');

chai.use(chaiAsPromise);
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const events = require('./session_establishment_events');
const callingService = require('./model/calling_service');

describe('session_establishment_events', () => {
  const io = {};
  const socket = {
    join: () => {},
    leave: () => {},
    emit: () => {},
    to: () => {},
    close: () => {},
  };
  let fakeSession;
  let joinStub;
  let leaveStub;
  let emitStub;
  let toStub;
  let closeStub;

  beforeEach(() => {
    fakeSession = {
      io,
      socket,
      user: 'fake user',
      room: 'fake room',
    };
    joinStub = sinon.stub(socket, 'join');
    leaveStub = sinon.stub(socket, 'leave');
    emitStub = sinon.stub(socket, 'emit');
    toStub = sinon.stub(socket, 'to').returns(socket);
    closeStub = sinon.stub(socket, 'close');
  });

  afterEach(() => {
    joinStub.restore();
    leaveStub.restore();
    emitStub.restore();
    toStub.restore();
    closeStub.restore();
  });

  context('acceptFromCallee', () => {
    it('should join the room and emit participants', async () => {
      const {
        room,
        user,
      } = fakeSession;
      const fakeParticipants = [
        { userId: 'fake user 1' },
        { userId: 'fake user 2' },
      ];
      const participantsPayload = {
        participants: fakeParticipants,
        length: fakeParticipants.length,
      };
      const findUsersInThisCallingWithJoiningStub = sinon.stub(callingService, 'findUsersInThisCallingWithJoining')
        .resolves(fakeParticipants);

      await events.acceptFromCallee(fakeSession)();

      expect(joinStub).to.have.been.calledOnce;
      expect(joinStub).to.have.been.calledWith([room, `user:${user}`]);
      expect(findUsersInThisCallingWithJoiningStub).to.have.been.calledOnce;
      expect(findUsersInThisCallingWithJoiningStub).to.have.been.calledAfter(joinStub);
      expect(findUsersInThisCallingWithJoiningStub).to.have.been.calledWith({
        roomId: room,
        userId: user,
      });
      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('PARTICIPANTS', participantsPayload);

      findUsersInThisCallingWithJoiningStub.restore();
    });
  });

  context('offerFromCallee', () => {
    it('should relay offer to receiver', () => {
      const fakePayload = {
        sdp: 'fake sdp',
        receiver: 'fake receiver',
      };
      const relayOfferPayload = {
        sdp: fakePayload.sdp,
        sender: fakeSession.user,
      };

      events.offerFromCallee(fakeSession)(fakePayload);

      expect(toStub).to.have.been.calledOnce;
      expect(toStub).to.have.been.calledWith(`user:${fakePayload.receiver}`);
      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('RELAY_OFFER', relayOfferPayload);
    });
  });

  context('rejectFromCallee', () => {
    it('should broadcast to caller', () => {
      const { user } = fakeSession;
      const fakePayload = { receiver: 'fake receiver' };
      const byeEventPayload = {
        sender: user,
        receiver: fakePayload.receiver,
      };

      events.rejectFromCallee(fakeSession)(fakePayload);

      expect(toStub).to.have.been.calledOnce;
      expect(toStub).to.have.been.calledWith(`user:${fakePayload.receiver}`);
      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('NOTIFY_REJECT', byeEventPayload);
      expect(leaveStub).to.have.been.calledOnce;
      expect(leaveStub).to.have.been.calledAfter(emitStub);
      expect(leaveStub).to.have.been.calledWith([fakeSession.room, `user:${user}`]);
      expect(closeStub).to.have.been.calledOnce;
      expect(closeStub).to.have.been.calledAfter(leaveStub);
    });
  });

  context('answerFromClient', () => {
    it('should emit relay answer event to receiver', () => {
      const fakePayload = {
        sdp: 'fake sdp',
        receiver: 'fake receiver',
      };
      const relayAnswerPayload = {
        sdp: fakePayload.sdp,
        sender: fakeSession.user,
      };

      events.answerFromClient(fakeSession)(fakePayload);

      expect(toStub).to.have.been.calledOnce;
      expect(toStub).to.have.been.calledWith(`user:${fakePayload.receiver}`);
      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('RELAY_ANSWER', relayAnswerPayload);
    });
  });

  context('iceCandidateFromClient', () => {
    it('should relay iceCandidate to receiver', () => {
      const fakePayload = {
        iceCandidate: 'fake iceCandidate',
        receiver: 'fake receiver',
      };
      const relayIceCandidatePayload = {
        iceCandidate: fakePayload.iceCandidate,
        sender: fakeSession.user,
      };

      events.iceCandidateFromClient(fakeSession)(fakePayload);

      expect(toStub).to.have.been.calledOnce;
      expect(toStub).to.have.been.calledWith(`user:${fakePayload.receiver}`);
      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('RELAY_ICE_CANDIDATE', relayIceCandidatePayload);
    });
  });
});
