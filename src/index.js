const express = require("express")
const path = require("path")
const app = express()

const bodyParser = require("body-parser");
const { body, validationResult } = require('express-validator');


app.use(express.json());

const LogInCollection = require("./mongo");
const { request } = require("http");
const { assert, error } = require("console");
const port = process.env.PORT || 5000


app.use(express.json());
const urlencodedParser =bodyParser.urlencoded({extended:true});

const tempelatePath = path.join(__dirname, '../tempelates')
const publicPath = path.join(__dirname, '../public')
console.log(publicPath);

app.set('view engine', 'hbs')
app.set('views', tempelatePath)
app.use(express.static(publicPath))

app.get('/', (req, res) => {
    res.render('login')
})
app.get('/signup', (req, res) => {
    res.render('signup');
})

app.get('/reset-password', (req,res)=>{
    res.render('reset-password');
});

app.post('/signup',urlencodedParser, [
    body('email', 'Email is not valid')
        .isEmail()
        .normalizeEmail(),
    body('name','Name does not contain special characters')
    .matches(/^[a-zA-Z\s]*$/),
    body('empid', 'The employee ID must be unique and contain 3 digits')
        .exists()
        .isLength({ min: 3 }),
    body('password', 'The password must contain at least 6 characters')
        .exists()
        .isLength({ min: 6 }),
    
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const alert = errors.array();
        return res.render('signup', { alert });
    }

    try {
        const data = {
            email: req.body.email,
            name: req.body.name,
            empid: req.body.empid,
            password: req.body.password,
        };

        // Check if a user with the same name already exists
        const existingUser = await LogInCollection.findOne({ email: req.body.email });

        if (existingUser) {
            return res.send("User details already exist");
        }

        // Insert the new user data into the database
        await LogInCollection.insertMany([data]);

        res.status(201).render("home", {
            naming: req.body.name
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});


app.post('/login', urlencodedParser, async (req, res) => {
    try {
        const user = await LogInCollection.findOne({ email: req.body.email, password: req.body.password });

        if (!user) {
            return res.send("Invalid credentials. Please try again.");
        }

        res.status(200).render("home", {
            naming: user.name
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});


app.post('/forgot-password', urlencodedParser, async (req, res) => {
    try {
        const user = await LogInCollection.findOne({ email: req.body.email });

        if (!user) {
            return res.send("User not found. Please check the email address.");
        }

        res.render('reset-password', { email: req.body.email });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

app.post('/reset-password', urlencodedParser, [
    body('newPassword', 'The password must contain at least 6 characters')
        .exists()
        .isLength({ min: 6 }),
    body('confirmPassword', 'Passwords do not match')
        .exists()
        .custom((value, { req }) => value === req.body.newPassword),
    body('email', 'Email is required')
        .exists(),
], async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const alert = errors.array();
            return res.render('reset-password', { alert, email: req.body.email });
        }

        const user = await LogInCollection.findOne({ email: req.body.email });

        if (!user) {
            return res.send("User not found. Please check the email address.");
        }

        // Update the user's password
        user.password = req.body.newPassword;

        await user.save();

        res.status(201).render("home", {
            naming: user.name,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});