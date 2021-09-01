const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const { redis } = require('../libs/db');
var fastcsv = require('fast-csv');

module.exports = {
    checkFile: function(folder, filename){
        try {
            let path_token = path.join('./', folder, filename);
            if (fs.existsSync(path_token)) {
                //file exists
                let obj = fs.readFileSync(path_token, 'utf8', function (err, data) {
                    if (err) throw err;
                    return data;
                });
                return JSON.parse(obj);
            } else {
                return null;
            }
        } catch (err) {
            return 0;
        }
    },
    readFile: async function(folder = 'token', filename = 'token_namnv.json'){
        try {
            var path_token = path.join('./', folder, filename);
            var obj = await fs.readFileSync(path_token, 'utf8');
            return JSON.parse(obj);
        } catch (err) {
            return 0;
        }
    },
    readFiles: function(dirname) {
        var obj = fs.readdirSync(dirname, function(err, items) {
            return items;
        });

        var files = [];
        for (var i=0; i<obj.length; i++) {
            // readFile
            var path_token = path.join('./', dirname, obj[i]);
            var objFile = fs.readFileSync(path_token, 'utf8', function (err, data) {
                if (err) throw err;
                return data;
            });
            files.push(JSON.parse(objFile));
        }

        return files;
    },
    writeFile: async function(obj, folder='token', filename='token_namnv.json'){
        const dir = path.join('./', folder);
        var path_token = path.join('./', folder, filename);
        let checkFolder = await fs.existsSync(dir);
		if (!checkFolder){
			mkdirp.sync(dir, {mode: 777});
		}
        await fs.writeFileSync(path_token, JSON.stringify(obj), 'utf8'); 
    },
    deleteFile: function(folder='token', filename='token_namnv.json'){
        var path_token = path.join('./', folder, filename);
        let resUnlinkSync = fs.unlinkSync(path_token);
        return resUnlinkSync;
    },
    writeFileSync: async function(filePath, data, pathLog, step = 0){
        try{
            let headers = (step == 0)?true:false;
            const ws = fs.createWriteStream(filePath, { flags: 'a' });
            return new Promise((resolve, reject) => {
                fastcsv
                 .write(data, { headers: headers, includeEndRowDelimiter: false, rowDelimiter: '\r\n', quote: '"', quoteColumns: true })
                 .pipe(ws)
                 .on('error', async (err) => {
                    await redis.s(pathLog, JSON.stringify(err));
                    reject();
                 })
                 .on('finish', async () => {
                     resolve();
                 });
            });
        }catch(e){
            console.log(e.stack);
            await redis.s(pathLog, e);
        }
    }
}