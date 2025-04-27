const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");

let testUserToken;
let testUserId;
let testMoodId;
const testMovieIds = [27205, 343611, 157336]; // Commonly used movie id for TMDB

async function commonBeforeAll() {
	// Clear existing data
	await db.query("DELETE FROM mood_ratings");
	await db.query("DELETE FROM movies_moods");
	await db.query("DELETE FROM moods");
	await db.query("DELETE FROM users");

	// Create test user
	const hashedPassword = await bcrypt.hash("password", BCRYPT_WORK_FACTOR);
	const user1Res = await db.query(
		`
    INSERT INTO users (username, password_hashed, email, first_name, last_name)
    VALUES ('testuser', $1, 'testuser@example.com', 'Test', 'User 1')
    RETURNING username`,
		[hashedPassword]
	);

	const user2Res = await db.query(
		`
    INSERT INTO users (username, password_hashed, email, first_name, last_name, is_admin)
    VALUES ('testuser2', $1, 'testuser2@example.com', 'Test', 'User 2', true)
    RETURNING username`,
		[hashedPassword]
	);

	testUsername = user1Res.rows[0].username;

	// Generate token for test user
	testUserToken = jwt.sign(
		{ username: testUsername, isAdmin: false },
		SECRET_KEY
	);

	// Generate token for test admin
	testAdminToken = jwt.sign(
		{ username: "testuser2", isAdmin: true },
		SECRET_KEY
	);

	// Create test mood
	const moodRes = await db.query(
		`
    INSERT INTO moods (created_by, mood)
    VALUES ($1, 'happy vibes')
    RETURNING id`,
		[testUsername]
	);

	testMoodId = moodRes.rows[0].id;

	// Add movie into mood
	await db.query(
		"INSERT INTO movies_moods (movie_id, mood_id) VALUES ($1, $2)",
		[testMovieIds[0], testMoodId]
	);
}

async function commonBeforeEach() {
	await db.query("BEGIN");
}

async function commonAfterEach() {
	await db.query("ROLLBACK");
}

async function commonAfterAll() {
	await db.end();
}

function getTestMoodId() {
	return testMoodId;
}

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testUserToken,
	testUserId,
	getTestMoodId,
	testMovieIds,
};
