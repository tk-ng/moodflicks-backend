const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

// Generates token to be returned as JSON
function createToken(user) {
	const payload = {
		username: user.username,
		isAdmin: user.isAdmin || false,
	};

	return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };
