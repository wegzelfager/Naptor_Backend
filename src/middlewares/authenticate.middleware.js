
const jwt = require('jsonwebtoken');
const env = require('../config/env')
const userRepo = require('../repositories/user.repository');
const redisClient = require('../config/redis')
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            const error = new Error('Not authorized to access this route')
            error.statusCode = 401;
            return next(error);
        }

        console.log(" Checking Token:", token.substring(0, 15) + "...");
        console.log(" env object:", env);
        const decoded = jwt.verify(token, env.jwtAccessSecret);
        const cacheKey = `user:${decoded.id}`;


        const cachedUser = await redisClient.get(cacheKey);

        if (cachedUser) {

            req.user = JSON.parse(cachedUser);
            return next();
        }

        const currentUser = await userRepo.findById(decoded.id);
        if (!currentUser) {
            const error = new Error('The user belonging to this token no longer exists');
            error.statusCode = 401;
            return next(error);
        }


        await redisClient.set(cacheKey, JSON.stringify(currentUser), {
            EX: 3600
        });

        req.user = currentUser;
        next();

    } catch (error) {
        const authError = new Error(`Not authorized, token failed: ${error.message}`);
        authError.statusCode = 401;
        next(authError);
    }
}

module.exports = { protect };