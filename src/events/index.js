/*
  This module convert each event handler modules into single array.
  You can import arbitrary module that contains handlers like below.

  module.exports = {
    handler1,
    handler2,
  };

  In common.js, you can see how it is implemented.

  If you want to import module named 'myHandler.js', try this code.

  import * as myHandler from './myHandler';
  ...
  ...
  export default
  [common, myHandler]
    .flatMap(....)
      .filter(....)
      .map(....);

   After all, your handler names will be used in event name
   and handler function will used in event callback function.
 */
import * as common from './common';
import * as call from './call';
import * as webrtc from './webrtc';

export const isValidHandler = handlers => key => key !== 'default' && typeof handlers[key] === 'function';

export const getHandler = handlers => key => ({ name: key, handler: handlers[key] });

// Write new handler module here.
const events = [];
[common, call, webrtc]
  .forEach(handlers => Object.keys(handlers)
    .filter(isValidHandler(handlers))
    .map(getHandler(handlers))
    .forEach((handler) => {
      events.push(handler);
    }));

export default events;
