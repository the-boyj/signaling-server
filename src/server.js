import listen from 'socket.io';
import events from './events';
import logger from './logger';

const addEventListeners = ({ io, weakMap }) => (socket) => {
  events.forEach((event) => {
    socket.on(event.name, event.handler({ io, socket, weakMap }));
  });
};

class Server {
  constructor() {
    this.io = listen(null, {});
    this.port = 3000;
  }

  start() {
    const { io } = this;
    const weakMap = new WeakMap();

    io.on('connection', addEventListeners({ io, weakMap }));
    io.listen(this.port);
    logger.trace(`server started at port ${this.port}`);
    return io;
  }

  close() {
    this.io.close();
  }
}

export default Server;
