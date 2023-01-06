const express = require("express");
const app = express();
const path = require("path");
const csurf = require("csurf");
const cookieParser = require("cookie-parser");
const {
  Users,
  Elections,
  Questions,
  Answers,
  Voters,
  Votes,
} = require("./models");
const passport = require("passport"); // authentication
const connectEnsureLogin = require("connect-ensure-login"); //authorization
const session = require("express-session"); // session middleware for cookie support
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
// const db = require("./models/index");
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
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(
  "local",
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

// Voter Local Strategy
passport.use(
  "voter",
  new LocalStrategy(
    {
      usernameField: "voterId",
      passwordField: "password",
    },
    function (username, password, done) {
      try {
        Voters.findOne({ where: { voterId: username } })
          .then(async function (user) {
            const result = await bcrypt.compare(password, user.password);
            if (result) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Invalid credentials" });
            }
          })
          .catch((err) => {
            console.log(err);
            return done(null, false, { message: "Invalid credentials" });
          });
      } catch (err) {
        console.log(err);
        return done(err);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  // If user is a voter, serialize voterId
  if (user.voterId) {
    done(null, {
      voterId: user.voterId,
      type: "voter",
    });
  } else {
    // If user is a regular user, serialize id
    done(null, {
      id: user.id,
      type: "user",
    });
  }
});

passport.deserializeUser(function (data, done) {
  // If id is a voterId, deserialize voterId
  if (data.type === "voter") {
    Voters.findOne({ where: { voterId: data.voterId } })
      .then((user) => {
        done(null, user);
      })
      .catch((err) => {
        done(err);
      });
  } else {
    // If id is a regular user, deserialize id
    Users.findByPk(data.id)
      .then((user) => {
        done(null, user);
      })
      .catch((err) => {
        done(err);
      });
  }
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

app.delete(
  "/election/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const election = await Elections.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    if (election) {
      await election.destroy();
      res.json({ message: "Election deleted successfully" });
    } else {
      res.status(404).json({ error: "Election not found" });
    }
  }
);

app.get(
  "/election/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const election = await Elections.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    if (election) {
      req.accepts("html")
        ? res.render("pages/election", { election })
        : res.json(election);
    } else {
      req.accepts("html")
        ? res.status(404)
        : res.status(404).json({ error: "Election not found" });
    }
  }
);

app.get(
  "/election/:id/questions",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const election = await Elections.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    const questions = await Questions.findAll({
      where: {
        electionId: req.params.id,
      },
      include: [
        {
          model: Answers,
        },
      ],
    });
    if (election) {
      req.accepts("html")
        ? res.render("pages/questions", {
            election,
            questions,
            user: req.user,
          })
        : res.json(election);
    } else {
      req.accepts("html")
        ? res.status(404)
        : res.status(404).json({ error: "Election not found" });
    }
  }
);

app.post(
  "/election/:id/questions",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const election = await Elections.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    const isElectionActive = election.status === "active";
    if (!isElectionActive) {
      const question = req.body.question.trim();
      const electionId = req.params.id;
      const description = req.body.description.trim();
      await Questions.create({
        question,
        electionId,
        description,
      })
        .then((question) => {
          res.json(question);
        })
        .catch((error) => {
          res.status(422).json({ error: error.message });
        });
    } else {
      res
        .status(422)
        .json({ error: "Election is active. Cannot add questions" });
    }
  }
);

app.delete(
  "/election/:id/questions/:questionId",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const election = await Elections.findByPk(req.params.id);
    const isElectionActive = election.status === "active";
    if (isElectionActive) {
      res.status(422).json({ error: "Election is active" });
    } else {
      const question = await Questions.findByPk(req.params.questionId);
      const answers = await Answers.findAll({
        where: {
          questionId: req.params.questionId,
        },
      });
      if (question) {
        answers.forEach(async (answer) => {
          await answer.destroy();
        });
        await question.destroy();
        res.json({ message: "Question deleted successfully" });
      } else {
        res.status(404).json({ error: "Question not found" });
      }
    }
  }
);

app.post(
  "/election/:id/questions/:questionId/answers",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const election = await Elections.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    const isElectionActive = election.status === "active";
    if (isElectionActive) {
      const answer = req.body.answer.trim();
      const questionId = req.params.questionId;
      await Answers.create({
        answer,
        questionId,
      })
        .then((answer) => {
          res.json(answer);
        })
        .catch((error) => {
          res.status(422).json({ error: error.message });
        });
    } else {
      res.status(422).json({ error: "Election is active. Cannot add answers" });
    }
  }
);

app.delete(
  "/election/:id/questions/:questionId/answers/:answerId",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const answer = await Answers.findByPk(req.params.answerId);
    const election = await Elections.findByPk(req.params.id);
    const isElectionActive = election.status === "active";
    if (isElectionActive) {
      res.status(422).json({ error: "Election is active" });
    } else {
      if (answer) {
        await answer.destroy();
        res.json({ message: "Answer deleted successfully" });
      } else {
        res.status(404).json({ error: "Answer not found" });
      }
    }
  }
);

