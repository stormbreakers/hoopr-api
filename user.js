const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const saltRounds = 10;
const url = 'mongodb://localhost:27017';

const client = new MongoClient(url);

const dbName = 'myTestProject';

module.exports = {
  signUp,
  signIn
};

async function signUp(req, res) {
  try {
    const userDetails = _validateSignUp(req.body);
    await client.connect();
    await _checkUserExist(client, userDetails);
    const result = await _createUser(client, userDetails);
    handleSuccess(res, result);
  } catch (err) {
    handleError(res, err);
  }
}

async function signIn(req, res) {
  try {
    const userDetails = _validateSignIn(req.body);
    await client.connect();
    const user = await _getUserDetails(client, userDetails);
    if (user?.password) {
      const result = await verifyPassword(userDetails.password, user.password);
      if (!result) {
        throw Error('Incorrect password provided');
      }
    }
    const { password, ...sendObject } = user;
    handleSuccess(res, sendObject);
  } catch (err) {
    handleError(res, err);
  }
}

function _validateSignUp(details) {
  const validatedData = Object(details).keys.reduce((obj, val) => {
    if (details?.[val] && details[val].trim() !== '') {
      obj[val] = details[val];
    } else {
      obj.valuesNotFound.push(val)
    }
    return obj;
  }, {
    valuesFound: {},
    valuesNotFound: [],
  });

  if (validatedData.valuesNotFound.length > 0) {
    throw Error('Invalid data provided');
  }
  return validatedData.valuesFound;
}

function _validateSignIn(details) {
  const { email = '', password = '' } = details;
  if (email === '') {
    throw Error('email not provided')
  }
  if (password === '') {
    throw Error('password not provided')
  }

  return { email, password };
}

async function _checkUserExist(client, details) {
  try {
    const whereObj = {
      email: details.email
    };
    const user = await _getUser(client, whereObj);
    if (user) {
      throw Error('User already exist');
    }
  } catch (err) {
    throw err;
  }
}

async function _getUserDetails(client, details) {
  try {
    const whereObj = {
      email: details.email
    };
    const user = await _getUser(client, whereObj);
    if (!user) {
      throw Error('User not found');
    }
    return user;
  } catch (err) {
    throw err;
  }
}

async function _getUser(client, whereObj = {}) {
  try {
    const db = client.db(dbName);
    const collection = db.collection('users');
    return await collection.findOne(whereObj);
  } catch (err) {
    throw err;
  }
}

async function _insertUser(client, createObj) {
  try {
    const db = client.db(dbName);
    const collection = db.collection('users');
    return await collection.insertOne(createObj);
  } catch (err) {
    throw err;
  }
}

async function _createUser(client, details) {
  try {
    if (details?.password) {
      details.password = encryptPassword(details.password);
    }
    return await _insertUser(client, details)
  } catch (err) {
    throw err;
  }
}

async function encryptPassword(password) {
  try {
    return bcrypt.hash(password, saltRounds);
  } catch (err) {
    throw err;
  }
}

async function verifyPassword(password, hashedPassword) {
  try {
    return bcrypt.compare(password, hashedPassword);
  } catch (err) {
    throw err;
  }
}

function handleSuccess(res, details) {
  const sendObj = {
    message: 'Success',
    result: details || {}
  }
  res.status(200).send(sendObj);
}

function handleError(res, err) {
  const sendObj = {
    message: err || 'Something went wrong',
    result: {}
  }
  res.status(400).send(sendObj);
}