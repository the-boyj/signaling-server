import listen from 'socket.io';

const addEventListeners = (socket) => {
  socket.on('echo', (data) => {
    socket.emit('echo', data);
  });
  socket.on('dial', () => {
    socket.emit('created', 'created success');
  });
  socket.on('sice', (candidate) => {
    socket.broadcast.to(candidate.room).emit('rice', candidate);
  });
  // Because I developed sice and rice without accept, I added this handler temporary
  socket.on('join', (room) => {
    socket.join(room);
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
