"use strict";

const request = require("supertest");
const Movie = require("../models/movie");
const app = require("../app");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u2Token,
	adminToken,
	testMoodIds,
} = require("./_testCommon");
const { testMovieIds } = require("../models/_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /moods/activities */

describe("GET /moods/activities", function () {
	test("works", async function () {
		const resp = await request(app).get("/moods/activities");
		expect(resp.body).toEqual({
			activities: expect.any(Array),
		});
		expect(resp.body.activities).toContainEqual({
			movieID: testMovieIds[0],
			moodID: expect.any(String),
			mood: "mood1",
			createdBy: "testuser1",
			created: expect.any(String),
			createdAgo: expect.any(String),
		});
	});
});

/************************************** GET /moods/search */

describe("GET /moods/search", function () {
	test("works", async function () {
		const resp = await request(app)
			.get("/moods/search")
			.query({ keyword: "mood" });
		expect(resp.body).toEqual({
			moods: [
				{
					count: expect.any(String),
					createdBy: "testuser2",
					id: expect.any(String),
					mood: "mood2",
					totalVotes: expect.any(String),
				},
				{
					count: expect.any(String),
					createdBy: "testuser1",
					id: expect.any(String),
					mood: "mood1",
					totalVotes: expect.any(String),
				},
				{
					count: expect.any(String),
					createdBy: "testuser3",
					id: expect.any(String),
					mood: "mood3",
					totalVotes: expect.any(String),
				},
			],
		});
	});

	test("works with no result", async function () {
		const resp = await request(app)
			.get("/moods/search")
			.query({ keyword: "notfound" });
		expect(resp.body).toEqual({
			moods: [],
		});
	});
});

/************************************** GET /moods */

describe("GET /moods", function () {
	test("works", async function () {
		const resp = await request(app).get("/moods");
		expect(resp.body).toEqual({
			moods: [
				{
					count: expect.any(String),
					createdBy: "testuser2",
					id: expect.any(String),
					mood: "mood2",
					totalVotes: expect.any(String),
				},
				{
					count: expect.any(String),
					createdBy: "testuser1",
					id: expect.any(String),
					mood: "mood1",
					totalVotes: expect.any(String),
				},

				{
					count: expect.any(String),
					createdBy: "testuser3",
					id: expect.any(String),
					mood: "mood3",
					totalVotes: expect.any(String),
				},
			],
		});

		// Test if it is sorted by their score
		let moods = resp.body.moods;
		expect(+moods[0].totalVotes).toBeGreaterThanOrEqual(+moods[1].totalVotes);
	});
});

/************************************** GET /moods/:id */

describe("GET /moods/:id", function () {
	test("works", async function () {
		const resp = await request(app).get(`/moods/${testMoodIds[1]}`);
		expect(resp.body).toEqual({
			mood: {
				count: expect.any(String),
				createdBy: "testuser2",
				id: testMoodIds[1],
				mood: "mood2",
				totalVotes: expect.any(String),
			},
		});
	});

	test("throws error for mood id that does not exist in the db", async function () {
		const resp = await request(app).get(`/moods/0`);
		expect(resp.statusCode).toBe(404);
	});
});

/************************************** GET /moods/:id/movies */

describe("GET /moods/:id/movies", function () {
	test("works", async function () {
		jest.spyOn(Movie, "get").mockResolvedValue({
			id: testMoodIds[0],
			title: "Test Movie 1",
			overview: "test overview 1",
			poster_path: "/test.jpg",
			release_date: "2010-07-15",
		});
		const resp = await request(app).get(`/moods/${testMoodIds[0]}/movies`);
		expect(resp.body).toEqual({
			movies: [
				{
					id: testMoodIds[0],
					title: "Test Movie 1",
					overview: "test overview 1",
					posterPath: "/test.jpg",
					releaseDate: "2010-07-15",
				},
			],
		});
	});

	test("throws error for mood id that does not exist in the db", async function () {
		const resp = await request(app).get(`/moods/0/movies`);
		expect(resp.statusCode).toBe(404);
	});
});

//////////////////////////////////////

describe("GET /moods/:id/similar", function () {
	test("works", async function () {
		const resp = await request(app).get(`/moods/${testMoodIds[0]}/similar`);
		expect(resp.body.moods).toBeInstanceOf(Array);
	});
});

describe("GET /moods/:id/recommended", function () {
	test("works", async function () {
		const resp = await request(app).get(`/moods/${testMoodIds[0]}/recommended`);
		expect(resp.body.movies).toBeInstanceOf(Array);
	});
});

describe("POST /moods", function () {
	test("creates mood", async function () {
		const resp = await request(app)
			.post("/moods")
			.send({ mood: "excited", username: "testuser1" })
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(201);

		const { id, mood, createdBy } = resp.body.mood;
		const res = await request(app).get(`/moods/${id}`);
		expect(res.body).toEqual({
			mood: expect.objectContaining({ id, mood, createdBy }),
		});
	});

	test("unauth without token", async function () {
		const resp = await request(app)
			.post("/moods")
			.send({ mood: "excited", username: "testuser1" });
		expect(resp.statusCode).toBe(401);
	});

	test("error if submit with missing username", async function () {
		const resp = await request(app)
			.post("/moods")
			.send({ mood: "excited" })
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(400);
	});

	test("error if submit with missing mood name", async function () {
		const resp = await request(app)
			.post("/moods")
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(400);
	});
});

describe("PATCH /moods/:id", function () {
	test("updates mood as user", async function () {
		const resp = await request(app)
			.patch(`/moods/${testMoodIds[0]}`)
			.send({ name: "relaxed", username: "testuser1" })
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			message: expect.any(String),
			mood: { id: testMoodIds[0], mood: "relaxed" },
		});

		const res = await request(app).get(`/moods/${testMoodIds[0]}`);
		expect(res.body).toEqual({
			mood: {
				id: expect.any(String),
				mood: "relaxed",
				createdBy: "testuser1",
				count: expect.any(String),
				totalVotes: expect.any(String),
			},
		});
	});

	test("updates mood as admin", async function () {
		const resp = await request(app)
			.patch(`/moods/${testMoodIds[0]}`)
			.send({ name: "not very relaxed", username: "testuser1" })
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			message: expect.any(String),
			mood: { id: testMoodIds[0], mood: "not very relaxed" },
		});

		const res = await request(app).get(`/moods/${testMoodIds[0]}`);
		expect(res.body).toEqual({
			mood: {
				id: expect.any(String),
				mood: "not very relaxed",
				createdBy: "testuser1",
				count: expect.any(String),
				totalVotes: expect.any(String),
			},
		});
	});

	test("throws 401 when update mood as neither admin or original user", async function () {
		const resp = await request(app)
			.patch(`/moods/${testMoodIds[0]}`)
			.send({ name: "relaxed", username: "testuser1" })
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toBe(401);
	});

	test("throws 401 when update mood as anon", async function () {
		const resp = await request(app)
			.patch(`/moods/${testMoodIds[0]}`)
			.send({ name: "as anon", username: "testuser1" });
		expect(resp.statusCode).toBe(401);
	});
});

