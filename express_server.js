var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

var cookieSession = require("cookie-session");
app.use(
  cookieSession({
    name: "session",
    keys: ["my secret password"]
  })
);

const bcrypt = require("bcrypt");

app.set("view engine", "ejs");

function generateRandomString(keylength) {
  var key = "";
  var characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charLength = characters.length;
  var i;

  for (i = 0; i < keylength; i++) {
    key =
      key + characters.substr(Math.floor(Math.random() * charLength + 1), 1);
  }

  return key;
}

function urlsForUser(id) {
  let urlObjects = urlDatabase.filter(function(data) {
    if (data.userID == id) {
      return true;
    } else {
      return false;
    }
  });
  return urlObjects;
}

let urlDatabase = [
  {
    longURL: "http://www.lighthouselabs.ca",
    shortURL: "b2xVn2",
    userID: "userRandomID"
  },
  {
    longURL: "http://www.google.com",
    shortURL: "9sm5xK",
    userID: "user3RandomID"
  },
  {
    longURL: "http://facebook.com",
    shortURL: "PxYaaL",
    userID: "user4RandomID"
  }
];

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$HtzP.eiDHeO/HoKTMi5t3euvh6FduH04ib1G7y70xawppqGEyu6ua"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$Ai/o7qkJyI0AFk9nhPMkq.McLsbBDFIZB0TzT88w6H9rqEmaLsI.C"
  },
  user3RandomID: {
    id: "user3RandomID",
    email: "bob@bob.com",
    password: "$2b$10$wLXsy02GX55H3uthf4kPiuAqR8.jzKdjlRovqATM.2mRbrQTQBs82"
  },
  user4RandomID: {
    id: "user4RandomID",
    email: "amy@amy.com",
    password: "$2b$10$152VBFDgMy/G4E0HrGT0nOjQl2DDLTQnzzUz4qxqqwlVehyowtSVy"
  }
};

app.get("/", (req, res) => {
  res.end("hello, this is the '/ page!");
});

app.get("/error", (req, res) => {
  res.end("<html><body><h1>400 Bad Request</h1></body></html>");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urlDatabase: urlsForUser(req.session["user_id"]),
    user: req.session["user_id"],
    users: users
  };

  if (req.session["user_id"]) {
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_unauthorized");
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: req.session["user_id"],
    users: users
  };

  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let longURLs = urlDatabase.filter(function(data) {
    if (data.shortURL == req.params.id) {
      return true;
    } else {
      return false;
    }
  });

  console.log(longURLs);

  let templateVars = {
    shortURL: req.params.id,
    longURL: longURLs[0].longURL,
    user: req.session["user_id"],
    users: users
  };

  if (req.session["user_id"]) {
    res.render("urls_show", templateVars);
  } else {
    res.render("urls_unauthorized");
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURLs = urlDatabase.filter(function(data) {
    if (data.shortURL == req.params.shortURL) {
      return true;
    } else {
      return false;
    }
  });

  res.redirect(longURLs[0].longURL);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  let shortURL = generateRandomString(6);
  let longURL = req.body.longURL;

  let newURL = {
    longURL: longURL,
    shortURL: shortURL,
    userID: req.session["user_id"]
  };

  urlDatabase.push(newURL);
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  console.log("URL Database before deleting:", urlDatabase);

  let i = urlDatabase.findIndex(function(urlObject) {
    return urlObject.shortURL == req.params.id;
  });

  if (req.session["user_id"] == urlDatabase[i].userID) {
    urlDatabase.splice(i, 1);
  }

  res.redirect(`/urls/`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  console.log(req.body.longURL);
  console.log(req.params.shortURL);
  let longURL = req.body.longURL;

  let i = urlDatabase.findIndex(function(urlObject) {
    return urlObject.shortURL == req.params.shortURL;
  });

  if (req.session["user_id"] == urlDatabase[i].userID) {
    urlDatabase[i].longURL = longURL;
  }

  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`urls/`);
});

app.get("/login", (req, res) => {
  res.render(`login`);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  res.render(`register`);
});

app.post("/register", (req, res) => {
  console.log(req.body);
  let randomUserID = generateRandomString(4);
  let email = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  let userExists = false;

  console.log(email);
  if (email) {
    for (key in users) {
      if (email === users[key].email) {
        userExists = true;
      }
    }
    if (userExists) {
      res.redirect("/error");
    } else {
      users[randomUserID] = {
        id: randomUserID,
        email: req.body.email,
        password: hashedPassword
      };

      req.session.user_id = randomUserID;
    }
  }

  if (email === "" || password === "") {
    res.redirect("/error");
  } else {
    res.redirect("/urls");
  }

  console.log(users);
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email) {
    for (key in users) {
      if (email === users[key].email) {
        foundUser = users[key];
      }
    }

    if (foundUser) {
      if (bcrypt.compareSync(password, hashedPassword)) {
        req.session["user_id"] = foundUser.id;
        res.redirect("/urls");
      } else {
        res.end("<html><body><h1>403 Error</h1></body></html>");
      }
    } else {
      res.end("<html><body><h1>403 Error</h1></body></html>");
    }
  }
});

app.listen(PORT, () => {
  console.log(`Example app lstening on port ${PORT}!`);
});
