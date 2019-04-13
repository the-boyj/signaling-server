import * as firebaseAdmin from 'firebase-admin';
import 'babel-polyfill';
import config from './config';

const { firebase } = config;
const {
  databaseURL,
  accountPath,
} = firebase;

const credential = firebaseAdmin.credential.cert(accountPath);

const firebaseApp = firebaseAdmin.initializeApp({
  databaseURL,
  credential,
});

export default firebaseApp.messaging();
