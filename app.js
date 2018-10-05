"use strict";

const sprintf = require("sprintf-js").sprintf;
const dateformat = require("dateformat");

const path = require("path");

const express = require("express");
const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "app/views"));

app.use("/static", express.static(path.join(__dirname, "app/public")));

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const session = require("express-session");
app.use(session({
	secret: "tabateksecret",
	resave: true,
	saveUninitialized: true,
	cookie: { maxAge: 3600000, secure: false }
}));

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
app.use(passport.initialize());
app.use(passport.session());

/** @type Database */
const DB = require("./app/Database.class").getInstance();

passport.use(new LocalStrategy({
		usernameField: "user",
		passwordField: "pass",
		session: true
	},
	function(user, pass, done){
		DB.tryLogin(user, pass, function(id){
			if(id !== -1){
				done(null, { id: id });
			}else{
				done(null, false, { message: "Neispravno korisničko ime ili lozinka" });
			}
		});
	}
));

passport.serializeUser(function(user, done){
	done(null, user.id);
});

passport.deserializeUser(function(id, done){
	DB.getUser(id, function(user){
		done(null, user[0]);
	});
});

/* ### */

app.locals.appTitle = "TabShare";

app.locals.tipovi = ["tekst", "akordi", "tab"];
app.locals.tipoviLink = ["tekstovi", "akordi", "tabulature"];
app.locals.tipoviNice = ["Tekst", "Akordi", "Tabulature"];

app.use(["/moj-sadrzaj*", "/moj-sadrzaj", "/uredivanje*", "/uredivanje" ], (req, res, next) => {
	if(req.user) next();
	else res.redirect("/prijava/");
});

app.use("/prijava", (req, res, next) => {
	if(req.user) res.redirect("/");
	else next();
});

const uredivanje = require("./app/uredivanje");
app.use("/uredivanje", uredivanje);

const prijava = require("./app/prijava");
app.use("/prijava", prijava);

app.use((req, res, next) => {
	if(req.user) res.locals.user = req.user;
	next();
});

/* ### */

app.post("/data_izvodac.json", (req, res) => {
	if(req.body.text === undefined || req.body.text === ""){
		res.json([]);
		return;
	}

	DB.pretraziIzvodace(req.body.text, (data) => {
		res.json(data);
	});
});

app.post("/data_pjesma.json", (req, res) => {
	if(req.body.text === undefined || req.body.text === "" ||
		req.body.filter === undefined || isNaN(req.body.filter)){

		res.json([]);
		return;
	}

	DB.pretraziPjesme(req.body.text, req.body.filter, (data) => {
		res.json(data);
	});
});

/* ### */


app.get("/", (req, res) => {
	DB.dohvatiSadrzajMalo(null, 0, null, (sadr) => {
		res.locals.sadrzajNajnov = sadr;

		DB.dohvatiSadrzajMalo(null, 0, "pogleda", (sadr2) => {
			res.locals.sadrzajNajtr = sadr2;

			res.render("index");
		});
	});
});

app.get("/prijava", (req, res) => {
	res.locals.hideSearch = true;
	res.locals.title = "Prijava";
	res.locals.hidetitle = true;
	res.render("prijava");
});

app.get("/odjava", (req, res) => {
	req.logout();
	res.redirect("/");
});

app.get("/tekstovi", (req, res) => {
	res.locals.title = "Tekstovi";

	DB.dohvatiSadrzajMalo({ tip: 0 }, 0, null, (data) => {
		res.locals.sadrzaji = data;
		res.render("lista");
	});
});

app.get("/akordi", (req, res) => {
	res.locals.title = "Akordi";

	DB.dohvatiSadrzajMalo({ tip: 1 }, 0, null, (data) => {
		res.locals.sadrzaji = data;
		res.render("lista");
	});
});

app.get("/tabulature", (req, res) => {
	res.locals.title = "Tabulature";

	DB.dohvatiSadrzajMalo({ tip: 2 }, 0, null, (data) => {
		res.locals.sadrzaji = data;
		res.render("lista");
	});
});

app.get("/moj-sadrzaj", (req, res) => {
	res.locals.title = "Moj sadržaj";
	res.locals.sadrzajStranica = 0;

	DB.dohvatiSadrzajMalo({ autor: req.user.id }, 0, null, (data) => {
		res.locals.sadrzaji = data;
		res.render("moj-sadrzaj");
	});
});

app.get("/moj-sadrzaj/tekstovi", (req, res) => {
	res.locals.title = "Moj sadržaj";
	res.locals.sadrzajStranica = 1;

	DB.dohvatiSadrzajMalo({ autor: req.user.id, tip: 0 }, 0, null, (data) => {
		res.locals.sadrzaji = data;
		res.render("moj-sadrzaj");
	});
});

app.get("/moj-sadrzaj/akordi", (req, res) => {
	res.locals.title = "Moj sadržaj";
	res.locals.sadrzajStranica = 2;

	DB.dohvatiSadrzajMalo({ autor: req.user.id, tip: 1 }, 0, null, (data) => {
		res.locals.sadrzaji = data;
		res.render("moj-sadrzaj");
	});
});

app.get("/moj-sadrzaj/tabulature", (req, res) => {
	res.locals.title = "Moj sadržaj";
	res.locals.sadrzajStranica = 3;

	DB.dohvatiSadrzajMalo({ autor: req.user.id, tip: 2 }, 0, null, (data) => {
		res.locals.sadrzaji = data;
		res.render("moj-sadrzaj");
	});
});

app.get("/sadrzaj/:id", (req, res) => {
	let id = req.params.id;

	if(isNaN(id)){
		// greska
		res.redirect("/");
		return;
	}

	DB.dohvatiSadrzaj(id, (data) => {
		if(data === null){
			res.redirect("/");
			return;
		}

		DB.dodajPogled(id);

		res.locals.data = data;
		res.locals.title = sprintf("%s %s by %s", data.pjesma.naziv, app.locals.tipovi[data.tip], data.autor.naziv);
		res.locals.hidetitle = true;

		DB.dohvatiKomentare(id, 0, (komentari) => {
			res.locals.komentari = komentari;

			res.locals.dateformat = dateformat;

			res.locals.tiny = req.user !== undefined;
			res.render("sadrzaj");
		})
	});
});

app.post("/sadrzaj/:id", (req, res) => {
	let id = req.params.id;

	if(isNaN(id)){
		// greska
		res.redirect("/");
		return;
	}

	if(!req.user){
		// TODO: error handling
		res.redirect("/sadrzaj/" + id)
		return;
	}

	DB.dodajKomentar(parseInt(id), req.user.id, req.body.komentar, (result) => {
		// TODO: error handling
		res.redirect("/sadrzaj/" + id);
	})
});

app.post("/pretraga", (req, res) => {
	let tekst = req.body.tekst;
	let tip = req.body.tip;

	DB.pretraga(tekst, parseInt(tip), (data) => {
		res.locals.sadrzaji = data;
		res.render("lista");
	});
});

app.listen(3000, (err) => {
	if(err){
		console.log("Express error: " + err);
	}else{
		console.log("Server started");
	}
});