var fs = require('fs');

fs.readdir('./books/programming', (err, files) => {
    console.log(files.length);
});

console.log(1440);