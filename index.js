const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for 
                                                            // our purposes we'll hash these existing users when the 
                                                            // app loads
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user", // Regular user
    },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
    response.render("login");
});

// POST /login - Allows a user to login
app.post("/login", async (request, response) => {
    const { email, password } = req.body;

    // make sure user is valid
    const user = USER.find(user => user.email === email);
    if(!user){
        return res.render("login", {error: "Invalid login information entered. Please retry."});
    }

    // make sure password is valid 
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword){
        return res.render("login", {error : "Invalid login information entered. Please retry."})
    }

    // save user 
    req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
    };

    res.redirect("/landing");
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    response.render("signup");
});

// POST /signup - Allows a user to signup
app.post("/signup", async (request, response) => {
    const { email, username, pasword } = req.body;

    // check if email is already used
    const userExists = USERS.find(user => user.email === email);
    if (userExists){
        return res.render("signup", { error: "A user with this email already exists."})
    }

    // hash password 
    const hashPassword = await bcrypt.hash( password, SALT_ROUNDS );

    // create user if email isnt already used
    const newUser = {
        id: USERS.length+1,
        username,
        email,
        password: hashPassword,
        role: "user",
    };

    // add new user to users 
    USERS.push(newUser);
    res.redirect("/login");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
    if (request.session.user) {
        return response.redirect("/landing");
    }
    response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
    if(!req.session.user){
        return res.redirect("login");
    }

    const user = req.session.user;

    // displays dashboard if user is an admin
    
    if(user.role === 'admin'){
        return res.render("landing", { user, users: USERS });
    }else {
        return res.render("landing", { user, user : null});
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
