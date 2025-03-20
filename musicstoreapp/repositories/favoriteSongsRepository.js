module.exports = {
    mongoClient: null,
    app: null,
    database: "musicStore",
    collectionName: "favorites_songs",
    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },
    getFavoritesSongs: async function (filter, options) {
    try {
        await this.dbClient.connect();
        const database = this.dbClient.db(this.database);
        const favSongsCollection = database.collection(this.collectionName);
        const songs = await favSongsCollection.find(filter, options).toArray();
        return songs;
    } catch (error) {
        throw (error);
    }
    },
    findSong: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const favSongsCollection = database.collection(this.collectionName);
            const song = await favSongsCollection.findOne(filter, options);
            return song;
        } catch (error) {
            throw (error);
        }
    },
    insertFavoriteSong: function (song, callbackFunction) {
        this.dbClient.connect()
            .then(() => {
                const database = this.dbClient.db(this.database);
                const favSongsCollection = database.collection(this.collectionName);
                favSongsCollection.insertOne(song)
                    .then(result => callbackFunction({songId: result.insertedId}))
                    .then(() => this.dbClient.close())
                    .catch(err => callbackFunction({error: err.message}));
            })
            .catch(err => callbackFunction({error: err.message}))
    }
};