const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../expressError");

// verify the token if provided and store the payload (username and isAdmin)
// on res.locals
function authenticateJWT(req, res, next) {
	try {
		const authHeader = req.headers?.authorization;
		if (authHeader) {
			const token = authHeader.replace(/^[Bb]earer /, "").trim();
			res.locals.user = jwt.verify(token, SECRET_KEY);
		}
		return next();
	} catch (err) {
		return next();
	}
}

// Return 'Unauthorized Access' error if the user is not logged in
function ensureLoggedIn(req, res, next) {
	try {
		if (!res.locals.user) throw new ExpressError("Unauthorized access", 401);
		return next();
	} catch (err) {
		return next(err);
	}
}

// Return 'Unauthorized Access' error if the user is not logged in or no an admin
function ensureLoggedInAsAdmin(req, res, next) {
	try {
		if (!res.locals.user || !res.locals.user.isAdmin) {
			throw new ExpressError("Unauthorized access", 401);
		}
		return next();
	} catch (err) {
		return next(err);
	}
}

// Verify a valid token was provided and that the user matches the username provided or is an admin
function userOrAdminOnly(req, res, next) {
	try {
		const user = res.locals.user;
		if (!(user && (user.isAdmin || user.username === req.body.username))) {
			throw new ExpressError("Unauthorized access", 401);
		}
		return next();
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	authenticateJWT,
	ensureLoggedIn,
	ensureLoggedInAsAdmin,
	userOrAdminOnly,
};
