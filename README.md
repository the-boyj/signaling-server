[![Codacy Badge](https://api.codacy.com/project/badge/Grade/6ec8dc4732044691b575299092d18161)](https://www.codacy.com/app/the-boyj/signaling-server?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=the-boyj/signaling-server&amp;utm_campaign=Badge_Grade)

## Execution
* Run server
```sh
FIREBASE_DATABASE_URL=<firebase-database-url> \
FIREBASE_ACCOUNT_TYPE=<firebase-account-type> \
FIREBASE_ACCOUNT_PROJECT_ID=<firebase-account-project-id> \
FIREBASE_ACCOUNT_PRIVATE_KEY_ID=<firebase-account-private-key-id> \
FIREBASE_ACCOUNT_PRIVATE_KEY=<firebase-account-private-key> \
FIREBASE_ACCOUNT_CLIENT_EMAIL=<firebase-account-client-email> \
FIREBASE_ACCOUNT_CLIENT_ID=<firebase-account-client-id> \
FIREBASE_ACCOUNT_AUTH_URI=<firebase-account-auth-uri> \
FIREBASE_ACCOUNT_TOKEN_URI=<firebase-account-token-uri> \
FIREBASE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL=<firebase-account-auth-provider-x509-cer-url> \
FIREBASE_ACCOUNT_CLIENT_X509_CERT_URL=<firebase-account-client-x509-cert-url> \
REDIS_HOST=<redis-host> \
REDIS_PORT=<redis-port> \
npm start
```
* Run tests with Mocha
```sh
FIREBASE_DATABASE_URL=<firebase-database-url> \
FIREBASE_ACCOUNT_TYPE=<firebase-account-type> \
FIREBASE_ACCOUNT_PROJECT_ID=<firebase-account-project-id> \
FIREBASE_ACCOUNT_PRIVATE_KEY_ID=<firebase-account-private-key-id> \
FIREBASE_ACCOUNT_PRIVATE_KEY=<firebase-account-private-key> \
FIREBASE_ACCOUNT_CLIENT_EMAIL=<firebase-account-client-email> \
FIREBASE_ACCOUNT_CLIENT_ID=<firebase-account-client-id> \
FIREBASE_ACCOUNT_AUTH_URI=<firebase-account-auth-uri> \
FIREBASE_ACCOUNT_TOKEN_URI=<firebase-account-token-uri> \
FIREBASE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL=<firebase-account-auth-provider-x509-cer-url> \
FIREBASE_ACCOUNT_CLIENT_X509_CERT_URL=<firebase-account-client-x509-cert-url> \
REDIS_HOST=<redis-host> \
REDIS_PORT=<redis-port> \
npm test 
```
