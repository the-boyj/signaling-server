import express from 'express';
import http from 'http';
import SocketIO from 'socket.io';

const addEventListeners = (socket) => {
  socket.on('dial', () => {
    socket.emit('created', 'created success');
  });
};

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIO(this.server);
    this.port = 80;
  }

  start() {
    this.server.listen(this.port);

    // echo
    this.app.get('/echo', (req, res) => {
      res.send(req.query.msg);
    });

    this.io.on('connection', (socket) => {
      addEventListeners(socket);
    });

    return Promise.resolve(this);
  }
}

export default Server;
