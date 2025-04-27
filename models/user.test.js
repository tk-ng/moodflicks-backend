const User = require("../models/user");
const db = require("../db");
const ExpressError = require("../expressError");
const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	getTestMoodId,
} = require("./_testCommon");
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("authenticate", function () {
	test("works", async function () {
		const user = await User.authenticate("testuser", "password");
		expect(user).toEqual({
			username: "testuser",
			firstName: "Test",
			lastName: "User 1",
			email: "testuser@example.com",
			isAdmin: false,
		});
	});

	test("unauth if no such user", async function () {
		try {
			const user = await User.authenticate("faketestuser", "password");
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(401);
		}
	});

	test("unauth if wrong password", async function () {
		try {
			const user = await User.authenticate("testuser", "wrongpassword");
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(401);
		}
	});
});

describe("register", function () {
	const newUser = {
		username: "new",
		firstName: "Test",
		lastName: "Tester",
		email: "test@test.com",
		isAdmin: false,
	};

	test("works", async function () {
		let user = await User.register({
			...newUser,
			password: "password",
		});
		expect(user).toEqual(newUser);
		const found = await db.query("SELECT * FROM users WHERE username = 'new'");
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].is_admin).toEqual(false);
		expect(found.rows[0].password_hashed.startsWith("$2b$")).toEqual(true);
	});

	test("works: adds admin", async function () {
		let user = await User.register({
			...newUser,
			password: "password",
			isAdmin: true,
		});
		expect(user).toEqual({ ...newUser, isAdmin: true });
		const found = await db.query("SELECT * FROM users WHERE username = 'new'");
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].is_admin).toEqual(true);
		expect(found.rows[0].password_hashed.startsWith("$2b$")).toEqual(true);
	});

	test("bad request with dup data", async function () {
		try {
			await User.register({
				...newUser,
				password: "password",
			});
			await User.register({
				...newUser,
				password: "password",
			});
			fail();
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(403);
		}
	});
});

describe("getAll", function () {
	test("works", async function () {
		let users = await User.getAll();
		expect(users).toEqual([
			{
				username: "testuser",
				firstName: "Test",
				lastName: "User 1",
				email: "testuser@example.com",
				isAdmin: false,
			},
			{
				username: "testuser2",
				firstName: "Test",
				lastName: "User 2",
				email: "testuser2@example.com",
				isAdmin: true,
			},
		]);
	});
});

describe("get", function () {
	test("works", async function () {
		let user = await User.get("testuser");
		expect(user).toEqual({
			username: "testuser",
			firstName: "Test",
			lastName: "User 1",
			email: "testuser@example.com",
			isAdmin: false,
		});
	});

	test("not found if no such user", async function () {
		try {
			await User.get("nope");
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});
});

describe("getMoodsByUser", function () {
	test("works", async function () {
		let moods = await User.getMoodsByUser("testuser");
		expect(moods).toEqual([
			{
				count: expect.any(String),
				createdBy: "testuser",
				id: getTestMoodId(),
				mood: expect.any(String),
				totalVotes: expect.any(String),
			},
		]);
	});

	test("not found if no such user", async function () {
		try {
			await User.getMoodsByUser("nope");
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});
});

describe("remove", function () {
	test("works", async function () {
		// User.get also tests for scenario where username is not found
		let user = await User.get("testuser2");
		await user.remove();
		const result = await db.query("SELECT FROM users WHERE username = $1", [
			"testuser2",
		]);
		expect(result.rows).toEqual([]);
	});
});

describe("update", function () {
	test("works", async function () {
		// User.get also tests for scenario where username is not found
		let user = await User.get("testuser");
		expect(user.firstName).toBe("Test");
		user.firstName = "new first name";
		await user.update();

		const result = await db.query(
			`SELECT
            username,
            first_name AS "firstName",
            last_name AS "lastName",
            email,
            is_admin AS "isAdmin"
            FROM users
            WHERE username=$1`,
			["testuser"]
		);
		expect(result.rows[0].firstName).toEqual("new first name");
	});
});
