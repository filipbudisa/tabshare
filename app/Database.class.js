"use strict";

const mysql = require("mysql");
const md5 = require("md5");

const tipovi = ["tekst", "akordi", "tab"];

class Database {
	constructor(){
		this.con = mysql.createConnection({
			host: "localhost",
			user: "tab",
			password: "AZ4kCXhS",
			database: "tab"
		});

		this.con.connect(function(error){
			if(error){
				console.log("Database connection error");
				console.log(error);
			}else{
				console.log("Database connection established");
			}
		});
	}

	tryLogin(user, pass, callback){
		let passMd5 = md5(pass);
		let sql = "SELECT id FROM korisnici WHERE username = ? AND pass = ?";

		let promise = new Promise((resolve, reject) => {
			this.con.query(sql, [user, passMd5], function(err, res, fields){
				resolve(res);
			});
		});

		promise.then((res) => {
			let result;

			if(res.length == 0){
				result = -1;
			}else{
				result = res[0].id;
			}

			callback(result);
		});
	}

	getUser(id, callback){
		let sql = "SELECT id, username, email FROM korisnici WHERE id = ?";

		let promise = new Promise((resolve, reject) => {
			this.con.query(sql, [id], function(err, res, fields){
				resolve(res);
			});
		});

		promise.then((res) => {
			callback(res);
		});
	}

	/**
	 *
	 * @param user
	 * @param pass
	 * @param email
	 * @param callback
	 * @return bool true uspjeh, false zauzeto
	 */
	tryRegister(user, pass, email, callback){
		let sql;

		let promise = new Promise((resolve, reject) => {
			sql = "SELECT id FROM korisnici WHERE username = ? OR email = ?";
			this.con.query(sql, [user, email], function(err, res, fields){
				resolve(res);
			});
		});

		promise.then((res) => {
			if(res.length !== 0){
				callback(false);
			}else{
				sql = "INSERT INTO korisnici (username, pass, email) VALUES (?, ?, ?)";
				this.con.query(sql, [user, md5(pass), email]);
				callback(true);
			}
		});
	}

	insertSadrzaj(user, tip, content, pjesma, privatno, callback){
		let sql = "INSERT INTO sadrzaj (tip, pjesma, privatno, autor) VALUES (?, ?, ?, ?)";

		if(pjesma === undefined || pjesma === ''){
			pjesma = null;
			privatno = 1;
		}

		this.con.query(sql, [tip, pjesma, privatno, user], (err, res, fields) => {
			if(err) {
				callback(-1);
				return;
			}

			let id = res.insertId;

			sql = "INSERT INTO sadrzaj_" + tipovi[tip] + " (sadrzajId, content) VALUES (?, ?)";
			this.con.query(sql, [id, content], (err2, res2, fields2) => {
				if(err2){
					callback(-1);
					return;
				}

				callback(id);
			});
		});
	}

	updateSadrzaj(id, content, pjesma, privatno, callback){
		let sql = "SELECT tip FROM sadrzaj WHERE id = ?";

		this.con.query(sql, [id], (err, res, fields) => {
			if(err){
				console.log(err);
				callback(false);
				return;
			}

			if(res.length > 0 && res[0].tip !== undefined){
				sql = "UPDATE sadrzaj_" + tipovi[res[0].tip] + " " +
					"SET content = ? " +
					"WHERE sadrzajId = ?";

				this.con.query(sql, [content, id], (err2, res2, fields2) =>{
					if(err2){
						console.log(err2);
						callback(false);
						return;
					}

					sql = "UPDATE sadrzaj SET pjesma = ?, privatno = ? WHERE id = ?";

					if(pjesma === ''){
						pjesma = null;
						privatno = 1;
					}

					this.con.query(sql, [pjesma, privatno, id], (err3, res3, fields3) => {
						if(err3){
							console.log(err3);
							callback(false);
						}else{
							callback(true);
						}
					});
				});
			}else{
				callback(false);
			}
		});
	}

