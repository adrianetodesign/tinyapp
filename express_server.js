const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca", 
    userID: "8Bj8DQ"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "8Bj8DQ"
  }
};

const users = { 
  "8Bj8DQ": {
    id: "8Bj8DQ", 
    email: "admin@example.com", 
    password: bcrypt.hashSync("purple-people-eater", 10)
  },
}

function generateRandomString(size) {
  return Math.random().toString(36).substr(2, size);
}

function getUserByEmail(email) {
  for (user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
}

function urlsForUser(id) {
  const filteredURLs = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      filteredURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return filteredURLs;
}

// Routing

app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});

// ---------- get routes ----------
// Redirect for default route
app.get("/", (req, res) => {
  res.redirect("/urls");
})


// Route for seeing json of the database.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// urls index page.
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(req.cookies["user_id"]), 
    user: users[req.cookies["user_id"]]  
  };
  res.render("urls_index", templateVars);
})

// new url form page
app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, 
    user: users[req.cookies["user_id"]]  
  };
  if (req.cookies["user_id"] === undefined) {
    return res.redirect("/urls");
  }
  res.render("urls_new", templateVars);
});

// Page for each individual url
app.get("/urls/:shortURL", (req, res) => {
  const cookieUserID = req.cookies["user_id"];
  const templateVars = { shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL, 
    user: users[req.cookies["user_id"]]
  };
  const templateVarsErr = {
    user: users[cookieUserID]
  };

  if (cookieUserID !== urlDatabase[req.params.shortURL].userID) {
    templateVarsErr['errMsg'] = "You are not authorized to view this shortURL."
    return res.status(401).render("urls_error", templateVarsErr);
  }
  res.render("urls_show", templateVars);
});

// Redirect to actual URL of our short url.
app.get("/u/:shortURL", (req, res) => {
  const shortURL = urlDatabase[req.params.shortURL];
  const templateVarsErr = {
    user: users[req.cookies["user_id"]]
  };

  if (shortURL === undefined) {
    templateVarsErr['errMsg'] = "The given shortURL does not exist."
    return res.status(404).render("urls_error", templateVarsErr);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL === undefined) {
    templateVarsErr['errMsg'] = "URL does not exist."
    return res.status(302).render("urls_error", templateVarsErr);
  }
  return res.redirect(longURL);
});

app.get("/login", (req,res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_login", templateVars);
})

// Get request to retrieve the registration page.
app.get("/register", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_register", templateVars);
});

// ---------- post routes ----------
// Deletes the short url created
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieUserID = req.cookies["user_id"];
  const templateVarsErr = {
    user: users[cookieUserID]
  };

  if (cookieUserID !== urlDatabase[shortURL].userID) {
    templateVarsErr['errMsg'] = "You are not authorized to delete this shortURL."
    return res.status(401).render("urls_error", templateVarsErr);
  }
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});

// Edit url post
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieUserID = req.cookies["user_id"];
  const templateVarsErr = {
    user: users[req.cookies["user_id"]]
  };

  if (cookieUserID !== urlDatabase[shortURL].userID) {
    templateVarsErr['errMsg'] = "You are not authorized to edit this shortURL."
    return res.status(401).render("urls_error", templateVarsErr);
  }
  urlDatabase[shortURL] = { 
    longURL: req.body.newLongURL,
    userID: cookieUserID
  }
  res.redirect("/urls/");
});

// reroute to new url page
app.post("/urls", (req, res) => {
  const userCookieID = req.cookies["user_id"];
  if( userCookieID === undefined) {
    return res.status(401).send("You must log in to create any new tiny urls.");
  }
  let newShortURL = generateRandomString(6);
  urlDatabase[newShortURL] = {
    longURL: req.body.longURL,
    userID: userCookieID
  }
  res.redirect(`/urls/${newShortURL}`);
});

// Login
app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  const user = getUserByEmail(inputEmail);
  const templateVarsErr = {
    user: users[req.cookies["user_id"]]
  };

  if (user === undefined) {
    templateVarsErr['errMsg'] = `${inputEmail} not found.`
    return res.status(403).render("urls_error", templateVarsErr)
  }
  if (!bcrypt.compareSync(inputPassword, user.password)) {
    templateVarsErr['errMsg'] = "Incorrect Password."
    return res.status(403).render("urls_error", templateVarsErr);
  }
  else {
    res.cookie('user_id',user.id);
    return res.redirect("/urls");
  }
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  return res.redirect('/urls');
});

// Post request for registering an email/password.
app.post("/register", (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId =  generateRandomString(6);
  const templateVarsErr = {
    user: users[req.cookies["user_id"]]
  };

  if (password === "" || email === "") {
    templateVarsErr["errMsg"] = "Please enter a valid email and password.";
    return res.status(400).render("urls_error", templateVarsErr);
  }
  if (getUserByEmail(email)) {
    return res.status(400).send("This email address is already in use.");
  }
  else {
    users[userId] = {
      id: userId,
      email: email,
      password: bcrypt.hashSync(password, 10)
    };
    res.cookie('user_id', userId);
    return res.redirect("/urls");
  }
});