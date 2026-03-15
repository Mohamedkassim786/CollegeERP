const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Handle "Bearer <token>" robustly
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
            return res.status(401).json({ message: 'Malformed token header' });
        }

        const bearerToken = parts[1];

        const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const { ROLES } = require('../utils/constants');

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === ROLES.ADMIN) return next();
    return res.status(403).json({ message: 'Require Admin Role' });
};

const isPrincipal = (req, res, next) => {
    if (req.user && (req.user.role === ROLES.PRINCIPAL || req.user.role === ROLES.ADMIN)) return next();
    return res.status(403).json({ message: 'Require Principal Role' });
};

const isCOE = (req, res, next) => {
    if (req.user && (req.user.role === 'COE' || req.user.role === ROLES.ADMIN)) return next();
    return res.status(403).json({ message: 'Require COE Role' });
};

const isChiefSecretary = (req, res, next) => {
    if (req.user && (req.user.role === ROLES.CHIEF_SECRETARY || req.user.role === 'COE' || req.user.role === ROLES.ADMIN)) return next();
    return res.status(403).json({ message: 'Require Chief Secretary Role' });
};

const isHod = (req, res, next) => {
    if (req.user && (req.user.role === ROLES.HOD || req.user.role === ROLES.ADMIN)) return next();
    return res.status(403).json({ message: 'Require HOD Role' });
};

const isFaculty = (req, res, next) => {
    if (req.user && (req.user.role === ROLES.FACULTY || req.user.role === ROLES.HOD || req.user.role === ROLES.ADMIN)) return next();
    return res.status(403).json({ message: 'Require Faculty Role' });
};

const isExternal = (req, res, next) => {
    if (req.user && (req.user.role === ROLES.EXTERNAL || req.user.role === ROLES.ADMIN)) return next();
    return res.status(403).json({ message: 'Require External Role' });
};

const isStudent = (req, res, next) => {
    if (req.user && (req.user.role === ROLES.STUDENT || req.user.role === ROLES.ADMIN)) return next();
    return res.status(403).json({ message: 'Require Student Role' });
};

const isFirstYearCoordinator = (req, res, next) => {
    if (req.user && (req.user.role === ROLES.FIRST_YEAR_COORDINATOR || req.user.role === ROLES.ADMIN)) return next();
    return res.status(403).json({ message: 'Require First Year Coordinator Role' });
};

module.exports = { 
    verifyToken, 
    isAdmin, 
    isPrincipal, 
    isCOE, 
    isChiefSecretary, 
    isHod, 
    isFaculty, 
    isExternal, 
    isStudent,
    isFirstYearCoordinator
};
