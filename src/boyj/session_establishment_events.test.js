/* eslint-disable no-unused-expressions */
const chai = require('chai');

const { expect } = chai;
const chaiAsPromise = require('chai-as-promised');

chai.use(chaiAsPromise);
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const events = require('./session_establishment_events');

describe('session_establishment_events', () => {
  const io = {};
  const socket = {
    join: () => {},
    emit: () => {},
    to: () => {},
  };
  let fakeSession;
  let joinStub;
  let emitStub;
  let toStub;

  beforeEach(() => {
    fakeSession = {
      io,
      socket,
      user: 'fake user',
      room: 'fake room',
    };
    joinStub = sinon.stub(socket, 'join');
    emitStub = sinon.stub(socket, 'emit');
    toStub = sinon.stub(socket, 'to').returns(socket);
  });

  afterEach(() => {
    joinStub.restore();
    emitStub.restore();
    toStub.restore();
  });

  context('acceptFromCallee', () => {
    it('should join the room and broadcast offer', () => {
      const {
        room,
        user,
      } = fakeSession;
      const fakePayload = { sdp: 'fake sdp' };
      const relayOfferPayload = {
        sender: user,
        sdp: fakePayload.sdp,
      };

      events.acceptFromCallee(fakeSession)(fakePayload);

      expect(joinStub).to.have.been.calledOnce;
      expect(joinStub).to.have.been.calledWith([room, `user:${user}`]);
      expect(toStub).to.have.been.calledOnce;
      expect(toStub).to.have.been.calledWith(room);
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
