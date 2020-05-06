const passport = require("passport");
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const { isProduction } = require("../helpers/utils");
const { login: loginConfig, mongo: mongoConfig } = require("../helpers/config");
const { getDB } = require("./db");
const { discordStrategy, discordSerialize, discordDeserialize } = require('../auth/discord.js');
const refresh = require('passport-oauth2-refresh');

function setupLogin(app) {
    const sessionOptions = {
        secret: loginConfig.session_secret,
        resave: false,
        saveUninitialized: true,
        name: loginConfig.cookie_name,
        rolling: true, // reset cookie expiry every request
        cookie: {
            secure: isProduction(),
            maxAge: loginConfig.cookie_maxage
        },
        store: new MongoStore({
            client: getDB().client,
            db_name: mongoConfig.db_name,
            collection: mongoConfig.collections.sessions
        })
    };

    // setup login strategy
    passport.use(discordStrategy);
    refresh.use(discordStrategy);
    passport.serializeUser(discordSerialize);
    passport.deserializeUser(discordDeserialize);

    // trust first proxy
    if (isProduction()) {
        app.set('trust proxy', 1);
    }

    // setup express middleware
    app.use(session(sessionOptions));
    app.use(passport.initialize());
    app.use(passport.session());
}

module.exports = {
    setupLogin
};
