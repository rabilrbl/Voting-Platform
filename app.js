const express = require("express");
const app = express();
const path = require("path");
const csurf = require("csurf");
const cookieParser = require("cookie-parser");
const { Users, Elections } = require("./models");
const passport = require("passport"); // authentication
const connectEnsureLogin = require("connect-ensure-login"); //authorization
const session = require("express-session"); // session middleware for cookie support
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const SequelizeStore = require('connect-session-sequelize')(session.Store);
const db = require("./models/index");

const saltRounds = 10;

app.use(cookieParser("secret"));

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
// eslint-disable-next-line no-undef
app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies
app.use(csurf({ cookie: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    function (username, password, done) {
      try {
        Users.findOne({ where: { email: username } })
          .then(async function (user) {
            const result = await bcrypt.compare(password, user.password);
            if (result) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Invalid credentials" });
            }
          })
          .catch(() => {
            return done(null, false, { message: "Invalid credentials" });
          });
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  Users.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

const sendResponse = (req, res, renderRes, jsonRes, renderData = {}) => {
  if (req.accepts("html")) {
    res.render(renderRes, renderData);
  } else {
    res.json(jsonRes);
  }
};

app.use(function (request, response, next) {
  response.locals.csrfToken = request.csrfToken();
  next();
});

app.get("/", (req, res) => {
  sendResponse(req, res, "pages/index", {
    message: "Welcome to the online voting platform!",
  });
});

app.get(
  "/login",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/elections" }),
  (req, res) => {
    res.render("pages/login");
  }
);

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    // failureFlash: true,
  }),
  function (request, response) {
    response.redirect("/elections");
  }
);

app.get(
  "/register",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/elections" }),
  (req, res) => {
    res.render("pages/register");
  }
);

app.post(
  "/register",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/elections" }),
  async function (request, response) {
    const firstName = request.body.firstName.trim();
    const lastName = request.body.lastName.trim();
    const email = request.body.email.trim();
    const password = await bcrypt.hash(request.body.password, saltRounds);
    await Users.create({
      firstName,
      lastName,
      email,
      password,
    })
      .then((user) => {
        // Initialize session after successful signup
        request.login(user, function (err) {
          if (err) {
            return response.status(500).json({ error: err.message });
          }
          return request.accepts("html")
            ? response.redirect("/elections")
            : // request.flash("success", "User created successfully")
              response.json({
                id: user.id,
                message: "User created successfully",
              });
        });
      })
      .catch((error) => {
        return request.accepts("html")
          ? // ? request.flash("error", error.message) &&
            response.redirect("/signup")
          : response.status(422).json({ error: error.message });
      });
  }
);

app.get(
  "/logout",
  connectEnsureLogin.ensureLoggedIn(),
  function (request, response, next) {
    request.logout(function (err) {
      if (err) {
        return next(err);
      }
      // request.flash("success", "You have been logged out");
      response.redirect("/");
    });
  }
);

app.get("/elections", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const elections = await Elections.findAll({
    where: {
      userId: req.user.id,
    },
  });
  res.render("pages/elections", { elections, user: req.user });
});

app.post(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const title = req.body.name.trim();
    const description = req.body.description.trim();
    await Elections.create({
      title,
      description,
      userId: req.user.id,
      status: "inactive",
    })
      .then((election) => {
        res.json(election);
      })
      .catch((error) => {
        res.status(422).json({ error: error.message });
      });
  }
);

app.delete("/elections/:id", async (req, res) => {
  const election = await Elections.findByPk(req.params.id);
  if (election) {
    await election.destroy();
    res.json({ message: "Election deleted successfully" });
  } else {
    res.status(404).json({ error: "Election not found" });
  }
});

app.get("/elections/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const election = await Elections.findByPk(req.params.id);
  // const candidates = await Candidates.findAll({
  //   where: {
  //     electionId: req.params.id,
  //   },
  // });
  res.render("pages/election_id", { election, user: req.user });
});

module.exports = app;
