import express from 'express';
import * as HttpStatus from 'http-status-codes';
import {UniqueConstraintError, ValidationError} from 'sequelize';
import { restfulResponse } from './utils';
import * as Users from '../../model/user_service';

const app = express();

app.get('/', restfulResponse(async ({
  model,
  query,
}) => {
  const { except } = query;
  const exceptUsers = except && except.split(',');

  const users = await Users.findAllUsers({ except: exceptUsers });

  model.set('data', users);
}));

app.get('/:userId', restfulResponse(async ({
  model,
  params,
}) => {
  const { userId } = params;

  const user = await Users.findUserById({ userId });

  model.set('data', user);
}));

app.post('/', restfulResponse(async ({
  res,
  form: user,
  model,
}) => Users.save(user)
  .then((savedUser) => {
    res.status(HttpStatus.CREATED);
    model.set('data', savedUser);
  })
  .catch((err) => {
    if (err instanceof UniqueConstraintError) {
      res.status(HttpStatus.CONFLICT);
      return;
    }
    throw err;
  })));

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
      model.set('data', updatedUser);
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
