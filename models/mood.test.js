const db = require("../db");
const Mood = require("../models/mood");
const ExpressError = require("../expressError");
const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	getTestMoodId,
	testMovieIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("createMood", function () {
	const newMood = {
		mood: "new",
		username: "testuser",
	};

	test("works", async function () {
		let mood = await Mood.createMood(newMood);
		expect(mood).toEqual({
			createdBy: "testuser",
			id: expect.any(String),
			mood: "new",
		});

		const result = await db.query(
			`SELECT id, mood, created_by
               FROM moods
               WHERE mood = 'new'`
		);
		expect(result.rows).toEqual([
			{
				id: expect.any(String),
				mood: "new",
				created_by: "testuser",
			},
		]);
	});

	test("bad request with dupe", async function () {
		try {
			await Mood.createMood(newMood);
			await Mood.createMood(newMood);
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(403);
		}
	});
});

describe("searchMood", function () {
	const testMood = {
		createdBy: "testuser",
		id: expect.any(String),
		mood: "happy vibes",
		count: expect.any(String),
		totalVotes: expect.any(String),
	};
	test("works with result", async function () {
		let mood = await Mood.searchMood("happy");
		expect(mood).toEqual([testMood]);
	});

	test("returns empty array if no result", async function () {
		let mood = await Mood.searchMood("noresults");
		expect(mood).toEqual([]);
	});
});

describe("getMoods", function () {
	const testMood = {
		createdBy: "testuser",
		id: expect.any(String),
		mood: "happy vibes",
		count: expect.any(String),
		totalVotes: expect.any(String),
	};

	test("works with result", async function () {
		let moods = await Mood.getMoods();
		expect(moods).toEqual([testMood]);
	});

	test("returns empty array with no results", async function () {
		await db.query(`DELETE FROM moods`);
		let moods = await Mood.getMoods();
		expect(moods).toEqual([]);
	});
});

