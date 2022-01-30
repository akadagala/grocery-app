const bcrypt = require('bcrypt');
const passport = require('passport');

module.exports = {
    generatePassword: (password) => {
        return new Promise((resolve, reject) => {
            let pass_info = {};
        bcrypt.genSalt(10, function(err, salt) {
            if(err) reject(err);
            bcrypt.hash(password, salt, function(err, hash) {
                if(err) reject(err);
                console.log("SALT: " + salt);
                console.log("HASH: " + hash);
                pass_info.salt = salt;
                pass_info.hash = hash;
                resolve(pass_info);
            });
        });
        })
        
    }
}