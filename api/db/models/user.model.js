const mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');


// JWT Secreto
const jwtSecret = "51778657246321226641fsdklafjasdkljfsklfjd7148924065";

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    sessions: [{
        token: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Number,
            required: true
        }
    }]
});


// *** Metodos de usuario instanciados ***

UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    // Regresa el documento excepto la sesion y la contraseña (eso no se debe mostrar)
    return _.omit(userObject, ['password', 'sessions']);
}

UserSchema.methods.generateAccessAuthToken = function () {
    const user = this;
    return new Promise((resolve, reject) => {
        // Crea el JSON Web Token y lo retorna
        jwt.sign({ _id: user._id.toHexString() }, jwtSecret, { expiresIn: "15m" }, (err, token) => {
            if (!err) {
                resolve(token);
            } else {
                // Si hay error
                reject();
            }
        })
    })
}

UserSchema.methods.generateRefreshAuthToken = function () {
    // Genera una cadeta de 64 bytes en hexadecimal 
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (!err) {
                // Si no hay error
                let token = buf.toString('hex');

                return resolve(token);
            }
        })
    })
}

UserSchema.methods.createSession = function () {
    let user = this;

    return user.generateRefreshAuthToken().then((refreshToken) => {
        return saveSessionToDatabase(user, refreshToken);
    }).then((refreshToken) => {
        // Guardado correctamente en bd
        // Regresa el refresh token
        return refreshToken;
    }).catch((e) => {
        return Promise.reject('Error al guardar en db.\n' + e);
    })
}


/* MODEL METHODS (metodos estaticos) */

UserSchema.statics.getJWTSecret = () => {
    return jwtSecret;
}



UserSchema.statics.findByIdAndToken = function (_id, token) {
    // Encuentra usuario por id y token
    // usado en auth middleware (verifySession)

    const User = this;

    return User.findOne({
        _id,
        'sessions.token': token
    });
}


UserSchema.statics.findByCredentials = function (email, password) {
    let User = this;
    return User.findOne({ email }).then((user) => {
        if (!user) {
            return Promise.reject();
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    resolve(user);
                }
                else {
                    reject();
                    console.log("contraseña incorrecta")
                }
            })
        })
    })
}

UserSchema.statics.hasRefreshTokenExpired = (expiresAt) => {
    let secondsSinceEpoch = Date.now() / 1000;
    if (expiresAt > secondsSinceEpoch) {
        // no a expirado
        return false;
    } else {
        // a expirado
        return true;
    }
}


/* MIDDLEWARE */
// Antes de guardar el documento de usuario se corre esto
UserSchema.pre('save', function (next) {
    let user = this;
    let costFactor = 10;

    if (user.isModified('password')) {
        // Crea salt de cotraseña y la hashea
        bcrypt.genSalt(costFactor, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            })
        })
    } else {
        next();
    }
});


/* HELPER METHODS */
let saveSessionToDatabase = (user, refreshToken) => {
    // Guarda sesion en db
    return new Promise((resolve, reject) => {
        let expiresAt = generateRefreshTokenExpiryTime();

        user.sessions.push({ 'token': refreshToken, expiresAt });

        user.save().then(() => {
            // guardado correctamente
            return resolve(refreshToken);
        }).catch((e) => {
            reject(e);
        });
    })
}

let generateRefreshTokenExpiryTime = () => {
    let daysUntilExpire = "10";
    let secondsUntilExpire = ((daysUntilExpire * 24) * 60) * 60;
    return ((Date.now() / 1000) + secondsUntilExpire);
}

const User = mongoose.model('User', UserSchema);

module.exports = { User }