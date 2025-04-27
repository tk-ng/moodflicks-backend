"use strict";

const request = require("supertest");
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

/************************************** GET /movies/:id/moods */

describe("GET /movies/:id/moods", function () {
	test("works", async function () {
		const resp = await request(app).get(`/movies/${testMovieIds[0]}/moods`);
		expect(resp.body).toEqual({
			moods: [
				{
					mood: "mood1",
					id: testMoodIds[0],
					createdBy: "testuser1",
					count: expect.any(String),
					totalVotes: expect.any(String),
				},
			],
		});
	});

	test("returns empty array if no mood is found for the movie", async function () {
		const resp = await request(app).get(`/movies/0/moods`);
		expect(resp.body).toEqual({ moods: [] });
	});
});
