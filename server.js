'use strict';

//====> reqiure packaged
const express = require('express');
const superAgent = require('superagent');
const pg = require('pg');
const cors = require('cors');
const methodOverride = require('method-override');

//====> run the server
const app = express();



//====> middlewares
require('dotenv').config();
app.use(cors());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


//====> DB
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });


//====> routes
const PORT = process.env.PORT;
app.get('/', homeHandler);
app.get('/getCountryResult', getCountryResultHandler);
app.get('/Allcountries', AllcountriesHandler);
app.post('/myRecords', myRecordsHandler1);
app.get('/myRecords', myRecordsHandler2);
app.get('/recordDetails/:id', recordDetailsHandler);
app.put('/recordDetails/:id', putHandler);
app.delete('/recordDetails/:id', deleteHandler);

//====> handlers
function homeHandler(req, res) {
    let url = `https://api.covid19api.com/world/total`;
    superAgent.get(url).then(summary => {
        res.render('pages/home', { data: summary.body })
    }).catch(error => {
        console.log(error);
    })
}

function getCountryResultHandler(req, res) {
    let { country, from, to } = req.query;
    let url = `https://api.covid19api.com/country/${country}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00Z`;
    superAgent.get(url).then(searched => {
        let searchedArray = searched.body.map(data => {
            return new SearchedCountry(data)
        })
        res.render('pages/getCountryResult', { data: searchedArray })
    }).catch(error => {
        console.log(error);
    })
}

function AllcountriesHandler(req, res) {
    let url = `https://api.covid19api.com/summary`;
    superAgent.get(url).then(all => {
        let allcountriesArray = all.body.Countries.map(data => {
            return new AllCountries(data);
        })
        res.render('pages/Allcountries', { data: allcountriesArray })
    }).catch(error => {
        console.log(error);
    })
}

function myRecordsHandler1(req, res) {
    let { country, confirmed, deaths, recovered, date } = req.body;
    let sql = `INSERT INTO card (country, confirmed, deaths, recovered, date) VALUES ($1, $2, $3, $4, $5);`
    let safeValues = [country, confirmed, deaths, recovered, date];
    client.query(sql, safeValues).then(() => {
        res.redirect('/myRecords')
    }).catch(error => {
        console.log(error);
    })
}

function myRecordsHandler2(req, res) {
    let sql = `SELECT * FROM card;`
    client.query(sql).then((table) => {
        res.render('pages/myRecords', { data: table.rows })
    }).catch(error => {
        console.log(error);
    })
}

function recordDetailsHandler(req, res) {
    let id = req.params.id;
    let sql = `SELECT * FROM card WHERE id=${id};`
    client.query(sql).then((table) => {
        res.render('pages/recordDetails', { data: table.rows[0] });
    }).catch(error => {
        console.log(error);
    })
}

function putHandler(req, res) {
    let id = req.params.id;
    let { country, confirmed, deaths, recovered, date } = req.body;
    let sql = `UPDATE card SET country = $1, confirmed = $2, deaths = $3,  recovered = $4,  date = $5 WHERE id=$6;`
    let safeValues = [country, confirmed, deaths, recovered, date, id];
    client.query(sql, safeValues).then(() => {
        res.redirect(`/recordDetails/${id}`)
    }).catch(error => {
        console.log(error);
    })
}

function deleteHandler(req, res) {
    let id = req.params.id;
    let sql = `DELETE FROM card WHERE id=${id}; `
    client.query(sql).then(() => {
        res.redirect(`/myRecords`)
    }).catch(error => {
        console.log(error);
    })
}

//====> constructor
function SearchedCountry(data) {
    this.country = data.Country;
    this.date = data.Date;
    this.confirmed = data.Cases;
}

function AllCountries(data) {
    this.country = data.Country;
    this.confirmed = data.TotalConfirmed;
    this.deaths = data.TotalDeaths;
    this.recovered = data.TotalRecovered;
    this.date = data.Date;
}


//====> listen and connect 

client.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`you are listening to PORT ${PORT}`);
    })
}).catch(error => {
    console.log(error);
})