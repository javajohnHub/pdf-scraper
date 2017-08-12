var Xray = require('x-ray');
var x = Xray();
var http = require('http');
var fs = require('fs');
var colors = require('colors');
var path = require('path');


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

        scrapePage(mainPage + '/page/' + pageNum, pageNum);

    }
});

function loopThroughPages(url, callback) {
    x(url, ['a[title="Last Page →"]'])((err, result) => {
        if (err) console.log(err.red);
        console.log('Result: '.cyan, result);
        callback(result);
    })
}

function scrapePage(url, pageNum) {
    x(url, ['.entry-title>a@href'])((err, result) => {
        if (err) console.log(err);
        if (result) {
            result.forEach(url => {
                download(url, pageNum)
            })
        }
    })
}

function download(url, pageNum) {
    if (!fs.existsSync("books/")) {
        fs.mkdirSync("books/");
    }
    if (!fs.existsSync("books/" + category)) {
        fs.mkdirSync("books/" + category);
    }
    x(url, '.download-links>a@href')((err, result) => {

        if (err) console.log(err.code.red);
        http.get(result, (response) => {
            if (response.statusCode === 200) {
                var file = fs.createWriteStream("books/" + category + "/" + url.split('/')[3] + ".pdf");
                if (!fs.existsSync(file.path)) {
                    if (pageNum !== undefined || pageNum !== 'undefined') {
                        console.log('downloading '.blue, url, ' PAGENUM '.red, pageNum)
                    } else {
                        console.log('downloading '.blue, url)
                    }

                    response.pipe(file);
                } else {
                    console.log('File exists'.cyan);
                }
            }

        }).on('error', function(err) {
            console.log(err.code.red);
            if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
                download(url, pageNum)
                if (pageNum !== undefined || pageNum !== 'undefined') {
                    console.log('retrying '.magenta, url, ' PAGENUM '.red, pageNum.toString().blue)
                } else {
                    console.log('retrying '.magenta, url)
                }

            }

        });

    });
}
