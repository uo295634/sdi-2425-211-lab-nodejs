module.exports = function(app, twig) {

    let authors = [{
        "name": "Kase O",
        "group": "VV",
        "role": "cantante"
    }, {
        "name": "Henry William",
        "group": "Metalica",
        "role": "saxofonista"
    }, {
        "name": "Mark Ruffalo",
        "group": "Iron Man",
        "role": "violinista"
    }, {
        "name": "Zach Erick",
        "group": "Los 4",
        "role": "pianista"
    }];

    app.get("/authors/add", function (req, res) {
        let roles = [{
            "name": "Cantante",
            "value": "cantante"
        },{
            "name": "Violinista",
            "value": "violinista"
        },{
            "name": "Trompetista",
            "value": "trompetista"
        },{
            "name": "Saxofonista",
            "value": "saxofonista"
        },{
            "name": "Pianista",
            "value": "pianista"
        }];

        let response = {
            roles: roles
        };

        res.render("authors/add.twig", response);
    });

    app.get('/authors', function (req, res) {

        let response = {
            seller: "Autores",
            authors: authors
        };
        res.render("authors/authors.twig", response);
    });

    app.post('/authors/add', function(req, res) {
        let response = "";
        if(typeof(req.body.name) != "undefined" && req.body.name != null && req.body.name.trim() != ""){
            response += "Nombre autor: " + req.body.name + "<br>";
        }else{
            response += "Nombre no enviado en la petición." + "<br>";
        }
        if(typeof(req.body.group) != "undefined" && req.body.group != null  && req.body.group.trim() != ""){
            response += "Grupo autor: " + req.body.group + "<br>";
        }else{
            response += "Grupo no enviado en la petición." + "<br>";
        }
        if(typeof(req.body.role) !== "undefined" && req.body.role != null && req.body.role.trim() != "") {
            response += "Rol autor: " + req.body.role + "<br>";
        }else{
            response += "Rol no enviado en la petición." + "<br>";
        }
        res.send(response);
    });
    app.get("/authors/filter/:role", function (req, res) {
        let response = {
            seller: "Autores",
            authors: authors.filter(author => author.role.toLowerCase().trim() === req.params.role.toLowerCase().trim())
        };
        res.render("authors/authors.twig", response);
    });
    app.get("/authors/*", function (req, res) {
        res.redirect("/authors");
    });
    app.get("/author*", function (req, res) {
        res.redirect("/authors");
    });

}