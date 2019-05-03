import express from 'express';
import * as HttpStatus from 'http-status-codes';
import {
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';
import { restfulResponse } from './utils';
import * as Users from '../../model/user_service';

const app = express();

/**
 * GET /users/
 * 유저 목록을 반환하며 결과 없을 시 빈 배열([]) 제공.
 */
app.get('/', restfulResponse(async ({
  model,
  query,
}) => {
  const { except } = query;
  const exceptUsers = except && except.split(',');

  const users = await Users.findAllUsers({ except: exceptUsers });

  model.setData(users);
}));

/**
 * POST /users/
 * 새 유저를 등록. 성공(201)시 해당 유저 정보를 제공.
 */
app.post('/', restfulResponse(async ({
  res,
  form: user,
  model,
}) => Users.save(user)
  .then((savedUser) => {
    res.status(HttpStatus.CREATED);
    model.setData(savedUser);
  })
  .catch((err) => {
    if (err instanceof UniqueConstraintError) {
      res.status(HttpStatus.CONFLICT);
      return;
    }
    throw err;
  })));

/**
 * GET /users/:id
 * 유저 정보를 반환하며 해당 유저가 없을 시 404 제공.
 */
app.get('/:userId', restfulResponse(async ({
  res,
  model,
  params,
}) => {
  const { userId } = params;

  const user = await Users.findUserById({ userId });

  if (!user) {
    res.status(HttpStatus.NOT_FOUND);
    return;
  }

  model.setData(user);
}));

/**
 * POST /users/:id
 * 유저 정보를 수정한다.
 * 성공(201)시 수정된 유저 정보를 제공한다.
 *
 * device token등에 의해 Query String 최대 길이 문제가 생길 수 있어
 * PUT대신 POST방식을 사용한다.
 *
 */
app.post('/:userId', restfulResponse(async ({
  res,
  model,
  params,
  form: user,
}) => {
  const { userId } = params;

  Object.assign(user, { userId });

  await Users.setUserInfo(user)
    .then((updatedUser) => {
      res.status(HttpStatus.CREATED);
      model.setData(updatedUser);
    })
    .catch((err) => {
      if (err instanceof ValidationError) {
        res.status(HttpStatus.NOT_FOUND);
        return;
      }
      throw err;
    });
}));

export default app;
