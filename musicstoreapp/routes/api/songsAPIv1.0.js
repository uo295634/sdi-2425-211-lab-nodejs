const {ObjectId} = require("mongodb");
module.exports = function (app, songsRepository, usersRepository) {
    app.get("/api/v1.0/songs", function (req, res) {
        let filter = {};
        let options = {};
        songsRepository.getSongs(filter, options).then(songs => {
            res.status(200);
            res.send({songs: songs})
        }).catch(error => {
            res.status(500);
            res.json({ error: "Se ha producido un error al recuperar las canciones." })
        });
    });
    app.get("/api/v1.0/songs/:id", function (req, res) {
        try {
            let songId = new ObjectId(req.params.id)
            let filter = {_id: songId};
            let options = {};
            songsRepository.findSong(filter, options).then(song => {
                if (song === null) {
                    res.status(404);
                    res.json({error: "ID inválido o no existe"})
                } else {
                    res.status(200);
                    res.json({song: song})
                }
            }).catch(error => {
                res.status(500);
                res.json({error: "Se ha producido un error a recuperar la canción."})
            });
        } catch (e) {
            res.status(500);
            res.json({error: "Se ha producido un error :" + e})
        }
    });
    app.delete('/api/v1.0/songs/:id', function (req, res) {
        try {
            let songIdString = req.params.id;

            // Validar si el ID tiene formato correcto (24 caracteres hexadecimales)
            if (!ObjectId.isValid(songIdString)) {
                return res.status(400).json({ error: "El ID proporcionado no es válido." });
            }

            let songId = new ObjectId(songIdString);
            let filter = { _id: songId };

            isUserAuthorOf(req.user, songId).then(isAuthor => {
                if (isAuthor) {
                    songsRepository.deleteSong(filter, {}).then(result => {
                        if (result === null || result.deletedCount === 0) {
                            res.status(404).json({ error: "ID inválido o no existe, no se ha borrado el registro." });
                        } else {
                            res.status(200).json({ message: "Canción eliminada correctamente.", result });
                        }
                    }).catch(error => {
                        console.error("Error al eliminar canción:", error);
                        res.status(500).json({ error: "Se ha producido un error al eliminar la canción." });
                    });
                } else {
                    res.status(403).json({ error: "El usuario logueado no es el autor de la canción que se intenta eliminar." });
                }
            }).catch(error => {
                console.error("Error al verificar autor:", error);
                res.status(500).json({ error: "Se ha producido un error al verificar el autor de la canción." });
            });

        } catch (e) {
            console.error("Error en el DELETE:", e);  // Para ver detalles del error en el servidor
            res.status(500).json({ error: "Se ha producido un error interno." });
        }
    });

    app.post('/api/v1.0/songs', function (req, res) {
        try {
            let song = {
                title: req.body.title,
                kind: req.body.kind,
                price: req.body.price,
                author: res.user
            }
            // Validar aquí: título, género, precio y autor.
            validateInsertSong(song, function (errors){
                if(errors !== null && errors.length > 0){
                    res.status(422);
                    res.json({errors:errors});
                }else{
                    songsRepository.insertSong(song, function (songId) {
                        if (songId === null) {
                            res.status(409);
                            res.json({error: "No se ha podido crear la canción. El recurso ya existe."});
                        } else {
                            res.status(201);
                            res.json({
                                message: "Canción añadida correctamente.",
                                _id: songId
                            })
                        }
                    });
                }
            })
        } catch (e) {
            res.status(500);
            res.json({error: "Se ha producido un error al intentar crear la canción: " + e})
        }
    }) ;

    app.put('/api/v1.0/songs/:id', function (req, res) {
        try {
            let songId = new ObjectId(req.params.id);
            let filter = {_id: songId};
            //Si la _id NO no existe, no crea un nuevo documento.
            const options = {upsert: false};
            let song = {
                author: req.session.user
            }
            if (typeof req.body.title !== "undefined" && req.body.title !== null)
                song.title = req.body.title;
            if (typeof req.body.kind !== "undefined" && req.body.kind !== null)
                song.kind = req.body.kind;
            if (typeof req.body.price !== "undefined" && req.body.price !== null)
                song.price = req.body.price;
            songsRepository.updateSong(song, filter, options).then(result => {
                if (result === null) {
                    res.status(404);
                    res.json({error: "ID inválido o no existe, no se ha actualizado la canción."});
                }
                //La _id No existe o los datos enviados no difieren de los ya almacenados.
                else if (result.modifiedCount == 0) {
                    res.status(409);
                    res.json({error: "No se ha modificado ninguna canción."});
                }
                else{
                    res.status(200);
                    res.json({
                        message: "Canción modificada correctamente.",
                        result: result
                    })
                }
            }).catch(error => {
                res.status(500);
                res.json({error : "Se ha producido un error al modificar la canción."})
            });
        } catch (e) {
            res.status(500);
            res.json({error: "Se ha producido un error al intentar modificar la canción: "+ e})
        }
    });
    app.post('/api/v1.0/users/login',function (req,res){
        try{
            let securePassword = app.get("crypto").createHmac('sha256',app.get('clave'))
                .update(req.body.password).digest('hex');
            let filter = {
                email: req.body.email,
                password: securePassword
            }
            let options = {}
            usersRepository.findUser(filter, options).then(user=> {
                if(user ==null){
                    res.status(401);//Unauthorized
                    res.json({
                        message:"usuario no autorizado",
                        authenticated:false
                    })

                }else{
                    let token = app.get('jwt').sign(
                        {
                            user:user.email, time:Date.now()/1000
                        },"secreto");
                    res.status(200);
                    res.json({
                        message: "usuario autorizado",
                        authenticated:true,
                        token:token
                        })
                }
            }).catch(error =>{
                res.status(401);
                res.json({
                    message:"Se ha producido un error al verificar credenciales",
                    authenticated: false
                })
            })
    }catch(e){
        res.status(500);
        res.json({
            message:"Se ha producido un error al verificar credenciales",
            authenticated:false
        })
    }
});

    function validateInsertSong(song, callback){
        let errors = [];
        if(song.title === null || typeof song.title === 'undefined' || song.title.trim().toString().length === 0){
            errors.push({
                "value": song.title,
                "message": "El titulo no puede estar vacio",
                "param": "title",
                "location": "body"
            });
        }
        if (song.price === null || typeof song.price === 'undefined' || song.price < 0 || song.price === '') {
            errors.push({
                "value": song.price,
                "message": 'El precio debe ser positivo.',
                "param": "price",
                "location": "body"
            });
        }
        if(song.kind === null || typeof song.kind === 'undefined' || song.kind.trim().toString().length === 0){
            errors.push({
                "value": song.kind,
                "message": "El genero no puede estar vacío",
                "param": "kind",
                "location": "body"
            });
        }
        if(errors.length === 0){
            callback(null);
        }else{
            callback(errors);
        }
    }

    async function isUserAuthorOf(user, songId) {
        let filter = {song_id: songId, 'author': user};
        let options ={};
        let songs = await songsRepository.getSongs(filter, options);
        return songs !== null && songs.length > 0;
    }
}