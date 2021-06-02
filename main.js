var express = require('express'),
    app     = express(),
    bodyParser = require('body-parser'),
    mongoose   = require('mongoose'),
    os = require('os'),
    hostname = os.hostname();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

var mongoUser =  process.env.MONGODB_USER,
    mongoDatabase = process.env.MONGODB_DATABASE,
    mongoPassword = process.env.MONGODB_PASSWORD,
    mongoHost = process.env.TAXCALCDB_SERVICE_HOST,
    mongoPort = process.env.TAXCALCDB_SERVICE_PORT,
    mongoURL = 'mongodb://';

mongoURL += mongoUser + ':' + mongoPassword + '@';
mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

mongoose.connect(mongoURL);

var Transaction = require('./models/transaction');

var route = express.Router();

// All our services are under the /api context
app.use('/api', route);

app.get('/', (req, res) => {
    res.send('Hello World!')
  });

// Start defining routes for our app/microservice

// A route that dumps hostname information from pod
route.get('/', function(req, res) {
    res.send('Hi! I am running on host -> ' + hostname + '\n' + 'config' + process.env.MY_CONFIG);
});

// This route handles tax calculation for our service
route.route('/calculate')
     .post(function(req, res) {

        var tx = new Transaction();
        tx.tx_id = req.body.id;
        tx.amount = req.body.amount;

        // Assume a 30% tax on all orders
        var finalAmount = tx.amount + (tx.amount * .2);

        tx.save(function(e) {
            if (e)
                res.send('ERROR: '+ e);

            res.json({ message: 'OK',
                      finalAmount: finalAmount
            });
        });

    });

// This route dumps all transactions
route.route('/list')
     .get(function(req, res) {
       Transaction.find(function(err, txs) {
        if (err)
          res.send(err);

        res.json(txs);
       });
    });

app.listen(port, ip);
console.log('nodejs server running on http://%s:%s', ip, port);

module.exports = app;
