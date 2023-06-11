const firebase = require('firebase/app')
const mySQLApp = require('mysql')

const firebaseConfig = {
  apiKey: "AIzaSyA55URxNCp4V-b_CDNrAAWnxJmjsKJfS6Y",
  authDomain: "dsci551-project-229fc.firebaseapp.com",
  databaseURL: "https://dsci551-project-229fc-default-rtdb.firebaseio.com/",
  projectId: "dsci551-project-229fc",
  storageBucket: "dsci551-project-229fc.appspot.com",
  messagingSenderId: "951394219493",
  appId: "1:951394219493:web:e57e8840ba1c7f50fbeb0c"
};

// Initialize Firebase
fbApp = firebase.initializeApp(firebaseConfig);

const sqlDB = mySQLApp.createConnection({
    user: 'root',
    host: 'localhost',
    password: 'Zzh12345',
    database: 'playground'
})

const sqlDBB = mySQLApp.createConnection({
  user: 'admin',
  host: 'localhost',
  password: '123456',
  database: 'DSCI551'
})

srcDB = '';

//exports.sqlDB = sqlDBB
exports.sqlDB = sqlDB
exports.fbApp = this.fbApp
exports.srcDB = this.srcDB
exports.firebaseConfig = firebaseConfig