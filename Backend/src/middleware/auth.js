const jwtLib = require('jsonwebtoken');

async function authentication(req, res, next) {

    try{
        const auth = req.headers.authorization || "";
        const token = auth.startsWith('Bearer') ? auth.slice(7) : null;

        if (!token) {
            return res.status(401).json({message: "missing access token"})
        }

        const decoded = jwtLib.verify(token, process.env.JWT_ACCESS_SECRET);

        /*
        decoded = 
        {
            user_id: 10,
            account_type: 'patient',
            iat: 1755632204,
            exp: 1755633104
        }
         */

        req.user = {
            user_id: decoded.user_id, 
            account_type: decoded.account_type
        }
        next();
    } catch(e) {
        console.log(e);
        return res.status(401).json({message: "invalid or expired access token"});
    }
}


function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({message: "unauthorized"});
        }

        if (!allowedRoles.includes(req.user.account_type)) {
            return res.status(403).json({message: "Forbidden: ROLE???"})
        }
        next();

    };
}

function isValidEmail(email) {
    return /.+@.+\..+/.test(email);
}


module.exports = {
    authentication,
    authorize,
    isValidEmail
}

