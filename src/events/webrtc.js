import logger from '../logger';

const isValidSdp = sdp => sdp;

const defaultSsdp = isValid => ({ socket: sender, weakMap }) => (sdp) => {
  logger.trace(`sendSDP is called with sdp: ${sdp}`);

  if (isValid(sdp)) {
    const { room } = weakMap.get(sender);
    const receivers = sender.to(room);
    receivers.emit('rsdp', sdp);
  } else {
    sender.emit('serverError', { description: `Invalid SDP. ${sdp}` });
  }
};

const ssdp = defaultSsdp(isValidSdp);

const defaultSice = isValid => ({ socket: sender, weakMap }) => (candidate) => {
  logger.trace(`send ICECandidate is called with ice: ${candidate}`);

  if (isValid(candidate)) {
    const { room } = weakMap.get(sender);
    const receivers = sender.to(room);
    receivers.emit('rice', candidate);
  } else {
    sender.emit('serverError', { description: `Invalid ICE candidate. ${candidate}` });
  }
};

const isValidCandidate = candidate => candidate;

const sice = defaultSice(isValidCandidate);

const helper = { defaultSsdp, defaultSice };

module.exports = { helper, ssdp, sice };
