"use strict";

const express = require("express");
const router = express.Router();
const passport = require("passport");

/** @type Database */
const DB = require("./Database.class").getInstance();


router.route("/").post((req, res, next) => {
	res.locals.hideSearch = true;

	let tip = req.body.submit;

	if(tip === "Prijava"){
		passport.authenticate("local", (err, user, info) => {
			if(user === false){
				res.locals.message = "Neispravno korisničko ime ili lozinka!";
				return res.render("prijava");
			}else{
				req.logIn(user, (err) => {
					return res.redirect("/moj-sadrzaj/");
				});
			}
		})(req, res, next);
	}else if(tip === "Registracija"){
		if(req.body.password === "" || req.body.username === "" || req.body.email === ""){
			res.locals.message = "Sva polja su obavezna!";
			res.render("prijava");
		}

		if(req.body.password !== req.body.password2){
			res.locals.message = "Lozinke se ne podudaraju!";
			res.render("prijava");
		}

		DB.tryRegister(req.body.username, req.body.password, req.body.email, function(success){
			if(success){
				res.locals.message = "Korisnički račun uspješno registriran!";
			}else{
				res.locals.message = "Korisničko ime ili lozinka zauzeti!";
			}

			res.render("prijava");
		});
	}
}, (req, res) => {
	console.log("error");
});

module.exports = router;