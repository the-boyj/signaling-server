import listen from 'socket.io';
import events from './events';

const addEventListeners = io => (socket) => {
  events.forEach((event) => {
    socket.on(event.name, event.handler(io)(socket));
  });
};

class Server {
  constructor() {
    this.io = listen(null, {});
    this.port = 3000;
  }

  start() {
    this.io.on('connection', addEventListeners(this.io));
    this.io.listen(this.port);
    console.log(`server started at port ${this.port}`);
    return this.io;
  }

  close() {
    this.io.close();
  }
}

export default Server;
