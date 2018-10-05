"use strict";

const express = require("express");
const router = express.Router();
const passport = require("passport");

/** @type Database */
const DB = require("./Database.class").getInstance();

router.route("/").post((req, res, next) => {

});

router.param("moj-sadrzaj", (req, res, next) => {
	let sadrzaj = req.params.sadrzaj;

	if(sadrzaj === "tekst"){
		res.locals.title = "Novi tekst";
	}else if(sadrzaj === "akordi"){
		res.locals.title = "Novi akordi";
	}else if(sadrzaj === "tab"){
		res.locals.title = "Nove tabulature";
	}else if(isNaN(sadrzaj)){
		// greska
	}else{
		res.locals.title = "Uređivanje";
	}

	next();
});

router.route("/:sadrzaj").get((req, res) => {
	let sadrzaj = req.params.sadrzaj;

	if(isNaN(sadrzaj)){
		res.locals.sadrzaj = {
			izvodac: { id: "", naziv: "Izvođač" },
			pjesma: { id: "", naziv: "Pjesma" },
			privatno: true,
			content: ""
		};

		res.locals.tiny = true;

		res.render("uredivanje");
	}else{
		DB.dohvatiSadrzaj(sadrzaj, (data) => {
			if(data.pjesma.id === null || data.izvodac.id === null){
				data.izvodac = { id: "", naziv: "Izvođač" };
				data.pjesma = { id: "", naziv: "Pjesma" };
			}

			res.locals.sadrzaj = data;
			res.locals.tiny = true;

			res.render("uredivanje");
		});
	}
});

const tipovi = ["tekst", "akordi", "tab"];

function insertGetIzvodac(izvodac, callback){
	if(isNaN(izvodac)){
		if(izvodac.startsWith("new:")){
			izvodac = izvodac.substring(4);
			DB.dohvatiIdIzvodaca(izvodac, callback);
		}else{
			callback(-1);
		}
	}else{
		// TODO: provjera ID-a
		callback(izvodac);
	}
}

function insertGetPjesma(data, callback){
	if(isNaN(data.pjesma)){
		if(data.pjesma.startsWith("new:")){
			data.pjesma = data.pjesma.substring(4);
			DB.dohvatiIdPjesme(data.izvodac, data.pjesma, callback);
		}else{
			callback(-1);
		}
	}else{
		// TODO: provjera ID-a
		callback(data.pjesma);
	}
}

router.route("/:sadrzaj").post((req, res) => {
	let sadrzajId = req.params.sadrzaj;

	//TODO: samo ako je korisnik ulogiran

	if(isNaN(sadrzajId)){
		if(tipovi.indexOf(sadrzajId) === -1){
			// TODO: hendlanje greske
		}else{
			insertGetIzvodac(req.body.sadrzaj_izvodac, (izvodac) => {
				// TODO: hendlanje errora

				insertGetPjesma({ izvodac: izvodac, pjesma: req.body.sadrzaj_pjesma }, (pjesma) => {
					//TODO: hendlanje errora

					DB.insertSadrzaj(req.user.id, tipovi.indexOf(sadrzajId),
						req.body.content, pjesma, parseInt(req.body.sadrzaj_privatno), (id) => {
						//TODO: hendlanje errora
						res.redirect("/uredivanje/" + id);
					});
				})
			});
		}
	}else{
		insertGetIzvodac(req.body.sadrzaj_izvodac, (izvodac) => {
			// TODO: hendlanje errora

			insertGetPjesma({ izvodac: izvodac, pjesma: req.body.sadrzaj_pjesma }, (pjesma) => {
				//TODO: hendlanje errora
				//TODO: provjera ako korisnik uređuje njegov sadržaj

				DB.updateSadrzaj(sadrzajId, req.body.content, pjesma, parseInt(req.body.sadrzaj_privatno), (result) => {
					//TODO: hendlanje errora
					res.redirect("/uredivanje/" + sadrzajId);
				});
			})
		});
	}
});

module.exports = router;