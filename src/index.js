import Server from './server';

const server = new Server();
server.start()
  .then(() => {
    console.log(`server started at port : ${server.port}`);
  });