describe("POST /moods/:moodID/movies/:movieID", function () {
	test("adds movie to mood", async function () {
		const resp = await request(app)
			.post(`/moods/${testMoodIds[0]}/movies/${testMovieIds[1]}`)
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(201);
	});

	test("throws error when adding movie as anon", async function () {
		const resp = await request(app)
			.post(`/moods/${testMoodIds[0]}/movies/${testMovieIds[0]}`)
			.send({ username: "testuser1" });
		expect(resp.statusCode).toBe(401);
	});

	test("throws error when adding movie to a mood the user has not created", async function () {
		const resp = await request(app)
			.post(`/moods/${testMoodIds[0]}/movies/${testMovieIds[2]}`)
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toBe(401);
	});

	test("able to add movie to mood as admin", async function () {
		const resp = await request(app)
			.post(`/moods/${testMoodIds[1]}/movies/${testMovieIds[0]}`)
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toBe(201);
	});
});

describe("DELETE /moods/:moodID/movies/:movieID", function () {
	test("removes movie from mood", async function () {
		const resp = await request(app)
			.delete(`/moods/${testMoodIds[0]}/movies/${testMovieIds[0]}`)
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body.message).toBe("Movie removed from mood");
	});

	test("throws error when removing movie as anon", async function () {
		const resp = await request(app)
			.delete(`/moods/${testMoodIds[0]}/movies/${testMovieIds[1]}`)
			.send({ username: "testuser1" });
		expect(resp.statusCode).toBe(401);
	});

	test("throws error when removing movie to a mood the user has not created", async function () {
		const resp = await request(app)
			.delete(`/moods/${testMoodIds[0]}/movies/${testMovieIds[2]}`)
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toBe(401);
	});

	test("able to delete movie to mood as admin", async function () {
		const resp = await request(app)
			.post(`/moods/${testMoodIds[1]}/movies/${testMovieIds[0]}`)
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toBe(201);
	});
});

describe("DELETE /moods/:id", function () {
	test("deletes mood as mood owner", async function () {
		const newMood = await request(app)
			.post("/moods")
			.send({ mood: "temp", username: "testuser1" })
			.set("authorization", `Bearer ${u1Token}`);

		const id = newMood.body.mood.id;
		const resp = await request(app)
			.delete(`/moods/${id}`)
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body.message).toBe("Mood deleted");
	});

	test("deletes mood as admin", async function () {
		const newMood = await request(app)
			.post("/moods")
			.send({ mood: "temp", username: "testuser1" })
			.set("authorization", `Bearer ${u1Token}`);

		const id = newMood.body.mood.id;
		const resp = await request(app)
			.delete(`/moods/${id}`)
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body.message).toBe("Mood deleted");
	});

	test("throws error when removing mood as anon", async function () {
		const resp = await request(app)
			.delete(`/moods/${testMoodIds[0]}`)
			.send({ username: "testuser1" });
		expect(resp.statusCode).toBe(401);
	});

	test("throws error when removing mood the user has not created", async function () {
		const resp = await request(app)
			.delete(`/moods/${testMoodIds[0]}`)
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toBe(401);
	});
});

describe("POST /moods/:id/vote/:voteType", function () {
	test("upvotes mood", async function () {
		const resp = await request(app)
			.post(`/moods/${testMoodIds[0]}/vote/up`)
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body.message).toBe("Mood voted");
	});

	test("downvotes mood", async function () {
		const resp = await request(app)
			.post(`/moods/${testMoodIds[0]}/vote/down`)
			.send({ username: "testuser1" })
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body.message).toBe("Mood voted");
	});

	test("throws error is vote as anon", async function () {
		const resp = await request(app)
			.post(`/moods/${testMoodIds[0]}/vote/up`)
			.send({ username: "testuser1" });

		expect(resp.statusCode).toBe(401);
	});

	test("bad vote type", async function () {
		const resp = await request(app)
			.post(`/moods/${testMoodIds[0]}/vote/meh`)
			.send({ username: "testuser2" })
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(404);
	});
});
