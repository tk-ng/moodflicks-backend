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
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /users */

describe("GET /users", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.get("/users")
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			users: expect.any(Array),
		});
	});

	test("unauthorized for non-admin", async function () {
		const resp = await request(app)
			.get("/users")
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(401);
	});

	test("unauthorized for anon", async function () {
		const resp = await request(app).get("/users");
		expect(resp.statusCode).toBe(401);
	});
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
	test("works for anon", async function () {
		const resp = await request(app).get("/users/testuser1");
		expect(resp.body).toEqual({
			user: {
				username: "testuser1",
				firstName: "U1F",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
			},
		});
	});

	test("throws error if user is not found", async function () {
		const resp = await request(app).get("/users/nonexisttestuser");
		expect(resp.statusCode).toBe(404);
	});
});

/************************************** GET /users/:username/moods */

describe("GET /users/:username/moods", function () {
	test("works for anon", async function () {
		const resp = await request(app).get("/users/testuser1/moods");
		expect(resp.body).toEqual({
			moods: [
				{
					count: expect.any(String),
					createdBy: "testuser1",
					id: expect.any(String),
					mood: "mood1",
					totalVotes: expect.any(String),
				},
			],
		});
	});

	test("throws error if user is not found", async function () {
		const resp = await request(app).get("/users/nonexisttestuser/moods");
		expect(resp.statusCode).toBe(404);
	});
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", function () {
	test("updates user as user", async function () {
		const resp = await request(app)
			.patch(`/users/testuser1`)
			.send({
				data: {
					firstName: "U1F updated",
					lastName: "U1L updated",
					email: "updateduser1@user.com",
				},
				username: "testuser1",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			user: {
				username: "testuser1",
				firstName: "U1F updated",
				lastName: "U1L updated",
				email: "updateduser1@user.com",
				isAdmin: false,
			},
		});

		const res = await request(app).get(`/users/testuser1`);
		expect(res.body).toEqual({
			user: {
				username: "testuser1",
				firstName: "U1F updated",
				lastName: "U1L updated",
				email: "updateduser1@user.com",
				isAdmin: false,
			},
		});
	});

	test("updates user as admin", async function () {
		const resp = await request(app)
			.patch(`/users/testuser1`)
			.send({
				data: {
					firstName: "U1F adminupdated",
					lastName: "U1L adminupdated",
					email: "adminupdateduser1@user.com",
				},
				username: "testuser1",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			user: {
				username: "testuser1",
				firstName: "U1F adminupdated",
				lastName: "U1L adminupdated",
				email: "adminupdateduser1@user.com",
				isAdmin: false,
			},
		});

		const res = await request(app).get(`/users/testuser1`);
		expect(res.body).toEqual({
			user: {
				username: "testuser1",
				firstName: "U1F adminupdated",
				lastName: "U1L adminupdated",
				email: "adminupdateduser1@user.com",
				isAdmin: false,
			},
		});
	});

	test("throws 401 when update user as neither admin or original user", async function () {
		const resp = await request(app)
			.patch(`/users/testuser1`)
			.send({
				data: {
					firstName: "U1F adminupdated",
					lastName: "U1L adminupdated",
					email: "adminupdateduser1@user.com",
				},
				username: "testuser1",
			})
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toBe(401);
	});

	test("throws 401 when update user as anon", async function () {
		const resp = await request(app)
			.patch(`/users/testuser1`)
			.send({
				data: {
					firstName: "U1F adminupdated",
					lastName: "U1L adminupdated",
					email: "adminupdateduser1@user.com",
				},
				username: "testuser1",
			});
		expect(resp.statusCode).toBe(401);
	});
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
	let token;
	beforeEach(async () => {
		const resp = await request(app).post("/auth/register").send({
			username: "testuserdelete",
			password: "password",
			firstName: "UDF",
			lastName: "UDL",
			email: "testuserdelete@user.com",
		});
		token = resp.body.token;
	});

	test("deletes user as themselves", async function () {
		const resp = await request(app)
			.delete(`/users/testuserdelete`)
			.send({ username: "testuserdelete" })
			.set("authorization", `Bearer ${token}`);
		expect(resp.body.message).toBe("user removed");
	});

	test("deletes user as admin", async function () {
		const resp = await request(app)
			.delete(`/users/testuserdelete`)
			.send({ username: "testuserdelete" })
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body.message).toBe("user removed");
	});

	test("throw error when delete mood as anon", async function () {
		const resp = await request(app)
			.delete(`/users/testuserdelete`)
			.send({ username: "testuserdelete" });
		expect(resp.statusCode).toBe(401);
	});

	test("throws error when removing mood the user has not created", async function () {
		const resp = await request(app)
			.delete(`/users/testuserdelete`)
			.send({ username: "testuserdelete" })
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toBe(401);
	});
});
