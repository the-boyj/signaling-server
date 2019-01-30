const makeMessage = ({
  data,
  priority = 'high',
  token,
} = {}) => ({
  data,
  android: { priority },
  token,
});

module.exports = { makeMessage };
