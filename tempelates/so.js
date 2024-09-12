
app.get('/reset-password/:token', (req, res) => {
    const token = req.params.token;

    // Check if the token is valid and not expired
    LogInCollection.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
        if (!user) {
            return res.send('Password reset link is invalid or has expired.');
        }

        // Render a password reset form with a hidden token field
        res.render('reset-password', { token });
    });
});



app.post('/reset-password/:token', urlencodedParser, async (req, res) => {
    const token = req.params.token;
    const newPassword = req.body.newPassword;

    // Check if the token is valid and not expired
    const user = await LogInCollection.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) {
        return res.send('Password reset link is invalid or has expired.');
    }

    // Update the user's password and clear the reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.send('Password has been reset successfully.');
});







// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-gmail@gmail.com',  // replace with your Gmail email
        pass: 'your-gmail-password'   // replace with your Gmail password
    }
});

// Your existing code
app.post('/forgot-password', urlencodedParser, async (req, res) => {
    const email = req.body.email;

    try {
        const user = await LogInCollection.findOne({ email:req.body.email });


        console.log('Before token generation');
        const token = require('crypto').randomBytes(32).toString('hex');
        console.log('After token generation:', token);

        // Update user document with reset token and expiration time
        await LogInCollection.updateOne(
            { email },
            {
                $set: {
                    resetPasswordToken: token,
                    resetPasswordExpires: Date.now() + 3600000, // 1 hour
                }
            }
        );

        const mailOptions = {
            to: email,
            subject: 'Password Reset',
            text: `You (or someone else) have requested a password reset.\n\n` +
                `Click on the link to reset your password:\n\n` +
                `http://${req.headers.host}/reset-password/${token}\n\n` +
                `If you didn't request this, ignore this email; your password will remain unchanged.\n`
        };

        // Send password reset email
        const info = await transporter.sendMail(mailOptions);

        console.log(`Email sent: ${info.response}`);
        res.send("Password reset email sent. Check your inbox.");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});


app.listen(port, () => {
    console.log('port connected' , +port);
})












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
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
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



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});