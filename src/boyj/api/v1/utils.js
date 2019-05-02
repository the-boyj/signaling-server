import * as HttpStatus from 'http-status-codes';

const STATUS_ERROR = 4;
const STATUS_FAIL = 5;

const getStatusType = code => Math.floor(code / 100);

const isSuccessStatus = (code) => {
  const statusType = getStatusType(code);

  return statusType !== STATUS_ERROR
    && statusType !== STATUS_FAIL;
};

const isFailStatus = code => getStatusType(code) === STATUS_FAIL;

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
 *
 * @param req
 * @param res
 * @param callback
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
  const model = new Map();

  let message = null;
  let data = null;

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
      res.status(500);
    }

    // eslint-disable-next-line no-multi-assign
    message = data = err.message;
  }

  const { statusCode } = res;
  const isSuccess = isSuccessStatus(statusCode);

  if (isSuccess) {
    data = model.get('data');
  } else {
    // eslint-disable-next-line no-multi-assign
    message = data = message || HttpStatus.getStatusText(statusCode);
  }

  return {
    code: statusCode,
    status: getStatus(statusCode),
    message,
    data,
  };
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
