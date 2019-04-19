import * as Redis from 'redis';
import * as Promise from 'bluebird';
import config from '../config';

const { redisOptions } = config;

Promise.promisifyAll(Redis.RedisClient.prototype);
Promise.promisifyAll(Redis.Multi.prototype);

const redis = Redis.createClient(redisOptions);

export default redis;
