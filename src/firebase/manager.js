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
validteMessage(msg) in messaging().send(msg) can throw FirebaseMessagingError follwing description
1. FirebaseMessagingError with null object
when msg is null object
2. FirebaseMessagingError when there is no topic, token, nor condition
when msg don't contain any topic, token, nor condition
 */
const send = async (manager, msg) => {
  await manager
    .messaging()
    .send(msg);
  return Promise.resolve(msg);
};

module.exports = { config, firebaseManager, send };
