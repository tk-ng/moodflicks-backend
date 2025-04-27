const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const User = require("../models/user");
const jsonschema = require("jsonschema");
const userUpdateSchema = require("../schemas/userUpdateSchema.json");
const {
	userOrAdminOnly,
	ensureLoggedInAsAdmin,
} = require("../middleware/auth");

/** GET /users/  { } => { users }
 *
 * users: [{ username, firstName, lastName, email, isAdmin }, { ... }, ...]
 *
 * GET all users from the database.
 *
 * Authorization required: admin only
 */
router.get("/", ensureLoggedInAsAdmin, async function (req, res, next) {
	try {
		const users = await User.getAll();
		return res.json({ users });
	} catch (err) {
		next(err);
	}
});

/** GET /users/:username  { username } => { user }
 *
 * user: { username, firstName, lastName, email, isAdmin }
 *
 * GET user by username.
 *
 * Authorization required: none
 */
router.get("/:username", async function (req, res, next) {
	try {
		const { username } = req.params;
		const user = await User.get(username);
		return res.json({ user });
	} catch (err) {
		next(err);
	}
});

/** GET /users/:username/moods  { username } => { moods }
 *
 * moods: [{ id, mood, createdBy, count, totalVotes }, { ... }, ...]
 *
 * GET a user's list of moods by username.
 *
 * Authorization required: none
 */
router.get("/:username/moods", async function (req, res, next) {
	try {
		const { username } = req.params;
		const moods = await User.getMoodsByUser(username);
		return res.json({ moods });
	} catch (err) {
		next(err);
	}
});

/** PATCH /users/:username/  { username } => { user }
 *
 * user: { username, firstName, lastName, email, isAdmin }
 *
 * GET a list of moods created by a user, by username.
 *
 * Authorization required: Logged in as the user or is admin
 */
router.patch("/:username", userOrAdminOnly, async function (req, res, next) {
	try {
		const { username } = req.params;
		const user = await User.get(username);

		const validator = jsonschema.validate(req.body.data, userUpdateSchema);

		if (!validator.valid) {
			const listOfErrors = validator.errors.map((err) => err.stack);
			const error = new ExpressError(listOfErrors, 400);
			return next(error);
		}

		Object.assign(user, req.body.data);
		await user.update();
		return res.json({ user });
	} catch (err) {
		next(err);
	}
});

/** DELETE /users/:username/  { username } => { message: "user removed" }
 *
 * DELETE a user, by username.
 *
 * Authorization required: Logged in as the user or is admin
 */
router.delete("/:username", userOrAdminOnly, async function (req, res, next) {
	try {
		const { username } = req.params;
		const user = await User.get(username);
		await user.remove();
		return res.json({ message: "user removed" });
	} catch (err) {
		next(err);
	}
});

module.exports = router;
