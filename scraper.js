var Xray = require('x-ray');
var x = Xray();
var http = require('http');
var fs = require('fs');
var colors = require('colors');
var async = require("async");
var path = require('path');
var Promise = require('bluebird');

const argv = require('yargs')
.option('category', {
    alias: 'c',
    demand: true,
    describe: 'Book Category',
    type: 'string'
}).help('help').argv

var category = argv.c.split(' ').join('-');
var mainPage = 'http://www.allitebooks.com/' + category;

scrapePage(mainPage);
loopThroughPages(mainPage, function(result) {
    var numOfPages = +(result[0]);
    for (var pageNum = 2; pageNum <= numOfPages; pageNum++) {
        return new Promise(function (resolve, reject) {
            scrapePage(mainPage + '/page/' + pageNum, pageNum);
        })

    }
});

function loopThroughPages(url, callback) {
    x(url, ['a[title="Last Page →"]'])((err, result) => {
        if (err) console.log(err .red);
        console.log('Result: ', result);
        callback(result);
    })
}

function scrapePage(url, pageNum) {
        x(url, ['.entry-title>a@href'])((err, result) => {
            if (err) console.log(err.red);
            if (result) {
                    result.forEach((url) => {
                        download(url, pageNum)
                    })
                }


    })
}
    /*x(url, ['.entry-title>a@href']).delay(1000)((err, result) => {
        if (err) console.log(err .red);
        if(result) {
            result.forEach((url) => {

                download(url, pageNum)

            })
        }
        })
        };*/

function download(url, pageNum) {
    if (!fs.existsSync("books/")) {
        fs.mkdirSync("books/");
    }
    if (!fs.existsSync("books/" + category)) {
        fs.mkdirSync("books/" + category);
    }
    x(url, '.download-links>a@href')((err, result) => {

        if (err) console.log(err .red);
        
        http.get(result,(response) => {
            if (response.statusCode === 200){
                var file = fs.createWriteStream("books/" + category + "/" + url.split('/')[3] + ".pdf");
                if (!fs.existsSync(file)) {
                    console.log('downloading ' .blue + url .cyan, 'pageNum ' .red + pageNum);
                    response.pipe(file);
                }else{
                    console.log('File exists');
                }

            } 
        }).on('error', function(err){
            console.log(err.code .red);
            if(err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED'){
                download(url, pageNum )
                console.log('RETRY ' .red, url, 'PAGENUM ', pageNum)
            }

        });
    });
}
