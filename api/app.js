const express = require('express');
const app = express();

const { mongoose } = require('./db/mongoose');

const bodyParser = require('body-parser');

// Carga los modelos de mongoose
const { List, Task, User } = require('./db/models');

const jwt = require('jsonwebtoken');


/* MIDDLEWARE  */

// Carga middleware
app.use(bodyParser.json());


// CORS HEADERS MIDDLEWARE
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});

// checa cualquier request que tenga un JWT access valido
let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');

    // veridica el JWT
    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if (err) {
            // si hay error
            // jwt es invalido - * NO AUTENTICA *
            res.status(401).send(err);
        } else {
            // jwt es valido
            req.user_id = decoded._id;
            next();
        }
    });
}

// Verifica el refresh token middleware (es el que estara verificando la sesion)
let verifySession = (req, res, next) => {
    // toma el refresh token del header request
    let refreshToken = req.header('x-refresh-token');

    // toma el _id del header request
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            // el usuario no se encotnro
            return Promise.reject({
                'error': 'Usuario no encontrado. Verifica que el refresh token y el _id de usuario sean validos.'
            });
        }


        // Si el código llega aquí, el usuario fue encontrado.
        // Entonces, el refresh token existe en la base de datos, pero todavía tenemos que verificar si ha caducado o no

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                // checa si el token expiro
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    // sin expirar
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            // la sesion es VALIDA - llama el next() para continuar el proceso del web request
            next();
        } else {
            // la sesion no es valida
            return Promise.reject({
                'error': 'Refresh token invalido o la sesion esta expirada'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}

/* FIN MIDDLEWARE  */




/* RUTAS */

/* RUTAS DE LSIT */

/**
 * GET /lists
 * Proposito: obtener todas las listas
 */
app.get('/lists', authenticate, (req, res) => {
    // Queremos que nos regrese un arreglo de las lsitas que tiene el usuario autenticado
    List.find({
        _userId: req.user_id
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

app.get('/listsDate', authenticate, (req, res) => {
    // Queremos que nos regrese un arreglo de las lsitas que tiene el usuario autenticado
    List.find({
        _userId: req.user_id
    }).sort({
        date: 1
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

app.get('/listsDateNewest', authenticate, (req, res) => {
    // Queremos que nos regrese un arreglo de las lsitas que tiene el usuario autenticado
    List.find({
        _userId: req.user_id
    }).sort({
        date: -1
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

app.get('/listsAlphaa', authenticate, (req, res) => {
    // Queremos que nos regrese un arreglo de las lsitas que tiene el usuario autenticado
    List.find({
        _userId: req.user_id
    }).sort({
        title: 1
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

/**
 * POST /lists
 * Proposito: crear una lista
 */
app.post('/lists', authenticate, (req, res) => {
    // Queremos crear una nueva lista y devolver el nuevo documento de la lista al usuario (que incluye el ID)
    // La información de la lista (campos) se pasará a través del JSON request body
    let title = req.body.title;

    let newList = new List({
        title,
        _userId: req.user_id
    });
    newList.save().then((listDoc) => {
        // El documento completo
        res.send(listDoc);
    })
});

/**
 * PATCH /lists/:id
 * Proposito: actualizar una lista especifica
 */
app.patch('/lists/:id', authenticate, (req, res) => {
    // Queremos actualizar la lista especificada (documento de lista con id en la URL) con los nuevos valores especificados en el JSON body
    List.findOneAndUpdate({ _id: req.params.id, _userId: req.user_id }, {
        $set: req.body
    }).then(() => {
        res.send({ 'message': 'actualizada correctamente' });
    });
});

/**
 * DELETE /lists/:id
 * Proposito: eliminar lista
 */
app.delete('/lists/:id', authenticate, (req, res) => {
    // Queremos eliminar la lista especificada (documento con ID en la URL)
    List.findOneAndRemove({
        _id: req.params.id,
        _userId: req.user_id
    }).then((removedListDoc) => {
        res.send(removedListDoc);
        // elimina todas las tareas que están en la lista eliminada
        deleteTasksFromList(removedListDoc._id);
    })
});


/**
 * GET /lists/:listId/tasks
 * Proposito: obtener todas las tareas en una lista específica
 */
app.get('/lists/:listId/tasks', authenticate, (req, res) => {
    // Queremos devolver todas las tareas que pertenecen a una lista específica (especificada por listId)
    Task.find({
        _listId: req.params.listId
    }).then((tasks) => {
        res.send(tasks);
    })
});

app.get('/lists/:listId/tasksDate', authenticate, (req, res) => {
    // Queremos devolver todas las tareas que pertenecen a una lista específica (especificada por listId)
    Task.find({
        _listId: req.params.listId
    }).sort({
        date: 1
    }).then((tasks) => {
        res.send(tasks);
    })
});

app.get('/lists/:listId/tasksNewest', authenticate, (req, res) => {
    // Queremos devolver todas las tareas que pertenecen a una lista específica (especificada por listId)
    Task.find({
        _listId: req.params.listId
    }).sort({
        date: -1
    }).then((tasks) => {
        res.send(tasks);
    })
});

app.get('/lists/:listId/tasksAlphaa', authenticate, (req, res) => {
    // Queremos devolver todas las tareas que pertenecen a una lista específica (especificada por listId)
    Task.find({
        _listId: req.params.listId
    }).sort({
        title: 1
    }).then((tasks) => {
        res.send(tasks);
    })
});


/**
 * POST /lists/:listId/tasks
 * Proposito: Crear una nueva tarea en una lista específica
 */
app.post('/lists/:listId/tasks', authenticate, (req, res) => {
    // Queremos crear una nueva tarea en una lista especificada por listId

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            // se encontró el objeto de lista con las condiciones especificadas
            // por lo tanto, el usuario actualmente autenticado puede crear nuevas tareas
            return true;
        }

        // else - el objeto de la lista no esta definido
        return false;
    }).then((canCreateTask) => {
        if (canCreateTask) {
            let newTask = new Task({
                title: req.body.title,
                _listId: req.params.listId
            });
            newTask.save().then((newTaskDoc) => {
                res.send(newTaskDoc);
            })
        } else {
            res.sendStatus(404);
        }
    })
})

/**
 * PATCH /lists/:listId/tasks/:taskId
 * Proposito: Actualizar una tarea existente
 */
app.patch('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
    // Queremos actualizar una tarea existente (especificada por taskId

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            // se encontró el objeto de lista con las condiciones especificadas
            // por lo tanto, el usuario autenticado actualmente puede hacer actualizaciones a las tareas dentro de esta lista
            return true;
        }

        // else - el objetio lsita no esta definido
        return false;
    }).then((canUpdateTasks) => {
        if (canUpdateTasks) {
            //el usuario actual autenticado podra actualizar
            Task.findOneAndUpdate({
                _id: req.params.taskId,
                _listId: req.params.listId
            }, {
                    $set: req.body
                }
            ).then(() => {
                res.send({ message: 'Actualizado correcto.' })
            })
        } else {
            res.sendStatus(404);
        }
    })
});

/**
 * DELETE /lists/:listId/tasks/:taskId
 * PProposito: borrar tarea
 */
app.delete('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            // se encontró el objeto de lista con las condiciones especificadas
            // por lo tanto, el usuario autenticado actualmente puede hacer actualizaciones a las tareas dentro de esta lista
            return true;
        }

        // else - el objeto lista no esta definido
        return false;
    }).then((canDeleteTasks) => {

        if (canDeleteTasks) {
            Task.findOneAndRemove({
                _id: req.params.taskId,
                _listId: req.params.listId
            }).then((removedTaskDoc) => {
                res.send(removedTaskDoc);
            })
        } else {
            res.sendStatus(404);
        }
    });
});



/* USER RUTAS */

/**
 * DELETE /users/session
 * Proposito: Cerrar sesión (eliminar una sesión de la base de datos)
 */
app.delete('/users/session', verifySession, (req, res) => {
    let userId = req.user_id;
    let refreshToken = req.refreshToken; // el token que queremos tumbar
    User.findOneAndUpdate({
        _id: userId
    }, {
            $pull: {
                sessions: {
                    token: refreshToken
                }
            }
        }).then(() => {
            console.log("Sesion removida");
            res.send();
        })
})

/**
 * POST /users
 * Proposito: registrarse
 */
app.post('/users', (req, res) => {
    // Registro de usuario

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        // Sesión creada correctamente - refreshToken devuelto.
        // ahora generamos un access auth token para el usuario

        return newUser.generateAccessAuthToken().then((accessToken) => {
            // access auth token generado correctamente, ahora regresamos un objeto con los auth tokens
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        // Ahora construimos y enviamos la respuesta al usuario con sus tokens de autenticación en el encabezado y el objeto de usuario en el cuerpo.
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})

/**
 * POST /users/login
 * Proposito: Login
 */
app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            // Sesión creada correctamente - refreshToken devuelto.
            // ahora generamos un token de autenticación de acceso para el usuario

            return user.generateAccessAuthToken().then((accessToken) => {
                // access auth token generado con éxito, ahora devolvemos un objeto que contiene los tokens de autenticación
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            // Ahora construimos y enviamos la respuesta al usuario con sus tokens de autenticación en el encabezado y el objeto de usuario en el cuerpo.
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})


/**
 * GET /users/me/access-token
 * Proposito: genera y regresa un access token
 */
app.get('/users/me/access-token', verifySession, (req, res) => {
    //Confirmamos que el usuario esta autenticado, regresamos el objeto de usuario
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})



/* HELPER METHODS */
let deleteTasksFromList = (_listId) => {
    Task.deleteMany({
        _listId
    }).then(() => {
        console.log("Tareas de " + _listId + " borradas!");
    })
}

app.listen(3000, () => {
    console.log("Server corriendo en el puerto 3000");
})

