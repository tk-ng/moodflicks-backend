"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Mood = require("../models/mood");
const Movie = require("../models/movie");
const { createToken } = require("../helpers/tokens");

const testMovieIds = [27205, 343611, 157336]; // Commonly used movie id for TMDB
const testMoodIds = [];

async function commonBeforeAll() {
	// Clear existing data
	await db.query("DELETE FROM mood_ratings");
	await db.query("DELETE FROM movies_moods");
	await db.query("DELETE FROM moods");
	await db.query("DELETE FROM users");

	await User.register({
		username: "testuser1",
		firstName: "U1F",
		lastName: "U1L",
		email: "user1@user.com",
		password: "password",
		isAdmin: false,
	});

	await User.register({
		username: "testuser2",
		firstName: "U2F",
		lastName: "U2L",
		email: "user2@user.com",
		password: "password",
		isAdmin: false,
	});

	await User.register({
		username: "testuser3",
		firstName: "U3F",
		lastName: "U3L",
		email: "user3@user.com",
		password: "password",
		isAdmin: true,
	});

	const m1 = await Mood.createMood({
		mood: "mood1",
		username: "testuser1",
	});

	testMoodIds.push(m1.id);

	const m2 = await Mood.createMood({
		mood: "mood2",
		username: "testuser2",
	});

	testMoodIds.push(m2.id);

	const m3 = await Mood.createMood({
		mood: "mood3",
		username: "testuser3",
	});

	testMoodIds.push(m3.id);

	await Mood.addMovieToMood(m1.id, testMovieIds[0]);
	await Mood.updateMoodRating(m2.id, "testuser3", "up");
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

const u1Token = createToken({ username: "testuser1", isAdmin: false });
const u2Token = createToken({ username: "testuser2", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u2Token,
	adminToken,
	testMoodIds,
};
