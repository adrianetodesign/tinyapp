const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "8Bj8DQ": {
    id: "8Bj8DQ", 
    email: "admin@example.com", 
    password: "purple-people-eater"
  },
}

function generateRandomString(size) {
  return Math.random().toString(36).substr(2, size);
}

function emailExists(email) {
  for (user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
}

// Routing
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// urls index page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, 
    user: users[req.cookies["user_id"]]  };
  res.render("urls_index", templateVars);
})

// new url form page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// reroute to new url page
app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString(6);
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/:${newShortURL}`);
});

// Page for each individual url
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL], 
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

// Deletes the short url created
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});

// Edit url post
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.newLongURL;
  res.redirect("/urls/");
});

// Get request to retrieve the registration page.
app.get("/register", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_register", templateVars);
});

// Post request for registering an email/password.
app.post("/register", (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId =  generateRandomString(6);
  if (password === "" || email === "") {
    res.status(400).send("Please enter a valid email or password.");
  }
  if (emailExists(email)) {
    res.status(400).send("This email address is already in use.");
  }
  else {
    users[userId] = {
      id: userId,
      email: email,
      password: password
    };
    console.log(users);
    res.cookie('user_id', userId);
    res.redirect("/urls");
  }
});

// Login
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect("/urls");
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Redirect to actual URL of our short url.
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL === undefined) {
    res.status(302);
  }
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
 });
 
 app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
 });

app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});