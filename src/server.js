import listen from 'socket.io';
import * as http from 'http';
import logger from './logger';

/**
 * 서버 클래스를 모듈 기본값으로 설정함으로써
 * 임의의 변수명에 할당하여 초기화 작업을 진행할 수 있습니다.
 *
 * import FooBarServer from './server'
 * const server = new FooBarServer();
 */
export default class SignalingServer {
  /**
   * 시그널링 서버 객체의 생성자로서
   * 이후 필요한 여러 인자들 중 필수로 필요한 인자만 받습니다.
   *
   * @param port
   */
  constructor({
    port = 3000,
    restful,
  }) {
    // 서버의 설정과 초기화에 사용되는 객체
    this.port = port;
    this.server = (restful && http.createServer(restful)) || null;
    this.eventHandlers = new Map();

    // socket.io 관련 객체
    this.io = listen(this.server, {
      pingTimeout: 60000,
    });

    // hook methods
    this.createSession = defaultParam => defaultParam;
    this.releaseSession = () => {};
    this.hookAfterSessionCreation = () => {};
    this.hookAfterSocketInitialization = () => {};
    this.defaultErrorHandler = () => {};
  }

  /**
   * Socket 객체에 매핑되어 각 이벤트 핸들러에 첫 인자로 들어갈
   * Session 객체를 초기화하는 콜백 함수를 설정합니다.
   * socket.io의 모든 객체를 관리하는 io와, 이벤트 핸들링의 대상이 되는 socket객체를
   * 기본 인자로 받게됩니다.
   *
   * @param createSession
   * @returns {SignalingServer}
   */
  setCreateSession(createSession = defaultSession => defaultSession) {
    this.createSession = createSession;
    return this;
  }

  /**
   * Session 객체가 갖고있는 유저의 추가적인 정보를 해제한다.
   * 메모리 누수가 발생하지 않도록 각 프로퍼티의 reference count를 관리한다.
   *
   * @param releaseSession
   * @returns {SignalingServer}
   */
  setReleaseSession(releaseSession = () => {}) {
    this.releaseSession = releaseSession;
    return this;
  }

  /**
   * Session 생성 직후 호출되는 hookAfterSessionCreation 콜백 함수를 설정합니다.
   * 유저 인증과 같은 작업이 들어갈 수 있습니다.
   *
   * @param hookAfterSessionCreation
   * @returns {SignalingServer}
   */
  setHookAfterSessionCreation(hookAfterSessionCreation = () => {}) {
    this.hookAfterSessionCreation = hookAfterSessionCreation;
    return this;
  }

  /**
   * 유저 이벤트 핸들러의 설정 직후 실행되는 hookAfterSocketInitialization 콜백 함수를 설정합니다.
   * socket.io의 reserved event handler 등을 설정할 수 있습니다.
   *
   * @param hookAfterSocketInitialization
   * @returns {SignalingServer}
   */
  setHookAfterSocketInitialization(hookAfterSocketInitialization = () => {}) {
    this.hookAfterSocketInitialization = hookAfterSocketInitialization;
    return this;
  }

  /**
   * 시그널링 이벤트에서 발생한 에러에 대한 디폴트 에러 핸들러를 설정합니다.
   *
   * @param defaultErrorHandler
   * @returns {SignalingServer}
   */
  setDefaultErrorHandler(defaultErrorHandler = () => {}) {
    this.defaultErrorHandler = defaultErrorHandler;
    return this;
  }

  /**
   * 시그널링 서버가 핸들링할 이벤트와 핸들러를 받습니다.
   *
   * 이 객체가 실제 이벤트를 핸들링하지 않기 때문에
   * EventEmitter를 상속하지는 않습니다.
   *
   * 다만 사용자에게 익숙한 메소드명을 제공하기 위해
   * 다음과 같은 이름을 사용합니다.
   *
   * callback은 event에 대한 callback function이며
   * handler는 callback에서의 에러에 대한 callback function이다.
   *
   * @param event
   * @param callback
   * @param handler
   * @returns {SignalingServer}
   */
  on(event, callback, handler) {
    if (!event || !callback) {
      throw new Error(`Invalid arguments ${event}, ${callback}`);
    }

    const { eventHandlers } = this;

    if (eventHandlers.has(event)) {
      throw new Error(`Event ${event} is already registered`);
    }

    eventHandlers.set(event, { callback, handler });
    return this;
  }

  /**
   * 서버 시작 시 실행 코드로서
   * 이벤트 핸들러 호출 시 소켓에 매핑되어 사용될 객체(Session)을 초기화하고
   * 필요에 따라 사용자가 주입한 Hook 메소드를 실행합니다.
   *
   * 때문에 구현되는 모든 이벤트 핸들러들은 다음과 같이 2번 currying된 인터페이스를 사용해야 합니다.
   * const eventHandler = session => payload => {}
   *
   * 또한, 에러 핸들러는 다음의 currying된 인터페이스를 사용해야 합니다.
   * const errorHandler = err => context => {}
   *
   * 이 때, context는 session, payload 등을 담고있습니다.
   */
  start() {
    const {
      port,
      eventHandlers,
      io,
      createSession,
      hookAfterSessionCreation,
      hookAfterSocketInitialization,
    } = this;

    io.on('connection', (socket) => {
      const session = createSession({
        io,
        socket,
      });

      hookAfterSessionCreation(session);

      eventHandlers.forEach(({ callback, handler = this.defaultErrorHandler }, event) => {
        socket.on(event, async (payload = {}) => {
          try {
            await callback(session)(payload);
          } catch (err) {
            try {
              await handler(err, { session, payload });
              return;
            } catch (handlerErr) {
              logger.error(handlerErr);
            }
          }
        });
      });

      hookAfterSocketInitialization(session);

      socket.on('disconnect', () => {
        this.releaseSession(session);
        // eslint-disable-next-line no-multi-assign
        session.io = session.socket = undefined;
      });
    });

    this.server.listen(3000);
    logger.info(`server started at port ${port}`);
  }

  /**
   * 시그널링 서버를 종료하는 함수로서
   * 테스트 등의 제한된 환경에서 사용할 수 있습니다.
   */
  stop() {
    this.server.close();
  }
}
