const express = require('express');
const bodyParser = require('body-parser')
const user = require('./user');
const app = express();
const port = 3000;

app.use(bodyParser.json())

app.post('/sign-up',user.signUp);
app.post('/sign-in',user.signIn);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})