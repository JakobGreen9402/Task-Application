var express = require('express');
var bParser = require('body-parser');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var path = require('path');

var url = 'mongodb://localhost:27017/';
var dbName = 'schedulerApp';

let db; // Declares a variable to store things in MongoDB

app.use(bParser.urlencoded({ extended: true }));
app.use(bParser.json());

app.use(function (req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html')); // get method to grab the index.html page as the primary page
});

app.get('/register', function (req, res) {
    res.sendFile(path.join(__dirname, 'register.html')); // get method to grab register.html for the /register route
});

app.get('/default', function (req, res) {
    res.sendFile(path.join(__dirname, 'default.html')); // get method to grab default.html for the /default route
});

app.get('/entertasks', function (req, res) {
    res.sendFile(path.join(__dirname, 'task.html')); // get method to grab task.html for the /entertasks route
});

app.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    MongoClient.connect(url, function(err, client) {
        if (err) {
            throw err;
        }

        var usersCollection = db.collection('users');

        usersCollection.findOne({ username, password }, function (err, user) {
            if (err) {
                throw err;
            }
            if (user) {
                res.redirect('/default');
            } else {
                res.status(401).send('Invalid credentials');
            }

            client.close();

        });

    });

});

app.post('/register', function(req, res) {
    const { username, password, email, firstName, lastName } = req.body;

    // Creates a new user document
    const usersCollection = db.collection('users');
    const newUser = {
        username,
        password,
        email,
        firstName,
        lastName
    };

    // Insert the new user into the database
    usersCollection.insertOne(newUser, function(err) {
        if (err) {
            throw err;
        } else {

            // Redirect user to the default page
            res.redirect('/default');
        }
    });
});

app.post('/', function(req, res){
    var formUserName = req.body.userName;
    var formPassWord = req.body.passWord;
    MongoClient.connect('mongodb://localhost:27017/application', function (err, db) {
      if (err){
        throw err;
      }
      var dbCollection = db.collection('users');
              dbCollection.findOne({'dbUsername':formUserName}, function (err, document) {
                  if(document.dbPassword === formPassWord)
                  {
                      res.send("successful login");
                      console.log(document);
                  }
                  else
                  {
                      res.send("unsuccessful login");
                      console.log(document);
                  }

               db.close();

              });

      });

  });

 

app.post('/createuser', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;

    MongoClient.connect(url, function(err, client) {
        if (err) {
            throw err;
        }

        var usersCollection = db.collection('users');

        // Check if the username already exists
        usersCollection.findOne({ username }, function(err, existingUser) {
            if (err) {
                throw err;
            }

            if (existingUser) {
                res.status(409).send('Username already exists');
                client.close();
                return;
            }

            // If username is unique, this creates the new user
            usersCollection.insertOne({ username, password, email, firstName, lastName }, function(err, result) {

                if (err) {
                    throw err;
                } else {
                    res.send('User created successfully');
                }

                client.close();

            });

        });

    });

});

app.post('/entertasks', function (req, res) {
    var userTask = req.body.task;
    var username = req.body.username;

    var tasksCollection = db.collection('tasks');

    tasksCollection.insertOne({ username: username, insertedTask: userTask }, function (err, result) {
        if (err) {
            throw err;
        } else {
            res.redirect('/default');
        }
    });
});


app.get('/default/data', function (req, res) {
    getTasksFromDatabase()
    .then(tasks => res.json({ tasks }))
    .catch(error => {
        console.error('Error getting tasks:', error);
        res.status(500).send('Internal Server Error');
    })

})

MongoClient.connect(url, function (err, client) {
    if (err) {
        console.error('Error connecting to MongoDB:', err);
        throw err;
    }

    db = client.db(dbName);

    db.createCollection('tasks', function(err, collection) {
        if (err) {
            throw err;
        }

        console.log('Tasks collection created');

        app.listen(3001, function () {
            console.log('Listening on port 3001');
        });
    });
});


function getTasksFromDatabase() {
    return new Promise((resolve, reject) => {
        var tasksCollection = db.collection('tasks');
        tasksCollection.find({}).toArray((err, tasks) => {
            if (err) {
                reject(err);
            } else {
                resolve(tasks.map(task => task.insertedTask));
            }
        });
    });
};