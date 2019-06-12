export default {
  firebase: {
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    accountPath: {
      type: process.env.FIREBASE_ACCOUNT_TYPE,
      project_id: process.env.FIREBASE_ACCOUNT_PROJECT_ID,
      private_key_id: process.env.FIREBASE_ACCOUNT_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_ACCOUNT_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_ACCOUNT_CLIENT_ID,
      auth_uri: process.env.FIREBASE_ACCOUNT_AUTH_URI,
      token_uri: process.env.FIREBASE_ACCOUNT_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_ACCOUNT_CLIENT_X509_CERT_URL,
    },
  },
  redisOptions: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  sequelize: {
    schema: process.env.SEQUELIZE_SCHEMA,
    user_name: process.env.SEQUELIZE_USER_NAME,
    password: process.env.SEQUELIZE_PASSWORD,
    options: {
      host: process.env.SEQUELIZE_OPTION_HOST,
      dialect: process.env.SEQUELIZE_OPTION_DIALECT,
    },
  },
};
