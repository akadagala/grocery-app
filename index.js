const express = require('express'); 
const sql = require('mysql2');
const bodyParser = require("body-parser").urlencoded();

const app = express(); 
const port = 5000;  

// Configure our mySQL connection that we will use here on out
var config = {
    user: 'root',
    password: 'akPK@@1234',
    host: 'localhost',
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

// Route handler for GET requests to the mealplan page ("/mealplan")
app.get('/mealplan', (req, res) => {  
    var mealsList = [];
    connection.execute('SELECT * FROM meal_plan', function (error, results, fields) {
        if (error) throw error;
        results.forEach(meal => {
            mealsList.push([meal['day'], meal['meal'], meal['who_cooks']]);
        }); 
        console.log(mealsList);
        res.render("mealplan", {mealsList: mealsList});
    }); 
});

app.post('/meal', bodyParser, (req, res) => {  
    var meal = req.body.meal;
    var who_cooks = req.body.who_cooks;
    var day = req.query.day;
    connection.query('UPDATE meal_plan SET meal=?, who_cooks=? WHERE day=?', [meal, who_cooks, day], function (error, results, fields) {
        if (error) throw error;
        res.redirect("/mealplan");
    }); 
});

app.get('/payment', (req, res) => {  
    var itemsList = [];     
    connection.execute('SELECT * FROM payment', function (error, results, fields) {
        if (error) throw error;
        results.forEach(item => {
            itemsList.push([item["item"], item["cost"], item["who_fronted"]]);
        }); 
        res.render("payment", {items: itemsList});
    });
});

app.post('/addPayment', bodyParser, (req, res) => {  
    var item = req.body.item;
    var cost = req.body.cost;
    var who_fronted = req.body.who_fronted;
    connection.query('INSERT INTO payment (item, cost, who_fronted) VALUES(?, ?, ?)', [item, cost, who_fronted], function (error, results, fields) {
        if (error) throw error;
        res.redirect("/payment");
    }); 
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

// Route handler for GET requests to "/removePayment", url will contain an item param and who_fronted param (?item= who_fronted=)
app.get('/removePayment', (req, res) => {
    var item = req.query.item;
    connection.query('DELETE FROM payment WHERE item=?', [item], function (error, results, fields) {
        if (error) throw error;
        res.redirect("/payment");
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

// Configure our app to use any additional files in the working directory (ex: css sheets, etc)
app.use(express.static(__dirname));
