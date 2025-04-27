const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { BCRYPT_WORK_FACTOR } = require("../config");
const SECRET_KEY = process.env.SECRET_KEY;
const ExpressError = require("../expressError");
const Mood = require("./mood");

class User {
	constructor(username, firstName, lastName, email, isAdmin) {
		this.username = username;
		this.firstName = firstName;
		this.lastName = lastName;
		this.email = email;
		this.isAdmin = isAdmin;
	}

	// Register user to the databse. Throws error if the username already exists
	static async register({
		username,
		password,
		firstName,
		lastName,
		email,
		isAdmin = false,
	}) {
		const duplicateCheck = await db.query(
			`SELECT username FROM users WHERE username = $1`,
			[username]
		);
		if (duplicateCheck.rows[0])
			throw new ExpressError(`Username '${username}' already exists`, 403);

		const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

		const result = await db.query(
			`INSERT INTO users
            (username,
            password_hashed,
            first_name,
            last_name,
            email,
            is_admin)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
			[username, hashedPassword, firstName, lastName, email, isAdmin]
		);

		const user = result.rows[0];

		return user;
	}

	// Authenticates the user by their username and password
	static async authenticate(username, password) {
		const result = await db.query(
			`SELECT username, 
            password_hashed AS "hashedPassword",
            first_name AS "firstName",
            last_name AS "lastName",
            email,
            is_admin AS "isAdmin"
            FROM users
            WHERE username = $1`,
			[username]
		);
		const user = result.rows[0];

		if (user) {
			if (await bcrypt.compare(password, user.hashedPassword)) {
				delete user.hashedPassword;
				return user;
			}
		}

		throw new ExpressError("Invalid username/password", 401);
	}

	// Get all users from the database
	static async getAll() {
		const results = await db.query(`SELECT 
            username,
            first_name AS "firstName",
            last_name AS "lastName",
            email,
            is_admin AS "isAdmin" 
            FROM users
            ORDER BY username`);

		const users = results.rows.map(
			(u) => new User(u.username, u.firstName, u.lastName, u.email, u.isAdmin)
		);
		return users;
	}

	// Returns a User instance from the database by the username
	static async get(username) {
		const result = await db.query(
			`SELECT
            username,
            first_name AS "firstName",
            last_name AS "lastName",
            email,
            is_admin AS "isAdmin"
            FROM users
            WHERE username=$1`,
			[username]
		);

		// Throws error if the username does not exists in the database
		const user = result.rows[0];
		if (!user) throw new ExpressError("User Not Found", 404);

		return new User(
			user.username,
			user.firstName,
			user.lastName,
			user.email,
			user.isAdmin
		);
	}

	// Returns a list of moods by a given user
	static async getMoodsByUser(username) {
		const check = await db.query(
			`SELECT
            username
            FROM users
            WHERE username=$1`,
			[username]
		);
		// Throws error if the user does not exist in the database
		const user = check.rows[0];
		if (!user) throw new ExpressError("User Not Found", 404);

		const results = await db.query({
			text: `SELECT id FROM moods WHERE created_by=$1`,
			values: [username],
			rowMode: "array",
		});

		let moods = results.rows.flat();

		// Fetches the mood detail of each mood
		if (moods.length) {
			moods = await Promise.all(Array.from(moods, (id) => Mood.getMood(id)));
		}

		return moods;
	}

	// Removes a user from the database.
	// Check for user exisence is done when a User instance if called by User.get()
	// prior to calling User.remove()
	async remove() {
		await db.query(`DELETE FROM users WHERE username=$1`, [this.username]);
	}

	// Saves the updated information of a user.
	// Check for user exisence is done when a User instance if called by User.get()
	// prior to calling User.update()
	async update() {
		await db.query(
			`UPDATE users SET first_name=$1,last_name=$2,email=$3 WHERE username=$4`,
			[this.firstName, this.lastName, this.email, this.username]
		);
	}
}

module.exports = User;