	dohvatiIdIzvodaca(izvodac, callback){
		let sql = "SELECT id FROM izvodaci WHERE LOWER(naziv) = ?";

		this.con.query(sql, [izvodac.toLowerCase()], (err, res, fields) => {
			if(res.length > 0){
				callback(res[0].id);
				return;
			}

			sql = "INSERT INTO izvodaci (naziv) VALUES (?)";
			this.con.query(sql, [izvodac], (err2, res2, fields2) => {
				callback(res2.insertId);
			});
		});
	}

	dohvatiIdPjesme(izvodac, pjesma, callback){
		let sql = "SELECT id FROM pjesme WHERE izvodac = ? AND LOWER(naziv) = ?";

		this.con.query(sql, [izvodac, pjesma], (err, res, fields) => {
			if(res.length > 0){
				callback(res[0].id);
				return;
			}

			sql = "INSERT INTO pjesme (naziv, izvodac) VALUES (?, ?)";
			this.con.query(sql, [pjesma, izvodac], (err2, res2, fields2) => {
				callback(res2.insertId);
			});
		});
	}

	dodajKomentar(id, korisnikId, content, callback){
		let sql = "INSERT INTO komentari (sadrzajId, autor, content) VALUES (?, ?, ?)";

		this.con.query(sql, [id, korisnikId, content], (err, res, fields) => {
			if(err){
				console.log(err);
				callback(false);
			}else{
				callback(true);
			}
		});
	}

	dohvatiKomentare(id, page, callback){
		let offset = page*10;

		let sql = "SELECT vrijeme, content, username " +
			"FROM komentari " +
			"LEFT JOIN korisnici ON komentari.autor = korisnici.id " +
			"WHERE komentari.sadrzajId = ? " +
			"ORDER BY komentari.id DESC " +
			"LIMIT " + offset + ", 10";

		this.con.query(sql, [id], (err, res, fields) => {
			if(err){
				console.log(err);
				callback([]);
				return;
			}

			callback(res);
		});
	}

	dohvatiSadrzaj(id, callback){
		let sql = "SELECT korisnici.username as autorNaziv, autor, tip, privatno, pogleda, " +
			"pjesma, izvodac, pjesme.naziv AS pjesmaNaziv, izvodaci.naziv AS izvodacNaziv, " +
			"COALESCE(sadrzaj_tekst.content, sadrzaj_akordi.content, sadrzaj_tab.content) AS content, " +
			"(SELECT COUNT(id) FROM komentari WHERE sadrzajId = sadrzaj.id) AS komentara " +
			"FROM sadrzaj " +
			"LEFT JOIN pjesme ON sadrzaj.pjesma = pjesme.id " +
			"LEFT JOIN izvodaci ON pjesme.izvodac = izvodaci.id " +
			"LEFT JOIN sadrzaj_tekst ON sadrzaj.id = sadrzaj_tekst.sadrzajId " +
			"LEFT JOIN sadrzaj_akordi ON sadrzaj.id = sadrzaj_akordi.sadrzajId " +
			"LEFT JOIN sadrzaj_tab ON sadrzaj.id = sadrzaj_tab.sadrzajId " +
			"LEFT JOIN korisnici ON sadrzaj.autor = korisnici.id " +
			"WHERE sadrzaj.id = ?";

		this.con.query(sql, [parseInt(id)], (err, res, fields) => {
			if(err || res.length === 0){
				console.log(err);
				callback(null);
				return;
			}

			let data = {
				id: id,
				izvodac: { id: res[0].izvodac, naziv: res[0].izvodacNaziv },
				pjesma: { id: res[0].pjesma, naziv: res[0].pjesmaNaziv },
				privatno: res[0].privatno.readInt8(0) === 1,
				content: res[0].content,
				autor: { id: res[0].autor, naziv: res[0].autorNaziv },
				tip: res[0].tip,
				pogleda: res[0].pogleda,
				komentara: res[0].komentara
			};

			callback(data);
		});
	}

