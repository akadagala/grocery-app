const express = require('express'); 
const sql = require('mysql2');

const app = express(); 
const port = 5001;  

app.use(express.urlencoded({extended:true})); 

const sqlite3 = require('sqlite3').verbose();

var db;
db = new sqlite3.Database('./grocery.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err && err.code == "SQLITE_CANTOPEN") {
        db = new sqlite3.Database('grocery.db', (err) => {
            if (err) {
                console.log("Getting error when creating database: " + err);
                exit(1);
            }
            // CREATE TABLES 
            let sql = "create table grocery_list (item text not null, checked int default 0 );";
            db.exec(sql); 
            sql = "create table meal_plan (day text not null, meal text, who_cooks text);";
            db.exec(sql); 
            sql = "insert into meal_plan (day) values (\"sunday\"); insert into meal_plan (day) values (\"monday\"); insert into meal_plan (day) values (\"tuesday\"); insert into meal_plan (day) values (\"wednesday\"); insert into meal_plan (day) values (\"thursday\"); insert into meal_plan (day) values (\"friday\"); insert into meal_plan (day) values (\"saturday\");";
            db.exec(sql); 
        });

    } else if (err) {
        console.log("Getting error " + err);
        exit(1);
    }
    console.log("Connected to the grocery database");
});

// Route handler for GET requests to the root ("/")
app.get('/', (req, res) => {   
    var itemsList = {}
    let sql = "select * from grocery_list";
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            itemsList[row.item] = row.checked;
            
        });
        res.render("index", {items: itemsList});
    });
});

// Route handler for GET requests to the mealplan page ("/mealplan")
app.get('/mealplan', (req, res) => {  
    var mealsList = []
    let sql = "select * from meal_plan";
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        if (rows == null) {
            mealsList.push([]);
        }
        rows.forEach((row) => {
            mealsList.push([row.day, row.meal, row.who_cooks]);
        });
        res.render("mealplan", {mealsList: mealsList});
    });
});

app.post('/meal', (req, res) => {  
    var meal = req.body.meal;
    var who_cooks = req.body.who_cooks;
    var day = req.query.day;
    let sql = "update meal_plan set meal=?, who_cooks=? where day=?";
    db.run(sql, [meal, who_cooks, day], (err) => {
        if (err) {
            console.log(err);
        }
        res.redirect("/mealplan");
    });
});
/*
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
*/

// Route handler for POST requests to "/addItem"
app.post('/addItem', (req, res) => {
    var item = req.body.item;
    let sql = "insert into grocery_list (item) values(?)";
    db.run(sql, [item], (err) => {
        if (err) {
            console.log(err);
        }
        res.redirect("/");
    });
});

// Route handler for GET requests to "/removeItem", url will contain an item param (?item=)
app.get('/removeItem', (req, res) => {
    var item = req.query.item;
    let sql = "delete from grocery_list where item=?";
    db.run(sql, [item], (err) => {
        if (err) {
            console.log(err);
        }
        res.redirect("/");
    });
});
/*
// Route handler for GET requests to "/removePayment", url will contain an item param and who_fronted param (?item= who_fronted=)
app.get('/removePayment', (req, res) => {
    var item = req.query.item;
    connection.query('DELETE FROM payment WHERE item=?', [item], function (error, results, fields) {
        if (error) throw error;
        res.redirect("/payment");
    });
});
*/
// Route handler for GET requests to "/check", url will contain an item param (?item=)
app.get('/check', (req, res) => {
    var item = req.query.item;
    
    let sql = "select * from grocery_list where item=?";
    db.all(sql, [item], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            if (row.checked == 1) {
                let sql = "update grocery_list set checked = 0 where item=?";
            }
            else {
                let sql = "update grocery_list set checked = 1 where item=?";
            }
        });
        db.run(sql, [item], (err) => {
            if (err) {
                console.log(err);
            }
            res.redirect("/");
        })
        
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
