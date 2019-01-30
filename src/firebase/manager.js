import * as firebaseAdmin from 'firebase-admin';
import * as firebaseError from 'firebase-admin/lib/utils/error';
import serviceAccount from '../../resource/firebase-key';
import * as messageMaker from './message-maker';
import 'babel-polyfill';

const databaseUrl = 'https://boyj-17019.firebaseio.com';
const { FirebaseMessagingError } = firebaseError;

const config = (cert, dbUrl) => ({
  credential: firebaseAdmin.credential.cert(cert),
  databaseURL: dbUrl,
});

const firebaseManager = firebaseAdmin.initializeApp(config(serviceAccount, databaseUrl));
const send = async ({ data, token }) => {
  const msg = messageMaker.makeMessage({ data, priority: 'high', token });
  try {
    await firebaseManager
      .messaging()
      .send(msg)
      .then((response) => {
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log(error);
      });
    return true;
  } catch (err) {
    // message data, token이 없을 경우
    if (err instanceof FirebaseMessagingError) {
      // TODO : error handling of various error code
      return err;
    }
    throw err;
  }
};

module.exports = { config, firebaseManager, send };
