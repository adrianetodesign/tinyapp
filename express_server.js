const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const generateUserHelpers = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080
const salt = bcrypt.genSaltSync(10);

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["drink","deep","descend"],
  maxAge: 24 * 60 * 60 * 1000
}));
app.set("view engine", "ejs");

//--- Object used as the "Database" for URLs.
const urlDatabase = {};

//--- Object used as the "Database" for users.
const users = {};

// Function closure call.
const {
  generateRandomString,
  getUserByEmail,
  getUrlsForUser
} = generateUserHelpers(urlDatabase, users);

//--- basic function
// Routing

app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});

// ---------- get routes ----------
//--- Redirect for default route
app.get("/", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    return res.redirect("/urls");
  }
  return res.redirect("/login");
});

//--- urls index page.
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = { urls: getUrlsForUser(userID),
    user: users[userID]
  };
  return res.render("urls_index", templateVars);
});

//--- new url form page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };
  if (req.session.user_id === undefined) {
    return res.redirect("/login");
  }
  return res.render("urls_new", templateVars);
});

//---Get request to retrieve page for each individual url
app.get("/urls/:shortURL", (req, res) => {
  const cookieUserID = req.session.user_id;
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id]
  };
  const templateVarsErr = {
    user: users[cookieUserID]
  };

  // Return an error if user tries to access a shortURL they didn't create.
  if (cookieUserID !== urlDatabase[req.params.shortURL].userID) {
    templateVarsErr['errMsg'] = "You are not authorized to view this shortURL.";
    return res.status(401).render("urls_error", templateVarsErr);
  }
  return res.render("urls_show", templateVars);
});

//--- Get request to redirect to actual URL of our short url.
app.get("/u/:shortURL", (req, res) => {
  const shortURL = urlDatabase[req.params.shortURL];
  const templateVarsErr = {
    user: users[req.session.user_id]
  };

  if (shortURL === undefined) {
    templateVarsErr['errMsg'] = "The given shortURL does not exist.";
    return res.status(404).render("urls_error", templateVarsErr);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL === undefined) {
    templateVarsErr['errMsg'] = "URL does not exist.";
    return res.status(302).render("urls_error", templateVarsErr);
  }
  return res.redirect(longURL);
});

//--- Get request to retrieve the login page.
app.get("/login", (req,res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  return res.render("urls_login", templateVars);
});

//--- Get request to retrieve the registration page.
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  };
  if (userID) {
    return res.redirect("/urls");
  }
  return res.render("urls_register", templateVars);
});

// ---------- post routes ----------
//--- Edit url post
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieUserID = req.session.user_id;
  const templateVarsErr = {
    user: users[req.session.user_id]
  };

  // If you are not the user registered with this shortURL, return an error page.
  if (cookieUserID !== urlDatabase[shortURL].userID) {
    templateVarsErr['errMsg'] = "You are not authorized to edit this shortURL.";
    return res.status(401).render("urls_error", templateVarsErr);
  }
  urlDatabase[shortURL] = {
    longURL: req.body.newLongURL,
    userID: cookieUserID
  };
  return res.redirect("/urls/");
});

//--- Deletes the short url created
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieUserID = req.session.user_id;
  const templateVarsErr = {
    user: users[cookieUserID]
  };

  // If you are not the user registered with this shortURL, return an error page.
  if (cookieUserID !== urlDatabase[shortURL].userID) {
    templateVarsErr['errMsg'] = "You are not authorized to delete this shortURL.";
    return res.status(401).render("urls_error", templateVarsErr);
  }
  delete urlDatabase[shortURL];
  return res.redirect(`/urls`);
});

//--- Post the new longURL assigned. Redirect to shortURL page.
app.post("/urls", (req, res) => {
  const userCookieID = req.session.user_id;
  if (userCookieID === undefined) {
    return res.status(401).send("You must log in to create any new tiny urls.");
  }
  let newShortURL = generateRandomString(6);
  urlDatabase[newShortURL] = {
    longURL: req.body.longURL,
    userID: userCookieID
  };
  return res.redirect(`/urls/${newShortURL}`);
});

//--- Post request to log in.
app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  const user = getUserByEmail(inputEmail);
  const templateVarsErr = {
    user: users[req.session.user_id]
  };

  templateVarsErr['errMsg'] = "Incorrect email or password.";
  // Email not found. return an error page.
  if (user === undefined) {
    return res.status(403).render("urls_error", templateVarsErr);
  }
  // Passwords don't match. return an error page.
  if (!bcrypt.compareSync(inputPassword, user.password)) {
    return res.status(403).render("urls_error", templateVarsErr);
  } else {
    // Store user_id cookie and redirect to index page.
    req.session.user_id = user.id;
    return res.redirect("/urls");
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect('/urls');
});

//--- Post request for registering an email/password.
app.post("/register", (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId =  generateRandomString(6);
  const templateVarsErr = {
    user: users[req.session.user_id]
  };

  // If password or email is empty, return an error page.
  if (!password || !email) {
    templateVarsErr["errMsg"] = "Please enter a valid email and password.";
    return res.status(400).render("urls_error", templateVarsErr);
  }
  // If email is alread in use, return an error page.
  if (getUserByEmail(email)) {
    templateVarsErr["errMsg"] = "This email is already in use.";
    return res.status(400).render("urls_error", templateVarsErr);
  } else {
    // Store user_id cookie and redirect to index page.
    users[userId] = {
      id: userId,
      email: email,
      password: bcrypt.hashSync(password, salt)
    };
    req.session.user_id = userId;
    return res.redirect("/urls");
  }
});