	dohvatiSadrzajMalo(filteri, page, order, callback){
		let filter, filterKeys = [], filterVals = [];
		for(filter in filteri){
			if(!filteri.hasOwnProperty(filter)) continue;
			filterKeys.push(filter + " = ?");
			filterVals.push(filteri[filter]);
		}

		let offset = 10*page;

		let sql = "SELECT korisnici.username as autorNaziv, sadrzaj.id as id, tip, pjesma, autor, privatno, pjesme.naziv as pjesma, izvodaci.naziv as izvodac " +
			"FROM sadrzaj " +
			"LEFT JOIN pjesme ON sadrzaj.pjesma = pjesme.id " +
			"LEFT JOIN izvodaci ON pjesme.izvodac = izvodaci.id " +
			"LEFT JOIN korisnici ON sadrzaj.autor = korisnici.id ";

		if(filteri !== null){
			sql += "WHERE " + filterKeys.join(" AND ");
		}

		if(order !== null){
			sql += " ORDER BY " + order + " DESC LIMIT " + offset + ", 10";
		}else{
			sql += " ORDER BY sadrzaj.id DESC LIMIT " + offset + ", 10";
		}

		this.con.query(sql, filterVals, (err, res, fields) => {
			if(err){
				console.log(err);
				callback([]);
				return;
			}

			callback(res);
		})
	}

	pretraziIzvodace(text, callback){
		let sql = "SELECT id as val, naziv as title FROM izvodaci WHERE naziv LIKE ?";

		this.con.query(sql, ["%" + text + "%"], (err, res, fields) => {
			if(err){
				callback([]);
			}else{
				callback(res);
			}
		})
	}

	pretraziPjesme(text, izvodac, callback){
		let sql = "SELECT id as val, naziv as title FROM pjesme WHERE naziv LIKE ? AND izvodac = ?";

		this.con.query(sql, ["%" + text + "%", izvodac], (err, res, fields) => {
			if(err){
				callback([]);
			}else{
				callback(res);
			}
		})
	}

	dodajPogled(id){
		let sql = "UPDATE sadrzaj SET pogleda = pogleda+1 WHERE id = ?";
		this.con.query(sql, [id], (err, res, fields) => { });
	}

	pretraga(tekst, tip, callback){
		let sql = "SELECT korisnici.username as autorNaziv, sadrzaj.id as id, tip, pjesma, autor, privatno, pjesme.naziv as pjesma, izvodaci.naziv as izvodac " +
			"FROM sadrzaj " +
			"LEFT JOIN pjesme ON sadrzaj.pjesma = pjesme.id " +
			"LEFT JOIN izvodaci ON pjesme.izvodac = izvodaci.id " +
			"LEFT JOIN korisnici ON sadrzaj.autor = korisnici.id ";
		let data;
		tekst = "%" + tekst + "%";

		switch(tip){
			case -1:
				sql += "WHERE pjesme.naziv LIKE ? OR izvodaci.naziv LIKE ? OR korisnici.username LIKE ?";
				data = [tekst, tekst, tekst];
				break;
			case 0:
				sql += "WHERE (pjesme.naziv LIKE ? OR izvodaci.naziv LIKE ? OR korisnici.username LIKE ?) AND tip = 0";
				data = [tekst, tekst, tekst];
				break;
			case 1:
				sql += "WHERE (pjesme.naziv LIKE ? OR izvodaci.naziv LIKE ? OR korisnici.username LIKE ?) AND tip = 1";
				data = [tekst, tekst, tekst];
				break;
			case 2:
				sql += "WHERE (pjesme.naziv LIKE ? OR izvodaci.naziv LIKE ? OR korisnici.username LIKE ?) AND tip = 2";
				data = [tekst, tekst, tekst];
				break;
			case 10:
				sql += "WHERE izvodaci.naziv LIKE ?";
				data = [tekst];
				break;
			case 11:
				sql += "WHERE pjesme.naziv LIKE ?";
				data = [tekst];
				break;
		}

		this.con.query(sql, data, (err, res, fields) => {
			if(err){
				console.log(err);
				callback([]);
			}else{
				callback(res);
			}
		});
	}
}

let DB = null;

exports.getInstance = function(){
	if(!DB) DB = new Database();
	return DB;
};