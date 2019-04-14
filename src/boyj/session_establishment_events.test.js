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
  let emitStub;
  let toStub;

  beforeEach(() => {
    fakeSession = {
      io,
      socket,
      user: 'fake user',
      room: 'fake room',
    };
    emitStub = sinon.stub(socket, 'emit');
    toStub = sinon.stub(socket, 'to').returns(socket);
  });

  afterEach(() => {
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

    it('should broadcast relay offer including sender info', () => {
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

      expect(toStub).to.have.been.calledOnce;
      expect(toStub).to.have.been.calledWith(room);
      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('relay offer', relayOfferPayload);
    });
  });

  context('acceptFromCalleeErrorHandler', () => {
    it('should emit invalid accept payload error to client', () => {
      const err = { message: 'fake message' };
      const context = { session: fakeSession };
      const errorPayload = {
        code: 304,
        description: 'Invalid Accept Payload',
        message: err.message,
      };

      events.acceptFromCalleeErrorHandler(err, context);

      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('SERVER_TO_PEER_ERROR', errorPayload);
    });
  });

  context('rejectFromCallee', () => {
    it('should emit bye to other clients', () => {
      const {
        room,
        user,
      } = fakeSession;
      const byeEventPayload = { sender: user };

      events.rejectFromCallee(fakeSession)();

      expect(toStub).to.have.been.calledOnce;
      expect(toStub).to.have.been.calledWith(room);
      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('bye', byeEventPayload);
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
        receiver: fakePayload.receiver,
        sender: fakeSession.user,
      };

      events.answerFromClient(fakeSession)(relayAnswerPayload);

      expect(toStub).to.have.been.calledOnce;
      expect(toStub).to.have.been.calledWith(`user:${fakePayload.receiver}`);
      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('relay answer', relayAnswerPayload);
    });
  });

  context('answerFromClientErrorHandler', () => {
    it('should emit error message to client', () => {
      const err = { message: 'fake message' };
      const context = { session: fakeSession };
      const errorPayload = {
        code: 305,
        description: 'Invalid Send Answer Payload',
        message: err.message,
      };

      events.answerFromClientErrorHandler(err, context);

      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('SERVER_TO_PEER_ERROR', errorPayload);
    });
  });

  context('icecandidateFromClient', () => {
    it('should throw error if payload is undefined', () => {
      const errMessage = `Invalid payload. payload: ${undefined}`;

      expect(events.icecandidateFromClient(fakeSession).bind(this)).to.throw(errMessage);
    });

    it('should throw error if payload does not contain properties', () => {
      const invalidPayloads = [
        {},
        { iceCandidate: undefined, receiver: 'fake receiver' },
        { iceCandidate: 'fake icecandidate', receiver: undefined },
      ];

      invalidPayloads.forEach((payload) => {
        const {
          iceCandidate,
          receiver,
        } = payload;
        const errMessage = `Invalid payload. iceCandidate: ${iceCandidate}, receiver: ${receiver}`;

        expect(events.icecandidateFromClient(fakeSession).bind(this, payload)).to.throw(errMessage);
      });
    });

    it('should relay icecandidate to receiver', () => {
      const fakePayload = {
        iceCandidate: 'fake icecandidate',
        receiver: 'fake receiver',
      };
      const relayIcecandidatePayload = {
        iceCandidate: fakePayload.iceCandidate,
        receiver: fakePayload.receiver,
        sender: fakeSession.user,
      };

      events.icecandidateFromClient(fakeSession)(fakePayload);

      expect(toStub).to.have.been.calledOnce;
      expect(toStub).to.have.been.calledWith(`user:${fakePayload.receiver}`);
      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('relay icecandidate', relayIcecandidatePayload);
    });
  });

  context('icecandidateFromClientErrorHandler', () => {
    it('should emit error message to client', () => {
      const err = { message: 'fake message' };
      const context = { session: fakeSession };
      const errorPayload = {
        code: 306,
        description: 'Invalid Send Icecandidate Payload',
        message: err.message,
      };

      events.icecandidateFromClientErrorHandler(err, context);

      expect(emitStub).to.have.been.calledOnce;
      expect(emitStub).to.have.been.calledWith('SERVER_TO_PEER_ERROR', errorPayload);
    });
  });
});
