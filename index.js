const express = require('express'); 
const sql = require('mysql2');
const bodyParser = require("body-parser").urlencoded();

const app = express(); 
const port = 5000;  

// Configure our mySQL connection that we will use here on out
var config = {
    user: 'root',
    password: 'akPK@@1234',
    server: 'localhost',
    database: 'groceries_app'
};
var connection = sql.createConnection(config);
connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected to the MySQL server!");
});

// Route handler for GET requests to the root ("/")
app.get('/', (req, res) => {   
    var itemsList = {};     
    connection.execute('SELECT * FROM grocery_list', function (error, results, fields) {
        if (error) throw error;
        results.forEach(item => {
            itemsList[item["item"]] = item["checked"];
        }); 
        res.render("index", {items: itemsList});
    });
    //res.sendFile('index.html', {root: __dirname});   // keeping this for any possible future reference  
    //res.sendFile('index.js', {root: __dirname});     // keeping this for any possible future reference
});

app.get('/mealplan', (req, res) => {  
    var mealsList = {};
    connection.execute('SELECT * FROM meal_plan', function (error, results, fields) {
        if (error) throw error;
        Object.keys(results[0]).forEach(meal => {
            mealsList[meal] = results[0][meal];
        }); 
        res.render("mealplan", {mealsList: mealsList});
    }); 
    //res.sendFile('index.html', {root: __dirname});   // keeping this for any possible future reference  
    //res.sendFile('index.js', {root: __dirname});     // keeping this for any possible future reference
});

// Route handler for POST requests to "/addItem"
app.post('/addItem', bodyParser, (req, res) => {
    var item = req.body.item;
    connection.query('INSERT INTO grocery_list (item) VALUES(?)', [item], function (error, results, fields) {
        if (error) throw error;
        res.redirect("/");
    });
});

// Route handler for GET requests to "/removeItem", url will contain an item param (?item=)
app.get('/removeItem', (req, res) => {
    var item = req.query.item;
    connection.query('DELETE FROM grocery_list WHERE item=?', [item], function (error, results, fields) {
        if (error) throw error;
        res.redirect("/");
    });
});

// Route handler for GET requests to "/check", url will contain an item param (?item=)
app.get('/check', (req, res) => {
    var item = req.query.item;
    connection.query('CALL p(?)', [item], function (error, results, fields) {
        if (error) throw error;
        res.redirect("/");
    });
});

// On startup, server starts listening for any attempts from a client to connect at port 5000
app.listen(port, () => {            
    console.log(`Now listening on port ${port}`); 
});

// Configure our app to use ejs views
app.set('view engine', 'ejs');

// Configure out app to use any additional files in the working directory (ex: css sheets, etc)
app.use(express.static(__dirname));
