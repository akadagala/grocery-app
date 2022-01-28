const express = require('express'); 
const session = require('express-session');
const sqlite = require('sqlite3');
const sqliteStoreFactory = require("express-session-sqlite").default
const SqliteStore = sqliteStoreFactory(session);
const bodyParser = require('body-parser').urlencoded();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');
const totp = require('totp-generator');

const config = require(__dirname + '/config');
const app = express(); 

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Configure our sqlite connection that we will use here on out

let connection = new sqlite.Database(config.database_file, (err) => {
    if (err) {
        console.log(err.code);
        throw err;
    };
    console.log("Sqlite3 connection established!");    
});

// Configure session
app.use(session({
    secret: config.secret || 'fake secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        sneaky: "Don't be looking at my cookies, you silly little goose!"
    },
    store: new SqliteStore({
        driver: sqlite.Database,
        path: __dirname + '/groceries_app.db',
        ttl: 5000,
        prefix: 'sess:',
        cleanupInterval: 300000,
    })
}));

// Configure passport for login
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    function verify(username, password, cb) {
        connection.get('SELECT * FROM users WHERE uid = ?', [ username ], function(err, user) {
        if (err) { return cb(err); }
        if (!user) { return cb(null, false, { message: 'Incorrect username or password.' }); }
    
        // Convert secret (stored in password) to TOTP code
        let token = totp(user.secret);
        if(password === token) return cb(null, user);
        return cb(null, false, { message: 'Incorrect username or password.' });
    });
  }));

passport.serializeUser(function(user, done) {
    console.log(user);
    done(null, user.uid);
});

passport.deserializeUser(function(id, done) {
    connection.get('SELECT uid FROM users WHERE uid = ?', id, function(err, row) {
        if (!row) return done(null, false);
        return done(null, row);
      });
});


app.get('/login', (req, res)=>{
    return res.render('login');
})

app.post('/login/auth', 
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
        return res.redirect('/');
    }
);

// All routes after login are protected:
let protect_routes_middleware = (req, res, next) => {
    if(!req.isAuthenticated()) return res.redirect('/login');
    next();
}

app.get('/logout', protect_routes_middleware, (req, res, next) => {
    req.logout();
    return res.redirect('/');
})

// Route handler for GET requests to the root ("/")
app.get('/', protect_routes_middleware, (req, res) => {
    return res.redirect('/grocerylist');
});

app.get('/grocerylist', protect_routes_middleware, (req, res) => {   
    var itemsList = {};     
    connection.all('SELECT * FROM grocery_list', function (error, results, fields) {
        if (error) throw error;
        results.forEach(item => {
            itemsList[item["item"]] = item["checked"];
        }); 
        return res.render("grocerylist", {items: itemsList});
    });
});


// Route handler for GET requests to the mealplan page ("/mealplan")
app.get('/mealplan', protect_routes_middleware, (req, res) => {  
    var mealsList = [];
    connection.all('SELECT * FROM meal_plan', function (error, results, fields) {
        if (error) throw error;
        results.forEach(meal => {
            mealsList.push([meal['day'], meal['meal'], meal['who_cooks']]);
        }); 
        console.log(mealsList);
        return res.render("mealplan", {mealsList: mealsList});
    }); 
});

app.post('/meal', protect_routes_middleware, bodyParser, (req, res) => {  
    var meal = req.body.meal;
    var who_cooks = req.body.who_cooks;
    var day = req.query.day;
    connection.run('UPDATE meal_plan SET meal=?, who_cooks=? WHERE day=?', [meal, who_cooks, day], function (error, results, fields) {
        if (error) throw error;
        return res.redirect("/mealplan");
    }); 
});

app.get('/payment', protect_routes_middleware, (req, res) => {  
    var itemsList = [];     
    connection.all('SELECT * FROM payment', function (error, results, fields) {
        if (error) throw error;
        results.forEach(item => {
            itemsList.push([item["item"], item["cost"], item["who_fronted"]]);
        }); 
        return res.render("payment", {items: itemsList});
    });
});

app.post('/addPayment', protect_routes_middleware, bodyParser, (req, res) => {  
    var item = req.body.item;
    var cost = req.body.cost;
    var who_fronted = req.body.who_fronted;
    connection.run('INSERT INTO payment (item, cost, who_fronted) VALUES(?, ?, ?)', [item, cost, who_fronted], function (error, results, fields) {
        if (error) throw error;
        return res.redirect("/payment");
    }); 
});

// Route handler for POST requests to "/addItem"
app.post('/addItem', protect_routes_middleware, bodyParser, (req, res) => {
    var item = req.body.item;
    connection.run('INSERT INTO grocery_list (item, checked) VALUES(?, 0)', [item], function (error, results, fields) {
        if (error) throw error;
        return res.redirect("/");
    });
});

// Route handler for GET requests to "/removeItem", url will contain an item param (?item=)
app.get('/removeItem', protect_routes_middleware, (req, res) => {
    var item = req.query.item;
    connection.run('DELETE FROM grocery_list WHERE item=?', [item], function (error, results, fields) {
        if (error) throw error;
        return res.redirect("/");
    });
});


// Route handler for GET requests to "/removePayment", url will contain an item param and who_fronted param (?item= who_fronted=)
app.get('/removePayment', protect_routes_middleware, (req, res) => {
    var item = req.query.item;
    connection.run('DELETE FROM payment WHERE item=?', [item], function (error, results, fields) {
        if (error) throw error;
        return res.redirect("/payment");
    });
});

// Route handler for POST requests to "/clearItems"
app.post('/clearItems', protect_routes_middleware, (req, res) => {
    connection.run('DELETE FROM grocery_list', function (error) {
        if (error) throw error;
        return res.redirect("/");
    });
});

// Route handler for GET requests to "/check", url will contain an item param (?item=)
app.get('/check', protect_routes_middleware, (req, res) => {
    var item = req.query.item;
    connection.run('UPDATE grocery_list SET checked = IIF(checked==1, 0, 1) WHERE item=?', [item], function (error, results, fields) {
        if (error) throw error;
        return res.redirect("/");
    });
});

// On startup, server starts listening for any attempts from a client to connect at port 5000
app.listen(config.site_port, () => {            
    console.log(`Now listening on port ${config.site_port}`); 
});

// Configure our app to use ejs views
app.set('view engine', 'ejs');

// Configure our app to use any additional files in the working directory (ex: css sheets, etc)
app.use(express.static(__dirname));
