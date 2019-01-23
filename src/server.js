import listen from 'socket.io';

const addEventListeners = (socket) => {
  socket.on('echo', (data) => {
    socket.emit('echo', data);
  });
  socket.on('dial', (deviceToken) => {
    socket.join(deviceToken);
    socket.emit('created', 'created success');
  });
  socket.on('accept', (deviceToken) => {
    socket.join(deviceToken);
  });
  socket.on('sice', (candidate) => {
    // evaluate to true if value is null, undefined, NaN, empty string, 0, false
    if (!candidate || !candidate.deviceToken) {
      socket.emit('peer_error', candidate.deviceToken);
    }
    socket.to(candidate.deviceToken).emit('rice', candidate);
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