describe("getMood", function () {
	const testMood = {
		createdBy: "testuser",
		id: expect.any(String),
		mood: "happy vibes",
		count: expect.any(String),
		totalVotes: expect.any(String),
	};

	test("works with result", async function () {
		let mood = await Mood.getMood(getTestMoodId());
		expect(mood).toEqual(testMood);
	});

	test("throws 404 with no results", async function () {
		try {
			await Mood.getMood(0);
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});
});

describe("getMoodsByMovie", function () {
	const testMood = {
		createdBy: "testuser",
		id: expect.any(String),
		mood: "happy vibes",
		count: expect.any(String),
		totalVotes: expect.any(String),
	};

	test("works with result", async function () {
		let moods = await Mood.getMoodsByMovie(testMovieIds[0]);
		expect(moods).toEqual([testMood]);
	});

	test("returns empty array with no results", async function () {
		let moods = await Mood.getMoodsByMovie(0);
		expect(moods).toEqual([]);
	});
});

describe("addMovieToMood", function () {
	test("works with proper movie", async function () {
		let result = await Mood.addMovieToMood(getTestMoodId(), testMovieIds[1]);
		expect(result).toEqual({
			moodId: getTestMoodId(),
			movieId: testMovieIds[1],
		});
	});

	test("throws 404 if mood id provided does not exist", async function () {
		try {
			await Mood.addMovieToMood(0, testMovieIds[1]);
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});

	test("throws 403 if the mood provided already has the provided movie", async function () {
		try {
			await Mood.addMovieToMood(getTestMoodId(), testMovieIds[0]);
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(403);
		}
	});

	test("throws 404 if movie id provided does not exist in TMDB", async function () {
		try {
			await Mood.addMovieToMood(getTestMoodId(), 0);
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});
});

describe("getMovies", function () {
	test("works with proper mood id", async function () {
		let result = await Mood.getMovies(getTestMoodId());
		expect(result).toEqual([testMovieIds[0]]);
	});

	test("throws 404 if mood id provided does not exist", async function () {
		try {
			await Mood.getMovies(0);
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});

	test("returns empty array with no results", async function () {
		await db.query(`DELETE FROM movies_moods`);
		let moods = await Mood.getMovies(getTestMoodId());
		expect(moods).toEqual([]);
	});
});

describe("similarMoodsByID", function () {
	let secondTestMoodId;
	beforeEach(async () => {
		const moodRes = await db.query(
			`
        INSERT INTO moods (created_by, mood)
        VALUES ($1, 'another mood')
        RETURNING id`,
			["testuser2"]
		);

		secondTestMoodId = moodRes.rows[0].id;

		// Add movies into moods
		await db.query(
			"INSERT INTO movies_moods (movie_id, mood_id) VALUES ($1, $2)",
			[testMovieIds[1], getTestMoodId()]
		);
		await db.query(
			"INSERT INTO movies_moods (movie_id, mood_id) VALUES ($1, $2)",
			[testMovieIds[0], secondTestMoodId]
		);
		await db.query(
			"INSERT INTO movies_moods (movie_id, mood_id) VALUES ($1, $2)",
			[testMovieIds[1], secondTestMoodId]
		);
	});

	test("works with proper mood id", async function () {
		let result = await Mood.similarMoodsByID(getTestMoodId());
		expect(result).toEqual([
			{
				id: secondTestMoodId,
				count: expect.any(Number),
				createdBy: "testuser2",
				mood: "another mood",
				movies: expect.any(Array),
				totalVotes: expect.any(String),
			},
		]);
	});

	test("throws 404 if mood id provided does not exist", async function () {
		try {
			await Mood.similarMoodsByID(0);
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});

	test("returns empty array with no results", async function () {
		await db.query(`DELETE FROM movies_moods WHERE mood_id = $1`, [
			secondTestMoodId,
		]);
		let moods = await Mood.similarMoodsByID(getTestMoodId());
		expect(moods).toEqual([]);
	});
});

describe("recommendedMovies", function () {
	let secondTestMoodId;
	beforeEach(async () => {
		// Add a new mood
		const moodRes = await db.query(
			`
        INSERT INTO moods (created_by, mood)
        VALUES ($1, 'another mood')
        RETURNING id`,
			["testuser2"]
		);

		secondTestMoodId = moodRes.rows[0].id;

		// Add additional movie into test mood
		await db.query(
			"INSERT INTO movies_moods (movie_id, mood_id) VALUES ($1, $2)",
			[testMovieIds[1], getTestMoodId()]
		);

		// Add common movies into the second test mood
		await Promise.all(
			testMovieIds.map((id) =>
				db.query(
					"INSERT INTO movies_moods (movie_id, mood_id) VALUES ($1, $2)",
					[id, secondTestMoodId]
				)
			)
		);
	});

	test("works with proper mood id", async function () {
		let result = await Mood.recommendedMovies(getTestMoodId());
		expect(result).toEqual([
			{
				id: testMovieIds[2],
				overview: expect.any(String),
				poll: expect.any(Number),
				posterPath: expect.any(String),
				releaseDate: expect.any(String),
				title: expect.any(String),
			},
		]);
	});

	test("throws 404 if mood id provided does not exist", async function () {
		try {
			await Mood.recommendedMovies(0);
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});

	test("returns empty array with no results", async function () {
		await db.query(`DELETE FROM movies_moods WHERE mood_id = $1`, [
			secondTestMoodId,
		]);
		let movies = await Mood.recommendedMovies(getTestMoodId());
		expect(movies).toEqual([]);
	});
});

describe("updateMood", function () {
	test("works with proper mood id", async function () {
		let result = await Mood.updateMood(getTestMoodId(), "new mood name");
		expect(result).toEqual({
			id: getTestMoodId(),
			mood: "new mood name",
		});
	});

	test("throws 404 if mood id provided does not exist", async function () {
		try {
			await Mood.updateMood(0, "new mood name");
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});
});

describe("deleteMood", function () {
	test("works with proper mood id", async function () {
		try {
			await Mood.deleteMood(getTestMoodId());
			await Mood.getMood(getTestMoodId());
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});

	test("throws 404 if mood id provided does not exist", async function () {
		try {
			await Mood.deleteMood(0);
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});
});

describe("deleteMovieFromMood", function () {
	test("works with proper mood id", async function () {
		// Confirm the movie is already added to the mood
		const result1 = await Mood.getMovies(getTestMoodId());
		expect(result1).toContainEqual(testMovieIds[0]);
		// Delete the movie from the mood
		await Mood.deleteMovieFromMood(getTestMoodId(), testMovieIds[0]);
		const result2 = await Mood.getMovies(getTestMoodId());
		expect(result2).not.toContainEqual(testMovieIds[0]);
	});

	test("throws 404 if mood id provided does not exist", async function () {
		try {
			await Mood.deleteMovieFromMood(0, testMovieIds[0]);
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});

	test("throws 404 if movie id provided does not exist in the given mood", async function () {
		try {
			await Mood.deleteMovieFromMood(getTestMoodId(), 1234);
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});
});

describe("updateMoodRating", function () {
	test("works with proper mood id, username, and vote type", async function () {
		await Mood.updateMoodRating(getTestMoodId(), "testuser", "up");
		const result1 = await Mood.getMood(getTestMoodId());
		expect(result1).toEqual({
			count: expect.any(String),
			createdBy: expect.any(String),
			id: getTestMoodId(),
			mood: expect.any(String),
			totalVotes: "1",
		});

		// Repeated same vote by the same user should not affect the score of totalVotes
		await Mood.updateMoodRating(getTestMoodId(), "testuser", "up");
		const result2 = await Mood.getMood(getTestMoodId());
		expect(result2.totalVotes).toBe(result1.totalVotes);
	});

	test("works with proper mood id, username, and different vote type", async function () {
		await Mood.updateMoodRating(getTestMoodId(), "testuser2", "up");
		const result1 = await Mood.getMood(getTestMoodId());
		expect(result1).toEqual({
			count: expect.any(String),
			createdBy: expect.any(String),
			id: getTestMoodId(),
			mood: expect.any(String),
			totalVotes: expect.any(String),
		});

		// A different vote by the same user should remove that's user's count
		// towards the totalVotes of mood
		await Mood.updateMoodRating(getTestMoodId(), "testuser2", "down");
		const result2 = await Mood.getMood(getTestMoodId());
		expect(+result2.totalVotes - +result1.totalVotes).toEqual(-1);
	});

	test("throws 403 if vote_type is not in the right format", async function () {
		try {
			await Mood.updateMoodRating(getTestMoodId(), "testuser", "wrong");
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(403);
		}
	});

	test("throws 404 if mood id provided does not exist", async function () {
		try {
			await Mood.updateMoodRating(0, "testuser", "up");
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});

	test("throws 404 if the username provided does not exist", async function () {
		try {
			await Mood.updateMoodRating(getTestMoodId(), "wronguser", "up");
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});
});

describe("getLatestMovieMood", function () {
	test("works", async function () {
		const result = await Mood.getLatestMovieMood();
		expect(result).toEqual([
			{
				movieID: testMovieIds[0],
				moodID: expect.any(String),
				mood: "happy vibes",
				createdBy: "testuser",
				created: expect.any(Date),
				createdAgo: expect.any(String),
			},
		]);
	});

	test("works when its empty", async function () {
		await db.query("DELETE FROM movies_moods");
		const result = await Mood.getLatestMovieMood();
		expect(result).toEqual([]);
	});
});
