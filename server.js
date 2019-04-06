var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
// var handlebars = require("expresshandlebars");

var db = require("./models");

var PORT = 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsscraper";

mongoose.connect(MONGODB_URI);

//routes go here

//scraping route
app.get("/scrape", function (req, res) {
    axios.get("https://www.bbc.com/news/world").then(function(response) {
        var $ = cheerio.load(response.data);
        console.log(response.data);
        // var articles = [];
        $(".title-link").each(function(i, element) {
            var result = {};
            result.headline = $(element).children().text().trim();
            result.link = $(element).attr("href");

            

            db.Article.create(result)
            .then(function(dbArticle) {
                console.log(dbArticle + "line 42");
            })
            .catch(function(err) {
                console.log(err + "line 45");
            });
        });
        res.send("Scrape Complete");
    });
});

app.get("/articles", function(req, res) {
    db.Article.find({})
    .then (function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
    db.Article.findOne({_id: req.params.id})
    .populate("note")
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
    .then(function(dbNote) {
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.json(err);
    });
});

app.listen(PORT, function() {
    console.log("App running on port " + PORT);
});