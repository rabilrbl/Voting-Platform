const express = require("express");
const app = express();
const path = require("path");

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
// eslint-disable-next-line no-undef
app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("pages/index");
    }
);

module.exports = app;
