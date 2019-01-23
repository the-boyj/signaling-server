const sice = socket => (candidate) => {
  // evaluate to true if value is null, undefined, NaN, empty string, 0, false
  if (!candidate || !candidate.deviceToken) {
    socket.emit('peer_error', candidate.deviceToken);
  }
  socket.to(candidate.deviceToken).emit('rice', candidate);
};

module.exports = { sice };
