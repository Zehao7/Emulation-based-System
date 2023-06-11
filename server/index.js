const express = require('express')
const cors = require("cors")
const fileUpload = require('express-fileupload');
const sqlRoute = require('./route')
const sqlAna = require('./analysis')
const fbRoute = require('./fbRoute')
const config = require('./config')

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static("files"));
app.use(fileUpload());

app.post('/sqltest', (req, res) => {
    console.log("body: ", req.body)
    const name = req.body.name
    const age = req.body.age
    const country = req.body.country

    config.sqlDB.query(
        'INSERT INTO test (name, age, country) VALUES (?, ?, ?)',
        [name, age, country], (err, result) => {
            if (err) {
                console.log(err)
            } else {
                res.send("Vals inserted")
            }
        }
    );
});

app.post('/put', (req, res) => {
    // console.log(req.body.file);
    // console.log(req.body);
    // console.log(req.body.numPart);
    console.log(req.body.name);
    var err = "", content = "Success"
    if (config.srcDB === 'MySQL') {
        sqlRoute.Route("put", [req.body.name, req.body.numPart], req.body.file, function (result) {
            err = ""
            res.send({ content: result, err: err }); })
    }
    else {
        fbRoute.Route("put", [req.body.file, req.body.numPart], req.body.name, function (result) { console.log("send result in Firebase"); res.send({ content: result, err: err }); })
    }
});

app.post('/cmd', (req, res) => {
    var cmd = req.body.cmd, params = req.body.params, filename = req.body.filename;
    var err = "";
    if (config.srcDB === 'MySQL') {
        sqlRoute.Route(cmd, params, filename, function (result,error) {
            if(error==undefined) error =  ""
            res.send({ content: result, err: error });
        });
    }
    else {
        fbRoute.Route(cmd, params, filename, function (result) { res.send({ content: result, err: err }); });
    }
});

app.post('/db', (req, res) => {
    config.srcDB = req.body.db;
    console.log(config.srcDB);
    res.send(req.body.db);
});

app.post('/query', (req, res) => {
    console.log(req.body.rawQuery);
    var output = '', err = ''
    console.log(config.srcDB)
    if (config.srcDB === 'MySQL') {
        sqlAna.HandleQuery(req.body.rawQuery, (params) => {
            res.send({ output: params[0], err: params[1] });
        })
    }
    else {
        fbRoute.Route("doQuery", req.body.rawQuery, "null", (params) => {
            res.send({ output: params[0], err: params[1] })
        })

    }
});


app.listen(3001, () => {
    console.log("hello node")
})