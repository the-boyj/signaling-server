import express from 'express';
import Server from './server';
import {
  createSession,
  releaseSession,
  createRoom,
  dialToCallee,
  awakenByCaller,
  byeFromClient,
  receiveErrorFromClient,
} from './boyj/session_control_events';
import {
  acceptFromCallee,
  rejectFromCallee,
  answerFromClient,
  iceCandidateFromClient, offerFromCallee,
} from './boyj/session_establishment_events';
import errorHandler from './boyj/signaling_error_handler';
import { withSession } from './boyj/signaling_validations';
import api from './boyj/api';

const app = express();
app.use('/api', api);

const server = new Server({
  port: 3000,
  restful: app,
});

server
  .setCreateSession(createSession)
  .setReleaseSession(releaseSession)
  .setHookAfterSessionCreation(() => {})
  .setHookAfterSocketInitialization(() => {})
  .setDefaultErrorHandler(errorHandler)
  .on('CREATE_ROOM', createRoom)
  .on('DIAL', withSession(dialToCallee))
  .on('AWAKEN', awakenByCaller)
  .on('ACCEPT', withSession(acceptFromCallee))
  .on('REJECT', withSession(rejectFromCallee))
  .on('OFFER', withSession(offerFromCallee))
  .on('ANSWER', withSession(answerFromClient))
  .on('SEND_ICE_CANDIDATE', withSession(iceCandidateFromClient))
  .on('END_OF_CALL', withSession(byeFromClient))
  .on('PEER_TO_SERVER_ERROR', withSession(receiveErrorFromClient))
  .start();
