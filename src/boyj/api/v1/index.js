import express from 'express';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.all('*', (req, res, next) => {
  console.log('before');
  next();
  console.log('after');
});

app.get('/', (req, res) => {
  console.log('hi');
  res.status(200)
    .json({
      a: req.path,
      b: req.path,
      c: res.statusCode,
    });
});

app.listen(3001);

export default app;
