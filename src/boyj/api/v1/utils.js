import * as HttpStatus from 'http-status-codes';

class Model {
  constructor() {
    this.data = null;
  }

  setData(data) {
    this.data = data;
  }

  getData() {
    return this.data;
  }
}

const STATUS_ERROR = 4;
const STATUS_FAIL = 5;

const getStatusType = code => Math.floor(code / 100);

const isErrorStatus = code => getStatusType(code) === STATUS_ERROR;

const isFailStatus = code => getStatusType(code) === STATUS_FAIL;

const isSuccessStatus = code => !isErrorStatus(code) && !isFailStatus(code);

const getStatus = (code) => {
  const statusType = getStatusType(code);

  switch (statusType) {
    case STATUS_FAIL:
      return 'fail';
    case STATUS_ERROR:
      return 'error';
    default:
      return 'success';
  }
};

/**
 * 유저 요청에 대한 응답을 만드는 함수.
 * callback 함수에 다양한 HTTP 관련 인자가 들어간다.
 *
 * req: HTTP Request
 *
 * res: HTTP Response
 *
 * query: HTTP query string
 *   ex) userId from url /users?userId=...
 *
 * params: parameters in HTTP url
 *   ex) userId from url /users/:userId
 *
 * form: HTTP form data used in POST method (x-www-form-urlencoded)
 *
 * model: 핸들러로부터의 응답 데이터를 담기위한 Return Parameter
 *
 * @param req: HTTP Request
 * @param res: HTTP Response
 * @param callback: HTTP 요청에 대한 이벤트 핸들러 함수.
 */
const getJsonResponse = async ({
  req,
  res,
  callback,
}) => {
  const {
    query,
    params,
    body: form,
  } = req;
  const model = new Model();

  let error = {};

  try {
    await callback({
      req,
      res,
      query,
      params,
      form,
      model,
    });
  } catch (err) {
    if (!isFailStatus(res.statusCode)) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    error = err;
  }

  const { statusCode } = res;
  const jsonResponse = {
    code: statusCode,
    status: getStatus(statusCode),
    message: null,
    data: null,
  };

  if (isFailStatus(statusCode)) {
    jsonResponse.message = error.message;
    jsonResponse.data = error.message;
  }

  if (isErrorStatus(statusCode)) {
    jsonResponse.message = HttpStatus.getStatusText(statusCode);
    jsonResponse.data = HttpStatus.getStatusText(statusCode);
  }

  if (isSuccessStatus(statusCode)) {
    jsonResponse.data = model.getData();
  }

  return jsonResponse;
};

const restfulResponse = callback => async (req, res) => {
  const jsonResponse = await getJsonResponse({
    req,
    res,
    callback,
  });

  res.json(jsonResponse);
};

export { restfulResponse };
