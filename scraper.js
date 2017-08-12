var Xray = require('x-ray');
var x = Xray();
var fs = require('fs');
var colors = require('colors');
var path = require('path');
var request = require('request');

const argv = require('yargs')
    .option('category', {
        alias: 'c',
        demand: true,
        describe: 'Book Category',
        type: 'string'
    }).help('help').argv

var category = argv.c.split(' ').join('-');
var mainPage = 'http://www.allitebooks.com/' + category;
var scheduledDownloads = [];

// Scrape the first page of the category
scrapePage(mainPage, 1);
// Then scrape all the other pages of the category
loopThroughPages(mainPage);

function loopThroughPages(url) {
    x(url, ['a[title="Last Page →"]'])((err, result) => {
        if (err) console.log(err.red);
        console.log('Scraping '.magenta, result[0].magenta, ' pages\n'.magenta);
        setTimeout(() => {
            // Waiting 2 seconds to make sure the number of pages is not undefined
            var numOfPages = +(result[0]);
            // After getting total number of pages, loop through every page
            for (var pageNum = 2; pageNum <= numOfPages; pageNum++) {
                scrapePage(mainPage + '/page/' + pageNum, pageNum);
            }
            // After the loop has started adding books to scheduledDownloads, start downloading the first book in the array
            download(0);
        }, 2000)
    })
}

function scrapePage(url, pageNum) {
    // Get all the books on the page and push their hrefs to scheduledDownloads
    x(url, ['.entry-title>a@href'])((err, result) => {
        if (err) console.log(err);
        if (result) {
            result.forEach(url => {
                scheduledDownloads.push({ url, pageNum });
                //download(url, pageNum)
            })
        }
    })
}

function download(index) {
    // Download the book with this index in the scheduledDownloads array 
    if (index < scheduledDownloads.length) {
        var url = scheduledDownloads[index].url;
        var pageNum = scheduledDownloads[index].pageNum;

        if (!fs.existsSync("books/")) {
            fs.mkdirSync("books/");
        }
        if (!fs.existsSync("books/" + category)) {
            fs.mkdirSync("books/" + category);
        }
        x(url, '.download-links>a@href')((err, result) => {
            if (err) console.log(err.red);
            var file = fs.createWriteStream("books/" + category + "/" + url.split('/')[3] + ".pdf");

            if (!fs.existsSync(file.path)) {
                console.log('downloading '.blue, url, ' PAGENUM '.red, pageNum)
                request.get(result)
                    .on('error', function(err) {
                        console.log(err.code.red);
                        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
                            console.log('retrying '.magenta, url, ' PAGENUM '.red, pageNum);
                            return download(index);
                        }
                    })
                    .pipe(file)
                    .on('finish', function() {
                        // Once the download is finished, proceed to downloading the next book in scheduledDownloads
                        return download(index + 1);
                    });
            } else {
                console.log('File exists: '.cyan + url);
                download(index + 1);
            }

        });
    } else {
        return console.log('\nAll downloads have been completed.'.magenta);
    }
}
