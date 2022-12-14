'use strict';

const createError = require('http-errors')
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');


const app = express();
const SECRET = '';

app.set('trust proxy', 1);
app.use(
  cookieSession({
    name: 'cookieSession',
    keys: ['key1'],
    secret: SECRET,
    maxAge: new Date(Date.now() + 864e5),
    httpOnly: true,
    secure: false
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS Config
const portApi = 8443;
const corsAllowDomains = ['http://localhost:9000', 'http://localhost:4200', 'https://desweb-eight.vercel.app'];
app.use(
  cors({
    origin: corsAllowDomains,
    credentials: true,
    methods: ['GET', 'PUT', 'DELETE', 'POST', 'OPTIONS'],
    exposedHeaders: ['']
  })
);

// API Dinamica
const endPoint = require('./helpers/endpoint');
const API_ROOT = ['api'];

(function recursiveRoutes(folderRoot) {
  folderRoot.forEach((element) => {
    const API_FOLDER = path.normalize(element, '.js');
    readFolders(API_FOLDER);
  });
})(API_ROOT);

function readFolders(folderName) {
  fs.readdirSync(folderName).forEach((file) => {
    const fullName = path.join(folderName, file);
    const stat = fs.lstatSync(fullName);

    if(stat.isDirectory()) {
      readFolders(fullName);
    } else if(file.toLowerCase().indexOf('.js') !== -1) {
      console.log('Aqui', endPoint.normalize(fullName, '.js'));
      require('./' + fullName)(app, endPoint.normalize(fullName, '.js'));
    }
  });
}

// catch 404
app.use((req, res) => {
  res.status(404);
  res.json({
    message: createError(404)
  });
});

app.listen(portApi, () => {
  console.log('-------------------------------');
  console.log('\n REST API routes');

  app._router.stack.forEach((item) => {
    if(item.name !== 'router' && item.name !== 'bound dispatch') {
      return;
    }
    console.log(
      '[' + item.route.stack[0].method.toUpperCase() + ']',
      item.route.path
    );
  });
  console.log('-------------------------------\n\n');
});

module.exports = app;
