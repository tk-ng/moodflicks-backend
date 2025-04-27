const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const User = require("../models/user");
const jsonschema = require("jsonschema");
const userRegisterSchema = require("../schemas/userRegisterSchema.json");
const userAuthSchema = require("../schemas/userAuthSchema.json");
const { createToken } = require("../helpers/tokens");

/** POST /auth/register:  { username, password, firstName, lastName, email  } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */
router.post("/register", async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, userRegisterSchema);

		if (!validator.valid) {
			const listOfErrors = validator.errors.map((err) => err.stack);
			throw new ExpressError(listOfErrors, 400);
		}

		const newUser = await User.register({ ...req.body, isAdmin: false });
		const token = createToken(newUser);
		return res.status(201).json({ token });
	} catch (err) {
		next(err);
	}
});

/** POST /auth/token:  { username, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */
router.post("/token", async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, userAuthSchema);
		if (!validator.valid) {
			const listOfErrors = validator.errors.map((err) => err.stack);
			throw new ExpressError(listOfErrors, 400);
		}

		const { username, password } = req.body;
		const user = await User.authenticate(username, password);
		const token = createToken(user);
		return res.json({ token });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
