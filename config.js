require("dotenv").config();

const PORT = +process.env.PORT || 3000;

function getDatabaseUrl() {
	return process.env.NODE_ENV === "test"
		? "postgresql:///moodflicks_test"
		: process.env.DATABASE_URL;
}

const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

const SECRET_KEY = process.env.SECRET_KEY || "secret-key-moodflicks";

const NUM_OF_ACTIVITIES = 5;

MIN_COMMON_MOVIES = 2;

module.exports = {
	PORT,
	BCRYPT_WORK_FACTOR,
	getDatabaseUrl,
	MIN_COMMON_MOVIES,
	SECRET_KEY,
	NUM_OF_ACTIVITIES,
};
