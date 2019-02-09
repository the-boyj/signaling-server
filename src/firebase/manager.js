import * as firebaseAdmin from 'firebase-admin';
import serviceAccount from '../../resource/firebase-key';
import 'babel-polyfill';

const databaseUrl = 'https://boyj-17019.firebaseio.com';
const config = (cert, dbUrl) => ({
  credential: firebaseAdmin.credential.cert(cert),
  databaseURL: dbUrl,
});

const firebaseManager = firebaseAdmin.initializeApp(config(serviceAccount, databaseUrl));

/*
ref : https://github.com/firebase/firebase-admin-node/blob/master/src/messaging/messaging.ts
validateMessage(msg) can throw FirebaseMessagingError with one of following descriptions
1. FirebaseMessagingError with null object
when msg is null object
2. FirebaseMessagingError when there is no topic, token, nor condition
when msg don't contain any topic, token, nor condition
 */
const send = async msg => firebaseManager.messaging().send(msg);

module.exports = { config, firebaseManager, send };
