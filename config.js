const config = {
    site_port: 5000,
    database_file: "groceries_app.db",
    secret: process.env.SECRET != null ? process.env.SECRET : "fakesecret"
}

module.exports = config;