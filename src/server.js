import listen from 'socket.io';

const addEventListeners = (socket) => {
  socket.on('echo', (data) => {
    socket.emit('echo', data);
  });
  socket.on('dial', () => {
    socket.emit('created', 'created success');
  });
};

class Server {
  constructor() {
    this.io = listen(null, {});
    this.port = 3000;
  }

  start() {
    this.io.on('connection', addEventListeners);
    this.io.listen(this.port);
    console.log(`server started at port ${this.port}`);
    return this.io;
  }

  close() {
    this.io.close();
  }
}

export default Server;
