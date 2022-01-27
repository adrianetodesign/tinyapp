const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

//--- Object used as the "Database" for URLs.
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

//--- Object used as the "Database" for users.
const users = { 
  "8Bj8DQ": {
    id: "8Bj8DQ", 
    email: "admin@example.com", 
    password: bcrypt.hashSync("purple-people-eater", 10)
  },
}

//--- basic function
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
//--- Redirect for default route
app.get("/", (req, res) => {
  return res.redirect("/urls");
})

//--- urls index page.
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(req.cookies["user_id"]), 
    user: users[req.cookies["user_id"]]  
  };
  return res.render("urls_index", templateVars);
})

//--- new url form page
app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, 
    user: users[req.cookies["user_id"]]  
  };
  if (req.cookies["user_id"] === undefined) {
    return res.redirect("/login");
  }
  return res.render("urls_new", templateVars);
});

//---Get request to retrieve page for each individual url
app.get("/urls/:shortURL", (req, res) => {
  const cookieUserID = req.cookies["user_id"];
  const templateVars = { 
    shortURL: req.params.shortURL, 
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
  return res.render("urls_show", templateVars);
});

//--- Get request to redirect to actual URL of our short url.
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

//--- Get request to retrieve the login page.
app.get("/login", (req,res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  return res.render("urls_login", templateVars);
})

//--- Get request to retrieve the registration page.
app.get("/register", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  return res.render("urls_register", templateVars);
});

// ---------- post routes ----------
//--- Deletes the short url created
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

//--- Edit url post
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieUserID = req.cookies["user_id"];
  const templateVarsErr = {
    user: users[req.cookies["user_id"]]
  };

  // If you are not the user registered with this shortURL, return an error page.
  if (cookieUserID !== urlDatabase[shortURL].userID) {
    templateVarsErr['errMsg'] = "You are not authorized to edit this shortURL."
    return res.status(401).render("urls_error", templateVarsErr);
  }
  urlDatabase[shortURL] = { 
    longURL: req.body.newLongURL,
    userID: cookieUserID
  }
  return res.redirect("/urls/");
});

//--- Post the new longURL assigned. Redirect to shortURL page.
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
  return res.redirect(`/urls/${newShortURL}`);
});

//--- Post request to log in.
app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  const user = getUserByEmail(inputEmail);
  const templateVarsErr = {
    user: users[req.cookies["user_id"]]
  };

  // Email not found. return an error page.
  if (user === undefined) {
    templateVarsErr['errMsg'] = `${inputEmail} not found.`
    return res.status(403).render("urls_error", templateVarsErr)
  }
  // Passwords don't match. return an error page.
  if (!bcrypt.compareSync(inputPassword, user.password)) {
    templateVarsErr['errMsg'] = "Incorrect Password."
    return res.status(403).render("urls_error", templateVarsErr);
  }
  // Store user_id cookie and redirect to index page.
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

//--- Post request for registering an email/password.
app.post("/register", (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId =  generateRandomString(6);
  const templateVarsErr = {
    user: users[req.cookies["user_id"]]
  };

  // If password or email is empty, return an error page.
  if (password === "" || email === "") {
    templateVarsErr["errMsg"] = "Please enter a valid email and password.";
    return res.status(400).render("urls_error", templateVarsErr);
  }
  // If email is alread in use, return an error page.
  if (getUserByEmail(email)) {
    return res.status(400).send("This email address is already in use.");
  }
  // Store user_id cookie and redirect to index page.
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