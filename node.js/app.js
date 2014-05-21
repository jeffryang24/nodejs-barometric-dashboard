var _ = require("underscore");
var express = require('express');
var mongodb = require('mongodb');
var app = require('express')();
var io = require('socket.io');

var db;
var collection;

var clients = [];

// set view engine to ejs
app.set('view engine', 'ejs');

// set path /static to content of folder static
app.use("/static", express.static(__dirname + '/static'));

// connect and update mongodb
mongodb.MongoClient.connect("mongodb://mylogin:mypass@oceanic.mongohq.com:10047/barometric_db", function(err, database) {
    
    if(err) throw err;
    
    db = database;
    collection = db.collection('datapoints');

    // start server listening on port 3000
    // and bind socket.op connection events
    console.log("Barometric Server v1.0"); 
    io.listen(app.listen(3000)).on('connection', function (client) {
            
            // store client into array
            clients.push(client); 

            // on disconnect
            client.on('disconnect', function() {

                // remove client from array 
                clients.splice(clients.indexOf(client), 1);
            });

    });
    
});



/****************************************
 * Express routes
 ****************************************/

app.get('/send_barom_data/:pressure/:temperature', function(req, res) {
    
    var datetime    = new Date()
    var pressure    = parseInt(req.param("pressure"));
    var temperature = parseFloat(req.param("temperature"));
    
    // update collection
    collection.insert({datetime: datetime, pressure : pressure , temperature : temperature}, function(err, docs) {
        if (err) {
            console.log(err);
        }
        
        // emit pressure to clients
        _.each(clients, function(client) {
            client.emit('data_added', { datetime : datetime, pressure: pressure, temperature : temperature });
        });
        
    });
    
    res.end();

});

app.get('/alive', function(req, res) {
    res.write("alive");
    res.end();
});


app.get('/get_data', function(req, res) {

    // Define date object that is set to current times minus 3 hours
    var helperTime = new Date();
    var _datetime = new Date();
    _datetime.setHours(helperTime.getHours() - 24);  

    // construct aggregation pipeline retrieving last 24 hours
    var pipeline =  [
                        { $match : { datetime : { $gt : _datetime  } } }, 
                        { $group : { _id : { 
                                                hour  : { $hour : "$datetime" },
                                                day   : { $dayOfMonth : "$datetime" },
                                                month : { $month : "$datetime" },
                                                year : { $year : "$datetime" }
                                           },
                                     average_pressure : { $avg : "$pressure" } 
                                   }
                        },
                        { $project : { _id : 1 , average_pressure : 1 } },
                        { $sort :  { "_id.year" :  1, "_id.month" :  1,  "_id.day" :  1 , "_id.hour" :  1  } }
                    ];

    collection.aggregate(pipeline, function (err, document) {

        if (err) {
            console.log(err);
        }
        
        helperTime = new Date();
        _datetime = new Date();
        _datetime.setHours(helperTime.getHours() - (24*31));
        
        // construct aggregation pipeline retrieving last 31 days
        var pipeline =  [
                            { $match : { datetime : { $gt : _datetime  } } }, 
                            { $group : { _id : { 
                                                    day   : { $dayOfMonth : "$datetime" },
                                                    month : { $month : "$datetime" },
                                               },
                                         max_pressure     : { $max : "$pressure" }, 
                                         min_pressure     : { $min : "$pressure" },
                                       }
                            },
                            { $project : { _id : 1 , month: 1, max_pressure : 1, min_pressure : 1 } },
                            { $sort :  { "_id.month" :  1,  "_id.day" :  1 } }

                        ];
        
        
        collection.aggregate(pipeline, function (err, document_2) {
                        
            // send json
            res.json({ document_1: document, document_2 : document_2 })

        });
    
    });
    
    
});


app.get('/', function(req, res) {
    // send index
    res.render('index', { })
});