import express from 'express';
import bodyParser from 'body-parser';
import * as HttpStatus from 'http-status-codes';
import { restfulResponse } from './utils';
import user from './user_controller';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/users', user);

const notFoundHandler = restfulResponse(({ res }) => {
  res.status(HttpStatus.NOT_FOUND);
});

// 이벤트 핸들러 등록과 실제 실행 순서가 같으므로
// 404 Not Found 핸들러 위치가 아주 중요합니다.
app.all('*', notFoundHandler);

export default app;