app.get(
  "/election/:id/vote",
  connectEnsureLogin.ensureLoggedIn({
    redirectTo: "login",
  }),
  async (req, res) => {
    if (req.user.voterId) {
      const election = await Elections.findByPk(req.params.id);
      if (election.status === "active") {
        const questions = await Questions.findAll({
          where: {
            electionId: req.params.id,
          },
          include: [
            {
              model: Answers,
            },
          ],
        });
        if (election) {
          req.accepts("html")
            ? res.render("pages/vote", { election, questions, user: req.user })
            : res.json(election);
        } else {
          req.accepts("html")
            ? res.status(404)
            : res.status(404).json({ error: "Election not found" });
        }
      } else {
        res.redirect(`/election/${req.params.id}/results`);
      }
    } else {
      req.accepts("html")
        ? res.redirect(`/election/${req.params.id}/login`)
        : res.status(403).json({ error: "You are not logged in as a voter" });
    }
  }
);

app.post(
  "/election/:id/toggleStatus",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const election = await Elections.findByPk(req.params.id);
    if (election) {
      if (election.status === "inactive") {
        election.status = "active";
      } else {
        election.status = "inactive";
      }
      await election.save();
      res.json({ message: "Election status changed successfully" });
    } else {
      res.status(404).json({ error: "Election not found" });
    }
  }
);

app.get(
  "/election/:id/voters",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    // Register voters
    const voters = await Voters.findAll({
      where: {
        electionId: req.params.id,
      },
    });
    const election = await Elections.findByPk(req.params.id);
    if (voters) {
      req.accepts("html")
        ? res.render("pages/voters", { election, voters, user: req.user })
        : res.json(voters);
    }
  }
);

app.post("/election/:id/voters", async (req, res) => {
  const electionId = req.params.id;
  const voterId = req.body.voterId.trim();
  // Validate voterId is unique as sequelize has errors
  const voter = await Voters.findOne({
    where: {
      voterId,
      electionId,
    },
  });
  if (!voter) {
    const password = await bcrypt.hash(req.body.password.trim(), 10);
    await Voters.create({
      voterId,
      password,
      electionId,
    })
      .then((voter) => {
        res.json(voter);
      })
      .catch((error) => {
        res.status(422).json({ error: error.message });
      });
  } else {
    res.status(422).json({ error: "Voter ID already exists" });
  }
});

app.delete(
  "/election/:id/voters/:voterId",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const voter = await Voters.findOne({
      where: {
        voterId: req.params.voterId,
        electionId: req.params.id,
      },
    });
    if (voter) {
      await voter.destroy();
      res.json({ message: "Voter deleted successfully" });
    } else {
      res.status(404).json({ error: "Voter not found" });
    }
  }
);

app.get("/election/:id/login", async (req, res) => {
  const election = await Elections.findByPk(req.params.id);
  if (election) {
    req.accepts("html")
      ? res.render("pages/election_login", { election })
      : res.status(404).json({ error: "Nothing to see here" });
  } else {
    req.accepts("html")
      ? res.status(404)
      : res.status(404).json({ error: "Election not found" });
  }
});

app.post(
  "/election/:id/login",
  passport.authenticate("voter"),
  async (req, res) => {
    req.accepts("html")
      ? res.redirect(`/election/${req.params.id}/vote`)
      : res.json({ message: "Voter logged in successfully" });
  }
);

app.post(
  "/election/:id/vote",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const election = await Elections.findByPk(req.params.id);
    if (election) {
      const questionId = req.body.questionId;
      const answerId = req.body.answerId;
      const voterId = req.user.voterId;
      const electionId = req.params.id;
      await Votes.create({
        questionId,
        answerId,
        voterId,
        electionId,
      });
      res.json({ message: "Vote cast successfully" });
    } else {
      res.status(404).json({ error: "Election not found" });
    }
  }
);

app.get("/election/:id/results", async (req, res) => {
  const election = await Elections.findByPk(req.params.id);
  if (election) {
    const questions = await Questions.findAll({
      where: {
        electionId: req.params.id,
      },
      include: [
        {
          model: Answers,
        },
      ],
    });
    const votes = await Votes.findAll({
      where: {
        electionId: req.params.id,
      },
    });

    const results = questions.map((question) => {
      const answers = question.Answers.map((answer) => {
        const answerVotes = votes.filter(
          (vote) => vote.answerId === answer.id
        ).length;
        return {
          ...answer.dataValues,
          votes: answerVotes,
        };
      });
      return {
        ...question.dataValues,
        Answers: answers,
      };
    });
    req.accepts("html")
      ? res.render("pages/results", { election, results })
      : res.json(questions);
  }
});

module.exports = app;
