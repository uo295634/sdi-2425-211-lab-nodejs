const {ObjectId} = require("mongodb");

module.exports = function(app, songsRepository,favoriteSongsRepository) {
    app.get('/songs/favorites', function (req, res) {
        let filter = {user : req.session.user};
        let options = {sort: { title: 1}};
        favoriteSongsRepository.getFavoritesSongs(filter, options).then(songs => {
            let totalPrice = songs.reduce((sum, song) => sum + (parseFloat(song.price) || 0), 0);
            res.render("favorites.twig", {
                songs: songs,
                totalPrice: totalPrice
            });
        }).catch(error => {
            res.send("Se ha producido un error al listar las canciones " + error)
        });
    });
    app.get('/songs/favorites/delete/:id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        favoriteSongsRepository.deleteFavoriteSong(filter, {}).then(result => {
            if (result === null || result.deletedCount === 0) {
                res.send("No se ha podido eliminar el registro");
            } else {
                res.redirect("/songs/favorites");
            }
        }).catch(error => {
            res.send("Se ha producido un error al intentar eliminar la canción: " + error)
        });
    });
    app.post('/songs/favorites/add/:id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        let favsong;
        songsRepository.findSong(filter, {}).then(song => {
            if (song == null) {
                return res.send("Canción no encontrada");
            }
            let songInsert = {
                song_id: req.params.id,
                title: song.title,
                price: song.price,
                date: new Date().toISOString(),
                user: req.session.user
            };

            favoriteSongsRepository.insertFavoriteSong(songInsert, function (err, result) {
                res.send("Agregada a favoritos la canción ID: " + req.params.id);
            });
        }).catch(err => {
            res.send("Error al buscar la canción: " + err);
        });
    });

}