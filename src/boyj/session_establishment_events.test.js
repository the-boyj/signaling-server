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
    it('should throw error if payload is undefined', () => {
      const errorMessage = `Invalid payload. payload: ${undefined}`;

      expect(events.acceptFromCallee(fakeSession).bind(this)).to.throw(errorMessage);
    });

    it('should throw error if payload does not contain sdp', () => {
      const invalidPayload = {};
      const errorMessage = `Invalid payload. sdp: ${undefined}`;

      expect(events.acceptFromCallee(fakeSession).bind(this, invalidPayload))
        .to.throw(errorMessage);
    });

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
      expect(joinStub).to.have.been.calledWith(room);
      expect(toStub).to.have.been.calledOnce;
      expect(toStub).to.have.been.calledWith(room);
      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('RELAY_OFFER', relayOfferPayload);
    });
  });

  context('acceptFromCalleeErrorHandler', () => {
    it('should emit invalid accept payload error to client', () => {
      const err = { message: 'fake message' };
      const context = { session: fakeSession };
      const errorPayload = {
        code: 304,
        description: 'Invalid ACCEPT Payload',
        message: err.message,
      };

      events.acceptFromCalleeErrorHandler(err, context);

      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('SERVER_TO_PEER_ERROR', errorPayload);
    });
  });

  context('rejectFromCallee', () => {
    it('should throw error if payload is undefined', () => {
      const errorMessage = `Invalid payload. payload: ${undefined}`;

      expect(events.rejectFromCallee(fakeSession).bind(this)).to.throw(errorMessage);
    });

    it('should throw error if payload does not include property', () => {
      const invalidPayloads = [
        {},
        { receiver: undefined },
      ];

      invalidPayloads.forEach((payload) => {
        const { receiver } = payload;
        const errorMessage = `Invalid payload. receiver: ${receiver}`;

        expect(events.rejectFromCallee(fakeSession).bind(this, payload)).to.throw(errorMessage);
      });
    });

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

  context('rejectFromCalleeErrorHandler', () => {
    it('should emit REJECT error to sender', () => {
      const context = { session: fakeSession };
      const err = { message: 'fake message' };

      events.rejectFromCalleeErrorHandler(err, context);

      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('SERVER_TO_PEER_ERROR', {
        code: 307,
        description: 'Invalid REJECT Payload',
        message: err.message,
      });
    });
  });

  context('answerFromClient', () => {
    it('should throw error if payload is undefined', () => {
      const errorMessage = `Invalid payload. payload: ${undefined}`;

      expect(events.answerFromClient(fakeSession).bind(this)).to.throw(errorMessage);
    });

    it('should throw error if payload doen not contain properties', () => {
      const invalidPayloads = [
        {},
        { sdp: 'fake sdp', receiver: undefined },
        { sdp: undefined, receiver: 'fake receiver' },
      ];

      invalidPayloads.forEach((payload) => {
        const {
          sdp,
          receiver,
        } = payload;
        const errorMessage = `Invalid payload. sdp: ${sdp}, receiver: ${receiver}`;

        expect(events.answerFromClient(fakeSession).bind(this, payload)).to.throw(errorMessage);
      });
    });

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

  context('answerFromClientErrorHandler', () => {
    it('should emit error message to client', () => {
      const err = { message: 'fake message' };
      const context = { session: fakeSession };
      const errorPayload = {
        code: 305,
        description: 'Invalid ANSWER Payload',
        message: err.message,
      };

      events.answerFromClientErrorHandler(err, context);

      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('SERVER_TO_PEER_ERROR', errorPayload);
    });
  });

  context('iceCandidateFromClient', () => {
    it('should throw error if payload is undefined', () => {
      const errMessage = `Invalid payload. payload: ${undefined}`;

      expect(events.iceCandidateFromClient(fakeSession).bind(this)).to.throw(errMessage);
    });

    it('should throw error if payload does not contain properties', () => {
      const invalidPayloads = [
        {},
        { iceCandidate: undefined, receiver: 'fake receiver' },
        { iceCandidate: 'fake iceCandidate', receiver: undefined },
      ];

      invalidPayloads.forEach((payload) => {
        const {
          iceCandidate,
          receiver,
        } = payload;
        const errMessage = `Invalid payload. iceCandidate: ${iceCandidate}, receiver: ${receiver}`;

        expect(events.iceCandidateFromClient(fakeSession).bind(this, payload)).to.throw(errMessage);
      });
    });

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

  context('iceCandidateFromClientErrorHandler', () => {
    it('should emit error message to client', () => {
      const err = { message: 'fake message' };
      const context = { session: fakeSession };
      const errorPayload = {
        code: 306,
        description: 'Invalid SEND_ICE_CANDIDATE Payload',
        message: err.message,
      };

      events.iceCandidateFromClientErrorHandler(err, context);

      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('SERVER_TO_PEER_ERROR', errorPayload);
    });
  });
});
