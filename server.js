const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
// const path = require('path');

const app = express()
const PORT = 3001;
const saltRounds = 10;

// app.use(express.static(path.join(__dirname, 'build')));
app.use(express.json());
app.use(require('cors')());

var dbconnection  = mysql.createPool({
    connectionLimit : 10,
    host            : 'fullstackdbinstance.cvhxiooi2cwh.us-east-2.rds.amazonaws.com',
    user            : 'admin',
    password        : 'password123',
    database        : 'fullstackdb'
  });

// var dbconnection  = mysql.createPool({
//   connectionLimit : 10,
//   host            : 'localhost',
//   user            : 'root',
//   password        : 'password123',
//   database        : 'study_buddy_db'
// });

// app.get('/', function(req, res){
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

app.get('/api/home', function(req, res) {
    res.json({message:'Welcome!'});
  });

app.get('/api/secret', function(req, res) {
    res.json({message:'The password is potato'});
});



app.post('/api/signUp',queryUser, encrypt, (req, res) => {
    
    console.log(req.results);
    if(req.results.length > 0) {
      console.log('User already exists!');
      res.status(409).json({message:'User already exists!'});
    }
    else {
      console.log("Adding user...")
      insert(req.body.username, req.hash, req.body.classes);
      res.status(200).json({message:'User Added!'});
    }
})

app.get('/api/signIn',queryUser, auth, (req, res) => {
    if(req.results.length == 0){
        console.log('User does not exist!');
        res.status(404).json({message:req.auth});
    }
    else if(!req.auth) res.status(401).json({message:req.auth});
    else res.status(200).json({message:req.auth});
})




function insert(username, pass, classes){
    dbconnection.getConnection(function(err, connection) {
        if (err) throw err;
        connection.query(`insert into users values(?,?,?)`, [username, pass, classes], function(err, result) {
            connection.release();
            if (err) {
                res.status(500).send("Query Failed");
                return;
            }
            console.log("1 record inserted");
        });
    });
}

function queryUser(req, res, next){
    dbconnection.getConnection(function(err, connection) {
        if (err) throw err;
        console.log("Connected!");
        connection.query(`SELECT USERNAME, CAST(PASS as CHAR) as PASS, CLASSES FROM users WHERE USERNAME=?`,[req.body.username], function(err, results) {
            connection.release();
            if (err) {
                res.status(500).send("Query Failed");
                return;
            }
            else{
                req.results = results;
                next();
                return;
            }

        })

    });
}

function auth(req, res, next){
    if(req.results.length == 0){
        req.auth = false;
        next();
        return;
    }
    bcrypt.compare(req.body.password, req.results[0].PASS, function(err, result) {
        if(err) {
            res.status(500).send("Internal Error");
            throw err;
        }
        req.auth = result;
        next();
    });
}

function encrypt(req, res, next){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if(err) {
            res.status(500).send("Internal Error");
            throw err;
        }
        req.hash = hash;
        next();
    });
}


app.use(function(req, res) {
    res.status(400);
    res.send("Invalid Request!");
});

app.listen(process.env.PORT || PORT, () => {
    console.log(`Listening on port: ${PORT}`)
})