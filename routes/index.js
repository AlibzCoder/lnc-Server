module.exports = app =>{
    app.use(require('./auth'));
    app.use(require('./user_info'));
}